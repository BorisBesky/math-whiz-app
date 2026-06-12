import { createAdminMock } from '../test-utils/firestoreAdminMock';

// Mutable holder the hoisted jest.mock factory delegates to (rebuilt per test).
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

const { handler } = require('../../netlify/functions/manage-class-teacher');

const APP = 'app-test';
const p = (...parts) => `artifacts/${APP}/${parts.join('/')}`;
const profilePath = (sid) => p('users', sid, 'math_whiz_data', 'profile');

const seed = (docs) => {
  const harness = createAdminMock(docs);
  Object.assign(mockState, {
    db: harness.db,
    FieldValue: harness.FieldValue,
    FieldPath: harness.FieldPath,
    verifyIdToken: jest.fn().mockResolvedValue({ uid: 'teacher-1' }),
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

describe('manage-class-teacher handler', () => {
  test('rejects requests without a bearer token (401)', async () => {
    seed({});
    const res = await handler(event({ action: 'add', classId: 'c1', teacherId: 't2' }, {}));
    expect(res.statusCode).toBe(401);
  });

  test('rejects non-POST methods (405)', async () => {
    seed({});
    const res = await handler({ httpMethod: 'GET', headers: { authorization: 'Bearer t' } });
    expect(res.statusCode).toBe(405);
  });

  test('rejects an invalid action (400)', async () => {
    seed({});
    const res = await handler(event({ action: 'promote', classId: 'c1', teacherId: 't2' }));
    expect(res.statusCode).toBe(400);
  });

  test('rejects missing classId/teacherId (400)', async () => {
    seed({});
    const res = await handler(event({ action: 'add', classId: 'c1' }));
    expect(res.statusCode).toBe(400);
  });

  test('returns 404 when the class does not exist', async () => {
    seed({});
    const res = await handler(event({ action: 'add', classId: 'missing', teacherId: 't2' }));
    expect(res.statusCode).toBe(404);
  });

  test('forbids a caller who is neither admin nor a teacher on the class (403)', async () => {
    const h = seed({ [p('classes', 'c1')]: { teacherIds: ['someone-else'] } });
    mockState.verifyIdToken.mockResolvedValue({ uid: 'teacher-1' });
    const res = await handler(event({ action: 'add', classId: 'c1', teacherId: 't2' }));
    expect(res.statusCode).toBe(403);
    // Class membership untouched.
    expect(h.store.get(p('classes', 'c1')).teacherIds).toEqual(['someone-else']);
  });

  test('add: grants the new teacher and propagates to every enrolled student profile', async () => {
    const h = seed({
      [p('classes', 'c1')]: { teacherIds: ['teacher-1'] },
      [p('classStudents', 'c1__s1')]: { classId: 'c1', studentId: 's1' },
      [p('classStudents', 'c1__s2')]: { classId: 'c1', studentId: 's2' },
      [profilePath('s1')]: { role: 'student', teacherIds: ['teacher-1'] },
      [profilePath('s2')]: { role: 'student', teacherIds: ['teacher-1'] },
    });

    const res = await handler(event({ action: 'add', classId: 'c1', teacherId: 't2' }));
    const body = JSON.parse(res.body);

    expect(res.statusCode).toBe(200);
    expect(body).toMatchObject({ status: 'added', reconciledStudents: 2 });
    expect(h.store.get(p('classes', 'c1')).teacherIds).toEqual(['teacher-1', 't2']);
    expect(h.store.get(profilePath('s1')).teacherIds).toEqual(['teacher-1', 't2']);
    expect(h.store.get(profilePath('s2')).teacherIds).toEqual(['teacher-1', 't2']);
  });

  test('add: a platform admin may manage a class they do not teach', async () => {
    const h = seed({
      [p('classes', 'c1')]: { teacherIds: ['teacher-9'] },
      [p('classStudents', 'c1__s1')]: { classId: 'c1', studentId: 's1' },
      [profilePath('s1')]: { role: 'student', teacherIds: ['teacher-9'] },
    });
    mockState.verifyIdToken.mockResolvedValue({ uid: 'admin-1', admin: true });

    const res = await handler(event({ action: 'add', classId: 'c1', teacherId: 't2' }));

    expect(res.statusCode).toBe(200);
    expect(h.store.get(profilePath('s1')).teacherIds).toEqual(['teacher-9', 't2']);
  });

  test('add: no-op when the teacher is already on the class', async () => {
    const h = seed({
      [p('classes', 'c1')]: { teacherIds: ['teacher-1', 't2'] },
      [p('classStudents', 'c1__s1')]: { classId: 'c1', studentId: 's1' },
      [profilePath('s1')]: { role: 'student', teacherIds: ['teacher-1'] },
    });

    const res = await handler(event({ action: 'add', classId: 'c1', teacherId: 't2' }));

    expect(JSON.parse(res.body).status).toBe('already_present');
    // Profile not rewritten — still only the original teacher.
    expect(h.store.get(profilePath('s1')).teacherIds).toEqual(['teacher-1']);
    expect(h.sets).toHaveLength(0);
  });

  test('remove: refuses to remove the last teacher (400)', async () => {
    const h = seed({ [p('classes', 'c1')]: { teacherIds: ['teacher-1'] } });
    const res = await handler(event({ action: 'remove', classId: 'c1', teacherId: 'teacher-1' }));
    expect(res.statusCode).toBe(400);
    expect(h.store.get(p('classes', 'c1')).teacherIds).toEqual(['teacher-1']);
  });

  test('remove: revokes access only where no other class retains the teacher', async () => {
    const h = seed({
      [p('classes', 'c1')]: { teacherIds: ['teacher-1', 't2'] },
      // c2 also taught by t2 — s1 stays reachable by t2 through c2.
      [p('classes', 'c2')]: { teacherIds: ['t2'] },
      [p('classStudents', 'c1__s1')]: { classId: 'c1', studentId: 's1' },
      [p('classStudents', 'c2__s1')]: { classId: 'c2', studentId: 's1' },
      [p('classStudents', 'c1__s2')]: { classId: 'c1', studentId: 's2' },
      [profilePath('s1')]: { role: 'student', teacherIds: ['teacher-1', 't2'] },
      [profilePath('s2')]: { role: 'student', teacherIds: ['teacher-1', 't2'] },
    });

    const res = await handler(event({ action: 'remove', classId: 'c1', teacherId: 't2' }));

    expect(res.statusCode).toBe(200);
    expect(h.store.get(p('classes', 'c1')).teacherIds).toEqual(['teacher-1']);
    // s1 retains t2 via c2; s2 (only in c1) loses t2.
    expect(h.store.get(profilePath('s1')).teacherIds).toEqual(['teacher-1', 't2']);
    expect(h.store.get(profilePath('s2')).teacherIds).toEqual(['teacher-1']);
  });
});
