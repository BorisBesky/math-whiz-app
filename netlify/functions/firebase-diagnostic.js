// Firebase Environment Diagnostic for Netlify
// Use this to test Firebase configuration in Netlify environment

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'GET') {
    return { 
      statusCode: 405, 
      headers,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  try {
    const diagnostics = {
      timestamp: new Date().toISOString(),
      environment: {
        NODE_ENV: process.env.NODE_ENV || 'not set',
        hasFirebaseProjectId: !!process.env.FIREBASE_PROJECT_ID,
        hasFirebaseClientEmail: !!process.env.FIREBASE_CLIENT_EMAIL,
        hasFirebasePrivateKey: !!process.env.FIREBASE_PRIVATE_KEY,
        hasGeminiApiKey: !!process.env.GEMINI_API_KEY
      }
    };

    // Check private key format without exposing it
    if (process.env.FIREBASE_PRIVATE_KEY) {
      const privateKey = process.env.FIREBASE_PRIVATE_KEY;
      diagnostics.privateKeyInfo = {
        length: privateKey.length,
        startsWithBegin: privateKey.includes('-----BEGIN'),
        hasNewlines: privateKey.includes('\n'),
        hasEscapedNewlines: privateKey.includes('\\n'),
        seemsBase64: !privateKey.includes('-----') && privateKey.length > 100
      };
    }

    // Test Firebase Admin initialization (without actually using it)
    let firebaseInitResult = 'not tested';
    try {
      const admin = require('firebase-admin');
      
      // Don't actually initialize if already initialized
      if (!admin.apps.length) {
        firebaseInitResult = 'would attempt initialization';
      } else {
        firebaseInitResult = 'already initialized';
      }
    } catch (error) {
      firebaseInitResult = `error: ${error.message}`;
    }

    diagnostics.firebaseAdmin = firebaseInitResult;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(diagnostics, null, 2)
    };

  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Diagnostic failed',
        message: error.message,
        stack: error.stack
      }, null, 2)
    };
  }
};
