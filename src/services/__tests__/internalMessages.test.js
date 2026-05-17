import {
  createMessagePayload,
  getParticipantIds,
  getTeacherStudentRelationships,
  isMessageUnreadForUser,
  normalizeMessageBody,
  sortMessagesNewestFirst,
} from '../internalMessages';

jest.mock('firebase/firestore', () => ({
  addDoc: jest.fn(),
  arrayUnion: jest.fn((value) => ({ arrayUnion: value })),
  collection: jest.fn(),
  doc: jest.fn(),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  query: jest.fn(),
  serverTimestamp: jest.fn(() => 'SERVER_TIME'),
  updateDoc: jest.fn(),
  where: jest.fn(),
}));

describe('internalMessages service helpers', () => {
  it('creates a constrained student-teacher message payload', () => {
    const payload = createMessagePayload({
      sender: { id: 'teacher-1', role: 'teacher', name: 'Ms. Baker' },
      recipient: { id: 'student-1', role: 'student', name: 'Ada' },
      classId: 'class-1',
      className: 'Room 12',
      studentId: 'student-1',
      studentName: 'Ada',
      teacherId: 'teacher-1',
      teacherName: 'Ms. Baker',
      body: '  Nice work on fractions.  ',
    });

    expect(payload).toMatchObject({
      body: 'Nice work on fractions.',
      classId: 'class-1',
      studentId: 'student-1',
      teacherId: 'teacher-1',
      senderId: 'teacher-1',
      recipientId: 'student-1',
      participantIds: ['student-1', 'teacher-1'],
      readBy: ['teacher-1'],
    });
    expect(payload).toHaveProperty('createdAt');
  });

  it('rejects empty messages and missing relationships', () => {
    expect(() => createMessagePayload({
      sender: { id: 'student-1', role: 'student' },
      recipient: { id: 'teacher-1', role: 'teacher' },
      classId: 'class-1',
      studentId: 'student-1',
      teacherId: 'teacher-1',
      body: '   ',
    })).toThrow('Message cannot be empty');

    expect(() => createMessagePayload({
      sender: { id: 'student-1', role: 'student' },
      recipient: { id: 'teacher-1', role: 'teacher' },
      body: 'Hello',
    })).toThrow('valid class');
  });

  it('normalizes message bodies and participant ids', () => {
    expect(normalizeMessageBody(' hello ')).toBe('hello');
    expect(normalizeMessageBody('x'.repeat(2100))).toHaveLength(2000);
    expect(getParticipantIds('teacher-1', 'student-1')).toEqual(['student-1', 'teacher-1']);
  });

  it('sorts messages newest first and calculates unread state', () => {
    const messages = [
      { id: 'old', createdAt: { seconds: 10 }, recipientId: 'student-1', readBy: [] },
      { id: 'new', createdAt: { seconds: 20 }, recipientId: 'teacher-1', readBy: ['student-1'] },
    ];

    expect(sortMessagesNewestFirst(messages).map((message) => message.id)).toEqual(['new', 'old']);
    expect(isMessageUnreadForUser(messages[0], 'student-1')).toBe(true);
    expect(isMessageUnreadForUser(messages[1], 'student-1')).toBe(false);
  });

  it('derives only valid teacher-student relationships from class rosters', () => {
    const relationships = getTeacherStudentRelationships({
      teacherId: 'teacher-1',
      classes: [
        { id: 'class-1', name: 'Room 12', teacherIds: ['teacher-1'] },
        { id: 'class-2', name: 'Other Room', teacherIds: ['teacher-2'] },
      ],
      students: [
        { id: 'student-1', displayName: 'Ada', classId: 'class-1' },
        { id: 'student-2', displayName: 'Grace', classId: 'class-2' },
        { id: 'student-3', displayName: 'Lin' },
      ],
    });

    expect(relationships).toEqual([
      {
        classId: 'class-1',
        className: 'Room 12',
        studentId: 'student-1',
        studentName: 'Ada',
        teacherId: 'teacher-1',
        teacherName: 'Teacher',
      },
    ]);
  });

  it('dedupes duplicate roster rows for the same class/student/teacher enrollment', () => {
    const relationships = getTeacherStudentRelationships({
      teacherId: 'teacher-1',
      classes: [
        { id: 'class-1', name: 'Room 12', teacherIds: ['teacher-1'], teacherName: 'Ms. Baker' },
      ],
      students: [
        { id: 'student-1', displayName: 'Ada', classId: 'class-1' },
        { id: 'student-1', displayName: 'Ada ', classId: 'class-1' },
      ],
    });

    expect(relationships).toHaveLength(1);
    expect(relationships[0].studentId).toBe('student-1');
  });
});
