// Browser Test Script for Gemini Proxy (Updated for Firebase v9+ modular SDK)
// Copy and paste this into your browser console when your React app is running
// Make sure you're logged in first!

async function testGeminiProxyInBrowser() {
  console.log('🧪 Testing Gemini Proxy Security Features...');
  
  // Check if React app has exposed auth in a way we can access
  // Since your app uses modular Firebase, we need to check differently
  
  let currentUser = null;
  
  // Try different ways to access the current user
  if (window.React && window.React.version) {
    console.log('✅ React app detected');
    
    // Method 1: Check if auth is exposed globally (you may need to expose this)
    if (window.firebaseAuth && window.firebaseAuth.currentUser) {
      currentUser = window.firebaseAuth.currentUser;
      console.log('✅ Found user via window.firebaseAuth');
    }
    // Method 2: Try to find auth in React DevTools context
    else {
      console.log('❌ Firebase auth not exposed globally');
      console.log('📝 To test properly, we need to expose the auth object');
      console.log('📝 Add this to your React app temporarily for testing:');
      console.log('   window.firebaseAuth = auth;');
      console.log('   window.currentUser = user;');
      return;
    }
  } else {
    console.log('❌ React app not detected or still loading');
    return;
  }
  
  if (!currentUser) {
    console.error('❌ No authenticated user found!');
    console.log('📝 Make sure you are logged in to the Math Whiz app');
    console.log('📝 The app should automatically sign you in anonymously');
    return;
  }
  
  console.log('✅ User authenticated:', currentUser.uid);
  
  // Helper function to test the proxy
  async function testRequest(testName, topic, prompt, expectSuccess = false) {
    console.log(`\n🧪 ${testName}`);
    try {
      const token = await currentUser.getIdToken();
      
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

// Enhanced version that tries to detect the user from React context
async function enhancedTestWithAutoDetection() {
  console.log('🔍 Attempting to auto-detect Firebase auth...');
  
  // Try to find React components with auth state
  const reactRoot = document.querySelector('#root');
  if (reactRoot && reactRoot._reactInternalFiber) {
    console.log('🔍 Scanning React component tree for auth state...');
    // This would require more complex React DevTools-like inspection
  }
  
  // Simple fallback - look for common auth indicators
  const authElements = document.querySelectorAll('[data-testid*="auth"], [class*="auth"], [id*="auth"]');
  console.log(`🔍 Found ${authElements.length} potential auth-related elements`);
  
  // Check if user data is visible in the UI
  const userDataElements = document.querySelectorAll('[class*="coin"], [class*="user"], [data-user]');
  if (userDataElements.length > 0) {
    console.log('✅ User interface elements detected - user is likely logged in');
  }
  
  // Run the main test
  await testGeminiProxyInBrowser();
}

// Simple direct test without auth detection
async function directAPITest() {
  console.log('🧪 Direct API Test (you need to provide a token)');
  console.log('📝 To get a token, run this in console after logging in:');
  console.log('   // In your React app, temporarily add:');
  console.log('   // console.log("Token:", await user.getIdToken());');
  
  const token = prompt('Paste your Firebase ID token here (or cancel to skip):');
  if (!token) {
    console.log('❌ No token provided, skipping direct test');
    return;
  }
  
  try {
    const response = await fetch('/.netlify/functions/gemini-proxy', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        topic: 'Multiplication',
        prompt: 'Create a multiplication story problem'
      })
    });
    
    const data = await response.json();
    console.log('📡 Response Status:', response.status);
    console.log('📄 Response Data:', data);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Auto-run the enhanced test
enhancedTestWithAutoDetection();
