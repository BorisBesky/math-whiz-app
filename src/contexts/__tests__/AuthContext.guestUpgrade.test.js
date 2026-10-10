import React from 'react';
import { render, act } from '@testing-library/react';

const mockAuth = { currentUser: null };
const mockLinkWithPopup = jest.fn();
const mockLinkWithCredential = jest.fn();
const mockSignOut = jest.fn();
const mockSetDoc = jest.fn();
const mockGetDoc = jest.fn();
const mockSignInWithEmail = jest.fn();
const mockSignInWithCredential = jest.fn();
const mockCredentialFromError = jest.fn();
const mockUpdateProfile = jest.fn();

jest.mock('../../firebase', () => ({ auth: mockAuth, db: {} }));
jest.mock('firebase/firestore', () => ({
  doc: (db, ...path) => ({ path: path.join('/') }),
  getDoc: (...a) => mockGetDoc(...a),
  setDoc: (...a) => mockSetDoc(...a),
}));
jest.mock('firebase/auth', () => {
  class GoogleAuthProvider {
    constructor() { this.providerId = 'google.com'; }
    setCustomParameters() {}
    static credentialFromError(e) { return mockCredentialFromError(e); }
  }
  return {
    GoogleAuthProvider,
    onAuthStateChanged: (auth, cb) => { cb(null); return () => {}; },
    signInAnonymously: jest.fn(),
    signInWithEmailAndPassword: (...a) => mockSignInWithEmail(...a),
    getAdditionalUserInfo: jest.fn(),
    deleteUser: jest.fn(),
    updateProfile: (...a) => mockUpdateProfile(...a),
    createUserWithEmailAndPassword: jest.fn(),
    signOut: (...a) => mockSignOut(...a),
    EmailAuthProvider: { credential: (email, password) => ({ email, password }) },
    linkWithCredential: (...a) => mockLinkWithCredential(...a),
    sendPasswordResetEmail: jest.fn(),
    signInWithPopup: jest.fn(),
    signInWithRedirect: jest.fn(),
    linkWithPopup: (...a) => mockLinkWithPopup(...a),
    linkWithRedirect: jest.fn(),
    signInWithCredential: (...a) => mockSignInWithCredential(...a),
    getRedirectResult: jest.fn(),
  };
});

const { AuthProvider, useAuth } = require('../AuthContext');

const setupAuth = () => {
  const ref = { current: null };
  const Probe = () => { ref.current = useAuth(); return null; };
  render(<AuthProvider><Probe /></AuthProvider>);
  return ref;
};

const PROFILE = (uid) => ({ path: `artifacts/default-app-id/users/${uid}/math_whiz_data/profile` });
const authError = (code) => Object.assign(new Error(code), { code });
const makeGuest = () => ({ uid: 'guest-uid', isAnonymous: true, getIdToken: jest.fn().mockResolvedValue('guest-token') });
const makeAccount = (overrides = {}) => ({
  uid: 'acct-uid',
  email: 'sam@example.com',
  isAnonymous: false,
  getIdToken: jest.fn().mockResolvedValue('acct-token'),
  getIdTokenResult: jest.fn().mockResolvedValue({ claims: {} }),
  ...overrides,
});
const ok = (body) => ({ ok: true, status: 200, json: async () => body });

beforeEach(() => {
  mockAuth.currentUser = null;
  mockSetDoc.mockResolvedValue(undefined);
  mockGetDoc.mockResolvedValue({ exists: () => false });
  mockSignOut.mockResolvedValue(undefined);
  mockUpdateProfile.mockResolvedValue(undefined);
  global.fetch = jest.fn();
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => jest.restoreAllMocks());

describe('saving a guest with email', () => {
  test('links the email credential to the guest (same uid), then marks the profile converted', async () => {
    const guest = makeGuest();
    mockAuth.currentUser = guest;
    mockLinkWithCredential.mockResolvedValue({ user: { ...guest, isAnonymous: false } });
    const ctx = setupAuth();
    let result;
    await act(async () => {
      result = await ctx.current.saveGuestWithEmail({ email: 'kid@example.com', password: 'secret1', displayName: ' Kid ' });
    });
    expect(mockLinkWithCredential).toHaveBeenCalledWith(guest, { email: 'kid@example.com', password: 'secret1' });
    expect(result).toMatchObject({ linkedGuest: true, user: { uid: 'guest-uid' } });
    expect(mockSetDoc).toHaveBeenCalledWith(
      PROFILE('guest-uid'),
      expect.objectContaining({ email: 'kid@example.com', role: 'student', isAnonymous: false, displayName: 'Kid' }),
      { merge: true },
    );
    expect(mockLinkWithCredential.mock.invocationCallOrder[0]).toBeLessThan(mockSetDoc.mock.invocationCallOrder[0]);
  });

  test('an email that already has an account returns existingAccount and leaves the guest profile alone', async () => {
    mockAuth.currentUser = makeGuest();
    mockLinkWithCredential.mockRejectedValue(authError('auth/email-already-in-use'));
    const ctx = setupAuth();
    let result;
    await act(async () => {
      result = await ctx.current.saveGuestWithEmail({ email: 'sam@example.com', password: 'secret1' });
    });
    expect(result).toEqual({ existingAccount: { method: 'password', email: 'sam@example.com' } });
    expect(mockSetDoc).not.toHaveBeenCalled();
  });

  test('other link errors are explained', async () => {
    mockAuth.currentUser = makeGuest();
    mockLinkWithCredential.mockRejectedValue(authError('auth/weak-password'));
    const ctx = setupAuth();
    await expect(ctx.current.saveGuestWithEmail({ email: 'a@b.co', password: '1' })).rejects.toThrow(/at least 6 characters/);
  });

  test('registerWithEmail (student sign-up page) no longer writes the profile when linking fails', async () => {
    mockAuth.currentUser = makeGuest();
    mockLinkWithCredential.mockRejectedValue(authError('auth/email-already-in-use'));
    const ctx = setupAuth();
    await expect(ctx.current.registerWithEmail('sam@example.com', 'secret1', 'student')).rejects.toMatchObject({ code: 'auth/email-already-in-use' });
    expect(mockSetDoc).not.toHaveBeenCalled();
  });
});

describe('saving a guest with Google', () => {
  test('links Google to the guest', async () => {
    const guest = makeGuest();
    mockAuth.currentUser = guest;
    mockLinkWithPopup.mockResolvedValue({ user: { ...guest, isAnonymous: false, email: 'kid@gmail.com', displayName: 'Kid' } });
    const ctx = setupAuth();
    let result;
    await act(async () => { result = await ctx.current.saveGuestWithGoogle(); });
    expect(mockLinkWithPopup).toHaveBeenCalledWith(guest, expect.anything());
    expect(result).toMatchObject({ linkedGuest: true });
    expect(mockSignInWithCredential).not.toHaveBeenCalled();
  });

  test('a Google account that already has an account is reported, not silently switched to', async () => {
    mockAuth.currentUser = makeGuest();
    mockLinkWithPopup.mockRejectedValue(Object.assign(authError('auth/credential-already-in-use'), { customData: { email: 'sam@gmail.com' } }));
    mockCredentialFromError.mockReturnValue({ token: 'g-cred' });
    const ctx = setupAuth();
    let result;
    await act(async () => { result = await ctx.current.saveGuestWithGoogle(); });
    expect(result).toEqual({ existingAccount: { method: 'google', credential: { token: 'g-cred' }, email: 'sam@gmail.com' } });
    expect(mockSignInWithCredential).not.toHaveBeenCalled();
  });

  test('refuses when not a guest', async () => {
    mockAuth.currentUser = makeAccount();
    const ctx = setupAuth();
    await expect(ctx.current.saveGuestWithGoogle()).rejects.toThrow(/already signed in/);
  });
});

describe('signing into the existing account and merging', () => {
  test('captures the guest token before switching, then sends both tokens to the merge function', async () => {
    const guest = makeGuest();
    const account = makeAccount();
    mockAuth.currentUser = guest;
    mockSignInWithEmail.mockImplementation(async () => {
      expect(guest.getIdToken).toHaveBeenCalled();
      mockAuth.currentUser = account;
      return { user: account };
    });
    mockGetDoc.mockResolvedValue({ exists: () => true, data: () => ({ role: 'student' }) });
    global.fetch.mockResolvedValue(ok({ success: true, summary: { profileMerged: true } }));
    const ctx = setupAuth();
    let result;
    await act(async () => {
      result = await ctx.current.signInAndMergeGuest({ method: 'password', email: 'sam@example.com' }, { password: 'pw' });
    });
    expect(mockSignInWithEmail).toHaveBeenCalledWith(mockAuth, 'sam@example.com', 'pw');
    const [url, init] = global.fetch.mock.calls[0];
    expect(url).toBe('/.netlify/functions/merge-guest-account');
    expect(init.headers.Authorization).toBe('Bearer acct-token');
    expect(JSON.parse(init.body)).toEqual({ appId: 'default-app-id', guestIdToken: 'guest-token' });
    expect(result).toEqual({ merged: true, summary: { profileMerged: true } });
  });

  test('Google existing account signs in with the saved credential', async () => {
    mockAuth.currentUser = makeGuest();
    const account = makeAccount();
    mockSignInWithCredential.mockImplementation(async () => { mockAuth.currentUser = account; return { user: account }; });
    global.fetch.mockResolvedValue(ok({ success: true, summary: {} }));
    const ctx = setupAuth();
    await act(async () => {
      await ctx.current.signInAndMergeGuest({ method: 'google', credential: { token: 'g-cred' } });
    });
    expect(mockSignInWithCredential).toHaveBeenCalledWith(mockAuth, { token: 'g-cred' });
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  test('a wrong password keeps the guest session and explains', async () => {
    mockAuth.currentUser = makeGuest();
    mockSignInWithEmail.mockRejectedValue(authError('auth/invalid-credential'));
    const ctx = setupAuth();
    await expect(ctx.current.signInAndMergeGuest({ method: 'password', email: 'sam@example.com' }, { password: 'x' }))
      .rejects.toThrow(/password isn’t right/);
    expect(global.fetch).not.toHaveBeenCalled();
    expect(mockAuth.currentUser.isAnonymous).toBe(true);
  });

  test('teacher accounts are refused and signed out', async () => {
    mockAuth.currentUser = makeGuest();
    const account = makeAccount();
    mockSignInWithEmail.mockImplementation(async () => { mockAuth.currentUser = account; return { user: account }; });
    mockGetDoc.mockResolvedValue({ exists: () => true, data: () => ({ role: 'teacher' }) });
    const ctx = setupAuth();
    await expect(ctx.current.signInAndMergeGuest({ method: 'password', email: 'sam@example.com' }, { password: 'pw' }))
      .rejects.toThrow(/isn’t a student account/);
    expect(mockSignOut).toHaveBeenCalled();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test('a failed merge can be retried with the saved guest token', async () => {
    mockAuth.currentUser = makeGuest();
    const account = makeAccount();
    mockSignInWithEmail.mockImplementation(async () => { mockAuth.currentUser = account; return { user: account }; });
    global.fetch
      .mockResolvedValueOnce({ ok: false, status: 500, json: async () => ({ error: 'We couldn’t finish moving your guest progress. Please try again.' }) })
      .mockResolvedValueOnce(ok({ success: true, summary: {} }));
    const ctx = setupAuth();
    await expect(ctx.current.signInAndMergeGuest({ method: 'password', email: 'sam@example.com' }, { password: 'pw' }))
      .rejects.toMatchObject({ code: 'guest/merge-failed', message: expect.stringMatching(/try again/) });
    let retried;
    await act(async () => { retried = await ctx.current.retryGuestMerge(); });
    expect(retried.merged).toBe(true);
    expect(JSON.parse(global.fetch.mock.calls[1][1].body).guestIdToken).toBe('guest-token');
  });
});
