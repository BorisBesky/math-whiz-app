// POST /.netlify/functions/merge-guest-account
// Authorization: Bearer <ID token of the existing account the user just signed into>
// Body: { appId, guestIdToken }  (ID token of the guest session, captured before switching)
//
// Moves the guest's progress into the existing student account, then deletes
// the guest. Both tokens must be valid; the guest token must be anonymous; the
// account token must be a recent, non-anonymous sign-in of a student account.
const { admin, db, storage } = require('./firebase-admin');
const { CORS_HEADERS, json, authenticate, resolveAppId, isAnonymousToken } = require('./account-auth');
const { mergeGuestIntoAccount } = require('./guest-merge');

const RECENT_LOGIN_SECONDS = 10 * 60;

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: CORS_HEADERS, body: '' };
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method Not Allowed' });

  const { decoded: target, response } = await authenticate(event);
  if (response) return response;

  let body;
  try {
    body = event.body ? JSON.parse(event.body) : {};
  } catch (e) {
    return json(400, { error: 'Invalid request.' });
  }
  if (!body.guestIdToken) return json(400, { error: 'Missing guest session.' });

  let guest;
  try {
    guest = await admin.auth().verifyIdToken(body.guestIdToken);
  } catch (e) {
    return json(401, { error: 'Your guest session has expired, so its progress can’t be moved.' });
  }

  if (!isAnonymousToken(guest)) return json(400, { error: 'Only guest progress can be moved.' });
  if (isAnonymousToken(target)) return json(400, { error: 'Sign in to your account first.' });
  if (guest.uid === target.uid) return json(400, { error: 'This guest session is already your account.' });
  if (target.admin === true || target.role === 'teacher') {
    return json(403, { error: 'Guest progress can only be moved into a student account.' });
  }
  const nowSeconds = Math.floor(Date.now() / 1000);
  if (!target.auth_time || nowSeconds - target.auth_time > RECENT_LOGIN_SECONDS) {
    return json(401, { error: 'Please sign in again to move your guest progress.', code: 'requires-recent-login' });
  }

  const appId = resolveAppId(event, body);
  try {
    const profileSnap = await db.collection('artifacts').doc(appId).collection('users').doc(target.uid)
      .collection('math_whiz_data').doc('profile').get();
    const role = profileSnap.exists ? (profileSnap.data() || {}).role : null;
    if (role && role !== 'student') {
      return json(403, { error: 'Guest progress can only be moved into a student account.' });
    }

    let bucket = null;
    try {
      bucket = storage.bucket();
    } catch (e) {
      bucket = null;
    }

    const summary = await mergeGuestIntoAccount({
      db, admin, appId, guestUid: guest.uid, targetUid: target.uid, bucket,
    });
    console.log('[merge-guest-account] merged', { guestUid: guest.uid, targetUid: target.uid, ...summary });
    return json(200, { success: true, summary });
  } catch (error) {
    console.error('[merge-guest-account] failed; safe to retry', { guestUid: guest.uid, targetUid: target.uid, message: error.message });
    return json(500, { error: 'We couldn’t finish moving your guest progress. Please try again.' });
  }
};
