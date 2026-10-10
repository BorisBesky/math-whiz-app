import { createAdminMock } from '../test-utils/firestoreAdminMock';

const mockState = {};

jest.mock('../../netlify/functions/firebase-admin', () => ({
  admin: {
    auth: () => ({
      verifyIdToken: (...args) => mockState.verifyIdToken(...args),
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

const { handler } = require('../../netlify/functions/merge-guest-account');
const { mergeGuestProfile } = require('../../netlify/functions/guest-merge');

const APP = 'app-test';
const p = (...parts) => `artifacts/${APP}/${parts.join('/')}`;
const profilePath = (uid) => p('users', uid, 'math_whiz_data', 'profile');
const now = () => Math.floor(Date.now() / 1000);

const createBucket = (paths) => {
  const files = new Set(paths);
  return {
    files,
    getFiles: jest.fn(async ({ prefix }) => [[...files].filter((f) => f.startsWith(prefix)).map((name) => ({ name, metadata: {} }))]),
    file: (name) => ({
      name,
      exists: jest.fn(async () => [files.has(name)]),
      copy: jest.fn(async (dest) => { files.add(dest.name); }),
      delete: jest.fn(async () => { files.delete(name); }),
    }),
  };
};

const guestProfile = () => ({
  role: 'student',
  displayName: 'Young Mathematician',
  isAnonymous: true,
  coins: 15,
  ownedBackgrounds: ['default', 'space'],
  ownedCharacters: ['robot'],
  progressByGrade: { '2026-10-10': { G3: { all: { correct: 4, incorrect: 1, timeSpent: 60 }, Fractions: { correct: 4, incorrect: 1 } } } },
  questionSummary: { total: 5, correct: 4, latestActivity: '2026-10-10T10:00:00Z' },
  questionStatsByDate: { '2026-10-10': { total: 5, correct: 4 } },
  pausedQuizzes: { Fractions: { index: 2 }, Geometry: { index: 1 } },
  favoriteColor: 'green',
});

const targetProfile = () => ({
  role: 'student',
  displayName: 'Sam',
  email: 'sam@example.com',
  isAnonymous: false,
  coins: 100,
  ownedBackgrounds: ['default', 'ocean'],
  ownedCharacters: ['cat'],
  progressByGrade: {
    '2026-10-10': { G3: { all: { correct: 10, incorrect: 2, timeSpent: 100 } } },
    '2026-10-09': { G3: { all: { correct: 1, incorrect: 0, timeSpent: 5 } } },
  },
  questionSummary: { total: 12, correct: 10, latestActivity: '2026-10-09T09:00:00Z' },
  questionStatsByDate: { '2026-10-10': { total: 12, correct: 10 } },
  pausedQuizzes: { Fractions: { index: 7 } },
  teacherIds: ['t1'],
});

const seed = ({ docs, files = [], targetToken, guestToken } = {}) => {
  const harness = createAdminMock(docs || {
    [profilePath('guest1')]: guestProfile(),
    [p('users', 'guest1', 'attempts', 'a1')]: { questionId: 'q1', drawingUrl: 'https://fs/o/drawings%2Fguest1%2Fq1.png?alt=media' },
    [p('users', 'guest1', 'attempts', 'a2')]: { questionId: 'q2' },
    [profilePath('acct1')]: targetProfile(),
    [p('users', 'acct1', 'attempts', 'x1')]: { questionId: 'old' },
  });
  const tokens = {
    'target-token': targetToken || { uid: 'acct1', auth_time: now(), firebase: { sign_in_provider: 'google.com' } },
    'guest-token': guestToken || { uid: 'guest1', firebase: { sign_in_provider: 'anonymous' } },
  };
  Object.assign(mockState, {
    db: harness.db,
    FieldValue: harness.FieldValue,
    FieldPath: harness.FieldPath,
    verifyIdToken: jest.fn(async (t) => {
      if (!tokens[t]) throw new Error('bad token');
      return tokens[t];
    }),
    deleteUser: jest.fn().mockResolvedValue(undefined),
    bucket: createBucket(files),
  });
  return harness;
};

const req = ({ auth = 'Bearer target-token', guestIdToken = 'guest-token' } = {}) => ({
  httpMethod: 'POST',
  headers: auth ? { authorization: auth } : {},
  queryStringParameters: {},
  body: JSON.stringify({ appId: APP, guestIdToken }),
});

describe('mergeGuestProfile rules', () => {
  test('sums coins and progress counters, unions owned items, keeps the account’s identity', () => {
    const merged = mergeGuestProfile(targetProfile(), guestProfile());
    expect(merged.coins).toBe(115);
    expect(merged.ownedBackgrounds).toEqual(['default', 'ocean', 'space']);
    expect(merged.ownedCharacters).toEqual(['cat', 'robot']);
    expect(merged.progressByGrade['2026-10-10'].G3.all).toEqual({ correct: 14, incorrect: 3, timeSpent: 160 });
    expect(merged.progressByGrade['2026-10-10'].G3.Fractions).toEqual({ correct: 4, incorrect: 1 });
    expect(merged.progressByGrade['2026-10-09']).toEqual(targetProfile().progressByGrade['2026-10-09']);
    expect(merged.questionSummary).toEqual({ total: 17, correct: 14, latestActivity: '2026-10-10T10:00:00Z' });
    expect(merged.questionStatsByDate['2026-10-10']).toEqual({ total: 17, correct: 14 });
    // Account's paused quiz wins; guest's fills the gap.
    expect(merged.pausedQuizzes).toEqual({ Fractions: { index: 7 }, Geometry: { index: 1 } });
    // Identity stays with the account; unknown guest fields fill in.
    expect(merged).toMatchObject({ displayName: 'Sam', email: 'sam@example.com', isAnonymous: false, teacherIds: ['t1'], favoriteColor: 'green' });
  });

  test('handles a target with no profile yet', () => {
    const merged = mergeGuestProfile({}, guestProfile());
    expect(merged.coins).toBe(15);
    expect(merged.displayName).toBeUndefined();
    expect(merged.isAnonymous).toBeUndefined();
  });
});

describe('merge-guest-account handler', () => {
  test('requires both tokens to be valid', async () => {
    seed();
    expect((await handler(req({ auth: null }))).statusCode).toBe(401);
    expect((await handler(req({ auth: 'Bearer nope' }))).statusCode).toBe(401);
    expect((await handler(req({ guestIdToken: 'nope' }))).statusCode).toBe(401);
    expect((await handler(req({ guestIdToken: '' }))).statusCode).toBe(400);
    expect(mockState.deleteUser).not.toHaveBeenCalled();
  });

  test('the guest token must be anonymous, and the account must be a recent, non-anonymous student sign-in', async () => {
    seed({ guestToken: { uid: 'guest1', firebase: { sign_in_provider: 'password' } } });
    expect((await handler(req())).statusCode).toBe(400);

    seed({ targetToken: { uid: 'acct1', auth_time: now(), firebase: { sign_in_provider: 'anonymous' } } });
    expect((await handler(req())).statusCode).toBe(400);

    seed({ targetToken: { uid: 'guest1', auth_time: now(), firebase: { sign_in_provider: 'google.com' } } });
    expect((await handler(req())).statusCode).toBe(400);

    seed({ targetToken: { uid: 'acct1', auth_time: now() - 3600, firebase: { sign_in_provider: 'google.com' } } });
    expect(JSON.parse((await handler(req())).body).code).toBe('requires-recent-login');

    seed({ targetToken: { uid: 'acct1', admin: true, auth_time: now(), firebase: { sign_in_provider: 'google.com' } } });
    expect((await handler(req())).statusCode).toBe(403);

    const docs = { [profilePath('guest1')]: guestProfile(), [profilePath('acct1')]: { role: 'teacher' } };
    const h = seed({ docs });
    expect((await handler(req())).statusCode).toBe(403);
    expect(h.store.has(profilePath('guest1'))).toBe(true);
  });

  test('moves the guest’s progress, attempts and drawings, then deletes the guest', async () => {
    const h = seed({ files: ['drawings/guest1/q1.png'] });
    const res = await handler(req());
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body).summary).toMatchObject({ profileMerged: true, attemptsCopied: 2, drawingsCopied: 1 });

    const merged = h.store.get(profilePath('acct1'));
    expect(merged.coins).toBe(115);
    expect(merged.mergedGuestUids).toEqual(['guest1']);
    expect(h.store.get(p('users', 'acct1', 'attempts', 'g_guest1_a1'))).toMatchObject({
      questionId: 'q1',
      drawingUrl: 'https://fs/o/drawings%2Facct1%2Fq1.png?alt=media',
    });
    expect(h.store.has(p('users', 'acct1', 'attempts', 'x1'))).toBe(true);
    expect(mockState.bucket.files.has('drawings/acct1/q1.png')).toBe(true);
    expect(mockState.bucket.files.has('drawings/guest1/q1.png')).toBe(false);

    expect(h.store.has(profilePath('guest1'))).toBe(false);
    expect(h.store.has(p('users', 'guest1', 'attempts', 'a1'))).toBe(false);
    expect(mockState.deleteUser).toHaveBeenCalledWith('guest1');
  });

  test('moves class enrollments and adds that class’s teachers', async () => {
    const docs = {
      [profilePath('guest1')]: guestProfile(),
      [profilePath('acct1')]: targetProfile(),
      [p('classStudents', 'c9__guest1')]: { classId: 'c9', studentId: 'guest1' },
      [p('classes', 'c9')]: { teacherIds: ['t9'] },
    };
    const h = seed({ docs });
    expect((await handler(req())).statusCode).toBe(200);
    expect(h.store.has(p('classStudents', 'c9__guest1'))).toBe(false);
    expect(h.store.get(p('classStudents', 'c9__acct1'))).toMatchObject({ classId: 'c9', studentId: 'acct1' });
    expect(h.store.get(profilePath('acct1')).teacherIds).toEqual(['t1', 't9']);
  });

  test('is idempotent: retrying after a failure doesn’t double-count', async () => {
    const h = seed();
    mockState.deleteUser.mockRejectedValueOnce(Object.assign(new Error('boom'), { code: 'auth/internal-error' }));
    expect((await handler(req())).statusCode).toBe(500);
    expect(h.store.get(profilePath('acct1')).coins).toBe(115);

    expect((await handler(req())).statusCode).toBe(200);
    expect((await handler(req())).statusCode).toBe(200);
    expect(h.store.get(profilePath('acct1')).coins).toBe(115);
    expect(h.store.get(profilePath('acct1')).mergedGuestUids).toEqual(['guest1']);
    const copied = [...h.store.keys()].filter((k) => k.startsWith(p('users', 'acct1', 'attempts', 'g_')));
    expect(copied).toHaveLength(2);
  });
});
