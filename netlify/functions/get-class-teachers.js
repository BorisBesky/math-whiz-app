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
  try {
    return event.body ? JSON.parse(event.body) : {};
  } catch {
    return {};
  }
};

const requireAuth = async (event) => {
  const authHeader = event.headers.authorization || event.headers.Authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Missing Authorization');
  }
  return admin.auth().verifyIdToken(authHeader.slice('Bearer '.length));
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return json(204, {});
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method not allowed' });

  try {
    const user = await requireAuth(event);
    const { appId = process.env.APP_ID || 'default-app-id', classId } = parseBody(event);

    if (!classId) {
      return json(400, { error: 'Missing classId' });
    }

    const classRef = db.collection('artifacts').doc(appId).collection('classes').doc(classId);
    const classSnap = await classRef.get();

    if (!classSnap.exists) {
      return json(404, { error: 'Class not found' });
    }

    const classData = classSnap.data();
    const teacherIds = getTeacherIds(classData);

    if (user.admin !== true && !isTeacherOnClass(classData, user.uid)) {
      return json(403, { error: 'Forbidden' });
    }

    const teachers = await Promise.all(teacherIds.map(async (teacherId) => {
      const profileSnap = await db
        .doc(`artifacts/${appId}/users/${teacherId}/math_whiz_data/profile`)
        .get();

      if (!profileSnap.exists) {
        return { id: teacherId, uid: teacherId };
      }

      const profileData = profileSnap.data() || {};
      return {
        id: teacherId,
        uid: teacherId,
        displayName: profileData.displayName || profileData.name || null,
        name: profileData.name || null,
        email: profileData.email || null,
        role: profileData.role || null,
      };
    }));

    return json(200, { teachers });
  } catch (error) {
    const statusCode = error.message === 'Missing Authorization' ? 401 : 500;
    console.error('[get-class-teachers] Error:', error);
    return json(statusCode, { error: statusCode === 401 ? error.message : 'Internal Server Error' });
  }
};
