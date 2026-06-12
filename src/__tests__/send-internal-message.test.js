import { createAdminMock } from '../test-utils/firestoreAdminMock';

const mockState = {};

jest.mock('../../netlify/functions/firebase-admin', () => ({
  admin: {
    auth: () => ({ verifyIdToken: (...args) => mockState.verifyIdToken(...args) }),
    firestore: {
      get FieldValue() { return mockState.FieldValue; },
      get FieldPath() { return mockState.FieldPath; },
    },
  },
  db: {
    collection: (...args) => mockState.db.collection(...args),
    doc: (...args) => mockState.db.doc(...args),
  },
}));

const { handler } = require('../../netlify/functions/send-internal-message');

const APP = 'app-test';
const p = (...parts) => `artifacts/${APP}/${parts.join('/')}`;

const seed = (docs, uid = 'student-1') => {
  const harness = createAdminMock(docs);
  Object.assign(mockState, {
    db: harness.db,
    FieldValue: harness.FieldValue,
    FieldPath: harness.FieldPath,
    verifyIdToken: jest.fn().mockResolvedValue({ uid }),
    h: harness,
  });
  return harness;
};

const event = (body, headers = { authorization: 'Bearer t' }) => ({
  httpMethod: 'POST',
  headers,
  body: JSON.stringify({ appId: APP, ...body }),
});

// A class taught by teacher-1 with student-1 enrolled.
const baseDocs = () => ({
  [p('classes', 'c1')]: { teacherIds: ['teacher-1'] },
  [p('classStudents', 'c1__student-1')]: { classId: 'c1', studentId: 'student-1' },
});

const studentToTeacher = {
  enrollmentId: 'c1__student-1',
  body: 'Hello teacher',
  sender: { id: 'student-1', name: 'Ada' },
  recipient: { id: 'teacher-1', name: 'Ms. Baker' },
};

afterEach(() => jest.clearAllMocks());

describe('send-internal-message handler', () => {
  test('rejects requests without a bearer token (401)', async () => {
    seed(baseDocs());
    const res = await handler(event(studentToTeacher, {}));
    expect(res.statusCode).toBe(401);
  });

  test('rejects non-POST methods (405)', async () => {
    seed(baseDocs());
    const res = await handler({ httpMethod: 'GET', headers: { authorization: 'Bearer t' } });
    expect(res.statusCode).toBe(405);
  });

  test('rejects sender spoofing — senderId must equal the verified uid (403)', async () => {
    const h = seed(baseDocs(), 'student-1');
    const res = await handler(event({
      ...studentToTeacher,
      sender: { id: 'someone-else', name: 'Mallory' },
    }));
    expect(res.statusCode).toBe(403);
    expect(h.adds).toHaveLength(0);
  });

  test('rejects a malformed enrollmentId (400)', async () => {
    seed(baseDocs());
    const res = await handler(event({ ...studentToTeacher, enrollmentId: 'no-separator' }));
    expect(res.statusCode).toBe(400);
  });

  test('rejects an empty message body (400)', async () => {
    seed(baseDocs());
    const res = await handler(event({ ...studentToTeacher, body: '   ' }));
    expect(res.statusCode).toBe(400);
  });

  test('returns 404 when the enrollment or class is missing', async () => {
    const h = seed({}); // nothing seeded
    const res = await handler(event(studentToTeacher));
    expect(res.statusCode).toBe(404);
    expect(h.adds).toHaveLength(0);
  });

  test('rejects a role-pair mismatch — student sending to a non-teacher (403)', async () => {
    // recipient "ghost" is neither a teacher on the class nor the enrolled student.
    seed(baseDocs(), 'student-1');
    const res = await handler(event({
      ...studentToTeacher,
      recipient: { id: 'ghost', name: 'Ghost' },
    }));
    expect(res.statusCode).toBe(403);
  });

  test('rejects when the enrollment doc does not match the enrollmentId pair (403)', async () => {
    seed({
      [p('classes', 'c1')]: { teacherIds: ['teacher-1'] },
      // enrollment doc carries a different studentId than the enrollmentId encodes.
      [p('classStudents', 'c1__student-1')]: { classId: 'c1', studentId: 'other-student' },
    }, 'student-1');
    const res = await handler(event(studentToTeacher));
    expect(res.statusCode).toBe(403);
  });

  test('happy path: student → teacher persists a well-formed message (200)', async () => {
    const h = seed(baseDocs(), 'student-1');
    const res = await handler(event(studentToTeacher));
    const body = JSON.parse(res.body);

    expect(res.statusCode).toBe(200);
    expect(h.adds).toHaveLength(1);
    expect(h.adds[0].path).toContain(`${p('messages')}/`);
    expect(h.adds[0].data).toMatchObject({
      enrollmentId: 'c1__student-1',
      body: 'Hello teacher',
      senderId: 'student-1',
      recipientId: 'teacher-1',
      participantIds: ['student-1', 'teacher-1'],
      readBy: ['student-1'],
    });
    expect(body).toMatchObject({ id: 'auto-1', senderId: 'student-1', recipientId: 'teacher-1' });
  });

  test('happy path: teacher → student persists a well-formed message (200)', async () => {
    const h = seed(baseDocs(), 'teacher-1');
    const res = await handler(event({
      enrollmentId: 'c1__student-1',
      body: 'Nice work!',
      sender: { id: 'teacher-1', name: 'Ms. Baker' },
      recipient: { id: 'student-1', name: 'Ada' },
    }));

    expect(res.statusCode).toBe(200);
    expect(h.adds[0].data).toMatchObject({
      senderId: 'teacher-1',
      recipientId: 'student-1',
      participantIds: ['student-1', 'teacher-1'],
      readBy: ['teacher-1'],
    });
  });
});
