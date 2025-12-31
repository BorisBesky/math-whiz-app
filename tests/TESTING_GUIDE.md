# Testing Guide for Math Whiz App

## Overview

This testing guide covers all types of tests available in the Math Whiz app, including unit tests, integration tests, security tests, and browser automation tests.

## Test Types

### 1. Jest Unit Tests (`npm test`)

- **App.test.js**: React component rendering tests
- **tests/EditQuestionModal.test.js**: Ensures `inputTypes` are auto-detected from `correctAnswer` for fill-in-the-blanks questions and are passed to `onSave` (prevents regressions)
- Uses Jest with React Testing Library
- Automatically run in CI/CD pipeline


### 5. Integration-style Jest Tests (mocked Firebase)

- These are Jest tests that mock Firebase modules (Auth/Firestore) to exercise higher-level flows without hitting real services.
- **QuestionReviewModal.integration.test.js**: Mocks `firebase/auth` and `firebase/firestore` and verifies the full save flow from the review modal to the teacher's question bank and class question subcollections; asserts `inputTypes` are computed and persisted when missing.
- Run these the same way as unit tests (examples below) — they rely on the mocked implementations included in the test file.

### 2. Node.js Backend Tests

- **test-gemini-proxy.js**: Authentication and API validation tests
- **test-firestore.js**: Database connection tests

### 3. Browser Console Tests

- **browser-test.js**: Interactive Gemini proxy security tests
- **comprehensive-test.js**: Complete security feature validation  
- **simple-browser-test.js**: Basic API functionality tests

### 4. Automated Browser Tests

- **explanation-modal-browser.js**: Playwright test for KaTeX rendering

## Quick Start

### 1. Run Unit Tests

```bash
npm test
```

These tests verify React component rendering and basic functionality.

### Run a single test file

```bash
# Run a single unit test (use CRA test runner which loads tests from /src proxies)
npm test -- -i src/components/__tests__/EditQuestionModal.proxy.test.js

# Run a single integration-style test (CRA proxy)
npm test -- -i src/components/__tests__/QuestionReviewModal.integration.proxy.test.js

# Or run tests directly from the /tests folder with Jest (may require additional Jest config if you run Jest directly)
# Run unit test directly
npx jest tests/EditQuestionModal.test.js -i --runInBand

# Run integration-style test directly
npx jest tests/QuestionReviewModal.integration.test.js -i --runInBand
```

Note: integration-style tests in the repo mock Firebase (Auth/Firestore) — they do not hit real Firestore accounts. If you run tests directly with `npx jest`, you may need to install or configure `babel-jest`/`@babel/preset-react` if you encounter JSX parsing errors.

### 2. Start Development Environment

```bash
netlify dev
```

This starts both your React app and Netlify functions locally.

### 3. Run Backend Security Tests

```bash
node src/tests/test-gemini-proxy.js
```

### 4. Run Browser Tests

1. Open your React app: `http://localhost:8888`
2. Log in as a user
3. Open browser console (F12)
4. Copy and paste the contents of `browser-test.js`

### 5. Run Automated Browser Tests

```bash
# Install Playwright if needed
npm install playwright

# Run the explanation modal test
node src/tests/explanation-modal-browser.js
```

## Detailed Test Descriptions

### Jest Unit Tests (App.test.js)

**Purpose**: Tests React component rendering and basic functionality

**How to run**:

```bash
npm test
```

**What it tests**:

- App component renders correctly
- Firebase authentication mock setup
- Basic component structure

**Setup Requirements**:

- `src/setupTests.js` must be present for jest-dom matchers
- Firebase auth and firestore are mocked

### Node.js Backend Tests (test-gemini-proxy.js)

**Purpose**: Tests Gemini API proxy authentication and security

**How to run**:

```bash
node src/tests/test-gemini-proxy.js
```

**What it tests**:

- Authentication without valid tokens
- Topic validation
- Request parameter validation
- Basic security features

**Requirements**:

- `.env.local` with Firebase credentials
- Netlify dev server running (`netlify dev`)

### Browser Console Tests

These are interactive tests you run in your browser console while the app is running.

#### simple-browser-test.js

**Purpose**: Basic API functionality test

**Usage**:

1. Open app at `http://localhost:8888`
2. Open browser console (F12)
3. Copy and paste the entire file contents

#### browser-test.js

**Purpose**: Comprehensive Gemini proxy security testing

**Features tested**:

- Full authentication flow
- Rate limiting validation
- Topic validation
- Error handling

#### comprehensive-test.js

**Purpose**: Complete security feature validation suite

**Features tested**:

- All security components working together
- End-to-end workflow validation
- Rate limiting across multiple topics

### Automated Browser Tests (explanation-modal-browser.js)

**Purpose**: Tests KaTeX math rendering in explanation modals

**Technology**: Playwright browser automation

**How to run**:

```bash
# Install Playwright first
npm install playwright

# Run the test
node src/tests/explanation-modal-browser.js
```

**What it tests**:

- Modal opening functionality
- KaTeX mathematical notation rendering
- UI interaction workflows

### Database Tests (test-firestore.js)

**Purpose**: Direct Firestore database connection testing

**Note**: Requires service account key file (not recommended for production)

## Test Categories by Functionality

### 🔐 Authentication Tests

**What it tests**: Only authenticated users can access the API

**Expected Results**:

- ❌ No auth header → 401 Unauthorized
- ❌ Invalid token → 401 Unauthorized  
- ❌ Malformed header → 401 Unauthorized
- ✅ Valid Firebase ID token → Proceed to next validation

### 📚 Topic Validation Tests

**What it tests**: Only valid math topics are accepted

**Valid Topics**:

- `'Multiplication'`
- `'Division'`
- `'Fractions'`
- `'Measurement & Data'`

**Expected Results**:

- ❌ Invalid topic (e.g., 'Science', 'History') → 400 Bad Request
- ❌ Missing topic → 400 Bad Request
- ✅ Valid topic → Proceed to rate limiting check

### 🚫 Rate Limiting Tests

**What it tests**: Users can only make 4 queries per day (1 per topic)

**Expected Results**:

- ✅ First request per topic → 200 Success
- ❌ Second request same topic → 429 Rate Limited
- ✅ Different topics (up to 4 total) → 200 Success
- ❌ 5th request any topic → 429 Rate Limited

### 🛡️ Content Safety Tests

**What it tests**: AI responses are appropriate and math-focused

**Expected Results**:

- Off-topic prompts are redirected to math content
- Inappropriate content is filtered out
- Responses are suitable for 3rd graders

### 🧪 UI Component Tests

**What it tests**: React components render and function correctly

**Expected Results**:

- Components render without errors
- Props are handled correctly
- User interactions work as expected

## Checking Test Results

### In Browser Console

Look for these status codes:

- `200` - Success ✅
- `400` - Bad Request (invalid topic/missing params) ❌
- `401` - Unauthorized (auth failed) ❌  
- `429` - Rate Limited ❌

### In Jest Output

Look for:

- ✅ Passing tests
- ❌ Failed assertions
- Code coverage reports

### In Firestore Database

Navigate to: `artifacts/default-app-id/users/{userId}/math_whiz_data/profile`

Look for:

```json
{
  "dailyQueries": {
    "2025-09-11": {
      "Multiplication": true,
      "Division": true,
      "Fractions": true,
      "Measurement & Data": true
    }
  }
}
```

### In Netlify Function Logs

1. Go to Netlify dashboard (when deployed)
2. Navigate to Functions tab
3. Click on `gemini-proxy`
4. Check logs for errors

## Troubleshooting

### Jest Tests Failing

**"Cannot find module" errors**:

```bash
# Ensure all dependencies are installed
npm install

# Check for proper import paths
```

**"toBeInTheDocument is not a function"**:

- Ensure `src/setupTests.js` exists and imports `@testing-library/jest-dom`

### "Netlify dev server is not running"

```bash
# Install Netlify CLI if needed
npm install -g netlify-cli

# Start dev server
netlify dev
```

### "Firebase Admin SDK initialization failed"

Check your `.env.local` file has:

- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`

### "User not authenticated" in browser tests

1. Make sure you're logged in to the React app
2. Wait for authentication to complete
3. Check `firebase.auth().currentUser` is not null

### Rate limiting not working

1. Check Firestore rules allow writing to user documents
2. Verify user document exists in Firestore
3. Check browser network tab for 429 responses

### Playwright Tests Failing

```bash
# Install Playwright browsers
npx playwright install
```

## Expected Test Results Summary

### Jest Unit Tests

```text
✅ App.test.js: renders learn react link
✅ All tests passing: 1 passed, 1 total
```

### Node.js Backend Tests

```text
✅ Test 1.1: No Authentication Header → 401
✅ Test 1.2: Invalid Token → 401  
✅ Test 2.1: Missing Topic → 400
✅ Test 2.2: Invalid Topic → 400
✅ Test 2.3-2.6: Valid Topics → 401 (no real ID token)
```

### Interactive Browser Console Tests

```text
✅ Multiplication Test → 200 (Success)
❌ Invalid Topic Test → 400 (Rejected)
✅ Division Test #1 → 200 (Success) 
❌ Division Test #2 → 429 (Rate Limited)
✅ Fractions Test → 200 (Success)
✅ Measurement Test → 200 (Success)
❌ 5th Request → 429 (Daily limit exceeded)
```

### Playwright Tests

```text
✅ Modal opens successfully
✅ KaTeX content renders properly
✅ Mathematical notation displays correctly
```

## Next Steps

Once all tests pass:

1. Deploy to Netlify
2. Set environment variables in Netlify dashboard
3. Test with production deployment
4. Monitor usage and adjust rate limits if needed
5. Set up automated testing in CI/CD pipeline

## Continuous Integration

### GitHub Actions Setup

We include a workflow that runs on `push` and `pull_request` which executes both the CRA proxy tests (so the standard `npm test` runner can pick up proxy test files) and direct Jest tests located in the `tests/` directory.

Workflow file: **`.github/workflows/run-tests.yml`**

What it runs:
- CRA proxy tests using `npm test` (examples below run the specific proxy files)
- Direct Jest runs for tests in `tests/` (via `npx jest`)

Example workflow steps (already committed to the repository):

```bash
# CRA proxy tests (run via CRA's test runner)
npm test -- -i src/components/__tests__/EditQuestionModal.proxy.test.js
npm test -- -i src/components/__tests__/QuestionReviewModal.integration.proxy.test.js

# direct Jest runs (optional additional checks)
npx jest tests/EditQuestionModal.test.js tests/QuestionReviewModal.integration.test.js --runInBand
```

Notes:
- The direct Jest runs may require `babel-jest` / `@babel/preset-react` if you run tests that include JSX or import component files directly. We include proxy tests so that the CRA/Jest runner can execute tests that depend on the CRA/Babel configuration.
- The workflow is at `.github/workflows/run-tests.yml` and runs on Node.js 18 with npm cache enabled.

### Test Coverage

Monitor test coverage with:

```bash
npm test -- --coverage --watchAll=false
```

Aim for >80% coverage on critical components.

## Complete Test File Reference

### Current Test Files in `src/tests/`

- **App.test.js** - Jest unit test for React App component
- **browser-test.js** - Interactive browser console test for Gemini proxy
- **comprehensive-test.js** - Complete security validation suite  
- **explanation-modal-browser.js** - Playwright test for KaTeX rendering
- **simple-browser-test.js** - Basic API functionality test
- **test-firestore.js** - Direct Firestore database connection test
- **test-gemini-proxy.js** - Node.js backend security and validation tests
- **setupTests.js** - Jest configuration (copied to `src/setupTests.js`)

### Additional Files

- **FIREBASE_PRIVATE_KEY_FIX.md** - Documentation for Firebase key setup
- **TESTING_GUIDE.md** - This file
- **story.txt** - Test story content

### Required Setup Files

- **src/setupTests.js** - Jest configuration for testing library
- **.env.local** - Environment variables for Firebase
- **netlify.toml** - Netlify configuration

This testing suite provides comprehensive coverage of the Math Whiz app's functionality, from unit tests to end-to-end security validation.
