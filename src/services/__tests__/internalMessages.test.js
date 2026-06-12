import {
  createMessagePayload,
  getEnrollmentId,
  getParticipantIds,
  sendInternalMessage,
  getTeacherStudentRelationships,
  isMessageUnreadForUser,
  normalizeMessageBody,
  parseEnrollmentId,
  sortMessagesNewestFirst,
} from '../internalMessages';

jest.mock('firebase/firestore', () => ({
  arrayUnion: jest.fn((value) => ({ arrayUnion: value })),
  collection: jest.fn(() => ({ __type: 'collection' })),
  doc: jest.fn(() => ({ __type: 'doc' })),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  query: jest.fn(() => ({ __type: 'query' })),
  serverTimestamp: jest.fn(() => 'SERVER_TIME'),
  updateDoc: jest.fn(),
  where: jest.fn(),
}));

const mockGetIdToken = jest.fn();

jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(() => ({
    currentUser: { getIdToken: (...args) => mockGetIdToken(...args) },
  })),
}));

// eslint-disable-next-line import/first
const firestoreMock = require('firebase/firestore');

const mockEnrollmentDocs = (docs) => {
  firestoreMock.getDocs.mockResolvedValue({
    empty: docs.length === 0,
    docs: docs.map((d) => ({ id: d.id, data: () => d })),
    forEach: (cb) => docs.forEach((d) => cb({ id: d.id, data: () => d })),
  });
};

describe('internalMessages service helpers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    firestoreMock.getDoc.mockResolvedValue({
      exists: () => false,
      data: () => ({}),
    });
    mockGetIdToken.mockResolvedValue('token-abc');
    require('firebase/auth').getAuth.mockReturnValue({
      currentUser: { getIdToken: (...args) => mockGetIdToken(...args) },
    });
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: 'message-1' }),
    });
  });

  afterEach(() => {
    delete global.fetch;
  });

  it('creates an enrollment-centric message payload', () => {
    const payload = createMessagePayload({
      sender: { id: 'teacher-1', role: 'teacher', name: 'Ms. Baker' },
      recipient: { id: 'student-1', role: 'student', name: 'Ada' },
      enrollmentId: 'class-1__student-1',
      className: 'Room 12',
      body: '  Nice work on fractions.  ',
    });

    expect(payload).toMatchObject({
      enrollmentId: 'class-1__student-1',
      className: 'Room 12',
      body: 'Nice work on fractions.',
      senderId: 'teacher-1',
      senderName: 'Ms. Baker',
      recipientId: 'student-1',
      recipientName: 'Ada',
      participantIds: ['student-1', 'teacher-1'],
      readBy: ['teacher-1'],
    });
    expect(payload).toHaveProperty('createdAt');
    expect(payload).not.toHaveProperty('classId');
    expect(payload).not.toHaveProperty('teacherId');
    expect(payload).not.toHaveProperty('senderRole');
  });

  it('rejects empty bodies and missing enrollments', () => {
    expect(() => createMessagePayload({
      sender: { id: 'student-1', role: 'student' },
      recipient: { id: 'teacher-1', role: 'teacher' },
      enrollmentId: 'class-1__student-1',
      body: '   ',
    })).toThrow('Message cannot be empty');

    expect(() => createMessagePayload({
      sender: { id: 'student-1', role: 'student' },
      recipient: { id: 'teacher-1', role: 'teacher' },
      body: 'Hello',
    })).toThrow('valid enrollment');
  });

  it('builds and parses enrollment ids round-trip', () => {
    expect(getEnrollmentId('class-1', 'student-1')).toBe('class-1__student-1');
    expect(parseEnrollmentId('class-1__student-1')).toEqual({ classId: 'class-1', studentId: 'student-1' });
    expect(parseEnrollmentId('bad-format')).toEqual({ classId: '', studentId: '' });
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

  it('fetches teacher relationships from classStudents and joins class metadata', async () => {
    mockEnrollmentDocs([
      {
        id: 'class-1__student-1',
        classId: 'class-1',
        studentId: 'student-1',
        studentName: 'Ada',
      },
      {
        id: 'class-2__student-2',
        classId: 'class-2',
        studentId: 'student-2',
        studentName: 'Grace',
      },
    ]);

    const relationships = await getTeacherStudentRelationships({
      db: {},
      appId: 'app-1',
      teacherId: 'teacher-1',
      classes: [
        { id: 'class-1', name: 'Room 12', teacherIds: ['teacher-1'], teacherName: 'Ms. Baker' },
        { id: 'class-2', name: 'Other Room', teacherIds: ['teacher-2'] },
      ],
    });

    expect(relationships).toEqual([
      {
        enrollmentId: 'class-1__student-1',
        classId: 'class-1',
        className: 'Room 12',
        studentId: 'student-1',
        studentName: 'Ada',
        teacherId: 'teacher-1',
        teacherName: 'Ms. Baker',
      },
    ]);
  });

  it('prefers current student profile names over stale classStudents names', async () => {
    mockEnrollmentDocs([
      {
        id: 'class-1__student-1',
        classId: 'class-1',
        studentId: 'student-1',
        studentName: 'Unknown',
      },
    ]);
    firestoreMock.getDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({ displayName: 'Margo' }),
    });

    const relationships = await getTeacherStudentRelationships({
      db: {},
      appId: 'app-1',
      teacherId: 'teacher-1',
      classes: [
        { id: 'class-1', name: 'Room 12', teacherIds: ['teacher-1'], teacherName: 'Ms. Baker' },
      ],
    });

    expect(relationships[0].studentName).toBe('Margo');
  });

  it('sends messages through the serverless function with an auth token', async () => {
    await sendInternalMessage({
      appId: 'app-1',
      sender: { id: 'teacher-1', role: 'teacher', name: 'Ms. Baker' },
      recipient: { id: 'student-1', role: 'student', name: 'Ada' },
      enrollmentId: 'class-1__student-1',
      className: 'Room 12',
      body: 'Nice work',
    });

    expect(global.fetch).toHaveBeenCalledWith('/.netlify/functions/send-internal-message', expect.objectContaining({
      method: 'POST',
      headers: expect.objectContaining({
        Authorization: 'Bearer token-abc',
      }),
    }));
    expect(JSON.parse(global.fetch.mock.calls[0][1].body)).toMatchObject({
      appId: 'app-1',
      enrollmentId: 'class-1__student-1',
      body: 'Nice work',
      sender: { id: 'teacher-1', name: 'Ms. Baker' },
      recipient: { id: 'student-1', name: 'Ada' },
    });
  });
});
