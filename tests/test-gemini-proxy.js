#!/usr/bin/env node

// Test script for Gemini Proxy authentication, rate limiting, and topic validation
// Run with: node test-gemini-proxy.js

require('dotenv').config({ path: '.env.local' });
const admin = require('firebase-admin');
const fetch = require('node-fetch');

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  try {
    console.log('🔧 Initializing Firebase Admin SDK...');
    if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PRIVATE_KEY) {
      throw new Error('Missing Firebase environment variables');
    }
    
    // Ensure private key is base64 encoded or properly formatted
    if (process.env.FIREBASE_PRIVATE_KEY && !process.env.FIREBASE_PRIVATE_KEY.includes('-----BEGIN PRIVATE KEY-----')) {
      console.log('🔄 Detected base64 encoded private key, decoding...');
      process.env.FIREBASE_PRIVATE_KEY = Buffer.from(process.env.FIREBASE_PRIVATE_KEY, 'base64').toString('utf8');
    }

    // Handle escaped newlines in private key
    if (process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_PRIVATE_KEY.includes('\\n')) {
      console.log('🔄 Replacing escaped newlines in private key...');
      process.env.FIREBASE_PRIVATE_KEY = process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');
    }

    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
    console.log('✅ Firebase Admin SDK initialized');
  } catch (error) {
    console.error('❌ Failed to initialize Firebase Admin SDK:', error.message);
    process.exit(1);
  }
}

// Configuration
const LOCAL_FUNCTION_URL = 'http://localhost:8888/.netlify/functions/gemini-proxy';
const TEST_USER_ID = 'test-user-' + Date.now();

// Test helper function
async function testGeminiProxy(testName, authToken, topic, prompt, expectedStatus) {
  console.log(`\n🧪 ${testName}`);
  console.log(`   Topic: ${topic || 'none'}`);
  console.log(`   Prompt: ${prompt || 'none'}`);
  console.log(`   Expected Status: ${expectedStatus}`);
  
  try {
    const headers = {
      'Content-Type': 'application/json'
    };
    
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }
    
    const body = {};
    if (prompt) body.prompt = prompt;
    if (topic) body.topic = topic;
    
    const response = await fetch(LOCAL_FUNCTION_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    });

    const data = await response.json();
    
    console.log(`   ✓ Status: ${response.status}`);
    console.log(`   ✓ Response: ${JSON.stringify(data, null, 2)}`);
    
    if (expectedStatus && response.status === expectedStatus) {
      console.log(`   ✅ PASS - Got expected status ${expectedStatus}`);
    } else if (expectedStatus) {
      console.log(`   ❌ FAIL - Expected ${expectedStatus}, got ${response.status}`);
    }
    
    return { status: response.status, data };
  } catch (error) {
    console.log(`   ❌ ERROR: ${error.message}`);
    return { error: error.message };
  }
}

// Create test authentication tokens
async function createTestTokens() {
  console.log('\n🎫 Creating test authentication tokens...');
  
  try {
    // Create a custom token for our test user
    const customToken = await admin.auth().createCustomToken(TEST_USER_ID, {
      testUser: true
    });
    console.log('✅ Custom token created for test user:', TEST_USER_ID);
    
    // Note: In a real scenario, the client would exchange this custom token
    // for an ID token. For testing, we'll use the custom token directly
    // but Firebase expects ID tokens, so this will help test invalid token scenarios
    
    return {
      validToken: customToken, // This will actually be invalid for ID token verification
      invalidToken: 'invalid-token-123'
    };
  } catch (error) {
    console.error('❌ Error creating test tokens:', error.message);
    return { validToken: null, invalidToken: 'invalid-token-123' };
  }
}

// Main test suite
async function runTests() {
  console.log('🚀 Starting Gemini Proxy Security Tests');
  console.log('=' .repeat(50));
  
  // Check if Netlify dev is running
  try {
    const healthCheck = await fetch('http://localhost:8888');
    console.log('✅ Netlify dev server is running');
  } catch (error) {
    console.error('❌ Netlify dev server is not running!');
    console.error('   Please run: netlify dev');
    process.exit(1);
  }
  
  const { validToken, invalidToken } = await createTestTokens();
  
  console.log('\n📋 Test Plan:');
  console.log('1. Authentication Tests');
  console.log('2. Topic Validation Tests');
  console.log('3. Rate Limiting Tests');
  console.log('4. Content Safety Tests');
  
  // ===== AUTHENTICATION TESTS =====
  console.log('\n' + '='.repeat(30));
  console.log('🔐 AUTHENTICATION TESTS');
  console.log('='.repeat(30));
  
  await testGeminiProxy(
    'Test 1.1: No Authentication Header',
    null, // no token
    'Multiplication',
    'Create a multiplication problem',
    401
  );
  
  await testGeminiProxy(
    'Test 1.2: Invalid Authentication Token',
    invalidToken,
    'Multiplication', 
    'Create a multiplication problem',
    401
  );
  
  await testGeminiProxy(
    'Test 1.3: Malformed Authorization Header',
    'not-bearer-format',
    'Multiplication',
    'Create a multiplication problem', 
    401
  );
  
  // ===== TOPIC VALIDATION TESTS =====
  console.log('\n' + '='.repeat(30));
  console.log('📚 TOPIC VALIDATION TESTS');
  console.log('='.repeat(30));
  
  await testGeminiProxy(
    'Test 2.1: Missing Topic',
    validToken,
    null, // no topic
    'Create a math problem',
    400
  );
  
  await testGeminiProxy(
    'Test 2.2: Invalid Topic',
    validToken,
    'History', // invalid topic
    'Create a history lesson',
    400
  );
  
  await testGeminiProxy(
    'Test 2.3: Valid Topic - Multiplication',
    validToken,
    'Multiplication',
    'Create a multiplication story problem',
    200 // This might still fail due to auth, but tests topic validation
  );
  
  await testGeminiProxy(
    'Test 2.4: Valid Topic - Division',
    validToken,
    'Division',
    'Create a division story problem',
    200
  );
  
  await testGeminiProxy(
    'Test 2.5: Valid Topic - Fractions',
    validToken,
    'Fractions', 
    'Create a fractions story problem',
    200
  );
  
  await testGeminiProxy(
    'Test 2.6: Valid Topic - Measurement & Data',
    validToken,
    'Measurement & Data',
    'Create an area story problem',
    200
  );
  
  // ===== PARAMETER VALIDATION TESTS =====
  console.log('\n' + '='.repeat(30));
  console.log('📝 PARAMETER VALIDATION TESTS');
  console.log('='.repeat(30));
  
  await testGeminiProxy(
    'Test 3.1: Missing Prompt',
    validToken,
    'Multiplication',
    null, // no prompt
    400
  );
  
  await testGeminiProxy(
    'Test 3.2: Empty Prompt',
    validToken,
    'Multiplication',
    '', // empty prompt
    400
  );
  
  // ===== CONTENT SAFETY TESTS =====
  console.log('\n' + '='.repeat(30));
  console.log('🛡️ CONTENT SAFETY TESTS');
  console.log('='.repeat(30));
  
  await testGeminiProxy(
    'Test 4.1: Off-topic Prompt (should be redirected to math)',
    validToken,
    'Multiplication',
    'Tell me about dinosaurs and ancient history',
    200 // Should work but return math content
  );
  
  await testGeminiProxy(
    'Test 4.2: Inappropriate Content (should be filtered)',
    validToken,
    'Division',
    'Create violent content',
    200 // Should work but return appropriate math content
  );
  
  // ===== SUMMARY =====
  console.log('\n' + '='.repeat(50));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(50));
  console.log('✅ Tests completed!');
  console.log('\n📝 Notes:');
  console.log('- Status 401: Authentication working correctly');
  console.log('- Status 400: Validation working correctly'); 
  console.log('- Status 200: Request format accepted (check response content)');
  console.log('- For rate limiting tests, you\'ll need to use the React app');
  console.log('  since it requires actual Firebase ID tokens');
  
  console.log('\n🔄 Next Steps:');
  console.log('1. Start your React app: npm start');
  console.log('2. Log in as a user');
  console.log('3. Try creating story problems to test rate limiting');
  console.log('4. Check Firestore for dailyQueries tracking');
}

// Handle uncaught errors
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Run the tests
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { testGeminiProxy, createTestTokens };
