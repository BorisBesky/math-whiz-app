import {
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
import { getAuth } from 'firebase/auth';
import { getTeacherIds } from '../utils/classHelpers';
import { getStudentDisplayName } from '../utils/studentName';

const MAX_MESSAGE_LENGTH = 2000;
const ENROLLMENT_ID_SEPARATOR = '__';

export const getMessagesCollection = (db, appId) => (
  collection(db, 'artifacts', appId, 'messages')
);

export const getEnrollmentId = (classId, studentId) => (
  classId && studentId ? `${classId}${ENROLLMENT_ID_SEPARATOR}${studentId}` : ''
);

export const parseEnrollmentId = (enrollmentId) => {
  if (typeof enrollmentId !== 'string') return { classId: '', studentId: '' };
  const idx = enrollmentId.indexOf(ENROLLMENT_ID_SEPARATOR);
  if (idx <= 0) return { classId: '', studentId: '' };
  return {
    classId: enrollmentId.slice(0, idx),
    studentId: enrollmentId.slice(idx + ENROLLMENT_ID_SEPARATOR.length),
  };
};

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

export const isMessageUnreadForUser = (message, userId) => (
  message?.recipientId === userId && !(message.readBy || []).includes(userId)
);

export const createMessagePayload = ({
  sender,
  recipient,
  enrollmentId,
  className = '',
  body,
}) => {
  const senderId = sender?.id || sender?.uid;
  const recipientId = recipient?.id || recipient?.uid;
  const cleanBody = normalizeMessageBody(body);

  if (!senderId || !recipientId) {
    throw new Error('Sender and recipient are required.');
  }

  const { classId, studentId } = parseEnrollmentId(enrollmentId);
  if (!classId || !studentId) {
    throw new Error('A valid enrollment is required.');
  }

  if (!cleanBody) {
    throw new Error('Message cannot be empty.');
  }

  return {
    enrollmentId,
    className,
    body: cleanBody,
    senderId,
    senderName: sender.name || '',
    recipientId,
    recipientName: recipient.name || '',
    participantIds: getParticipantIds(senderId, recipientId),
    readBy: [senderId],
    createdAt: serverTimestamp(),
  };
};

export const sendInternalMessage = async ({ db, appId, ...messageInput }) => {
  if (!appId) {
    throw new Error('Application ID is required.');
  }

  const auth = getAuth();
  const token = await auth.currentUser?.getIdToken();
  if (!token) {
    throw new Error('Authentication required.');
  }

  const payload = createMessagePayload(messageInput);
  const response = await fetch('/.netlify/functions/send-internal-message', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      appId,
      enrollmentId: payload.enrollmentId,
      className: payload.className,
      body: payload.body,
      sender: {
        id: payload.senderId,
        name: payload.senderName,
      },
      recipient: {
        id: payload.recipientId,
        name: payload.recipientName,
      },
    }),
  });

  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(result.error || 'Failed to send message.');
  }

  return result;
};

export const markMessageRead = async ({ db, appId, messageId, userId }) => {
  if (!db || !appId || !messageId || !userId) return;
  const messageRef = doc(db, 'artifacts', appId, 'messages', messageId);
  await updateDoc(messageRef, {
    readBy: arrayUnion(userId),
  });
};

const chunkArray = (items, size) => {
  const chunks = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
};

const buildRelationshipFromEnrollment = (enrollment, classItem, teacherId, studentProfile = null) => ({
  // Always derive from (classId, studentId) — the Firestore rule's enrollmentExists()
  // looks the doc up at exactly this path, and legacy auto-ID enrollment docs would
  // otherwise produce a key that doesn't match any classStudents doc the rule can find.
  enrollmentId: getEnrollmentId(classItem.id, enrollment.studentId),
  classId: classItem.id,
  className: classItem.name || 'Class',
  studentId: enrollment.studentId,
  studentName: studentProfile
    ? getStudentDisplayName({ id: enrollment.studentId, ...studentProfile }, enrollment.studentEmail || `Student ${(enrollment.studentId || '').slice(-6)}`)
    : getStudentDisplayName(enrollment, enrollment.studentEmail || `Student ${(enrollment.studentId || '').slice(-6)}`),
  teacherId,
  teacherName: classItem.teacherName || classItem.teacherEmail || 'Teacher',
});

const getStudentProfilesById = async ({ db, appId, studentIds }) => {
  const profilesById = new Map();
  const uniqueStudentIds = Array.from(new Set(studentIds.filter(Boolean)));

  await Promise.all(uniqueStudentIds.map(async (studentId) => {
    // Best-effort: the per-student profile read is gated by the profile rule, which only
    // grants a teacher access when the student's profile carries a `teacherIds` array
    // containing the teacher (maintained solely by scripts/sync-teacher-ids.js, so usually
    // absent). A denied/missing read must NOT fail the whole relationships load — the name
    // simply falls back to the enrollment-stored value in buildRelationshipFromEnrollment.
    try {
      const profileRef = doc(db, 'artifacts', appId, 'users', studentId, 'math_whiz_data', 'profile');
      const profileSnap = await getDoc(profileRef);
      if (profileSnap.exists()) {
        profilesById.set(studentId, profileSnap.data() || {});
      }
    } catch (err) {
      console.warn('[getStudentProfilesById] Skipping unreadable student profile', studentId, err?.code || err);
    }
  }));

  return profilesById;
};

/**
 * Composite key for the recipient dropdown. enrollmentId alone collapses multi-teacher
 * classes into a single row (the student would lose the ability to reach the second
 * teacher); adding teacherId keeps one row per (enrollment, teacher) while still
 * collapsing duplicate enrollment docs that point at the same teacher.
 */
export const getRelationshipKey = (relationship) => (
  relationship?.enrollmentId && relationship?.teacherId
    ? `${relationship.enrollmentId}::${relationship.teacherId}`
    : ''
);

/**
 * Fetch relationships from the classStudents collection — the canonical enrollment store.
 * Returns one row per (enrollment, teacher) pair. classStudents has deterministic IDs
 * (`${classId}__${studentId}`), so there is no duplicate input to dedupe.
 */
export const getTeacherStudentRelationships = async ({ db, appId, classes = [], teacherId, includeAllTeachers = false }) => {
  if (!db || !appId) return [];
  if (!teacherId && !includeAllTeachers) return [];

  const eligibleClasses = classes.filter((cls) => {
    if (includeAllTeachers) return true;
    return getTeacherIds(cls).includes(teacherId);
  });

  if (eligibleClasses.length === 0) return [];

  const classById = new Map(eligibleClasses.map((cls) => [cls.id, cls]));
  const enrollmentsCol = collection(db, 'artifacts', appId, 'classStudents');
  const classIds = eligibleClasses.map((cls) => cls.id);

  const enrollmentDocs = [];
  await Promise.all(
    chunkArray(classIds, 30).map(async (chunk) => {
      const snapshot = await getDocs(query(enrollmentsCol, where('classId', 'in', chunk)));
      snapshot.forEach((enrollmentDoc) => {
        enrollmentDocs.push({ id: enrollmentDoc.id, ...enrollmentDoc.data() });
      });
    }),
  );

  const relationships = [];
  const studentProfilesById = await getStudentProfilesById({
    db,
    appId,
    studentIds: enrollmentDocs.map((enrollment) => enrollment.studentId),
  });

  enrollmentDocs.forEach((enrollment) => {
    const classItem = classById.get(enrollment.classId);
    if (!classItem || !enrollment.studentId) return;

    const teacherIds = getTeacherIds(classItem);
    if (teacherIds.length === 0) return;

    if (includeAllTeachers) {
      teacherIds.forEach((tid) => {
        relationships.push(buildRelationshipFromEnrollment(enrollment, classItem, tid, studentProfilesById.get(enrollment.studentId)));
      });
    } else if (teacherIds.includes(teacherId)) {
      relationships.push(buildRelationshipFromEnrollment(enrollment, classItem, teacherId, studentProfilesById.get(enrollment.studentId)));
    }
  });

  return relationships;
};

export const getStudentTeacherRelationships = async ({ db, appId, studentId }) => {
  if (!db || !appId || !studentId) return [];

  const enrollmentsRef = collection(db, 'artifacts', appId, 'classStudents');
  const enrollmentSnapshot = await getDocs(query(enrollmentsRef, where('studentId', '==', studentId)));
  if (enrollmentSnapshot.empty) return [];

  const enrollments = enrollmentSnapshot.docs.map((enrollmentDoc) => ({
    id: enrollmentDoc.id,
    ...enrollmentDoc.data(),
  }));

  const classIds = Array.from(new Set(enrollments.map((e) => e.classId).filter(Boolean)));
  const classesById = new Map();
  await Promise.all(classIds.map(async (classId) => {
    const classRef = doc(db, 'artifacts', appId, 'classes', classId);
    const classSnap = await getDoc(classRef);
    if (classSnap.exists()) {
      classesById.set(classId, { id: classSnap.id, ...classSnap.data() });
    }
  }));

  // One row per enrollment. We don't fan out to per-teacher rows for the student side:
  // the class-level teacher label (teacherName/teacherEmail) is the same for every
  // teacher on the class, so multi-teacher classes would show indistinguishable
  // duplicates. The student writes to the class's primary teacher; any teacher on the
  // class can read and reply (Firestore rule allows any teacher on the class as
  // recipient).
  const relationships = [];
  const studentProfilesById = await getStudentProfilesById({
    db,
    appId,
    studentIds: [studentId],
  });

  enrollments.forEach((enrollment) => {
    const classItem = classesById.get(enrollment.classId);
    if (!classItem) return;
    const teacherIds = getTeacherIds(classItem);
    const primaryTeacherId = classItem.teacherId && teacherIds.includes(classItem.teacherId)
      ? classItem.teacherId
      : teacherIds[0];
    if (!primaryTeacherId) return;
    relationships.push(buildRelationshipFromEnrollment(enrollment, classItem, primaryTeacherId, studentProfilesById.get(enrollment.studentId)));
  });

  return relationships;
};
