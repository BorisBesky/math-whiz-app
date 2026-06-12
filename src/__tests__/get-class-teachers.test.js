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

const { handler } = require('../../netlify/functions/get-class-teachers');

const APP = 'app-test';
const p = (...parts) => `artifacts/${APP}/${parts.join('/')}`;
const profilePath = (uid) => p('users', uid, 'math_whiz_data', 'profile');

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

describe('get-class-teachers handler', () => {
  test('rejects requests without a bearer token (401)', async () => {
    seed({});
    const res = await handler(event({ classId: 'c1' }, {}));
    expect(res.statusCode).toBe(401);
  });

  test('rejects non-POST methods (405)', async () => {
    seed({});
    const res = await handler({ httpMethod: 'GET', headers: { authorization: 'Bearer t' } });
    expect(res.statusCode).toBe(405);
  });

  test('rejects a missing classId (400)', async () => {
    seed({});
    const res = await handler(event({}));
    expect(res.statusCode).toBe(400);
  });

  test('returns 404 when the class does not exist', async () => {
    seed({});
    const res = await handler(event({ classId: 'missing' }));
    expect(res.statusCode).toBe(404);
  });

  test('forbids a caller who is neither admin nor a teacher on the class (403)', async () => {
    seed({ [p('classes', 'c1')]: { teacherIds: ['teacher-9'] } }, { uid: 'teacher-1' });
    const res = await handler(event({ classId: 'c1' }));
    expect(res.statusCode).toBe(403);
  });

  test('a teacher on the class gets resolved teacher profiles (200)', async () => {
    seed({
      [p('classes', 'c1')]: { teacherIds: ['teacher-1', 'teacher-2'] },
      [profilePath('teacher-1')]: { displayName: 'Ms. Baker', email: 'baker@ex.com', role: 'teacher' },
      [profilePath('teacher-2')]: { name: 'Mr. Lee', role: 'teacher' },
    }, { uid: 'teacher-1' });

    const res = await handler(event({ classId: 'c1' }));
    const { teachers } = JSON.parse(res.body);

    expect(res.statusCode).toBe(200);
    expect(teachers).toEqual([
      { id: 'teacher-1', uid: 'teacher-1', displayName: 'Ms. Baker', name: null, email: 'baker@ex.com', role: 'teacher' },
      { id: 'teacher-2', uid: 'teacher-2', displayName: 'Mr. Lee', name: 'Mr. Lee', email: null, role: 'teacher' },
    ]);
  });

  test('falls back to id/uid when a teacher profile is missing', async () => {
    seed({
      [p('classes', 'c1')]: { teacherIds: ['teacher-1', 'ghost-teacher'] },
      [profilePath('teacher-1')]: { displayName: 'Ms. Baker' },
    }, { uid: 'teacher-1' });

    const { teachers } = JSON.parse((await handler(event({ classId: 'c1' }))).body);

    expect(teachers).toContainEqual({ id: 'ghost-teacher', uid: 'ghost-teacher' });
  });

  test('a platform admin may read teachers of a class they do not teach (200)', async () => {
    seed({
      [p('classes', 'c1')]: { teacherIds: ['teacher-9'] },
      [profilePath('teacher-9')]: { displayName: 'Ms. Nine', role: 'teacher' },
    }, { uid: 'admin-1', admin: true });

    const res = await handler(event({ classId: 'c1' }));

    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body).teachers[0]).toMatchObject({ id: 'teacher-9', displayName: 'Ms. Nine' });
  });
});
