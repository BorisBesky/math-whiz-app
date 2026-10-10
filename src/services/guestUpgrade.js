// Client helpers for turning a guest (anonymous) student into a real account.
const MERGE_ENDPOINT = '/.netlify/functions/merge-guest-account';

export const EMAIL_EXISTS_CODES = new Set(['auth/email-already-in-use', 'auth/credential-already-in-use']);

const EMAIL_MESSAGES = {
  'auth/invalid-email': 'That email address doesn’t look right.',
  'auth/weak-password': 'Choose a password with at least 6 characters.',
  'auth/missing-password': 'Enter a password.',
  'auth/operation-not-allowed': 'Email sign-up isn’t turned on for this app yet. Try Google, or ask your teacher.',
  'auth/wrong-password': 'That password isn’t right for this account.',
  'auth/invalid-credential': 'That password isn’t right for this account.',
  'auth/invalid-login-credentials': 'That password isn’t right for this account.',
  'auth/user-not-found': 'We couldn’t find that account.',
  'auth/too-many-requests': 'Too many attempts. Wait a few minutes and try again.',
  'auth/network-request-failed': 'Could not reach the server. Check your connection and try again.',
  'auth/requires-recent-login': 'Please try again.',
};

export const toFriendlyEmailError = (error) => {
  const friendly = new Error(EMAIL_MESSAGES[error?.code] || error?.message || 'Something went wrong. Please try again.');
  friendly.code = error?.code;
  return friendly;
};

/** Ask the server to move the guest's progress into the signed-in account. */
export const requestGuestMerge = async ({ user, guestIdToken, appId }) => {
  const token = await user.getIdToken();
  let response;
  try {
    response = await fetch(MERGE_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ appId, guestIdToken }),
    });
  } catch (e) {
    const error = new Error('Could not reach the server to move your guest progress. Check your connection and try again.');
    error.code = 'guest/merge-failed';
    throw error;
  }
  let data = {};
  try {
    data = await response.json();
  } catch (e) {
    data = {};
  }
  if (!response.ok) {
    const error = new Error(data.error || `We couldn’t move your guest progress (HTTP ${response.status}).`);
    error.code = response.status === 403 ? 'guest/merge-refused' : 'guest/merge-failed';
    error.status = response.status;
    throw error;
  }
  return data;
};

// Guests get a gentle "save your progress" nudge once they've done something
// worth keeping. Dismissal is remembered per guest uid on this device.
export const GUEST_BANNER_MIN_COINS = 5;
export const GUEST_BANNER_MIN_QUESTIONS = 5;
const bannerKey = (uid) => `mathwhiz.guestSaveBanner.dismissed.${uid}`;

export const hasMeaningfulGuestProgress = (userData) => (
  Number(userData?.coins || 0) >= GUEST_BANNER_MIN_COINS
  || Number(userData?.questionSummary?.total || 0) >= GUEST_BANNER_MIN_QUESTIONS
);

export const isGuestBannerDismissed = (uid) => {
  try {
    return Boolean(uid) && window.localStorage.getItem(bannerKey(uid)) === '1';
  } catch (e) {
    return false;
  }
};

export const dismissGuestBanner = (uid) => {
  try {
    if (uid) window.localStorage.setItem(bannerKey(uid), '1');
  } catch (e) {
    // storage unavailable: the banner just shows again next time
  }
};
