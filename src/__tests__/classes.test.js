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
    batch: (...args) => mockState.db.batch(...args),
  },
}));

const { handler } = require('../../netlify/functions/classes');

const APP = 'app-test';
const p = (...parts) => `artifacts/${APP}/${parts.join('/')}`;
const profilePath = (sid) => p('users', sid, 'math_whiz_data', 'profile');

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

const req = (httpMethod, { query = {}, body, headers = { authorization: 'Bearer t' } } = {}) => ({
  httpMethod,
  headers,
  queryStringParameters: { appId: APP, ...query },
  body: body === undefined ? undefined : JSON.stringify({ appId: APP, ...body }),
});

afterEach(() => jest.clearAllMocks());

describe('classes handler — authentication', () => {
  test('rejects a missing bearer token (401)', async () => {
    seed({});
    const res = await handler(req('GET', { query: { teacherId: 'teacher-1' }, headers: {} }));
    expect(res.statusCode).toBe(401);
  });

  test('rejects an invalid/expired token (401) without verifying succeeding', async () => {
    seed({});
    mockState.verifyIdToken.mockRejectedValue(new Error('Firebase ID token has expired'));
    const res = await handler(req('GET', { query: { teacherId: 'teacher-1' } }));
    expect(res.statusCode).toBe(401);
    expect(JSON.parse(res.body).error).toMatch(/token/i);
  });

  test('rejects unsupported methods (405)', async () => {
    seed({});
    const res = await handler(req('PATCH'));
    expect(res.statusCode).toBe(405);
  });
});

describe('classes handler — GET (list)', () => {
  test('a teacher cannot list another teacher\'s classes (403)', async () => {
    seed({}, { uid: 'teacher-1' });
    const res = await handler(req('GET', { query: { teacherId: 'teacher-2' } }));
    expect(res.statusCode).toBe(403);
  });

  test('a teacher lists their own classes (200)', async () => {
    seed({
      [p('classes', 'c1')]: { teacherIds: ['teacher-1'], name: 'Room 12' },
      [p('classes', 'c2')]: { teacherIds: ['teacher-2'], name: 'Other' },
    }, { uid: 'teacher-1' });
    const res = await handler(req('GET', { query: { teacherId: 'teacher-1' } }));
    const classes = JSON.parse(res.body);
    expect(res.statusCode).toBe(200);
    expect(classes.map((c) => c.id)).toEqual(['c1']);
  });

  test('an admin may list any teacher\'s classes (200)', async () => {
    seed({ [p('classes', 'c2')]: { teacherIds: ['teacher-2'], name: 'Other' } }, { uid: 'admin-1', admin: true });
    const res = await handler(req('GET', { query: { teacherId: 'teacher-2' } }));
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body).map((c) => c.id)).toEqual(['c2']);
  });
});

describe('classes handler — POST (create)', () => {
  const createBody = (over = {}) => ({
    name: 'Room 1', subject: 'Math', gradeLevel: 'G3', teacherIds: ['teacher-1'], ...over,
  });

  test('a teacher cannot create a class assigned to someone else (403)', async () => {
    const h = seed({}, { uid: 'teacher-1' });
    const res = await handler(req('POST', { body: createBody({ teacherIds: ['teacher-2'] }) }));
    expect(res.statusCode).toBe(403);
    expect(h.adds).toHaveLength(0);
  });

  test('a teacher creates a class they teach; ownership is forced to the caller (201)', async () => {
    const h = seed({}, { uid: 'teacher-1' });
    const res = await handler(req('POST', { body: createBody({ createdBy: 'teacher-9' }) }));
    expect(res.statusCode).toBe(201);
    expect(h.adds).toHaveLength(1);
    expect(h.adds[0].data).toMatchObject({ teacherIds: ['teacher-1'], createdBy: 'teacher-1' });
  });

  test('an admin may create a class for other teachers (201)', async () => {
    const h = seed({}, { uid: 'admin-1', admin: true });
    const res = await handler(req('POST', { body: createBody({ teacherIds: ['teacher-2', 'teacher-3'] }) }));
    expect(res.statusCode).toBe(201);
    expect(h.adds[0].data.teacherIds).toEqual(['teacher-2', 'teacher-3']);
  });

  test('missing required fields → 400', async () => {
    seed({}, { uid: 'teacher-1' });
    const res = await handler(req('POST', { body: { name: 'X', teacherIds: ['teacher-1'] } }));
    expect(res.statusCode).toBe(400);
  });
});

describe('classes handler — PUT (update)', () => {
  const base = () => ({
    [p('classes', 'c1')]: { teacherIds: ['teacher-1'], name: 'Old', subject: 'Math', gradeLevel: 'G3', studentCount: 5 },
  });

  test('404 when the class does not exist', async () => {
    seed({}, { uid: 'teacher-1' });
    const res = await handler(req('PUT', { query: { id: 'missing' }, body: { name: 'New' } }));
    expect(res.statusCode).toBe(404);
  });

  test('a teacher not on the class cannot update it (403)', async () => {
    const h = seed(base(), { uid: 'intruder' });
    const res = await handler(req('PUT', { query: { id: 'c1' }, body: { name: 'Hacked' } }));
    expect(res.statusCode).toBe(403);
    expect(h.store.get(p('classes', 'c1')).name).toBe('Old');
  });

  test('updates only whitelisted fields — server-managed fields are ignored', async () => {
    const h = seed(base(), { uid: 'teacher-1' });
    const res = await handler(req('PUT', {
      query: { id: 'c1' },
      body: { name: 'New', studentCount: 999, createdBy: 'intruder', joinCode: 'HACK' },
    }));
    expect(res.statusCode).toBe(200);
    const cls = h.store.get(p('classes', 'c1'));
    expect(cls.name).toBe('New');
    expect(cls.studentCount).toBe(5); // untouched
    expect(cls.joinCode).toBeUndefined();
    expect(cls.createdBy).toBeUndefined();
  });

  test('adding a teacher propagates to enrolled students\' profile.teacherIds', async () => {
    const h = seed({
      ...base(),
      [p('classStudents', 'c1__s1')]: { classId: 'c1', studentId: 's1' },
      [profilePath('s1')]: { role: 'student', teacherIds: ['teacher-1'] },
    }, { uid: 'teacher-1' });

    const res = await handler(req('PUT', {
      query: { id: 'c1' },
      body: { teacherIds: ['teacher-1', 'teacher-2'], teacherId: 'teacher-1' },
    }));

    expect(res.statusCode).toBe(200);
    expect(h.store.get(p('classes', 'c1')).teacherIds).toEqual(['teacher-1', 'teacher-2']);
    expect(h.store.get(profilePath('s1')).teacherIds).toEqual(['teacher-1', 'teacher-2']);
  });

  test('removing a teacher revokes access (retention-aware) for enrolled students', async () => {
    const h = seed({
      [p('classes', 'c1')]: { teacherIds: ['teacher-1', 'teacher-2'], name: 'C1' },
      [p('classStudents', 'c1__s1')]: { classId: 'c1', studentId: 's1' },
      [profilePath('s1')]: { role: 'student', teacherIds: ['teacher-1', 'teacher-2'] },
    }, { uid: 'teacher-1' });

    const res = await handler(req('PUT', {
      query: { id: 'c1' },
      body: { teacherIds: ['teacher-1'], teacherId: 'teacher-1' },
    }));

    expect(res.statusCode).toBe(200);
    expect(h.store.get(profilePath('s1')).teacherIds).toEqual(['teacher-1']);
  });

  test('refuses to leave a class with zero teachers (400)', async () => {
    const h = seed(base(), { uid: 'teacher-1' });
    const res = await handler(req('PUT', { query: { id: 'c1' }, body: { teacherIds: [] } }));
    expect(res.statusCode).toBe(400);
    expect(h.store.get(p('classes', 'c1')).teacherIds).toEqual(['teacher-1']);
  });
});

describe('classes handler — DELETE', () => {
  test('a teacher not on the class cannot delete it (403)', async () => {
    const h = seed({ [p('classes', 'c1')]: { teacherIds: ['teacher-1'], name: 'C1' } }, { uid: 'intruder' });
    const res = await handler(req('DELETE', { query: { id: 'c1' } }));
    expect(res.statusCode).toBe(403);
    expect(h.store.get(p('classes', 'c1'))).toBeDefined();
  });

  test('a teacher on the class deletes it and its enrollments (200)', async () => {
    const h = seed({
      [p('classes', 'c1')]: { teacherIds: ['teacher-1'], name: 'C1' },
      [p('classStudents', 'c1__s1')]: { classId: 'c1', studentId: 's1' },
      [profilePath('s1')]: { role: 'student', teacherIds: ['teacher-1'] },
    }, { uid: 'teacher-1' });

    const res = await handler(req('DELETE', { query: { id: 'c1' } }));

    expect(res.statusCode).toBe(200);
    expect(h.store.get(p('classes', 'c1'))).toBeUndefined();
    expect(h.store.get(p('classStudents', 'c1__s1'))).toBeUndefined();
    expect(h.store.get(profilePath('s1')).teacherIds).toEqual([]);
  });

  test('an admin may delete any class (200)', async () => {
    const h = seed({ [p('classes', 'c1')]: { teacherIds: ['teacher-9'], name: 'C1' } }, { uid: 'admin-1', admin: true });
    const res = await handler(req('DELETE', { query: { id: 'c1' } }));
    expect(res.statusCode).toBe(200);
    expect(h.store.get(p('classes', 'c1'))).toBeUndefined();
  });
});
