import { renderHook, act } from '@testing-library/react';

const mockSubscribe = jest.fn();
jest.mock('firebase/firestore', () => ({ getFirestore: () => ({ __db: true }) }));
jest.mock('../../services/featureSettings', () => ({
  DISABLED_FEATURE_SETTINGS: { aiStoryEnabled: false },
  subscribeFeatureSettings: (...args) => mockSubscribe(...args),
}));

// eslint-disable-next-line import/first
import useFeatureSettings from '../useFeatureSettings';

describe('useFeatureSettings', () => {
  it('starts disabled and follows live updates', () => {
    let push;
    const unsubscribe = jest.fn();
    mockSubscribe.mockImplementation(({ onChange }) => { push = onChange; return unsubscribe; });
    const { result, unmount } = renderHook(() => useFeatureSettings({ appId: 'app-1' }));
    expect(result.current.settings.aiStoryEnabled).toBe(false);
    expect(result.current.loading).toBe(true);
    act(() => push({ aiStoryEnabled: true }));
    expect(result.current.settings.aiStoryEnabled).toBe(true);
    expect(result.current.loading).toBe(false);
    act(() => push({ aiStoryEnabled: false }));
    expect(result.current.settings.aiStoryEnabled).toBe(false);
    unmount();
    expect(unsubscribe).toHaveBeenCalled();
  });

  it('stays disabled and does not subscribe when not enabled (signed out)', () => {
    const { result } = renderHook(() => useFeatureSettings({ appId: 'app-1', enabled: false }));
    expect(mockSubscribe).not.toHaveBeenCalled();
    expect(result.current.settings.aiStoryEnabled).toBe(false);
    expect(result.current.loading).toBe(false);
  });
});
