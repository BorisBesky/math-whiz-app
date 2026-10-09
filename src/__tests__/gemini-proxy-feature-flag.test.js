/**
 * gemini-proxy (AI story problems) is gated by the admin-controlled runtime
 * setting at artifacts/default-app-id/settings/features.aiStoryEnabled.
 */
const mockVerifyIdToken = jest.fn();
const mockSettingsGet = jest.fn();
const mockProfileGet = jest.fn();
const mockCollection = jest.fn();

jest.mock('../../netlify/functions/firebase-admin', () => ({
  admin: { auth: () => ({ verifyIdToken: (...args) => mockVerifyIdToken(...args) }) },
  db: { collection: (...args) => mockCollection(...args) },
}));

const featureDefaults = require('../config/features.json');
const geminiProxy = require('../../netlify/functions/gemini-proxy');

// Minimal chainable Firestore stub: .collection().doc().collection().doc()...get()
const buildChain = (path = []) => ({
  collection: (name) => buildChain([...path, name]),
  doc: (id) => buildChain([...path, id]),
  get: () => (path.includes('settings') ? mockSettingsGet(path) : mockProfileGet(path)),
  set: jest.fn(),
  update: jest.fn(),
});

const postEvent = {
  httpMethod: 'POST',
  headers: { authorization: 'Bearer good-token' },
  body: JSON.stringify({ prompt: 'p', topic: 'Multiplication', grade: 'G3' }),
};

const settingsSnapshot = (data) => ({ exists: data !== undefined, data: () => data });

describe('gemini-proxy AI story setting', () => {
  beforeEach(() => {
    mockCollection.mockImplementation((name) => buildChain([name]));
    mockVerifyIdToken.mockResolvedValue({ uid: 'student-1' });
    // Stop right after the gate so no Gemini call is attempted.
    mockProfileGet.mockRejectedValue(new Error('profile lookup reached'));
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('defaults to disabled when no setting document exists', () => {
    expect(featureDefaults.aiStoryEnabled).toBe(false);
  });

  test('returns 410 when the settings document is missing', async () => {
    mockSettingsGet.mockResolvedValue(settingsSnapshot(undefined));
    const res = await geminiProxy.handler(postEvent);
    expect(res.statusCode).toBe(410);
    expect(JSON.parse(res.body).error).toMatch(/disabled/i);
    expect(mockProfileGet).not.toHaveBeenCalled();
  });

  test('reads the shared settings path', async () => {
    mockSettingsGet.mockResolvedValue(settingsSnapshot({ aiStoryEnabled: false }));
    await geminiProxy.handler(postEvent);
    expect(mockSettingsGet).toHaveBeenCalledWith(['artifacts', 'default-app-id', 'settings', 'features']);
  });

  test('returns 410 when an admin switched it off', async () => {
    mockSettingsGet.mockResolvedValue(settingsSnapshot({ aiStoryEnabled: false }));
    const res = await geminiProxy.handler(postEvent);
    expect(res.statusCode).toBe(410);
  });

  test('treats non-boolean truthy values as disabled', async () => {
    mockSettingsGet.mockResolvedValue(settingsSnapshot({ aiStoryEnabled: 'yes' }));
    const res = await geminiProxy.handler(postEvent);
    expect(res.statusCode).toBe(410);
  });

  test('fails closed (410) when the setting cannot be read', async () => {
    mockSettingsGet.mockRejectedValue(new Error('permission denied'));
    const res = await geminiProxy.handler(postEvent);
    expect(res.statusCode).toBe(410);
  });

  test('proceeds past the gate when an admin switched it on', async () => {
    mockSettingsGet.mockResolvedValue(settingsSnapshot({ aiStoryEnabled: true }));
    const res = await geminiProxy.handler(postEvent);
    expect(res.statusCode).not.toBe(410);
    expect(mockProfileGet).toHaveBeenCalled();
  });

  test('still requires authentication before reading the setting', async () => {
    const res = await geminiProxy.handler({ ...postEvent, headers: {} });
    expect(res.statusCode).not.toBe(410);
    expect(JSON.parse(res.body).error).toMatch(/authorization/i);
    expect(mockSettingsGet).not.toHaveBeenCalled();
  });

  test('still answers CORS preflight', async () => {
    const res = await geminiProxy.handler({ httpMethod: 'OPTIONS', headers: {} });
    expect(res.statusCode).toBe(200);
  });
});
