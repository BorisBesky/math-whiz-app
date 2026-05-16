import {
  addDoc,
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { getTeacherIds } from '../utils/classHelpers';

const MAX_MESSAGE_LENGTH = 2000;

export const getMessagesCollection = (db, appId) => (
  collection(db, 'artifacts', appId, 'messages')
);

export const getMessageTimestampMillis = (value) => {
  if (!value) return 0;
  if (typeof value.toMillis === 'function') return value.toMillis();
  if (typeof value.seconds === 'number') return value.seconds * 1000;
  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
};

export const sortMessagesNewestFirst = (messages) => (
  [...messages].sort((a, b) => getMessageTimestampMillis(b.createdAt) - getMessageTimestampMillis(a.createdAt))
);

export const getParticipantIds = (senderId, recipientId) => (
  [senderId, recipientId].filter(Boolean).sort()
);

export const normalizeMessageBody = (body) => (
  typeof body === 'string' ? body.trim().slice(0, MAX_MESSAGE_LENGTH) : ''
);

export const createMessagePayload = ({
  sender,
  recipient,
  classId,
  className = '',
  studentId,
  studentName = '',
  teacherId,
  teacherName = '',
  body,
}) => {
  const senderId = sender?.id || sender?.uid;
  const recipientId = recipient?.id || recipient?.uid;
  const cleanBody = normalizeMessageBody(body);

  if (!senderId || !recipientId) {
    throw new Error('Sender and recipient are required.');
  }

  if (!classId || !studentId || !teacherId) {
    throw new Error('A valid class, student, and teacher relationship is required.');
  }

  if (!cleanBody) {
    throw new Error('Message cannot be empty.');
  }

  return {
    body: cleanBody,
    classId,
    className,
    studentId,
    studentName,
    teacherId,
    teacherName,
    senderId,
    senderRole: sender.role,
    senderName: sender.name || '',
    recipientId,
    recipientRole: recipient.role,
    recipientName: recipient.name || '',
    participantIds: getParticipantIds(senderId, recipientId),
    readBy: [senderId],
    createdAt: serverTimestamp(),
  };
};

export const sendInternalMessage = async ({ db, appId, ...messageInput }) => {
  if (!db) {
    throw new Error('Firestore is not initialized.');
  }

  const payload = createMessagePayload(messageInput);
  const ref = await addDoc(getMessagesCollection(db, appId), payload);
  return { id: ref.id, ...payload };
};

export const markMessageRead = async ({ db, appId, messageId, userId }) => {
  if (!db || !appId || !messageId || !userId) return;
  const messageRef = doc(db, 'artifacts', appId, 'messages', messageId);
  await updateDoc(messageRef, {
    readBy: arrayUnion(userId),
  });
};

export const isMessageUnreadForUser = (message, userId) => (
  message?.recipientId === userId && !(message.readBy || []).includes(userId)
);

export const getTeacherStudentRelationships = ({ classes = [], students = [], teacherId, includeAllTeachers = false }) => {
  if (!teacherId && !includeAllTeachers) return [];

  return students
    .filter((student) => student.classId)
    .map((student) => {
      const classItem = classes.find((cls) => cls.id === student.classId);
      if (!classItem) return null;
      const teacherIds = getTeacherIds(classItem);
      const activeTeacherId = teacherId || teacherIds[0];
      if (!includeAllTeachers && !teacherIds.includes(activeTeacherId)) return null;

      return {
        classId: classItem.id,
        className: classItem.name || 'Class',
        studentId: student.id,
        studentName: student.displayName || student.name || student.email || `Student ${student.id.slice(-6)}`,
        teacherId: activeTeacherId,
        teacherName: classItem.teacherName || classItem.teacherEmail || 'Teacher',
      };
    })
    .filter(Boolean);
};

export const getStudentTeacherRelationships = async ({ db, appId, studentId }) => {
  if (!db || !appId || !studentId) return [];

  const enrollmentsRef = collection(db, 'artifacts', appId, 'classStudents');
  const enrollmentQuery = query(enrollmentsRef, where('studentId', '==', studentId));
  const enrollmentSnapshot = await getDocs(enrollmentQuery);
  const relationships = [];

  await Promise.all(enrollmentSnapshot.docs.map(async (enrollmentDoc) => {
    const enrollment = enrollmentDoc.data();
    if (!enrollment.classId) return;

    const classRef = doc(db, 'artifacts', appId, 'classes', enrollment.classId);
    const classSnapshot = await getDoc(classRef);
    if (!classSnapshot.exists()) return;

    const classItem = { id: classSnapshot.id, ...classSnapshot.data() };
    getTeacherIds(classItem).forEach((teacherId) => {
      relationships.push({
        classId: classItem.id,
        className: classItem.name || enrollment.className || 'Class',
        studentId,
        studentName: enrollment.studentName || '',
        teacherId,
        teacherName: classItem.teacherName || classItem.teacherEmail || 'Teacher',
      });
    });
  }));

  return relationships;
};
