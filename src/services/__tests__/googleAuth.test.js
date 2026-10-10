const mockSignInWithPopup = jest.fn();
const mockSignInWithRedirect = jest.fn();
const mockLinkWithPopup = jest.fn();
const mockLinkWithRedirect = jest.fn();
const mockSignInWithCredential = jest.fn();
const mockGetRedirectResult = jest.fn();
const mockCredentialFromError = jest.fn();
const mockSetCustomParameters = jest.fn();

jest.mock('firebase/auth', () => {
  class GoogleAuthProvider {
    constructor() { this.providerId = 'google.com'; }
    setCustomParameters(params) { mockSetCustomParameters(params); this.params = params; }
    static credentialFromError(error) { return mockCredentialFromError(error); }
  }
  return {
    GoogleAuthProvider,
    signInWithPopup: (...a) => mockSignInWithPopup(...a),
    signInWithRedirect: (...a) => mockSignInWithRedirect(...a),
    linkWithPopup: (...a) => mockLinkWithPopup(...a),
    linkWithRedirect: (...a) => mockLinkWithRedirect(...a),
    signInWithCredential: (...a) => mockSignInWithCredential(...a),
    getRedirectResult: (...a) => mockGetRedirectResult(...a),
  };
});

// eslint-disable-next-line import/first
import {
  GOOGLE_REDIRECT_INTENT_KEY,
  completeGoogleRedirect,
  getGoogleAuthErrorMessage,
  startStudentGoogleAuth,
} from '../googleAuth';

const authError = (code) => Object.assign(new Error(`Firebase: Error (${code}).`), { code });
const googleUser = { uid: 'google-uid', email: 'kid@gmail.com', isAnonymous: false };

describe('startStudentGoogleAuth', () => {
  beforeEach(() => {
    window.sessionStorage.clear();
  });

  it('opens a Google popup when nobody is signed in', async () => {
    mockSignInWithPopup.mockResolvedValue({ user: googleUser });
    const auth = { currentUser: null };
    const outcome = await startStudentGoogleAuth(auth);
    expect(mockSignInWithPopup).toHaveBeenCalledTimes(1);
    const [authArg, provider] = mockSignInWithPopup.mock.calls[0];
    expect(authArg).toBe(auth);
    expect(provider.providerId).toBe('google.com');
    expect(mockSetCustomParameters).toHaveBeenCalledWith({ prompt: 'select_account' });
    expect(outcome).toEqual({ user: googleUser, linkedGuest: false, replacedGuest: false });
  });

  it('links Google to an anonymous guest so progress is kept', async () => {
    const guest = { uid: 'guest-uid', isAnonymous: true };
    mockLinkWithPopup.mockResolvedValue({ user: { ...googleUser, uid: 'guest-uid' } });
    const outcome = await startStudentGoogleAuth({ currentUser: guest });
    expect(mockLinkWithPopup).toHaveBeenCalledWith(guest, expect.objectContaining({ providerId: 'google.com' }));
    expect(mockSignInWithPopup).not.toHaveBeenCalled();
    expect(outcome).toMatchObject({ linkedGuest: true, user: { uid: 'guest-uid' } });
  });

  it('signs into the existing account on credential-already-in-use', async () => {
    const guest = { uid: 'guest-uid', isAnonymous: true };
    const error = authError('auth/credential-already-in-use');
    mockLinkWithPopup.mockRejectedValue(error);
    mockCredentialFromError.mockReturnValue({ token: 'cred' });
    mockSignInWithCredential.mockResolvedValue({ user: googleUser });
    const auth = { currentUser: guest };
    const outcome = await startStudentGoogleAuth(auth);
    expect(mockCredentialFromError).toHaveBeenCalledWith(error);
    expect(mockSignInWithCredential).toHaveBeenCalledWith(auth, { token: 'cred' });
    expect(outcome).toEqual({ user: googleUser, linkedGuest: false, replacedGuest: true });
  });

  it('explains credential-already-in-use when no credential can be recovered', async () => {
    mockLinkWithPopup.mockRejectedValue(authError('auth/credential-already-in-use'));
    mockCredentialFromError.mockReturnValue(null);
    await expect(startStudentGoogleAuth({ currentUser: { isAnonymous: true } }))
      .rejects.toMatchObject({ code: 'auth/credential-already-in-use', message: expect.stringMatching(/already linked/) });
  });

  it('falls back to a redirect link when the popup is blocked for a guest', async () => {
    const guest = { uid: 'guest-uid', isAnonymous: true };
    mockLinkWithPopup.mockRejectedValue(authError('auth/popup-blocked'));
    mockLinkWithRedirect.mockResolvedValue(undefined);
    const outcome = await startStudentGoogleAuth({ currentUser: guest });
    expect(mockLinkWithRedirect).toHaveBeenCalledWith(guest, expect.anything());
    expect(outcome).toEqual({ redirected: true });
    expect(JSON.parse(window.sessionStorage.getItem(GOOGLE_REDIRECT_INTENT_KEY))).toMatchObject({ role: 'student', linking: true });
  });

  it('falls back to a redirect sign-in when the popup is blocked', async () => {
    mockSignInWithPopup.mockRejectedValue(authError('auth/popup-blocked'));
    mockSignInWithRedirect.mockResolvedValue(undefined);
    const outcome = await startStudentGoogleAuth({ currentUser: null });
    expect(mockSignInWithRedirect).toHaveBeenCalledTimes(1);
    expect(outcome).toEqual({ redirected: true });
  });

  it('surfaces other errors with a readable message and no redirect', async () => {
    mockSignInWithPopup.mockRejectedValue(authError('auth/unauthorized-domain'));
    await expect(startStudentGoogleAuth({ currentUser: null }))
      .rejects.toMatchObject({ code: 'auth/unauthorized-domain', message: expect.stringMatching(/Authorized domains/) });
    expect(mockSignInWithRedirect).not.toHaveBeenCalled();

    mockSignInWithPopup.mockRejectedValue(authError('auth/popup-closed-by-user'));
    await expect(startStudentGoogleAuth({ currentUser: null })).rejects.toThrow(/cancelled/);
  });
});

describe('completeGoogleRedirect', () => {
  beforeEach(() => window.sessionStorage.clear());

  it('does nothing when no redirect was started', async () => {
    expect(await completeGoogleRedirect({})).toBeNull();
    expect(mockGetRedirectResult).not.toHaveBeenCalled();
  });

  it('returns the linked guest after a redirect link', async () => {
    window.sessionStorage.setItem(GOOGLE_REDIRECT_INTENT_KEY, JSON.stringify({ role: 'student', linking: true }));
    mockGetRedirectResult.mockResolvedValue({ user: googleUser, operationType: 'link' });
    expect(await completeGoogleRedirect({})).toMatchObject({ user: googleUser, linkedGuest: true, role: 'student' });
    expect(window.sessionStorage.getItem(GOOGLE_REDIRECT_INTENT_KEY)).toBeNull();
  });

  it('returns null when the user came back without signing in', async () => {
    window.sessionStorage.setItem(GOOGLE_REDIRECT_INTENT_KEY, JSON.stringify({ role: 'student', linking: false }));
    mockGetRedirectResult.mockResolvedValue(null);
    expect(await completeGoogleRedirect({})).toBeNull();
  });

  it('signs into the existing account when the redirect link hits credential-already-in-use', async () => {
    window.sessionStorage.setItem(GOOGLE_REDIRECT_INTENT_KEY, JSON.stringify({ role: 'student', linking: true }));
    mockGetRedirectResult.mockRejectedValue(authError('auth/credential-already-in-use'));
    mockCredentialFromError.mockReturnValue({ token: 'cred' });
    mockSignInWithCredential.mockResolvedValue({ user: googleUser });
    expect(await completeGoogleRedirect({})).toMatchObject({ user: googleUser, replacedGuest: true, role: 'student' });
  });

  it('turns redirect errors into readable errors', async () => {
    window.sessionStorage.setItem(GOOGLE_REDIRECT_INTENT_KEY, JSON.stringify({ role: 'student' }));
    mockGetRedirectResult.mockRejectedValue(authError('auth/operation-not-allowed'));
    await expect(completeGoogleRedirect({})).rejects.toThrow(/enable the Google provider/);
  });
});

test('getGoogleAuthErrorMessage always returns text', () => {
  expect(getGoogleAuthErrorMessage(undefined)).toMatch(/Google sign-in failed/);
  expect(getGoogleAuthErrorMessage({ code: 'auth/weird' })).toMatch(/\(weird\)/);
});
