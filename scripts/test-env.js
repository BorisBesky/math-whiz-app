// Load environment variables from .env file
require('dotenv').config();

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
          
          // If no BEGIN/END markers, try to decode as base64
          if (!hasBeginEnd) {
            try {
              const decoded = Buffer.from(value, 'base64').toString('utf8');
              isValidKey = decoded.includes('BEGIN PRIVATE KEY') && decoded.includes('END PRIVATE KEY');
            } catch (error) {
              isValidKey = false;
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
    console.log('✅ Environment is properly configured for migration!');
    console.log(`\n🔧 Using: ${hasValidServiceAccount ? 'Service Account JSON' : 'Individual Firebase fields'}`);
    console.log('\nYou can now run:');
    console.log('  npm run migrate:preview  # Preview migration');
    console.log('  npm run migrate:execute  # Execute migration');
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