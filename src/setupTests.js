// Load environment variables for all tests
import dotenv from 'dotenv';

// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

dotenv.config({ path: '.env.local' });

// Unit tests import Firebase-backed modules, and the SDK throws
// `auth/invalid-api-key` at import time when the config is empty — so on a
// bare checkout (no .env.local) whole suites failed to run even though they
// never touch a network. CI worked only because the workflow injects these
// same demo values. Default them here so `npm test` behaves identically
// locally and in CI. Real values in .env.local still win.
const FIREBASE_TEST_DEFAULTS = {
  REACT_APP_FIREBASE_API_KEY: 'demo-api-key',
  REACT_APP_FIREBASE_AUTH_DOMAIN: 'demo-mathwhiz.firebaseapp.com',
  REACT_APP_FIREBASE_PROJECT_ID: 'demo-mathwhiz',
  REACT_APP_FIREBASE_STORAGE_BUCKET: 'demo-mathwhiz.appspot.com',
  REACT_APP_FIREBASE_MESSAGING_SENDER_ID: '1234567890',
  REACT_APP_FIREBASE_APP_ID: '1:1234567890:web:abcdef1234567890',
};

for (const [key, value] of Object.entries(FIREBASE_TEST_DEFAULTS)) {
  if (!process.env[key]) process.env[key] = value;
}
