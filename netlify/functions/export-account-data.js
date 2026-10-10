// GET /.netlify/functions/export-account-data?appId=...
// Returns a JSON file with everything stored about the signed-in user.
// Only ever exports the caller's own data (uid comes from the verified token).
const { admin, db, storage } = require('./firebase-admin');
const { CORS_HEADERS, json, authenticate, resolveAppId } = require('./account-auth');
const { collectAccountData } = require('./account-data');

// Netlify synchronous functions can return at most 6 MB (buffered).
const MAX_EXPORT_BYTES = Math.floor(5.5 * 1024 * 1024);

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: CORS_HEADERS, body: '' };
  if (event.httpMethod !== 'GET' && event.httpMethod !== 'POST') {
    return json(405, { error: 'Method Not Allowed' });
  }

  const { decoded, response } = await authenticate(event);
  if (response) return response;

  let body = {};
  try {
    body = event.body ? JSON.parse(event.body) : {};
  } catch (e) {
    body = {};
  }
  const appId = resolveAppId(event, body);
  const uid = decoded.uid;

  try {
    let authUser = null;
    try {
      authUser = await admin.auth().getUser(uid);
    } catch (e) {
      authUser = null;
    }
    let bucket = null;
    try {
      bucket = storage.bucket();
    } catch (e) {
      bucket = null;
    }

    const data = await collectAccountData({ db, appId, uid, bucket, authUser });
    const payload = JSON.stringify(data, null, 2);
    if (Buffer.byteLength(payload) > MAX_EXPORT_BYTES) {
      return json(413, {
        error: 'Your data is too large to download in one file. Please contact support and we will send it to you.',
      });
    }
    const date = new Date().toISOString().slice(0, 10);
    return {
      statusCode: 200,
      headers: {
        ...CORS_HEADERS,
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': `attachment; filename="math-whiz-data-${date}.json"`,
        'Cache-Control': 'no-store',
      },
      body: payload,
    };
  } catch (error) {
    console.error('[export-account-data] failed', { uid, message: error.message });
    return json(500, { error: 'We could not prepare your data. Please try again.' });
  }
};
