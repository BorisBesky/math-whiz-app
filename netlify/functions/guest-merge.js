/**
 * Merge a guest (anonymous) student's data into an existing student account.
 * Used by merge-guest-account.js when a guest tries to save their progress
 * with a Google account or email that already has a Math Whiz account.
 *
 * Profile merge rules (target = the existing account, guest = the guest):
 *   coins                         summed
 *   progressByGrade, progress,
 *   questionStatsByDate,
 *   questionSummary               numbers summed at every level (per day /
 *                                 grade / topic counters); latestActivity
 *                                 keeps the most recent value
 *   owned* arrays (ownedBackgrounds, ownedCharacters, ownedAccessories,
 *   ownedCharacterSkills, ...)    union
 *   answeredQuestions (legacy)    appended, duplicates dropped
 *   pausedQuizzes, dailyStories,
 *   dailyGoalsByGrade,
 *   equippedAccessories,
 *   lastAskedComplexityByTopic    target's entries win; guest's fill gaps
 *   identity / class fields       target only (email, role, displayName,
 *                                 teacherIds, classId, createdAt, ...)
 *   any other field               target wins; guest fills it if missing
 */
const { deleteAccountData } = require('./account-data');

const SUM_KEYS = new Set(['coins', 'progressByGrade', 'progress', 'questionStatsByDate', 'questionSummary']);
const FILL_KEYS = new Set(['pausedQuizzes', 'dailyStories', 'dailyGoalsByGrade', 'equippedAccessories', 'lastAskedComplexityByTopic']);
const TARGET_ONLY_KEYS = new Set([
  'email', 'role', 'isAnonymous', 'displayName', 'createdAt', 'convertedAt', 'teacherIds',
  'classId', 'mergedGuestUids', 'mergedAt', 'selectedGrade', 'activeBackground', 'selectedCharacterId',
]);
const MAX_KEYS = new Set(['latestActivity']);

const isPlainObject = (v) => Boolean(v) && typeof v === 'object' && !Array.isArray(v)
  && Object.getPrototypeOf(v) === Object.prototype;

const sumDeep = (a, b, key) => {
  if (a === undefined) return b;
  if (b === undefined) return a;
  if (typeof a === 'number' && typeof b === 'number') return a + b;
  if (MAX_KEYS.has(key) && typeof a === 'string' && typeof b === 'string') return a > b ? a : b;
  if (isPlainObject(a) && isPlainObject(b)) {
    const out = { ...a };
    for (const [k, v] of Object.entries(b)) out[k] = sumDeep(a[k], v, k);
    return out;
  }
  return a;
};

const fillMissing = (a, b) => {
  if (!isPlainObject(a)) return a === undefined ? b : a;
  if (!isPlainObject(b)) return a;
  const out = { ...a };
  for (const [k, v] of Object.entries(b)) {
    out[k] = k in a ? fillMissing(a[k], v) : v;
  }
  return out;
};

const union = (a = [], b = []) => {
  const seen = new Set();
  const out = [];
  for (const item of [...a, ...b]) {
    const id = typeof item === 'object' ? JSON.stringify(item) : String(item);
    if (!seen.has(id)) {
      seen.add(id);
      out.push(item);
    }
  }
  return out;
};

/** Pure merge of two profile objects (see rules above). */
function mergeGuestProfile(target = {}, guest = {}) {
  const merged = { ...target };
  for (const [key, guestValue] of Object.entries(guest || {})) {
    const targetValue = target[key];
    if (TARGET_ONLY_KEYS.has(key)) continue;
    if (SUM_KEYS.has(key)) {
      merged[key] = sumDeep(targetValue, guestValue, key);
    } else if ((key.startsWith('owned') || key === 'answeredQuestions') && Array.isArray(guestValue)) {
      merged[key] = union(Array.isArray(targetValue) ? targetValue : [], guestValue);
    } else if (FILL_KEYS.has(key)) {
      merged[key] = fillMissing(targetValue, guestValue);
    } else if (targetValue === undefined) {
      merged[key] = guestValue;
    }
  }
  return merged;
}

const rewriteDrawingPaths = (value, guestUid, targetUid) => {
  const json = JSON.stringify(value);
  const rewritten = json
    .split(`drawings/${guestUid}/`).join(`drawings/${targetUid}/`)
    .split(`drawings%2F${guestUid}%2F`).join(`drawings%2F${targetUid}%2F`);
  return JSON.parse(rewritten);
};

/**
 * Move everything from guestUid into targetUid, then delete the guest's data.
 * Safe to call again after a partial failure: the profile is merged once
 * (guarded by mergedGuestUids), copied attempts and enrollments use fixed ids,
 * and Storage copies skip files that already exist.
 */
async function mergeGuestIntoAccount({ db, admin, appId, guestUid, targetUid, bucket }) {
  const users = db.collection('artifacts').doc(appId).collection('users');
  const enrollments = db.collection('artifacts').doc(appId).collection('classStudents');
  const guestProfileRef = users.doc(guestUid).collection('math_whiz_data').doc('profile');
  const targetProfileRef = users.doc(targetUid).collection('math_whiz_data').doc('profile');
  const summary = { profileMerged: false, attemptsCopied: 0, enrollmentsMoved: 0, drawingsCopied: 0 };

  // 1) Attempts (copied under fixed ids so a retry overwrites, not duplicates).
  const attempts = await users.doc(guestUid).collection('attempts').get();
  for (const attempt of attempts.docs) {
    const data = rewriteDrawingPaths(attempt.data() || {}, guestUid, targetUid);
    await users.doc(targetUid).collection('attempts').doc(`g_${guestUid}_${attempt.id}`)
      .set({ ...data, mergedFromGuest: true });
    summary.attemptsCopied += 1;
  }

  // 2) Class enrollments (guests normally can't join classes, but be safe).
  const guestEnrollments = await enrollments.where('studentId', '==', guestUid).get();
  const addedTeacherIds = new Set();
  for (const enrollment of guestEnrollments.docs) {
    const data = enrollment.data() || {};
    if (data.classId) {
      const targetRef = enrollments.doc(`${data.classId}__${targetUid}`);
      const existing = await targetRef.get();
      if (!existing.exists) await targetRef.set({ ...data, studentId: targetUid });
      const classSnap = await db.collection('artifacts').doc(appId).collection('classes').doc(data.classId).get();
      const classData = classSnap.exists ? classSnap.data() || {} : {};
      (classData.teacherIds || (classData.teacherId ? [classData.teacherId] : [])).forEach((t) => addedTeacherIds.add(t));
      summary.enrollmentsMoved += 1;
    }
    await enrollment.ref.delete();
  }

  // 3) Drawings in Storage (copied; the guest's originals are deleted below).
  if (bucket) {
    const [files] = await bucket.getFiles({ prefix: `drawings/${guestUid}/` });
    for (const file of files) {
      const dest = file.name.replace(`drawings/${guestUid}/`, `drawings/${targetUid}/`);
      const [exists] = await bucket.file(dest).exists();
      if (!exists) {
        await bucket.file(file.name).copy(bucket.file(dest));
        summary.drawingsCopied += 1;
      }
    }
  }

  // 4) Profile (merged once).
  const [guestSnap, targetSnap] = await Promise.all([guestProfileRef.get(), targetProfileRef.get()]);
  const target = targetSnap.exists ? targetSnap.data() || {} : {};
  const alreadyMerged = (target.mergedGuestUids || []).includes(guestUid);
  if (!alreadyMerged) {
    const merged = guestSnap.exists ? mergeGuestProfile(target, guestSnap.data() || {}) : { ...target };
    merged.mergedGuestUids = [...(target.mergedGuestUids || []), guestUid];
    merged.mergedAt = new Date().toISOString();
    if (addedTeacherIds.size > 0) merged.teacherIds = union(target.teacherIds || [], [...addedTeacherIds]);
    if (!merged.role) merged.role = 'student';
    await targetProfileRef.set(merged);
    summary.profileMerged = guestSnap.exists;
  } else if (addedTeacherIds.size > 0) {
    await targetProfileRef.set({ teacherIds: union(target.teacherIds || [], [...addedTeacherIds]) }, { merge: true });
  }

  // 5) Remove the guest's data and the anonymous user.
  await deleteAccountData({ db, admin, appId, uid: guestUid, bucket });
  try {
    await admin.auth().deleteUser(guestUid);
  } catch (error) {
    if (error?.code !== 'auth/user-not-found') throw error;
  }

  return summary;
}

module.exports = { mergeGuestProfile, mergeGuestIntoAccount };
