/**
 * Shared logic for self-service account export and deletion
 * (export-account-data.js, delete-account.js). Everything is scoped to one
 * uid and runs with the Admin SDK, so Firestore/Storage rules don't apply.
 *
 * Data model touched (all under artifacts/{appId}):
 *   users/{uid}                       parent doc (may not exist)
 *   users/{uid}/math_whiz_data/*      profile (progress, coins, store items, goals...)
 *   users/{uid}/attempts/*            per-question attempt history
 *   users/{uid}/questionBank/*        teacher's own questions
 *   pdfProcessingJobs (userId)        PDF upload jobs
 *   classStudents (studentId)         a student's class enrollments
 *   classes (teacherIds / teacherId)  classes a teacher teaches (+ questions subcollection)
 *   messages (participantIds)         student <-> teacher messages
 * Storage: drawings/{uid}/, question-images/{uid}/, pdf-uploads/{uid}/
 */
const { getTeacherIds, reconcileEnrolledStudentTeachers } = require('./class-helpers');

const STORAGE_PREFIXES = ['drawings', 'question-images', 'pdf-uploads'];
const EXPORT_FORMAT_VERSION = 1;
const DELETED_USER_NAME = 'Deleted user';

const artifactRef = (db, appId) => db.collection('artifacts').doc(appId);
const userRef = (db, appId, uid) => artifactRef(db, appId).collection('users').doc(uid);

// Firestore Timestamps / Dates -> ISO strings so the export is plain JSON.
const toPlain = (value) => {
  if (value === null || value === undefined) return value;
  if (typeof value.toDate === 'function') {
    try { return value.toDate().toISOString(); } catch (e) { return String(value); }
  }
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(toPlain);
  if (typeof value === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(value)) out[k] = toPlain(v);
    return out;
  }
  return value;
};

const docsOf = async (query) => {
  const snap = await query.get();
  return snap.docs;
};

const plainDocs = (docs) => docs.map((d) => ({ id: d.id, ...toPlain(d.data() || {}) }));

/** Classes the user teaches (new teacherIds array or legacy teacherId). */
const findTaughtClasses = async (db, appId, uid) => {
  const classes = artifactRef(db, appId).collection('classes');
  const [byArray, byLegacy] = await Promise.all([
    docsOf(classes.where('teacherIds', 'array-contains', uid)),
    docsOf(classes.where('teacherId', '==', uid)),
  ]);
  const seen = new Map();
  [...byArray, ...byLegacy].forEach((d) => {
    if (!seen.has(d.id) && getTeacherIds(d.data() || {}).includes(uid)) seen.set(d.id, d);
  });
  return [...seen.values()];
};

const listStorageFiles = async (bucket, uid) => {
  if (!bucket) return [];
  const files = [];
  for (const prefix of STORAGE_PREFIXES) {
    try {
      const [found] = await bucket.getFiles({ prefix: `${prefix}/${uid}/` });
      found.forEach((f) => files.push({
        path: f.name,
        size: Number(f.metadata?.size || 0),
        contentType: f.metadata?.contentType || null,
        updated: f.metadata?.updated || null,
      }));
    } catch (error) {
      console.warn(`[account-data] Could not list ${prefix}/${uid}/:`, error.message);
    }
  }
  return files;
};

/**
 * Everything stored about `uid`, as plain JSON. Other people's data is limited
 * to what the user already sees (class rosters: names only; messages they are
 * a participant in).
 */
async function collectAccountData({ db, appId, uid, bucket, authUser = null }) {
  const user = userRef(db, appId, uid);
  const artifact = artifactRef(db, appId);

  const [mathWhizDocs, attemptDocs, questionBankDocs, jobDocs, enrollmentDocs, messageDocs, taughtClasses, storageFiles] = await Promise.all([
    docsOf(user.collection('math_whiz_data')),
    docsOf(user.collection('attempts')),
    docsOf(user.collection('questionBank')),
    docsOf(artifact.collection('pdfProcessingJobs').where('userId', '==', uid)),
    docsOf(artifact.collection('classStudents').where('studentId', '==', uid)),
    docsOf(artifact.collection('messages').where('participantIds', 'array-contains', uid)),
    findTaughtClasses(db, appId, uid),
    listStorageFiles(bucket, uid),
  ]);

  const profileDoc = mathWhizDocs.find((d) => d.id === 'profile');
  const profile = profileDoc ? toPlain(profileDoc.data()) : null;

  // Class names for the student's enrollments.
  const enrolledClasses = await Promise.all(enrollmentDocs.map(async (d) => {
    const data = d.data() || {};
    let className = data.className || null;
    if (!className && data.classId) {
      const classSnap = await artifact.collection('classes').doc(data.classId).get();
      className = classSnap.exists ? (classSnap.data() || {}).name || null : null;
    }
    return { enrollmentId: d.id, ...toPlain(data), className };
  }));

  const classesTaught = await Promise.all(taughtClasses.map(async (classDoc) => {
    const classRef = artifact.collection('classes').doc(classDoc.id);
    const [questionDocs, rosterDocs] = await Promise.all([
      docsOf(classRef.collection('questions')),
      docsOf(artifact.collection('classStudents').where('classId', '==', classDoc.id)),
    ]);
    return {
      id: classDoc.id,
      ...toPlain(classDoc.data()),
      questions: plainDocs(questionDocs),
      roster: rosterDocs.map((r) => {
        const data = r.data() || {};
        return { studentId: data.studentId || null, studentName: data.studentName || data.displayName || null };
      }),
    };
  }));

  return {
    format: 'math-whiz-account-export',
    formatVersion: EXPORT_FORMAT_VERSION,
    exportedAt: new Date().toISOString(),
    appId,
    account: {
      uid,
      email: authUser?.email || profile?.email || null,
      displayName: authUser?.displayName || profile?.displayName || null,
      providers: (authUser?.providerData || []).map((p) => p.providerId),
      createdAt: authUser?.metadata?.creationTime || null,
      lastSignIn: authUser?.metadata?.lastSignInTime || null,
      role: profile?.role || null,
    },
    profile,
    otherAppData: plainDocs(mathWhizDocs.filter((d) => d.id !== 'profile')),
    attempts: plainDocs(attemptDocs),
    questionBank: plainDocs(questionBankDocs),
    pdfProcessingJobs: plainDocs(jobDocs),
    enrollments: enrolledClasses,
    classesTaught,
    messages: plainDocs(messageDocs),
    storageFiles,
  };
}

const deleteDocs = async (docs) => {
  for (const d of docs) await d.ref.delete();
  return docs.length;
};

// Strings of every document that survives (co-taught classes' questions and
// the shared bank), so we keep question images other teachers still use.
const collectSurvivingReferences = async ({ db, appId, keptClassIds }) => {
  const artifact = artifactRef(db, appId);
  const chunks = [];
  for (const classId of keptClassIds) {
    const qs = await docsOf(artifact.collection('classes').doc(classId).collection('questions'));
    qs.forEach((d) => chunks.push(JSON.stringify(d.data() || {})));
  }
  const shared = await docsOf(artifact.collection('sharedQuestionBank'));
  shared.forEach((d) => chunks.push(JSON.stringify(d.data() || {})));
  return chunks.join('\n');
};

/**
 * Delete everything belonging to `uid`. Every step tolerates data that is
 * already gone, so calling it again after a partial failure finishes the job.
 * Returns counts per step (no PII).
 */
async function deleteAccountData({ db, admin, appId, uid, bucket }) {
  const artifact = artifactRef(db, appId);
  const user = userRef(db, appId, uid);
  const summary = {
    classesDeleted: 0,
    classesLeft: 0,
    enrollmentsDeleted: 0,
    messagesDeleted: 0,
    messagesAnonymized: 0,
    pdfJobsDeleted: 0,
    attemptsDeleted: 0,
    questionBankDeleted: 0,
    profileDocsDeleted: 0,
    storageFilesDeleted: 0,
    storageFilesKept: 0,
  };

  // 1) Classes the user teaches.
  const keptClassIds = [];
  const taught = await findTaughtClasses(db, appId, uid);
  for (const classDoc of taught) {
    const data = classDoc.data() || {};
    const classRef = artifact.collection('classes').doc(classDoc.id);
    const others = getTeacherIds(data).filter((tid) => tid !== uid);
    if (others.length > 0) {
      // Co-taught: just remove this teacher.
      const update = { teacherIds: others };
      if (data.teacherId === uid) update.teacherId = others[0];
      if (data.createdBy === uid) update.createdBy = others[0];
      await classRef.set(update, { merge: true });
      await reconcileEnrolledStudentTeachers({ db, admin, appId, classId: classDoc.id, removed: [uid] });
      keptClassIds.push(classDoc.id);
      summary.classesLeft += 1;
    } else {
      // Sole teacher: delete the class, its questions and its enrollments.
      // Students keep their accounts; drop this teacher from their profiles.
      await reconcileEnrolledStudentTeachers({ db, admin, appId, classId: classDoc.id, removed: [uid] });
      const enrollments = await docsOf(artifact.collection('classStudents').where('classId', '==', classDoc.id));
      for (const e of enrollments) {
        const studentId = (e.data() || {}).studentId;
        if (studentId) {
          const profileRef = artifact.collection('users').doc(studentId).collection('math_whiz_data').doc('profile');
          const profileSnap = await profileRef.get();
          if (profileSnap.exists && (profileSnap.data() || {}).classId === classDoc.id) {
            await profileRef.set({ classId: null }, { merge: true });
          }
        }
        await e.ref.delete();
      }
      await deleteDocs(await docsOf(classRef.collection('questions')));
      await classRef.delete();
      summary.classesDeleted += 1;
    }
  }

  // 2) The user's own class enrollments (as a student).
  summary.enrollmentsDeleted = await deleteDocs(
    await docsOf(artifact.collection('classStudents').where('studentId', '==', uid))
  );

  // 3) Messages: delete what they wrote; keep what others wrote to them, with
  //    their name replaced.
  const messages = await docsOf(artifact.collection('messages').where('participantIds', 'array-contains', uid));
  for (const m of messages) {
    const data = m.data() || {};
    if (data.senderId === uid) {
      await m.ref.delete();
      summary.messagesDeleted += 1;
    } else if (data.recipientName !== DELETED_USER_NAME) {
      await m.ref.set({ recipientName: DELETED_USER_NAME }, { merge: true });
      summary.messagesAnonymized += 1;
    }
  }

  // 4) PDF processing jobs.
  summary.pdfJobsDeleted = await deleteDocs(
    await docsOf(artifact.collection('pdfProcessingJobs').where('userId', '==', uid))
  );

  // 5) The user's documents.
  summary.attemptsDeleted = await deleteDocs(await docsOf(user.collection('attempts')));
  summary.questionBankDeleted = await deleteDocs(await docsOf(user.collection('questionBank')));
  summary.profileDocsDeleted = await deleteDocs(await docsOf(user.collection('math_whiz_data')));
  await user.delete();

  // 6) Storage files (keep question images still used by surviving questions).
  if (bucket) {
    const files = await listStorageFiles(bucket, uid);
    const imageFiles = files.filter((f) => f.path.startsWith('question-images/'));
    const references = imageFiles.length > 0
      ? await collectSurvivingReferences({ db, appId, keptClassIds })
      : '';
    for (const file of files) {
      const stillUsed = file.path.startsWith('question-images/') && (
        references.includes(file.path) || references.includes(encodeURIComponent(file.path))
      );
      if (stillUsed) {
        summary.storageFilesKept += 1;
        continue;
      }
      try {
        await bucket.file(file.path).delete({ ignoreNotFound: true });
        summary.storageFilesDeleted += 1;
      } catch (error) {
        if (error?.code !== 404) throw error;
      }
    }
  }

  return summary;
}

module.exports = {
  STORAGE_PREFIXES,
  DELETED_USER_NAME,
  collectAccountData,
  deleteAccountData,
  findTaughtClasses,
  toPlain,
};
