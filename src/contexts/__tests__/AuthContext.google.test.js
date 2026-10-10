import React from 'react';
import { render, act, waitFor } from '@testing-library/react';

const mockAuth = { currentUser: null };
const mockSignInWithPopup = jest.fn();
const mockLinkWithPopup = jest.fn();
const mockSignOut = jest.fn();
const mockSignInAnonymously = jest.fn();
const mockSetDoc = jest.fn();
const mockGetDoc = jest.fn();
const mockGetRedirectResult = jest.fn();

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
    static credentialFromError() { return null; }
  }
  return {
    GoogleAuthProvider,
    onAuthStateChanged: (auth, cb) => { cb(null); return () => {}; },
    signInAnonymously: (...a) => mockSignInAnonymously(...a),
    signInWithEmailAndPassword: jest.fn(),
    createUserWithEmailAndPassword: jest.fn(),
    signOut: (...a) => mockSignOut(...a),
    EmailAuthProvider: { credential: jest.fn() },
    linkWithCredential: jest.fn(),
    sendPasswordResetEmail: jest.fn(),
    signInWithPopup: (...a) => mockSignInWithPopup(...a),
    signInWithRedirect: jest.fn(),
    linkWithPopup: (...a) => mockLinkWithPopup(...a),
    linkWithRedirect: jest.fn(),
    signInWithCredential: jest.fn(),
    getRedirectResult: (...a) => mockGetRedirectResult(...a),
  };
});

const { AuthProvider, useAuth } = require('../AuthContext');

const setupAuth = () => {
  const ref = { current: null };
  const Probe = () => { ref.current = useAuth(); return null; };
  render(<AuthProvider><Probe /></AuthProvider>);
  return ref;
};

const makeUser = (overrides = {}) => ({
  uid: 'google-uid',
  email: 'kid@gmail.com',
  displayName: 'Kid',
  isAnonymous: false,
  getIdTokenResult: () => Promise.resolve({ claims: {} }),
  ...overrides,
});

describe('AuthContext Google flows', () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    mockAuth.currentUser = null;
    mockSetDoc.mockResolvedValue(undefined);
    mockGetDoc.mockResolvedValue({ exists: () => false });
    mockSignOut.mockResolvedValue(undefined);
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => jest.restoreAllMocks());

  it('student Google sign-up actually opens Google and creates a student profile (regression)', async () => {
    const user = makeUser();
    mockSignInWithPopup.mockResolvedValue({ user });
    const ctx = setupAuth();
    let result;
    await act(async () => { result = await ctx.current.registerWithGoogle('student'); });
    expect(mockSignInWithPopup).toHaveBeenCalledTimes(1);
    expect(mockSignInAnonymously).not.toHaveBeenCalled();
    expect(result.user).toBe(user);
    expect(mockSetDoc).toHaveBeenCalledWith(
      { path: 'artifacts/default-app-id/users/google-uid/math_whiz_data/profile' },
      expect.objectContaining({ role: 'student', email: 'kid@gmail.com', isAnonymous: false }),
      { merge: true }
    );
  });

  it('student Google sign-up upgrades an anonymous guest in place', async () => {
    mockAuth.currentUser = { uid: 'guest-uid', isAnonymous: true };
    const linked = makeUser({ uid: 'guest-uid' });
    mockLinkWithPopup.mockResolvedValue({ user: linked });
    const ctx = setupAuth();
    let result;
    await act(async () => { result = await ctx.current.registerWithGoogle('student'); });
    expect(mockLinkWithPopup).toHaveBeenCalledTimes(1);
    expect(mockSignInWithPopup).not.toHaveBeenCalled();
    expect(result).toMatchObject({ linkedGuest: true, user: { uid: 'guest-uid' } });
    expect(mockSetDoc).toHaveBeenCalledWith(
      { path: 'artifacts/default-app-id/users/guest-uid/math_whiz_data/profile' },
      expect.objectContaining({ role: 'student', isAnonymous: false }),
      { merge: true }
    );
  });

  it('rejects a Google account that belongs to a teacher on the student page', async () => {
    mockSignInWithPopup.mockResolvedValue({ user: makeUser() });
    mockGetDoc.mockResolvedValue({ exists: () => true, data: () => ({ role: 'teacher' }) });
    const ctx = setupAuth();
    await act(async () => {
      await expect(ctx.current.loginWithGoogle('student')).rejects.toThrow(/registered as a teacher/);
    });
    expect(mockSignOut).toHaveBeenCalled();
  });

  it('surfaces popup errors instead of resolving silently', async () => {
    mockSignInWithPopup.mockRejectedValue(Object.assign(new Error('x'), { code: 'auth/operation-not-allowed' }));
    const ctx = setupAuth();
    await act(async () => {
      await expect(ctx.current.registerWithGoogle('student')).rejects.toThrow(/enable the Google provider/);
    });
    await waitFor(() => expect(ctx.current.error).toMatch(/enable the Google provider/));
  });

  it('teacher Google login still uses a popup and the teacher checks', async () => {
    const teacher = makeUser({ uid: 't1', getIdTokenResult: () => Promise.resolve({ claims: { admin: true } }) });
    mockSignInWithPopup.mockResolvedValue({ user: teacher });
    mockGetDoc.mockResolvedValue({ exists: () => true, data: () => ({ role: 'teacher' }) });
    const ctx = setupAuth();
    let user;
    await act(async () => { user = await ctx.current.loginWithGoogle('teacher'); });
    expect(user).toBe(teacher);
    expect(mockLinkWithPopup).not.toHaveBeenCalled();
    expect(mockSignOut).not.toHaveBeenCalled();
  });

  it('teacher Google login with a guest session does not link the guest', async () => {
    mockAuth.currentUser = { uid: 'guest-uid', isAnonymous: true };
    const teacher = makeUser({ uid: 't1', getIdTokenResult: () => Promise.resolve({ claims: { admin: true } }) });
    mockSignInWithPopup.mockResolvedValue({ user: teacher });
    mockGetDoc.mockResolvedValue({ exists: () => true, data: () => ({ role: 'teacher' }) });
    const ctx = setupAuth();
    await act(async () => { await ctx.current.loginWithGoogle('teacher'); });
    expect(mockLinkWithPopup).not.toHaveBeenCalled();
    expect(mockSignInWithPopup).toHaveBeenCalledTimes(1);
  });

  it('only students can sign up with Google', async () => {
    const ctx = setupAuth();
    await act(async () => {
      await expect(ctx.current.registerWithGoogle('teacher')).rejects.toThrow(/Only student/);
    });
    expect(mockSignInWithPopup).not.toHaveBeenCalled();
  });

  it('finishes a Google redirect exactly once, even under StrictMode double effects', async () => {
    window.sessionStorage.setItem('mathwhiz.googleRedirectIntent', JSON.stringify({ role: 'student', linking: true }));
    const linked = makeUser({ uid: 'guest-uid' });
    mockGetRedirectResult.mockResolvedValue({ user: linked, operationType: 'link' });
    const ref = { current: null };
    const Probe = () => { ref.current = useAuth(); return null; };
    render(<React.StrictMode><AuthProvider><Probe /></AuthProvider></React.StrictMode>);
    await waitFor(() => expect(ref.current.googleRedirect.status).toBe('success'));
    expect(mockGetRedirectResult).toHaveBeenCalledTimes(1);
    expect(mockSetDoc).toHaveBeenCalledWith(
      { path: 'artifacts/default-app-id/users/guest-uid/math_whiz_data/profile' },
      expect.objectContaining({ role: 'student', isAnonymous: false }),
      { merge: true }
    );
    expect(window.sessionStorage.getItem('mathwhiz.googleRedirectIntent')).toBeNull();
  });

  it('reports a failed Google redirect', async () => {
    window.sessionStorage.setItem('mathwhiz.googleRedirectIntent', JSON.stringify({ role: 'student', linking: false }));
    mockGetRedirectResult.mockRejectedValue(Object.assign(new Error('x'), { code: 'auth/unauthorized-domain' }));
    const ctx = setupAuth();
    await waitFor(() => expect(ctx.current.googleRedirect.status).toBe('error'));
    expect(ctx.current.googleRedirect.error).toMatch(/Authorized domains/);
  });
});
