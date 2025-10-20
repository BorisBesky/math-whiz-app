// Load environment variables from .env file
require('dotenv').config();
require('firebase-admin');

function testEnvironment() {
  console.log('🔍 Testing Environment Configuration');
  console.log('=====================================\n');

  // Check for required environment variables
  const serviceAccountKeys = ['FIREBASE_SERVICE_ACCOUNT_KEY'];
  const individualKeys = ['FIREBASE_PROJECT_ID', 'FIREBASE_CLIENT_EMAIL', 'FIREBASE_PRIVATE_KEY'];
  const otherRequired = ['APP_ID'];
  
  const results = {};

  // Check service account format
  console.log('🔧 Firebase Admin Configuration:');
  const hasServiceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (hasServiceAccount) {
    try {
      const parsed = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
      results.serviceAccount = {
        exists: true,
        valid: !!parsed.project_id,
        details: `JSON object with ${Object.keys(parsed).length} properties`
      };
      console.log('✅ FIREBASE_SERVICE_ACCOUNT_KEY: Valid JSON service account');
    } catch (error) {
      results.serviceAccount = {
        exists: true,
        valid: false,
        details: 'Invalid JSON format'
      };
      console.log('❌ FIREBASE_SERVICE_ACCOUNT_KEY: Invalid JSON format');
    }
  } else {
    console.log('ℹ️  FIREBASE_SERVICE_ACCOUNT_KEY: Not set (checking individual fields)');
    
    // Check individual fields
    individualKeys.forEach(key => {
      const value = process.env[key];
      if (value) {
        if (key === 'FIREBASE_PRIVATE_KEY') {
          // Check if it's base64 encoded or has BEGIN/END markers
          const hasBeginEnd = value.includes('BEGIN PRIVATE KEY') && value.includes('END PRIVATE KEY');
          let isValidKey = hasBeginEnd;
          let privateKey = value;
          
          // If no BEGIN/END markers, try to decode as base64
          if (!hasBeginEnd) {
            try {
              const decoded = Buffer.from(value, 'base64').toString('utf8');
              isValidKey = decoded.includes('BEGIN PRIVATE KEY') && decoded.includes('END PRIVATE KEY');
              privateKey = decoded;
            } catch (error) {
              isValidKey = false;
            }
          }

          if (isValidKey) {
            const admin = require("firebase-admin");

            // Initialize Firebase Admin SDK
            try {
              // Replace literal \n with actual newlines
              // privateKey = privateKey.replace(/\\n/g, "\n");
              // console.log(`FIREBASE_PRIVATE_KEY=${privateKey}`);

              admin.initializeApp({
                credential: admin.credential.cert({
                  projectId: process.env.FIREBASE_PROJECT_ID,
                  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                  privateKey: privateKey,
                }),
                databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}.firebaseio.com`,
              });
              console.log('✅ Firebase Admin SDK initialized successfully during test.');
            } catch (initError) {
              console.error("Error initializing Firebase Admin SDK during test:", initError);
              isValidKey = false;
            }

            // initialize firebase app
            const { initializeApp } = require("firebase/app");
            const { getAuth } = require("firebase/auth");
            const { getFirestore } = require("firebase/firestore");

            let isFirebaseInitialized = false;
            let firebaseConfig;
            if (process.env.FIREBASE_API_KEY && process.env.FIREBASE_AUTH_DOMAIN) {
              firebaseConfig = {
                apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
                authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
                projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
                storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
                messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
                appId: process.env.REACT_APP_FIREBASE_APP_ID,
              };
            
              // Check if we have the minimum required config
              if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
                console.error(
                  "Firebase configuration incomplete. Please set REACT_APP_FIREBASE_API_KEY and REACT_APP_FIREBASE_PROJECT_ID in your environment."
                );
              }
              try {
                const app = initializeApp(firebaseConfig);
                const auth = getAuth(app);
                const db = getFirestore(app);
                isFirebaseInitialized = true;
                console.log('✅ Firebase Client SDK initialized successfully during test.');
              } catch (firebaseInitError) {
                console.error("Error initializing Firebase Client SDK during test:", firebaseInitError);
              }
            }
          }
          results[key] = {
            exists: true,
            valid: isValidKey,
            details: isValidKey ? 
              (hasBeginEnd ? 'Valid private key format' : 'Valid base64 encoded private key') : 
              'Invalid private key format'
          };
        } else {
          results[key] = {
            exists: true,
            valid: true,
            details: key === 'FIREBASE_PROJECT_ID' ? `"${value}"` : 'Set'
          };
        }
      } else {
        results[key] = {
          exists: false,
          valid: false,
          details: 'Not set'
        };
      }
    });

    individualKeys.forEach(key => {
      const result = results[key];
      const status = result?.exists && result?.valid ? '✅' : '❌';
      console.log(`${status} ${key}: ${result?.details || 'Not set'}`);
    });
  }

  // Check other required variables
  console.log('\n🔧 App Configuration:');
  otherRequired.forEach(key => {
    let value = process.env[key];
    
    // Handle APP_ID default
    if (key === 'APP_ID' && !value) {
      value = 'default-app-id';
      console.log('ℹ️  APP_ID not set, will use default: "default-app-id"');
    }
    
    if (value) {
      results[key] = {
        exists: true,
        valid: true,
        details: `"${value}"`
      };
    } else {
      results[key] = {
        exists: false,
        valid: false,
        details: 'Not set'
      };
    }

    const result = results[key];
    const status = result.exists && result.valid ? '✅' : '❌';
    if (key !== 'APP_ID' || process.env[key]) { // Only show status line if it's not the default APP_ID case
      console.log(`${status} ${key}: ${result.details}`);
    }
  });

  console.log('\n=====================================');
  
  // Determine if configuration is valid
  const hasValidServiceAccount = results.serviceAccount?.valid;
  const hasValidIndividualFields = individualKeys.every(key => results[key]?.exists && results[key]?.valid);
  const hasValidOther = otherRequired.every(key => results[key]?.exists && results[key]?.valid);
  
  const isValid = (hasValidServiceAccount || hasValidIndividualFields) && hasValidOther;
  
  if (isValid) {
    console.log('✅ Environment is properly configured for the app!');
    console.log(`\n🔧 Using: ${hasValidServiceAccount ? 'Service Account JSON' : 'Individual Firebase fields'}`);
  } else {
    console.log('❌ Environment configuration issues detected.');
    console.log('\nYou need either:');
    console.log('• Service Account JSON: FIREBASE_SERVICE_ACCOUNT_KEY');
    console.log('• OR Individual fields: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY');
    console.log('• Plus: APP_ID');
    console.log('\nPlease check your .env file and ensure required variables are set.');
  }
}

testEnvironment();