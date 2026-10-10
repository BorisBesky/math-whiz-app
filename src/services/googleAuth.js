// Google sign-in / sign-up for students.
//
// - Opens a Google popup; falls back to a full-page redirect when the browser
//   blocks popups.
// - If the student is currently an anonymous guest, links Google to that
//   guest account so their progress (same uid) is kept.
// - If that Google account already has a Math Whiz account
//   (auth/credential-already-in-use), signs into the existing account instead.
// - Every failure becomes an Error with a readable message (and the Firebase
//   `code`), never a silent fallback to a guest session.
import {
  GoogleAuthProvider,
  getRedirectResult,
  linkWithPopup,
  linkWithRedirect,
  signInWithCredential,
  signInWithPopup,
  signInWithRedirect,
} from 'firebase/auth';

export const GOOGLE_REDIRECT_INTENT_KEY = 'mathwhiz.googleRedirectIntent';

// Errors where a redirect will work even though the popup didn't.
const REDIRECT_FALLBACK_CODES = new Set([
  'auth/popup-blocked',
  'auth/operation-not-supported-in-environment',
]);

export const getGoogleAuthErrorMessage = (error) => {
  const code = error?.code || '';
  switch (code) {
    case 'auth/popup-closed-by-user':
    case 'auth/cancelled-popup-request':
    case 'auth/user-cancelled':
      return 'Google sign-in was cancelled before it finished. Please try again.';
    case 'auth/popup-blocked':
      return 'Your browser blocked the Google sign-in window. Allow pop-ups for this site and try again.';
    case 'auth/unauthorized-domain':
      return "Google sign-in isn't allowed on this website address yet. An admin needs to add this domain under Firebase Authentication → Settings → Authorized domains.";
    case 'auth/operation-not-allowed':
      return 'Google sign-in is not enabled for this app. An admin needs to enable the Google provider in Firebase Authentication.';
    case 'auth/network-request-failed':
      return 'Network error during Google sign-in. Check your connection and try again.';
    case 'auth/account-exists-with-different-credential':
    case 'auth/email-already-in-use':
      return 'An account with this email already exists. Sign in with your email and password instead.';
    case 'auth/credential-already-in-use':
      return 'This Google account is already linked to another Math Whiz account. Use "Sign in with Google" instead.';
    case 'auth/provider-already-linked':
      return 'This account is already connected to Google.';
    case 'auth/user-disabled':
      return 'This account has been disabled. Please contact your teacher or administrator.';
    case 'auth/web-storage-unsupported':
      return 'Google sign-in needs cookies and site storage. Turn them on (or leave private browsing) and try again.';
    case 'auth/too-many-requests':
      return 'Too many sign-in attempts. Please wait a few minutes and try again.';
    default:
      return `Google sign-in failed${code ? ` (${code.replace('auth/', '')})` : ''}. Please try again.`;
  }
};

export const toFriendlyAuthError = (error) => {
  const friendly = new Error(getGoogleAuthErrorMessage(error));
  friendly.code = error?.code;
  friendly.cause = error;
  return friendly;
};

export const createGoogleProvider = () => {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  return provider;
};

const safeSessionStorage = () => {
  try {
    return typeof window !== 'undefined' ? window.sessionStorage : null;
  } catch (e) {
    return null;
  }
};

const rememberRedirectIntent = (intent) => {
  safeSessionStorage()?.setItem(GOOGLE_REDIRECT_INTENT_KEY, JSON.stringify({ ...intent, startedAt: Date.now() }));
};

export const takeRedirectIntent = () => {
  const storage = safeSessionStorage();
  const raw = storage?.getItem(GOOGLE_REDIRECT_INTENT_KEY);
  if (!raw) return null;
  storage.removeItem(GOOGLE_REDIRECT_INTENT_KEY);
  try {
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
};

export const hasPendingGoogleRedirect = () => Boolean(safeSessionStorage()?.getItem(GOOGLE_REDIRECT_INTENT_KEY));

// The Google account already belongs to another Math Whiz account. Don't
// switch silently (that would abandon the guest's progress): hand the
// credential back so the UI can offer "sign in and move my progress".
const existingAccountFromError = (error) => {
  const credential = GoogleAuthProvider.credentialFromError(error);
  if (!credential) throw toFriendlyAuthError(error);
  return {
    existingAccount: {
      method: 'google',
      credential,
      email: error?.customData?.email || null,
    },
  };
};

/** Sign into the existing Google account found by a failed guest link. */
export const signInWithExistingGoogleCredential = async (auth, credential) => {
  try {
    const result = await signInWithCredential(auth, credential);
    return result.user;
  } catch (error) {
    throw toFriendlyAuthError(error);
  }
};

/**
 * Start Google sign-in for a student. Resolves with
 * { user, linkedGuest, replacedGuest } after a popup, with
 * { existingAccount } when a guest tries to link a Google account that
 * already has its own Math Whiz account, or never settles
 * meaningfully when it falls back to a redirect (the page navigates away);
 * the result then arrives through completeGoogleRedirect() on return.
 */
export const startStudentGoogleAuth = async (auth) => {
  const provider = createGoogleProvider();
  const current = auth.currentUser;

  if (current && current.isAnonymous) {
    try {
      const result = await linkWithPopup(current, provider);
      return { user: result.user, linkedGuest: true, replacedGuest: false };
    } catch (error) {
      if (error?.code === 'auth/credential-already-in-use') {
        return existingAccountFromError(error);
      }
      if (REDIRECT_FALLBACK_CODES.has(error?.code)) {
        rememberRedirectIntent({ role: 'student', linking: true });
        await linkWithRedirect(current, provider);
        return { redirected: true };
      }
      throw toFriendlyAuthError(error);
    }
  }

  try {
    const result = await signInWithPopup(auth, provider);
    return { user: result.user, linkedGuest: false, replacedGuest: false };
  } catch (error) {
    if (REDIRECT_FALLBACK_CODES.has(error?.code)) {
      rememberRedirectIntent({ role: 'student', linking: false });
      await signInWithRedirect(auth, provider);
      return { redirected: true };
    }
    throw toFriendlyAuthError(error);
  }
};

/**
 * Finish a redirect started by startStudentGoogleAuth. Returns null when no
 * redirect was pending (or the user came back without signing in).
 */
export const completeGoogleRedirect = async (auth) => {
  const intent = takeRedirectIntent();
  if (!intent) return null;
  try {
    const result = await getRedirectResult(auth);
    if (!result?.user) return null;
    return {
      user: result.user,
      role: intent.role,
      linkedGuest: Boolean(intent.linking) && result.operationType === 'link',
      replacedGuest: false,
    };
  } catch (error) {
    if (error?.code === 'auth/credential-already-in-use') {
      return { ...existingAccountFromError(error), role: intent.role };
    }
    throw toFriendlyAuthError(error);
  }
};
