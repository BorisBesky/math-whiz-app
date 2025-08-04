// Simple Browser Test for Gemini Proxy
// Copy and paste this into your browser console after the React app loads

async function simpleGeminiTest() {
  console.log('🧪 Simple Gemini Proxy Test');
  
  // Check if auth is exposed
  if (!window.currentUser) {
    console.log('❌ No user found. Make sure the React app is loaded and you are logged in.');
    console.log('📝 The app should automatically sign you in anonymously.');
    console.log('📝 Look for the message: "🧪 Firebase auth exposed for testing"');
    return;
  }
  
  const user = window.currentUser;
  console.log('✅ User found:', user.uid);
  
  try {
    console.log('🎫 Getting auth token...');
    const token = await user.getIdToken();
    console.log('✅ Token obtained');
    
    console.log('📡 Testing API call...');
    const response = await fetch('/.netlify/functions/gemini-proxy', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        topic: 'Multiplication',
        prompt: 'Create a simple multiplication story about apples'
      })
    });
    
    console.log('📊 Response Status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ SUCCESS! API Response:', data);
      console.log('📝 Story content:', data.content);
    } else {
      const errorData = await response.json();
      console.log('❌ API Error:', errorData);
      
      if (response.status === 401) {
        console.log('🔐 Authentication failed - check token');
      } else if (response.status === 429) {
        console.log('🚫 Rate limited - you already used this topic today');
      } else if (response.status === 400) {
        console.log('📝 Bad request - check topic/prompt format');
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
simpleGeminiTest();
