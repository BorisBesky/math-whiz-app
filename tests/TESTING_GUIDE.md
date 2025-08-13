# Testing Guide for Gemini Proxy Security Features

## Quick Start

### 1. Start Netlify Dev Server
```bash
# In your project directory
netlify dev
```
This starts both your React app and Netlify functions locally.

### 2. Run Authentication & Validation Tests
```bash
# Run the Node.js test script
node test-gemini-proxy.js
```

### 3. Test Rate Limiting Through Browser
1. Open your React app: `http://localhost:8888`
2. Log in as a user
3. Open browser console (F12)
4. Copy and paste the contents of `browser-test.js`

## Test Categories

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

## Detailed Test Instructions

### Test 1: Node.js Script (Authentication & Validation)

```bash
# Make sure Netlify dev is running first
netlify dev

# In another terminal, run:
node test-gemini-proxy.js
```

**This tests**:
- ✅ Authentication without valid Firebase tokens
- ✅ Topic validation with invalid topics
- ✅ Parameter validation (missing prompt/topic)
- ✅ Basic request format

**Limitations**: Can't test rate limiting since it requires real Firebase ID tokens

### Test 2: Browser Console (Full Integration)

1. **Start your app**: `netlify dev`
2. **Open browser**: Go to `http://localhost:8888`
3. **Log in**: Complete Firebase authentication
4. **Open console**: Press F12, go to Console tab
5. **Run test**: Copy/paste contents of `browser-test.js`

**This tests**:
- ✅ End-to-end authentication flow
- ✅ Rate limiting with real user tokens
- ✅ Firestore data persistence
- ✅ All security features working together

### Test 3: Manual React App Testing

1. **Log in** to your React app
2. **Complete a quiz** in each topic
3. **Try creating story problems**:
   - First story per topic should work
   - Second story same topic should fail
   - After 4 stories total, all should fail
4. **Check browser network tab** for HTTP status codes
5. **Check Firestore** for `dailyQueries` tracking

## Checking Results

### In Browser Console
Look for these status codes:
- `200` - Success ✅
- `400` - Bad Request (invalid topic/missing params) ❌
- `401` - Unauthorized (auth failed) ❌  
- `429` - Rate Limited ❌

### In Firestore Database
Navigate to: `artifacts/default-app-id/users/{userId}/math_whiz_data/profile`

Look for:
```json
{
  "dailyQueries": {
    "2025-08-03": {
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

## Expected Test Results Summary

### Node.js Script Results:
```
✅ Test 1.1: No Authentication Header → 401
✅ Test 1.2: Invalid Token → 401  
✅ Test 2.1: Missing Topic → 400
✅ Test 2.2: Invalid Topic → 400
✅ Test 2.3-2.6: Valid Topics → 401 (because no real ID token)
```

### Browser Console Results:
```
✅ Multiplication Test → 200 (Success)
❌ Invalid Topic Test → 400 (Rejected)
✅ Division Test #1 → 200 (Success) 
❌ Division Test #2 → 429 (Rate Limited)
✅ Fractions Test → 200 (Success)
✅ Measurement Test → 200 (Success)
❌ 5th Request → 429 (Daily limit exceeded)
```

## Next Steps

Once all tests pass:
1. Deploy to Netlify
2. Set environment variables in Netlify dashboard
3. Test with production deployment
4. Monitor usage and adjust rate limits if needed
