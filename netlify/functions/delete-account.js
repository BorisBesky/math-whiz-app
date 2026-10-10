// POST /.netlify/functions/delete-account  { appId, confirm: "DELETE" }
// Permanently deletes the signed-in user's account and data.
//   - Requires a recent sign-in (ID token auth_time within RECENT_LOGIN_SECONDS);
//     the client reauthenticates first.
//   - Admin accounts and anonymous guests can't use it.
//   - Retry-safe: every step skips data that's already gone, and the Firebase
//     Auth user is deleted last so a failed run can simply be repeated.
const { admin, db, storage } = require('./firebase-admin');
const { CORS_HEADERS, json, authenticate, resolveAppId, isAnonymousToken } = require('./account-auth');
const { deleteAccountData } = require('./account-data');

const RECENT_LOGIN_SECONDS = 10 * 60;
const CONFIRM_WORD = 'DELETE';

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: CORS_HEADERS, body: '' };
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method Not Allowed' });

  const { decoded, response } = await authenticate(event);
  if (response) return response;

  let body;
  try {
    body = event.body ? JSON.parse(event.body) : {};
  } catch (e) {
    return json(400, { error: 'Invalid request.' });
  }
  if (body.confirm !== CONFIRM_WORD) {
    return json(400, { error: `Type ${CONFIRM_WORD} to confirm.` });
  }

  const uid = decoded.uid;
  const appId = resolveAppId(event, body);

  if (isAnonymousToken(decoded)) {
    return json(400, { error: 'Guest sessions have no account to delete.' });
  }
  if (decoded.admin === true) {
    return json(403, { error: 'Administrator accounts can’t be deleted here. Ask another administrator to remove your admin access first.' });
  }
  const nowSeconds = Math.floor(Date.now() / 1000);
  if (!decoded.auth_time || nowSeconds - decoded.auth_time > RECENT_LOGIN_SECONDS) {
    return json(401, { error: 'Please confirm your identity again before deleting your account.', code: 'requires-recent-login' });
  }

  try {
    const profileSnap = await db.collection('artifacts').doc(appId)
      .collection('users').doc(uid).collection('math_whiz_data').doc('profile').get();
    const role = profileSnap.exists ? (profileSnap.data() || {}).role || null : null;
    if (role === 'admin') {
      return json(403, { error: 'Administrator accounts can’t be deleted here.' });
    }

    let bucket = null;
    try {
      bucket = storage.bucket();
    } catch (e) {
      bucket = null;
    }

    const summary = await deleteAccountData({ db, admin, appId, uid, bucket });

    try {
      await admin.auth().deleteUser(uid);
    } catch (error) {
      if (error?.code !== 'auth/user-not-found') throw error;
    }

    // Minimal audit trail in function logs: uid, role and counts only.
    console.log('[delete-account] account deleted', { uid, role, appId, ...summary });
    return json(200, { success: true, summary });
  } catch (error) {
    console.error('[delete-account] failed; safe to retry', { uid, message: error.message });
    return json(500, { error: 'Your account could not be fully deleted. Please try again.' });
  }
};
