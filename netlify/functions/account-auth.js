// Shared auth helpers for the self-service account functions.
const { admin } = require('./firebase-admin');

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

const json = (statusCode, body, extraHeaders = {}) => ({
  statusCode,
  headers: { ...CORS_HEADERS, 'Content-Type': 'application/json', ...extraHeaders },
  body: JSON.stringify(body),
});

/** Verify the caller's ID token. Returns the decoded token or a response. */
const authenticate = async (event) => {
  const authHeader = event.headers?.authorization || event.headers?.Authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { response: json(401, { error: 'You need to be signed in.' }) };
  }
  try {
    const decoded = await admin.auth().verifyIdToken(authHeader.slice('Bearer '.length));
    return { decoded };
  } catch (error) {
    return { response: json(401, { error: 'Your session has expired. Please sign in again.' }) };
  }
};

const resolveAppId = (event, body = {}) => (
  body.appId || event.queryStringParameters?.appId || process.env.APP_ID || 'default-app-id'
);

const isAnonymousToken = (decoded) => decoded?.firebase?.sign_in_provider === 'anonymous';

module.exports = { CORS_HEADERS, json, authenticate, resolveAppId, isAnonymousToken };
