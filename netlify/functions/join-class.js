// Netlify Function to generate and redeem class join codes
const { admin, db } = require('./firebase-admin');

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

const genCode = (len = 7) => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return json(204, {});
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method not allowed' });

  try {
    const user = await requireAuth(event);
    const body = parseBody(event);
    const action = (body.action || (event.queryStringParameters || {}).action || '').toString();
    const appId = body.appId || process.env.APP_ID || 'default-app-id';

    if (!['request-link', 'redeem'].includes(action)) {
      return json(400, { error: 'Invalid action' });
    }

    const classesCol = db.collection('artifacts').doc(appId).collection('classes');
    const enrollmentsCol = db.collection('artifacts').doc(appId).collection('classStudents');

    if (action === 'request-link') {
      const { classId, rotate } = body;
      if (!classId) return json(400, { error: 'Missing classId' });

      const classRef = classesCol.doc(classId);
      const classSnap = await classRef.get();
      if (!classSnap.exists) return json(404, { error: 'Class not found' });
      const classData = classSnap.data();

      if (classData.teacherId !== user.uid) {
        return json(403, { error: 'Not class owner' });
      }

      let joinCode = classData.joinCode;
      if (!joinCode || rotate) {
        joinCode = genCode(7);
        await classRef.update({
          joinCode,
          joinCodeUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }

      const baseUrl = process.env.PUBLIC_APP_BASE_URL || '';
      const joinUrl = baseUrl ? `${baseUrl}/join?code=${joinCode}` : `/join?code=${joinCode}`;

      return json(200, { joinCode, joinUrl });
    }

    if (action === 'redeem') {
      const { code } = body;
      if (!code) return json(400, { error: 'Missing code' });

      const classesByCode = await classesCol.where('joinCode', '==', code).limit(1).get();
      if (classesByCode.empty) return json(404, { error: 'Invalid code' });

      const classDoc = classesByCode.docs[0];
      const classId = classDoc.id;

      const existing = await enrollmentsCol
        .where('classId', '==', classId)
        .where('studentId', '==', user.uid)
        .limit(1)
        .get();
      if (!existing.empty) {
        return json(200, { status: 'already_enrolled', classId });
      }

      const now = admin.firestore.FieldValue.serverTimestamp();
      const enrollmentId = `${classId}__${user.uid}`;
      await enrollmentsCol.doc(enrollmentId).set({
        classId,
        studentId: user.uid,
        studentEmail: user.email || null,
        studentName: user.name || user.displayName || null,
        joinedAt: now,
        createdAt: now,
      }, { merge: true });

      const profileRef = db
        .collection('artifacts').doc(appId)
        .collection('users').doc(user.uid)
        .collection('math_whiz_data').doc('profile');

      await profileRef.set({ classId, updatedAt: now }, { merge: true });

      return json(200, { status: 'enrolled', classId });
    }

    return json(400, { error: 'Unhandled action' });
  } catch (e) {
    console.error('join-class error', e);
    return json(500, { error: e.message || 'Internal error' });
  }
};
