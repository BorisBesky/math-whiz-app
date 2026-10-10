import { createAdminMock } from '../test-utils/firestoreAdminMock';

const mockState = {};

jest.mock('../../netlify/functions/firebase-admin', () => ({
  admin: {
    auth: () => ({
      verifyIdToken: (...args) => mockState.verifyIdToken(...args),
      getUser: (...args) => mockState.getUser(...args),
      deleteUser: (...args) => mockState.deleteUser(...args),
    }),
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
  storage: { bucket: () => mockState.bucket },
}));

const { handler: exportHandler } = require('../../netlify/functions/export-account-data');
const { handler: deleteHandler } = require('../../netlify/functions/delete-account');

const APP = 'app-test';
const p = (...parts) => `artifacts/${APP}/${parts.join('/')}`;
const profilePath = (uid) => p('users', uid, 'math_whiz_data', 'profile');
const now = () => Math.floor(Date.now() / 1000);

const createBucket = (paths) => {
  const files = new Set(paths);
  const deleted = [];
  return {
    files,
    deleted,
    getFiles: jest.fn(async ({ prefix }) => [
      [...files].filter((f) => f.startsWith(prefix)).map((name) => ({ name, metadata: { size: '10', contentType: 'image/png' } })),
    ]),
    file: (name) => ({
      delete: jest.fn(async () => { files.delete(name); deleted.push(name); }),
    }),
  };
};

const seedWorld = () => ({
  // Student s1 (the deleting user in student tests)
  [profilePath('s1')]: { role: 'student', displayName: 'Sam', coins: 40, storeItems: ['hat'], classId: 'c-solo', teacherIds: ['t1', 't2'] },
  [p('users', 's1', 'attempts', 'a1')]: { questionId: 'q1', correct: true },
  [p('users', 's1', 'attempts', 'a2')]: { questionId: 'q2', correct: false },
  [p('classStudents', 'c-solo__s1')]: { classId: 'c-solo', studentId: 's1', studentName: 'Sam' },
  [p('classStudents', 'c-co__s1')]: { classId: 'c-co', studentId: 's1', studentName: 'Sam' },
  // Another student s2, who must be untouched by s1's export/deletion
  [profilePath('s2')]: { role: 'student', displayName: 'Other', coins: 99, classId: 'c-solo', teacherIds: ['t1'] },
  [p('users', 's2', 'attempts', 'a9')]: { questionId: 'q9' },
  [p('classStudents', 'c-solo__s2')]: { classId: 'c-solo', studentId: 's2', studentName: 'Other' },
  // Teacher t1: sole teacher of c-solo, co-teacher of c-co with t2
  [profilePath('t1')]: { role: 'teacher', displayName: 'Ms T' },
  [p('users', 't1', 'questionBank', 'qb1')]: { question: '2+2?', imageUrl: 'https://x/o/question-images%2Ft1%2Fsolo.png' },
  [p('classes', 'c-solo')]: { name: 'Solo class', teacherIds: ['t1'], teacherId: 't1', createdBy: 't1' },
  [p('classes', 'c-solo', 'questions', 'cq1')]: { question: 'solo q' },
  [p('classes', 'c-co')]: { name: 'Co class', teacherIds: ['t1', 't2'], teacherId: 't1', createdBy: 't1' },
  [p('classes', 'c-co', 'questions', 'cq2')]: { question: 'co q', imageUrl: 'https://x/o/question-images%2Ft1%2Fshared.png' },
  [p('pdfProcessingJobs', 'job1')]: { userId: 't1', status: 'completed' },
  [p('pdfProcessingJobs', 'job2')]: { userId: 't2', status: 'completed' },
  [profilePath('t2')]: { role: 'teacher' },
  // Messages
  [p('messages', 'm1')]: { senderId: 's1', recipientId: 't1', senderName: 'Sam', recipientName: 'Ms T', participantIds: ['s1', 't1'], body: 'hi' },
  [p('messages', 'm2')]: { senderId: 't1', recipientId: 's1', senderName: 'Ms T', recipientName: 'Sam', participantIds: ['s1', 't1'], body: 'hello' },
  [p('messages', 'm3')]: { senderId: 't2', recipientId: 's2', participantIds: ['s2', 't2'], body: 'unrelated' },
});

const seed = ({ token, docs = seedWorld(), files = [] } = {}) => {
  const harness = createAdminMock(docs);
  Object.assign(mockState, {
    db: harness.db,
    FieldValue: harness.FieldValue,
    FieldPath: harness.FieldPath,
    verifyIdToken: jest.fn().mockResolvedValue(token),
    getUser: jest.fn().mockResolvedValue({ email: 'x@example.com', providerData: [{ providerId: 'password' }], metadata: {} }),
    deleteUser: jest.fn().mockResolvedValue(undefined),
    bucket: createBucket(files),
  });
  return harness;
};

const exportReq = (headers = { authorization: 'Bearer t' }) => ({
  httpMethod: 'GET', headers, queryStringParameters: { appId: APP },
});
const deleteReq = (body = { confirm: 'DELETE' }, headers = { authorization: 'Bearer t' }) => ({
  httpMethod: 'POST', headers, queryStringParameters: {}, body: JSON.stringify({ appId: APP, ...body }),
});

const studentToken = (extra = {}) => ({ uid: 's1', auth_time: now(), firebase: { sign_in_provider: 'password' }, ...extra });
const teacherToken = (extra = {}) => ({ uid: 't1', role: 'teacher', auth_time: now(), firebase: { sign_in_provider: 'google.com' }, ...extra });

describe('export-account-data', () => {
  test('rejects requests without a token', async () => {
    seed({ token: studentToken() });
    const res = await exportHandler(exportReq({}));
    expect(res.statusCode).toBe(401);
  });

  test('rejects invalid tokens', async () => {
    seed({ token: studentToken() });
    mockState.verifyIdToken.mockRejectedValue(new Error('expired'));
    const res = await exportHandler(exportReq());
    expect(res.statusCode).toBe(401);
  });

  test('exports only the caller’s student data as a JSON attachment', async () => {
    seed({ token: studentToken(), files: ['drawings/s1/q1.png', 'drawings/s2/q9.png'] });
    // A uid in the request is ignored; the token decides whose data is exported.
    const res = await exportHandler({ ...exportReq(), queryStringParameters: { appId: APP, uid: 's2' } });
    expect(res.statusCode).toBe(200);
    expect(res.headers['Content-Disposition']).toMatch(/attachment; filename="math-whiz-data-/);
    const data = JSON.parse(res.body);
    expect(data.account.uid).toBe('s1');
    expect(data.profile).toMatchObject({ coins: 40, storeItems: ['hat'] });
    expect(data.attempts.map((a) => a.id).sort()).toEqual(['a1', 'a2']);
    expect(data.enrollments.map((e) => e.classId).sort()).toEqual(['c-co', 'c-solo']);
    expect(data.enrollments.find((e) => e.classId === 'c-solo').className).toBe('Solo class');
    expect(data.messages.map((m) => m.id).sort()).toEqual(['m1', 'm2']);
    expect(data.storageFiles.map((f) => f.path)).toEqual(['drawings/s1/q1.png']);
    expect(data.classesTaught).toEqual([]);
    expect(res.body).not.toContain('"Other"');
    expect(res.body).not.toContain('unrelated');
  });

  test('exports a teacher’s question bank, classes, rosters and PDF jobs', async () => {
    seed({ token: teacherToken() });
    const res = await exportHandler(exportReq());
    const data = JSON.parse(res.body);
    expect(data.questionBank.map((q) => q.id)).toEqual(['qb1']);
    expect(data.classesTaught.map((c) => c.id).sort()).toEqual(['c-co', 'c-solo']);
    const solo = data.classesTaught.find((c) => c.id === 'c-solo');
    expect(solo.questions.map((q) => q.id)).toEqual(['cq1']);
    expect(solo.roster).toEqual(expect.arrayContaining([
      { studentId: 's1', studentName: 'Sam' },
      { studentId: 's2', studentName: 'Other' },
    ]));
    expect(data.pdfProcessingJobs.map((j) => j.id)).toEqual(['job1']);
  });
});

describe('delete-account', () => {
  test('rejects missing token, wrong confirmation, guests, admins and stale sign-ins', async () => {
    seed({ token: studentToken() });
    expect((await deleteHandler(deleteReq(undefined, {}))).statusCode).toBe(401);
    expect((await deleteHandler(deleteReq({ confirm: 'delete' }))).statusCode).toBe(400);

    mockState.verifyIdToken.mockResolvedValue(studentToken({ firebase: { sign_in_provider: 'anonymous' } }));
    expect((await deleteHandler(deleteReq())).statusCode).toBe(400);

    mockState.verifyIdToken.mockResolvedValue(teacherToken({ admin: true }));
    expect((await deleteHandler(deleteReq())).statusCode).toBe(403);

    mockState.verifyIdToken.mockResolvedValue(studentToken({ auth_time: now() - 3600 }));
    const stale = await deleteHandler(deleteReq());
    expect(stale.statusCode).toBe(401);
    expect(JSON.parse(stale.body).code).toBe('requires-recent-login');

    expect(mockState.deleteUser).not.toHaveBeenCalled();
    expect(mockState.db.doc(profilePath('s1'))).toBeDefined();
  });

  test('refuses a profile with the admin role even without the claim', async () => {
    const docs = seedWorld();
    docs[profilePath('s1')] = { role: 'admin' };
    const h = seed({ token: studentToken(), docs });
    expect((await deleteHandler(deleteReq())).statusCode).toBe(403);
    expect(h.store.has(profilePath('s1'))).toBe(true);
  });

  test('deletes a student’s data and auth user, leaving other users intact', async () => {
    const h = seed({ token: studentToken(), files: ['drawings/s1/q1.png', 'drawings/s2/q9.png'] });
    const res = await deleteHandler(deleteReq());
    expect(res.statusCode).toBe(200);

    expect(h.store.has(profilePath('s1'))).toBe(false);
    expect(h.store.has(p('users', 's1', 'attempts', 'a1'))).toBe(false);
    expect(h.store.has(p('classStudents', 'c-solo__s1'))).toBe(false);
    expect(h.store.has(p('classStudents', 'c-co__s1'))).toBe(false);
    // Messages they wrote are deleted; messages to them are kept, name replaced.
    expect(h.store.has(p('messages', 'm1'))).toBe(false);
    expect(h.store.get(p('messages', 'm2'))).toMatchObject({ body: 'hello', recipientName: 'Deleted user' });
    expect(mockState.bucket.deleted).toEqual(['drawings/s1/q1.png']);
    expect(mockState.deleteUser).toHaveBeenCalledWith('s1');

    // Untouched
    expect(h.store.get(profilePath('s2'))).toMatchObject({ coins: 99 });
    expect(h.store.has(p('classStudents', 'c-solo__s2'))).toBe(true);
    expect(h.store.has(p('classes', 'c-solo'))).toBe(true);
    expect(h.store.has(p('messages', 'm3'))).toBe(true);
  });

  test('teacher: sole-taught classes are deleted, co-taught classes keep the other teacher', async () => {
    const h = seed({
      token: teacherToken(),
      files: ['question-images/t1/solo.png', 'question-images/t1/shared.png', 'pdf-uploads/t1/x.pdf'],
    });
    const res = await deleteHandler(deleteReq());
    expect(res.statusCode).toBe(200);
    const { summary } = JSON.parse(res.body);
    expect(summary).toMatchObject({ classesDeleted: 1, classesLeft: 1 });

    // Sole class: class, questions and enrollments gone; students keep accounts.
    expect(h.store.has(p('classes', 'c-solo'))).toBe(false);
    expect(h.store.has(p('classes', 'c-solo', 'questions', 'cq1'))).toBe(false);
    expect(h.store.has(p('classStudents', 'c-solo__s1'))).toBe(false);
    expect(h.store.has(p('classStudents', 'c-solo__s2'))).toBe(false);
    expect(h.store.get(profilePath('s2'))).toMatchObject({ coins: 99, classId: null, teacherIds: [] });

    // Co-taught class: kept, teacher removed, ownership handed to t2.
    expect(h.store.get(p('classes', 'c-co'))).toMatchObject({ teacherIds: ['t2'], teacherId: 't2', createdBy: 't2' });
    expect(h.store.has(p('classes', 'c-co', 'questions', 'cq2'))).toBe(true);
    expect(h.store.has(p('classStudents', 'c-co__s1'))).toBe(true);
    expect(h.store.get(profilePath('s1')).teacherIds).toEqual(['t2']);

    // Teacher data
    expect(h.store.has(profilePath('t1'))).toBe(false);
    expect(h.store.has(p('users', 't1', 'questionBank', 'qb1'))).toBe(false);
    expect(h.store.has(p('pdfProcessingJobs', 'job1'))).toBe(false);
    expect(h.store.has(p('pdfProcessingJobs', 'job2'))).toBe(true);
    expect(h.store.has(p('messages', 'm2'))).toBe(false);
    expect(h.store.get(p('messages', 'm1'))).toMatchObject({ recipientName: 'Deleted user' });

    // The image still used by the co-taught class's question is kept.
    expect(mockState.bucket.deleted.sort()).toEqual(['pdf-uploads/t1/x.pdf', 'question-images/t1/solo.png']);
    expect(mockState.bucket.files.has('question-images/t1/shared.png')).toBe(true);
    expect(mockState.deleteUser).toHaveBeenCalledWith('t1');
  });

  test('is retry-safe: a failure before auth deletion can be repeated to completion', async () => {
    const h = seed({ token: teacherToken(), files: ['pdf-uploads/t1/x.pdf'] });
    mockState.deleteUser.mockRejectedValueOnce(Object.assign(new Error('network'), { code: 'auth/internal-error' }));
    const first = await deleteHandler(deleteReq());
    expect(first.statusCode).toBe(500);
    expect(JSON.parse(first.body).error).toMatch(/try again/i);

    const second = await deleteHandler(deleteReq());
    expect(second.statusCode).toBe(200);
    expect(JSON.parse(second.body).summary).toMatchObject({ classesDeleted: 0, classesLeft: 0, attemptsDeleted: 0 });
    expect(h.store.has(profilePath('t1'))).toBe(false);

    // Auth user already gone also counts as success.
    mockState.deleteUser.mockRejectedValueOnce(Object.assign(new Error('gone'), { code: 'auth/user-not-found' }));
    expect((await deleteHandler(deleteReq())).statusCode).toBe(200);
  });
});
