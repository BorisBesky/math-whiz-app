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

const { handler } = require('../../netlify/functions/class-question-pool-health');

const APP = 'app-test';
const p = (...parts) => `artifacts/${APP}/${parts.join('/')}`;
const attemptPath = (sid, attemptId) => p('users', sid, 'attempts', attemptId);

const seed = (docs, token = { uid: 'teacher-1' }) => {
  const harness = createAdminMock(docs);
  Object.assign(mockState, {
    db: harness.db,
    FieldValue: harness.FieldValue,
    FieldPath: harness.FieldPath,
    verifyIdToken: jest.fn().mockResolvedValue(token),
    h: harness,
  });
  return harness;
};

const event = (body, headers = { authorization: 'Bearer t' }) => ({
  httpMethod: 'POST',
  headers,
  body: JSON.stringify({ appId: APP, ...body }),
});

afterEach(() => jest.clearAllMocks());

describe('class-question-pool-health handler', () => {
  test('rejects a missing bearer token (401)', async () => {
    seed({});
    const res = await handler(event({ classId: 'c1' }, {}));
    expect(res.statusCode).toBe(401);
  });

  test('rejects non-POST (405) and missing classId (400)', async () => {
    seed({ [p('classes', 'c1')]: { teacherIds: ['teacher-1'] } });
    expect((await handler({ httpMethod: 'GET', headers: { authorization: 'Bearer t' } })).statusCode).toBe(405);
    expect((await handler(event({}))).statusCode).toBe(400);
  });

  test('returns 404 when the class does not exist', async () => {
    seed({});
    expect((await handler(event({ classId: 'missing' }))).statusCode).toBe(404);
  });

  test('forbids a caller who is neither admin nor a teacher on the class (403)', async () => {
    seed({ [p('classes', 'c1')]: { teacherIds: ['teacher-9'] } }, { uid: 'teacher-1' });
    expect((await handler(event({ classId: 'c1' }))).statusCode).toBe(403);
  });

  test('aggregates attempts across enrolled students and flags repeats', async () => {
    const geo = (q, sid) => ({ topic: 'Geometry', subtopic: 'lines and angles', question: q, correctAnswer: 'point' });
    seed({
      [p('classes', 'c1')]: { teacherIds: ['teacher-1'], gradeLevel: 'G4' },
      [p('classStudents', 'c1__s1')]: { classId: 'c1', studentId: 's1' },
      [p('classStudents', 'c1__s2')]: { classId: 'c1', studentId: 's2' },
      // s1 saw the same question twice, s2 saw it once → 3 total across the class.
      [attemptPath('s1', 'a1')]: geo('What is an exact location with no size?'),
      [attemptPath('s1', 'a2')]: geo('What is an exact location with no size?'),
      [attemptPath('s2', 'a1')]: geo('What is an exact location with no size?'),
      [attemptPath('s2', 'a2')]: { topic: 'Geometry', subtopic: 'lines and angles', question: 'A ray has one endpoint.', correctAnswer: 'True' },
    }, { uid: 'teacher-1' });

    const res = await handler(event({ classId: 'c1', repeatThreshold: 3 }));
    const body = JSON.parse(res.body);

    expect(res.statusCode).toBe(200);
    expect(body.studentsAnalyzed).toBe(2);
    expect(body.totalAnswers).toBe(4);
    expect(body.flags).toHaveLength(1);
    expect(body.flags[0]).toMatchObject({
      topic: 'Geometry',
      subtopic: 'lines and angles',
      maxRepeats: 3,
      sampleQuestion: 'What is an exact location with no size?',
    });
  });

  test('falls back to profile.answeredQuestions when a student has no attempts subcollection', async () => {
    seed({
      [p('classes', 'c1')]: { teacherIds: ['teacher-1'] },
      [p('classStudents', 'c1__s1')]: { classId: 'c1', studentId: 's1' },
      [p('users', 's1', 'math_whiz_data', 'profile')]: {
        answeredQuestions: [
          { topic: 'Geometry', subtopic: 'x', question: 'Q', correctAnswer: 'a' },
          { topic: 'Geometry', subtopic: 'x', question: 'Q', correctAnswer: 'a' },
        ],
      },
    }, { uid: 'teacher-1' });

    const res = await handler(event({ classId: 'c1', repeatThreshold: 2 }));
    const body = JSON.parse(res.body);
    expect(body.totalAnswers).toBe(2);
    expect(body.flags[0].maxRepeats).toBe(2);
  });

  test('an admin may analyze a class they do not teach', async () => {
    seed({
      [p('classes', 'c1')]: { teacherIds: ['teacher-9'] },
      [p('classStudents', 'c1__s1')]: { classId: 'c1', studentId: 's1' },
    }, { uid: 'admin-1', admin: true });
    const res = await handler(event({ classId: 'c1' }));
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body).flags).toHaveLength(0);
  });
});
