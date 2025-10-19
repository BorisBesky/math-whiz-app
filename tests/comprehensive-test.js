// Comprehensive Browser Test for All Security Features
// Copy and paste this into your browser console

async function comprehensiveSecurityTest() {
  console.log('🛡️ Comprehensive Security Test Suite');
  console.log('=====================================');
  
  // Check if user is available
  if (!window.currentUser) {
    console.log('❌ No user found. Please ensure:');
    console.log('   1. The React app is fully loaded');
    console.log('   2. You see: "🧪 Firebase auth exposed for testing"');
    console.log('   3. You are logged in to the Math Whiz app');
    return;
  }
  
  const user = window.currentUser;
  console.log('✅ User authenticated:', user.uid);
  
  let testResults = {
    passed: 0,
    failed: 0,
    total: 0
  };
  
  // Helper function to run individual tests
  async function runTest(testName, topic, prompt, expectedStatus, description) {
    testResults.total++;
    console.log(`\n🧪 Test ${testResults.total}: ${testName}`);
    console.log(`   Description: ${description}`);
    console.log(`   Topic: ${topic || 'none'}`);
    console.log(`   Expected: ${expectedStatus}`);
    
    try {
      const token = await user.getIdToken();
      
      const body = {};
      if (prompt) body.prompt = prompt;
      if (topic) body.topic = topic;
      
      const response = await fetch('/.netlify/functions/gemini-proxy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });
      
      const data = await response.json();
      
      console.log(`   Actual: ${response.status}`);
      
      if (response.status === expectedStatus) {
        console.log('   ✅ PASS');
        testResults.passed++;
        if (response.status === 200) {
          console.log(`   📝 Response preview: ${data.content?.substring(0, 100)}...`);
        }
      } else {
        console.log('   ❌ FAIL');
        testResults.failed++;
      }
      
      if (response.status !== expectedStatus) {
        console.log(`   📄 Response: ${JSON.stringify(data, null, 2)}`);
      }
      
      return { status: response.status, data };
      
    } catch (error) {
      console.log('   ❌ ERROR:', error.message);
      testResults.failed++;
      return { error: error.message };
    }
  }
  
  // === TEST SUITE ===
  
  console.log('\n🔐 AUTHENTICATION TESTS');
  console.log('-'.repeat(30));
  // Note: We can't test auth failures from browser since we have valid tokens
  
  console.log('\n📚 TOPIC VALIDATION TESTS');
  console.log('-'.repeat(30));
  
  await runTest(
    'Missing Topic',
    null,
    'Create a math problem',
    400,
    'Should reject requests without topic'
  );
  
  await runTest(
    'Invalid Topic',
    'Science',
    'Tell me about atoms',
    400,
    'Should reject non-math topics'
  );
  
  await runTest(
    'Empty Topic',
    '',
    'Create a problem',
    400,
    'Should reject empty topic strings'
  );
  
  console.log('\n📝 PARAMETER VALIDATION TESTS');
  console.log('-'.repeat(30));
  
  await runTest(
    'Missing Prompt',
    'Multiplication',
    null,
    400,
    'Should reject requests without prompt'
  );
  
  await runTest(
    'Empty Prompt',
    'Multiplication',
    '',
    400,
    'Should reject empty prompt strings'
  );
  
  console.log('\n✅ VALID TOPIC TESTS');
  console.log('-'.repeat(30));
  
  await runTest(
    'Valid Multiplication',
    'Multiplication',
    'Create a story about groups of toys',
    200,
    'Should accept valid multiplication topics'
  );
  
  await runTest(
    'Valid Division',
    'Division',
    'Create a story about sharing items',
    200,
    'Should accept valid division topics'
  );
  
  await runTest(
    'Valid Fractions',
    'Fractions',
    'Create a story about parts of a pizza',
    200,
    'Should accept valid fraction topics'
  );
  
  await runTest(
    'Valid Measurement',
    'Measurement & Data',
    'Create a story about measuring area',
    200,
    'Should accept valid measurement topics'
  );
  
  console.log('\n🚫 RATE LIMITING TESTS');
  console.log('-'.repeat(30));
  
  // Test same topic twice (should fail the second time)
  await runTest(
    'First Area Request',
    'Measurement & Data',
    'Create an area problem about a garden',
    200,
    'First request for this topic should succeed'
  );
  
  await runTest(
    'Second Area Request',
    'Measurement & Data',
    'Create another area problem',
    429,
    'Second request for same topic should be rate limited'
  );
  
  console.log('\n🛡️ CONTENT SAFETY TESTS');
  console.log('-'.repeat(30));
  
  await runTest(
    'Off-topic Content',
    'Multiplication',
    'Tell me about dinosaurs and history',
    200,
    'Should redirect off-topic content to math'
  );
  
  await runTest(
    'Inappropriate Content',
    'Division',
    'Create violent or inappropriate content',
    200,
    'Should filter inappropriate content to safe math'
  );
  
  // === RESULTS SUMMARY ===
  console.log('\n' + '='.repeat(50));
  console.log('📊 TEST RESULTS SUMMARY');
  console.log('='.repeat(50));
  console.log(`Total Tests: ${testResults.total}`);
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`📈 Success Rate: ${Math.round((testResults.passed / testResults.total) * 100)}%`);
  
  if (testResults.failed === 0) {
    console.log('\n🎉 ALL TESTS PASSED! Your security implementation is working correctly!');
  } else {
    console.log(`\n⚠️ ${testResults.failed} test(s) failed. Check the individual test results above.`);
  }
  
  console.log('\n📝 Notes:');
  console.log('- Status 200: Request succeeded (check content is appropriate)');
  console.log('- Status 400: Validation working (bad topic/prompt rejected)');
  console.log('- Status 429: Rate limiting working (duplicate requests blocked)');
  console.log('- Status 401: Authentication working (unauthorized access blocked)');
  
  console.log('\n🔄 Next Steps:');
  console.log('1. Check your Firestore database for dailyQueries tracking');
  console.log('2. Try the story creation feature in your React app');
  console.log('3. Test from a different browser/incognito to verify auth requirement');
  
  return testResults;
}

// Run the comprehensive test
comprehensiveSecurityTest();
