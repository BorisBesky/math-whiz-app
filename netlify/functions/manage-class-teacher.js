// Netlify Function: add or remove a teacher on a class.
//
// Why this exists: a class's `teacherIds` is the authorization key that lets a
// teacher read their students' data — the Firestore profile-read rule grants access
// only when `request.auth.uid in resource.data.teacherIds` on each student's profile
// (artifacts/{appId}/users/{studentId}/math_whiz_data/profile). That denormalized
// array MUST stay in sync with class membership, otherwise a teacher added to an
// existing class cannot read those students (the internal Messages tab then fails with
// "Missing or insufficient permissions").
//
// A client cannot maintain this itself: a teacher has no write access to another
// student's profile doc. So teacher add/remove is funnelled through this Admin SDK
// function, which updates the class AND reconciles every enrolled student's
// profile.teacherIds — mirroring the maintenance already done in join-class.js and
// class-students.js for enroll/unenroll.
const { admin, db } = require('./firebase-admin');
const { getTeacherIds, isTeacherOnClass } = require('./class-helpers');

const json = (status, body) => ({
  statusCode: status,
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  },
  body: JSON.stringify(body),
});

const parseBody = (event) => {
  try { return event.body ? JSON.parse(event.body) : {}; } catch { return {}; }
};

const requireAuth = async (event) => {
  const authHeader = event.headers.authorization || event.headers.Authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) throw new Error('Missing Authorization');
  const idToken = authHeader.slice('Bearer '.length);
  return admin.auth().verifyIdToken(idToken);
};

const chunk = (items, size) => {
  const out = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return json(204, {});
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method not allowed' });

  try {
    const user = await requireAuth(event);
    const body = parseBody(event);
    const action = (body.action || '').toString();
    const appId = body.appId || process.env.APP_ID || 'default-app-id';
    const { classId, teacherId } = body;

    if (!['add', 'remove'].includes(action)) return json(400, { error: 'Invalid action' });
    if (!classId || !teacherId) return json(400, { error: 'Missing classId or teacherId' });

    const classesCol = db.collection('artifacts').doc(appId).collection('classes');
    const enrollmentsCol = db.collection('artifacts').doc(appId).collection('classStudents');
    const usersCol = db.collection('artifacts').doc(appId).collection('users');

    const classRef = classesCol.doc(classId);
    const classSnap = await classRef.get();
    if (!classSnap.exists) return json(404, { error: 'Class not found' });
    const classData = classSnap.data();

    // Authorize: platform admin, or an existing teacher on this class.
    const isAdmin = user.admin === true;
    if (!isAdmin && !isTeacherOnClass(classData, user.uid)) {
      return json(403, { error: 'Not authorized to manage this class' });
    }

    const currentTeachers = getTeacherIds(classData);

    // The set of students whose profile.teacherIds must be reconciled.
    const enrollmentSnap = await enrollmentsCol.where('classId', '==', classId).get();
    const studentIds = [...new Set(enrollmentSnap.docs.map((d) => d.data().studentId).filter(Boolean))];

    const profileRefFor = (studentId) => usersCol.doc(studentId)
      .collection('math_whiz_data').doc('profile');

    if (action === 'add') {
      if (currentTeachers.includes(teacherId)) {
        return json(200, { status: 'already_present', classId, teacherId });
      }

      await classRef.update({
        teacherIds: admin.firestore.FieldValue.arrayUnion(teacherId),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Grant the new teacher read access to every enrolled student.
      await Promise.all(studentIds.map((studentId) => (
        profileRefFor(studentId).set(
          { teacherIds: admin.firestore.FieldValue.arrayUnion(teacherId) },
          { merge: true },
        )
      )));

      return json(200, { status: 'added', classId, teacherId, reconciledStudents: studentIds.length });
    }

    // action === 'remove'
    if (currentTeachers.length <= 1) {
      return json(400, { error: 'Cannot remove the last teacher from a class' });
    }
    if (!currentTeachers.includes(teacherId)) {
      return json(200, { status: 'not_present', classId, teacherId });
    }

    await classRef.update({
      teacherIds: admin.firestore.FieldValue.arrayRemove(teacherId),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Revoke access only where the student is no longer reachable by this teacher
    // through any OTHER class — otherwise we'd strip a still-valid relationship.
    await Promise.all(studentIds.map(async (studentId) => {
      const otherEnrollments = await enrollmentsCol.where('studentId', '==', studentId).get();
      const otherClassIds = otherEnrollments.docs
        .map((d) => d.data().classId)
        .filter((cid) => cid && cid !== classId);

      let stillReachable = false;
      for (const ids of chunk([...new Set(otherClassIds)], 30)) {
        if (ids.length === 0) continue;
        const otherClasses = await classesCol
          .where(admin.firestore.FieldPath.documentId(), 'in', ids)
          .get();
        if (otherClasses.docs.some((d) => getTeacherIds(d.data()).includes(teacherId))) {
          stillReachable = true;
          break;
        }
      }

      if (!stillReachable) {
        await profileRefFor(studentId).set(
          { teacherIds: admin.firestore.FieldValue.arrayRemove(teacherId) },
          { merge: true },
        );
      }
    }));

    return json(200, { status: 'removed', classId, teacherId, reconciledStudents: studentIds.length });
  } catch (e) {
    console.error('manage-class-teacher error', e);
    return json(500, { error: e.message || 'Internal error' });
  }
};
