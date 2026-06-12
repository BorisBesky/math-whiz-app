/**
 * Shared helpers for multi-teacher class support.
 * Supports both old (teacherId: string) and new (teacherIds: string[]) formats.
 */

function getTeacherIds(classData) {
  if (Array.isArray(classData.teacherIds) && classData.teacherIds.length > 0) {
    return classData.teacherIds;
  }
  return classData.teacherId ? [classData.teacherId] : [];
}

function isTeacherOnClass(classData, uid) {
  return getTeacherIds(classData).includes(uid);
}

const chunk = (items, size) => {
  const out = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
};

/**
 * Keep each enrolled student's `profile.teacherIds` in sync with a class's teacher set.
 *
 * `profile.teacherIds` is the authorization key the Firestore rules use to let a teacher
 * read a student (see firestore/fs.rules). Whenever a class's teacher membership changes,
 * the change must be propagated to every enrolled student's profile — a client cannot do
 * this itself (it has no write access to other students' profiles). This is the single
 * source of truth for that propagation, shared by manage-class-teacher.js (single add/
 * remove) and classes.js handleUpdateClass (diffed add/remove on edit).
 *
 * Removals are retention-aware: a teacher is stripped from a student only when no OTHER
 * class still connects them, so a co-taught student never loses a still-valid relationship.
 *
 * @returns {Promise<{reconciled: number}>} number of distinct enrolled students processed.
 */
async function reconcileEnrolledStudentTeachers({ db, admin, appId, classId, added = [], removed = [] }) {
  if (added.length === 0 && removed.length === 0) return { reconciled: 0 };

  const artifact = db.collection('artifacts').doc(appId);
  const enrollmentsCol = artifact.collection('classStudents');
  const classesCol = artifact.collection('classes');
  const usersCol = artifact.collection('users');
  const profileRefFor = (studentId) => usersCol.doc(studentId)
    .collection('math_whiz_data').doc('profile');

  const enrollmentSnap = await enrollmentsCol.where('classId', '==', classId).get();
  const studentIds = [...new Set(enrollmentSnap.docs.map((d) => d.data().studentId).filter(Boolean))];

  await Promise.all(studentIds.map(async (studentId) => {
    // Grant newly-added teachers.
    if (added.length > 0) {
      await profileRefFor(studentId).set(
        { teacherIds: admin.firestore.FieldValue.arrayUnion(...added) },
        { merge: true },
      );
    }

    // Revoke removed teachers only where the student is unreachable through another class.
    if (removed.length > 0) {
      const otherEnroll = await enrollmentsCol.where('studentId', '==', studentId).get();
      const otherClassIds = [...new Set(
        otherEnroll.docs.map((d) => d.data().classId).filter((cid) => cid && cid !== classId),
      )];

      const retained = new Set();
      for (const ids of chunk(otherClassIds, 30)) {
        if (ids.length === 0) continue;
        const snap = await classesCol
          .where(admin.firestore.FieldPath.documentId(), 'in', ids)
          .get();
        snap.docs.forEach((d) => getTeacherIds(d.data()).forEach((tid) => retained.add(tid)));
      }

      const toRemove = removed.filter((tid) => !retained.has(tid));
      if (toRemove.length > 0) {
        await profileRefFor(studentId).set(
          { teacherIds: admin.firestore.FieldValue.arrayRemove(...toRemove) },
          { merge: true },
        );
      }
    }
  }));

  return { reconciled: studentIds.length };
}

module.exports = { getTeacherIds, isTeacherOnClass, reconcileEnrolledStudentTeachers };
