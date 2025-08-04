// Browser Test Script for Gemini Proxy
// Copy and paste this into your browser console when your React app is running
// Make sure you're logged in first!

async function testGeminiProxyInBrowser() {
  console.log('🧪 Testing Gemini Proxy Security Features...');
  
  // Check if user is authenticated
  if (!window.firebase || !window.firebase.auth().currentUser) {
    console.error('❌ Please log in first!');
    return;
  }
  
  const user = window.firebase.auth().currentUser;
  console.log('✅ User authenticated:', user.uid);
  
  // Helper function to test the proxy
  async function testRequest(testName, topic, prompt, expectSuccess = false) {
    console.log(`\n🧪 ${testName}`);
    try {
      const token = await user.getIdToken();
      
      const response = await fetch('/.netlify/functions/gemini-proxy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          topic: topic,
          prompt: prompt
        })
      });
      
      const data = await response.json();
      
      console.log(`Status: ${response.status}`);
      console.log(`Response:`, data);
      
      if (expectSuccess && response.status === 200) {
        console.log('✅ PASS - Request succeeded as expected');
      } else if (!expectSuccess && response.status !== 200) {
        console.log('✅ PASS - Request failed as expected');
      } else {
        console.log('⚠️ Unexpected result');
      }
      
      return { status: response.status, data };
    } catch (error) {
      console.log('❌ Error:', error.message);
    }
  }
  
  // Test valid topics
  console.log('\n📚 Testing Valid Topics:');
  await testRequest('Multiplication Test', 'Multiplication', 'Create a story about groups of objects', true);
  
  // Test invalid topic
  console.log('\n❌ Testing Invalid Topic:');
  await testRequest('Invalid Topic Test', 'Science', 'Tell me about atoms', false);
  
  // Test rate limiting (same topic twice)
  console.log('\n🚫 Testing Rate Limiting:');
  await testRequest('Division Test #1', 'Division', 'Create a division story', true);
  await testRequest('Division Test #2 (should fail)', 'Division', 'Create another division story', false);
  
  // Test remaining topics
  console.log('\n✅ Testing Remaining Topics:');
  await testRequest('Fractions Test', 'Fractions', 'Create a fraction story', true);
  await testRequest('Measurement Test', 'Measurement & Data', 'Create an area problem', true);
  
  // Test 5th request (should fail due to daily limit)
  console.log('\n🚫 Testing Daily Limit (5th request):');
  await testRequest('5th Request (should fail)', 'Multiplication', 'Another multiplication story', false);
  
  console.log('\n✅ Browser tests completed!');
  console.log('Check your Firestore database to see dailyQueries tracking');
}

// Auto-run the test
testGeminiProxyInBrowser();
