const mockOnSnapshot = jest.fn();
const mockSetDoc = jest.fn();

jest.mock('firebase/firestore', () => ({
  doc: (db, ...path) => ({ path: path.join('/') }),
  onSnapshot: (...args) => mockOnSnapshot(...args),
  setDoc: (...args) => mockSetDoc(...args),
  serverTimestamp: () => 'SERVER_TS',
}));

// eslint-disable-next-line import/first
import {
  DEFAULT_FEATURE_SETTINGS,
  normalizeFeatureSettings,
  subscribeFeatureSettings,
  updateFeatureSettings,
} from '../featureSettings';

describe('featureSettings service', () => {
  beforeEach(() => {
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });
  afterEach(() => jest.restoreAllMocks());

  it('defaults AI stories to disabled', () => {
    expect(DEFAULT_FEATURE_SETTINGS.aiStoryEnabled).toBe(false);
    expect(normalizeFeatureSettings(null).aiStoryEnabled).toBe(false);
  });

  it('only enables on an explicit boolean true', () => {
    expect(normalizeFeatureSettings({ aiStoryEnabled: true }).aiStoryEnabled).toBe(true);
    expect(normalizeFeatureSettings({ aiStoryEnabled: 'true' }).aiStoryEnabled).toBe(false);
    expect(normalizeFeatureSettings({ aiStoryEnabled: 1 }).aiStoryEnabled).toBe(false);
    expect(normalizeFeatureSettings({}).aiStoryEnabled).toBe(false);
  });

  it('subscribes to artifacts/{appId}/settings/features', () => {
    const onChange = jest.fn();
    mockOnSnapshot.mockImplementation((ref, next) => {
      expect(ref.path).toBe('artifacts/app-1/settings/features');
      next({ exists: () => true, data: () => ({ aiStoryEnabled: true }) });
      return 'unsub';
    });
    expect(subscribeFeatureSettings({ db: {}, appId: 'app-1', onChange })).toBe('unsub');
    expect(onChange).toHaveBeenCalledWith({ aiStoryEnabled: true });
  });

  it('treats a missing document as disabled', () => {
    const onChange = jest.fn();
    mockOnSnapshot.mockImplementation((ref, next) => {
      next({ exists: () => false, data: () => undefined });
      return () => {};
    });
    subscribeFeatureSettings({ db: {}, appId: 'app-1', onChange });
    expect(onChange).toHaveBeenCalledWith({ aiStoryEnabled: false });
  });

  it('fails closed when the document cannot be read', () => {
    const onChange = jest.fn();
    const onError = jest.fn();
    mockOnSnapshot.mockImplementation((ref, next, error) => {
      error(new Error('permission-denied'));
      return () => {};
    });
    subscribeFeatureSettings({ db: {}, appId: 'app-1', onChange, onError });
    expect(onChange).toHaveBeenCalledWith({ aiStoryEnabled: false });
    expect(onError).toHaveBeenCalled();
  });

  it('writes the toggle with merge and audit fields', async () => {
    mockSetDoc.mockResolvedValue(undefined);
    await updateFeatureSettings({ db: {}, appId: 'app-1', updates: { aiStoryEnabled: true }, userId: 'admin-1' });
    expect(mockSetDoc).toHaveBeenCalledWith(
      { path: 'artifacts/app-1/settings/features' },
      { aiStoryEnabled: true, updatedAt: 'SERVER_TS', updatedBy: 'admin-1' },
      { merge: true }
    );
  });

  it('rejects updates without a boolean value', async () => {
    await expect(updateFeatureSettings({ db: {}, appId: 'app-1', updates: { aiStoryEnabled: 'yes' } }))
      .rejects.toThrow(/no valid/i);
    expect(mockSetDoc).not.toHaveBeenCalled();
  });
});
