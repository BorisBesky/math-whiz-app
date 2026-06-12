const { admin, db } = require('./firebase-admin');
const { getTeacherIds } = require('./class-helpers');

const MAX_MESSAGE_LENGTH = 2000;
const ENROLLMENT_ID_SEPARATOR = '__';

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

const parseEnrollmentId = (enrollmentId) => {
  if (typeof enrollmentId !== 'string') return { classId: '', studentId: '' };
  const idx = enrollmentId.indexOf(ENROLLMENT_ID_SEPARATOR);
  if (idx <= 0) return { classId: '', studentId: '' };
  return {
    classId: enrollmentId.slice(0, idx),
    studentId: enrollmentId.slice(idx + ENROLLMENT_ID_SEPARATOR.length),
  };
};

const normalizeMessageBody = (body) => (
  typeof body === 'string' ? body.trim().slice(0, MAX_MESSAGE_LENGTH) : ''
);

const getParticipantIds = (senderId, recipientId) => (
  [senderId, recipientId].filter(Boolean).sort()
);

const isTeacherForClass = (classData, teacherId) => getTeacherIds(classData).includes(teacherId);

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return json(204, {});
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method not allowed' });

  try {
    const user = await requireAuth(event);
    const {
      appId = process.env.APP_ID || 'default-app-id',
      enrollmentId,
      className = '',
      body,
      sender = {},
      recipient = {},
    } = parseBody(event);

    const senderId = sender.id || sender.uid;
    const recipientId = recipient.id || recipient.uid;
    const cleanBody = normalizeMessageBody(body);
    const { classId, studentId } = parseEnrollmentId(enrollmentId);

    if (!senderId || !recipientId || senderId !== user.uid) {
      return json(403, { error: 'Sender is not authorized.' });
    }

    if (!classId || !studentId) {
      return json(400, { error: 'A valid enrollment is required.' });
    }

    if (!cleanBody) {
      return json(400, { error: 'Message cannot be empty.' });
    }

    const artifactRef = db.collection('artifacts').doc(appId);
    const [enrollmentSnap, classSnap] = await Promise.all([
      artifactRef.collection('classStudents').doc(enrollmentId).get(),
      artifactRef.collection('classes').doc(classId).get(),
    ]);

    if (!enrollmentSnap.exists || !classSnap.exists) {
      return json(404, { error: 'Class enrollment was not found.' });
    }

    const enrollmentData = enrollmentSnap.data() || {};
    const classData = classSnap.data() || {};
    const senderIsStudent = senderId === studentId;
    const senderIsTeacher = isTeacherForClass(classData, senderId);
    const recipientIsTeacher = isTeacherForClass(classData, recipientId);
    const recipientIsStudent = recipientId === studentId;
    const enrollmentMatches = enrollmentData.classId === classId && enrollmentData.studentId === studentId;

    if (!enrollmentMatches || !(
      (senderIsStudent && recipientIsTeacher) ||
      (senderIsTeacher && recipientIsStudent)
    )) {
      return json(403, { error: 'Sender and recipient are not valid for this class.' });
    }

    const messagePayload = {
      enrollmentId,
      className,
      body: cleanBody,
      senderId,
      senderName: sender.name || '',
      recipientId,
      recipientName: recipient.name || '',
      participantIds: getParticipantIds(senderId, recipientId),
      readBy: [senderId],
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const messageRef = await artifactRef.collection('messages').add(messagePayload);

    return json(200, {
      id: messageRef.id,
      ...messagePayload,
      createdAt: new Date().toISOString(),
    });
  } catch (error) {
    const statusCode = error.message === 'Missing Authorization' ? 401 : 500;
    console.error('[send-internal-message] Error:', error);
    return json(statusCode, {
      error: statusCode === 401 ? error.message : 'Failed to send message.',
    });
  }
};
