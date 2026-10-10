import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  reauthenticateWithPopup,
} from 'firebase/auth';
import { createGoogleProvider, getGoogleAuthErrorMessage } from './googleAuth';

export const DELETE_CONFIRM_WORD = 'DELETE';
const EXPORT_ENDPOINT = '/.netlify/functions/export-account-data';
const DELETE_ENDPOINT = '/.netlify/functions/delete-account';

/** Which way this user can re-confirm their identity. */
export const getReauthMethod = (user) => {
  const providers = (user?.providerData || []).map((p) => p.providerId);
  if (providers.includes('password')) return 'password';
  if (providers.includes('google.com')) return 'google';
  return null;
};

const readError = async (response, fallback) => {
  try {
    const data = await response.json();
    if (data?.error) {
      const error = new Error(data.error);
      error.code = data.code;
      error.status = response.status;
      return error;
    }
  } catch (e) {
    // body wasn't JSON
  }
  const error = new Error(`${fallback} (HTTP ${response.status}).`);
  error.status = response.status;
  return error;
};

export const exportFileName = (date = new Date()) => `math-whiz-data-${date.toISOString().slice(0, 10)}.json`;

/** Fetch the caller's data export and save it as a JSON file. */
export const downloadMyData = async ({ user, appId }) => {
  if (!user) throw new Error('You need to be signed in.');
  const token = await user.getIdToken();
  let response;
  try {
    response = await fetch(`${EXPORT_ENDPOINT}?appId=${encodeURIComponent(appId)}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch (e) {
    throw new Error('Could not reach the server. Check your connection and try again.');
  }
  if (!response.ok) throw await readError(response, 'Could not download your data');

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = exportFileName();
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

const REAUTH_MESSAGES = {
  'auth/wrong-password': 'That password isn’t right.',
  'auth/invalid-credential': 'That password isn’t right.',
  'auth/invalid-login-credentials': 'That password isn’t right.',
  'auth/too-many-requests': 'Too many attempts. Wait a few minutes and try again.',
  'auth/user-mismatch': 'Please sign in with the same Google account you use for Math Whiz.',
  'auth/network-request-failed': 'Could not reach the server. Check your connection and try again.',
};

/** Ask the user to prove it's them again (password or Google). */
export const reauthenticate = async ({ user, password }) => {
  const method = getReauthMethod(user);
  try {
    if (method === 'password') {
      if (!password) throw Object.assign(new Error('Enter your password to continue.'), { code: 'app/missing-password' });
      await reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email, password));
    } else if (method === 'google') {
      await reauthenticateWithPopup(user, createGoogleProvider());
    } else {
      throw Object.assign(new Error('This account can’t be verified here. Sign out, sign back in, and try again.'), { code: 'app/no-provider' });
    }
  } catch (error) {
    if (error?.code?.startsWith('app/')) throw error;
    const message = REAUTH_MESSAGES[error?.code]
      || (method === 'google' ? getGoogleAuthErrorMessage(error) : null)
      || 'We couldn’t confirm it’s you. Please try again.';
    const friendly = new Error(message);
    friendly.code = error?.code;
    throw friendly;
  }
};

/** Re-confirm identity, then permanently delete the account server-side. */
export const deleteMyAccount = async ({ user, appId, password, confirmText }) => {
  if (confirmText !== DELETE_CONFIRM_WORD) throw new Error(`Type ${DELETE_CONFIRM_WORD} to confirm.`);
  await reauthenticate({ user, password });
  const token = await user.getIdToken(true);
  let response;
  try {
    response = await fetch(DELETE_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ appId, confirm: confirmText }),
    });
  } catch (e) {
    throw new Error('Could not reach the server. Check your connection and try again.');
  }
  if (!response.ok) throw await readError(response, 'Your account could not be deleted');
  return response.json();
};
