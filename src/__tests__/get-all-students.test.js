import { createAdminMock } from '../test-utils/firestoreAdminMock';

const mockState = {};

jest.mock('../../netlify/functions/firebase-admin', () => ({
  admin: {
    apps: [{}],
    auth: () => ({ verifyIdToken: (...args) => mockState.verifyIdToken(...args) }),
  },
  db: {
    collectionGroup: (...args) => mockState.db.collectionGroup(...args),
    doc: (...args) => mockState.db.doc(...args),
  },
}));

const { handler } = require('../../netlify/functions/get-all-students');

const APP = 'app-test';
const p = (...parts) => `artifacts/${APP}/${parts.join('/')}`;
const profilePath = (uid) => p('users', uid, 'math_whiz_data', 'profile');

const seed = (docs, token = { uid: 'teacher-1' }) => {
  const harness = createAdminMock(docs);
  Object.assign(mockState, {
    db: harness.db,
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

describe('get-all-students handler', () => {
  test('rejects a missing bearer token (400)', async () => {
    seed({});
    const res = await handler(event({}, {}));
    expect(res.statusCode).toBe(400);
  });

  test('rejects non-POST (405)', async () => {
    seed({});
    expect((await handler({ httpMethod: 'GET', headers: { authorization: 'Bearer t' } })).statusCode).toBe(405);
  });

  test('forbids a caller who is neither admin nor teacher (403)', async () => {
    seed({
      [profilePath('student-1')]: { role: 'student' },
    }, { uid: 'student-1' });
    expect((await handler(event({}))).statusCode).toBe(403);
  });

  test('does not crash with a 500 when fetching a teacher\'s students (regression: native .select() on a collectionGroup query requires an unprovisioned composite index)', async () => {
    seed({
      [profilePath('teacher-1')]: { role: 'teacher', teacherIds: ['teacher-1'] },
      [profilePath('student-1')]: {
        role: 'student',
        teacherIds: ['teacher-1'],
        displayName: 'Alice',
        coins: 12,
        questionSummary: { total: 10, correct: 8 },
      },
    }, { uid: 'teacher-1' });

    const res = await handler(event({}));
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body).toHaveLength(1);
    expect(body[0].id).toBe('student-1');
    expect(body[0].displayName).toBe('Alice');
    expect(body[0].totalQuestions).toBe(10);
    expect(body[0].correctQuestions).toBe(8);
  });

  test('admin sees all students across teachers (200)', async () => {
    seed({
      [profilePath('admin-1')]: { role: 'admin' },
      [profilePath('student-1')]: { role: 'student', teacherIds: ['teacher-1'], displayName: 'Alice' },
      [profilePath('student-2')]: { role: 'student', teacherIds: ['teacher-2'], displayName: 'Bob' },
    }, { uid: 'admin-1', admin: true });

    const res = await handler(event({}));
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body)).toHaveLength(2);
  });

  test('compact mode (default) strips fields outside the allow-list', async () => {
    seed({
      [profilePath('teacher-1')]: { role: 'teacher', teacherIds: ['teacher-1'] },
      [profilePath('student-1')]: {
        role: 'student',
        teacherIds: ['teacher-1'],
        displayName: 'Alice',
        answeredQuestions: ['should-not-be-returned-in-compact-mode'],
      },
    }, { uid: 'teacher-1' });

    const res = await handler(event({}));
    const body = JSON.parse(res.body);
    expect(body[0].answeredQuestions).toBeUndefined();
    expect(body[0].displayName).toBe('Alice');
  });

  test('includeHistory=true returns full profile data, including fields outside the compact allow-list', async () => {
    seed({
      [profilePath('teacher-1')]: { role: 'teacher', teacherIds: ['teacher-1'] },
      [profilePath('student-1')]: {
        role: 'student',
        teacherIds: ['teacher-1'],
        displayName: 'Alice',
        answeredQuestions: ['q1', 'q2'],
      },
    }, { uid: 'teacher-1' });

    const res = await handler(event({ includeHistory: true }));
    const body = JSON.parse(res.body);
    expect(body[0].answeredQuestions).toEqual(['q1', 'q2']);
  });

  test('returns an empty array (200) when no students match', async () => {
    seed({
      [profilePath('teacher-1')]: { role: 'teacher', teacherIds: ['teacher-1'] },
    }, { uid: 'teacher-1' });

    const res = await handler(event({}));
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body)).toEqual([]);
  });
});
