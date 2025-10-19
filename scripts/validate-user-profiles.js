// Load environment variables from .env file
require('dotenv').config();

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// Check for required environment variables
function validateEnvironment() {
  // Check for both formats: service account JSON or individual fields
  const hasServiceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  const hasIndividualFields = process.env.FIREBASE_PROJECT_ID && 
                              process.env.FIREBASE_CLIENT_EMAIL && 
                              process.env.FIREBASE_PRIVATE_KEY;

  if (!hasServiceAccountJson && !hasIndividualFields) {
    console.error('❌ Missing Firebase configuration. You need either:');
    console.error('\n   Option 1: Service Account JSON');
    console.error('   - FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}');
    console.error('\n   Option 2: Individual Fields');
    console.error('   - FIREBASE_PROJECT_ID=your-project-id');
    console.error('   - FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com');
    console.error('   - FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----\\n');
    process.exit(1);
  }

  if (!process.env.APP_ID) {
    console.warn('⚠️  APP_ID not set, using default: "default-app-id"');
    process.env.APP_ID = 'default-app-id';
  }
}

// Initialize Firebase Admin
let app;
try {
  validateEnvironment();
  
  let credential;
  
  // Try service account JSON first
  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
    credential = cert(serviceAccount);
  } else {
    // Use individual fields
    let privateKey = process.env.FIREBASE_PRIVATE_KEY;
    
    // Handle base64 encoded private key
    if (privateKey && !privateKey.includes('BEGIN PRIVATE KEY')) {
      try {
        privateKey = Buffer.from(privateKey, 'base64').toString('utf8');
      } catch (error) {
        console.error('❌ Failed to decode base64 private key:', error.message);
        process.exit(1);
      }
    }
    
    // Replace \\n with actual newlines
    privateKey = privateKey.replace(/\\n/g, '\n');
    
    credential = cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: privateKey
    });
  }
  
  app = initializeApp({
    credential: credential,
    projectId: process.env.FIREBASE_PROJECT_ID
  });
  
  console.log('✅ Firebase Admin initialized successfully');
} catch (error) {
  console.error('❌ Firebase Admin initialization error:', error.message);
  process.exit(1);
}

const db = getFirestore(app);

/**
 * User Profile Validation and Field Completion Script
 * 
 * This script validates that all users have the required fields in their profile
 * and fills in missing fields with appropriate default values.
 * 
 * Required fields:
 * - createdAt (default: current timestamp)
 * - displayName (default: userId)
 * - email (default: "")
 * - name (default: userId)
 * - role (default: "student")
 */

const REQUIRED_FIELDS = {
  createdAt: {
    default: () => new Date(),
    description: 'Account creation timestamp'
  },
  displayName: {
    default: (userId) => userId,
    description: 'Display name for UI'
  },
  email: {
    default: () => "",
    description: 'User email address'
  },
  name: {
    default: (userId) => userId,
    description: 'User name'
  },
  role: {
    default: () => "student",
    description: 'User role (student/teacher/admin)'
  }
};

async function validateAndCompleteUserProfiles() {
  const appId = process.env.APP_ID || 'default-app-id';
  console.log(`Starting user profile validation for app: ${appId}`);
  console.log('Required fields:', Object.keys(REQUIRED_FIELDS).join(', '));
  console.log('=====================================\n');

  let validationStats = {
    total: 0,
    validated: 0,
    updated: 0,
    errors: 0,
    skipped: 0,
    fieldStats: {},
    details: []
  };

  // Initialize field statistics
  Object.keys(REQUIRED_FIELDS).forEach(field => {
    validationStats.fieldStats[field] = {
      missing: 0,
      present: 0,
      added: 0
    };
  });

  try {
    // Get all user documents
    const usersCollectionRef = db.collection(`artifacts/${appId}/users`);
    const userDocRefs = await usersCollectionRef.listDocuments();

    if (userDocRefs.length === 0) {
      console.log('No users found in the collection.');
      return;
    }

    console.log(`Found ${userDocRefs.length} user document(s) to validate.\n`);
    validationStats.total = userDocRefs.length;

    // Process each user
    for (const userDocRef of userDocRefs) {
      const userId = userDocRef.id;
      console.log(`Validating user: ${userId}`);

      try {
        // Check if math_whiz_data/profile exists
        const profileRef = db.doc(`artifacts/${appId}/users/${userId}/math_whiz_data/profile`);
        const profileSnapshot = await profileRef.get();

        if (!profileSnapshot.exists) {
          console.log(`  ⚠️  No math_whiz_data/profile found - creating with defaults`);
          
          // Create profile with all default values
          const newProfileData = {
            updatedAt: new Date(),
            validatedAt: new Date()
          };

          Object.keys(REQUIRED_FIELDS).forEach(field => {
            const fieldConfig = REQUIRED_FIELDS[field];
            newProfileData[field] = typeof fieldConfig.default === 'function' 
              ? fieldConfig.default(userId) 
              : fieldConfig.default;
            validationStats.fieldStats[field].missing++;
            validationStats.fieldStats[field].added++;
          });

          await profileRef.set(newProfileData);
          console.log(`  ✅ Created profile with ${Object.keys(REQUIRED_FIELDS).length} default fields`);

          validationStats.updated++;
          validationStats.details.push({
            userId,
            status: 'created',
            fieldsAdded: Object.keys(REQUIRED_FIELDS)
          });

          continue;
        }

        const profileData = profileSnapshot.data() || {};
        console.log(`  📋 Found existing profile with ${Object.keys(profileData).length} fields`);

        // Check for missing fields
        const missingFields = [];
        const updatedData = { ...profileData };
        let needsUpdate = false;

        Object.keys(REQUIRED_FIELDS).forEach(field => {
          const fieldConfig = REQUIRED_FIELDS[field];
          
          if (profileData.hasOwnProperty(field) && profileData[field] !== null && profileData[field] !== undefined) {
            // Field exists and has a value
            validationStats.fieldStats[field].present++;
            console.log(`    ✅ ${field}: present`);
          } else {
            // Field is missing or null/undefined
            missingFields.push(field);
            const defaultValue = typeof fieldConfig.default === 'function' 
              ? fieldConfig.default(userId) 
              : fieldConfig.default;
            
            updatedData[field] = defaultValue;
            needsUpdate = true;
            
            validationStats.fieldStats[field].missing++;
            validationStats.fieldStats[field].added++;
            
            console.log(`    ➕ ${field}: missing, adding default (${typeof defaultValue === 'object' ? 'timestamp' : `"${defaultValue}"`})`);
          }
        });

        if (needsUpdate) {
          // Update the profile with missing fields
          updatedData.updatedAt = new Date();
          updatedData.validatedAt = new Date();

          await profileRef.update(updatedData);
          console.log(`  ✅ Updated profile with ${missingFields.length} missing field(s)`);

          validationStats.updated++;
          validationStats.details.push({
            userId,
            status: 'updated',
            fieldsAdded: missingFields
          });
        } else {
          console.log(`  ✅ All required fields present - no update needed`);
          validationStats.validated++;
          validationStats.details.push({
            userId,
            status: 'valid',
            fieldsAdded: []
          });
        }

      } catch (error) {
        console.error(`  ❌ Error processing user ${userId}:`, error.message);
        validationStats.errors++;
        validationStats.details.push({
          userId,
          status: 'error',
          error: error.message
        });
      }

      console.log(''); // Empty line for readability
    }

  } catch (error) {
    console.error('Fatal error during validation:', error);
    process.exit(1);
  }

  // Print validation summary
  console.log('\n=====================================');
  console.log('VALIDATION SUMMARY');
  console.log('=====================================');
  console.log(`Total users processed: ${validationStats.total}`);
  console.log(`Already valid: ${validationStats.validated}`);
  console.log(`Updated with missing fields: ${validationStats.updated}`);
  console.log(`Errors: ${validationStats.errors}`);
  console.log('');

  // Field statistics
  console.log('FIELD STATISTICS:');
  Object.keys(REQUIRED_FIELDS).forEach(field => {
    const stats = validationStats.fieldStats[field];
    const total = stats.present + stats.missing;
    console.log(`  ${field}:`);
    console.log(`    Present: ${stats.present}/${total} (${total > 0 ? Math.round(stats.present/total*100) : 0}%)`);
    console.log(`    Missing/Added: ${stats.added}`);
  });
  console.log('');

  if (validationStats.updated > 0) {
    console.log('UPDATED USERS:');
    validationStats.details
      .filter(d => d.status === 'updated' || d.status === 'created')
      .forEach(detail => {
        console.log(`  - ${detail.userId}: ${detail.status} (added: ${detail.fieldsAdded.join(', ')})`);
      });
    console.log('');
  }

  if (validationStats.errors > 0) {
    console.log('ERRORS:');
    validationStats.details
      .filter(d => d.status === 'error')
      .forEach(detail => {
        console.log(`  - ${detail.userId}: ${detail.error}`);
      });
    console.log('');
  }

  console.log('Validation completed successfully! 🎉');
  
  if (validationStats.updated > 0) {
    console.log('\nAll users now have the required profile fields with appropriate defaults.');
  }
}

/**
 * Dry run function to preview what the validation would do
 */
async function dryRunValidation() {
  const appId = process.env.APP_ID || 'default-app-id';
  console.log(`DRY RUN: Preview user profile validation for app: ${appId}`);
  console.log('Required fields:', Object.keys(REQUIRED_FIELDS).join(', '));
  console.log('=====================================\n');

  let previewStats = {
    total: 0,
    wouldUpdate: 0,
    wouldCreate: 0,
    alreadyValid: 0,
    fieldStats: {}
  };

  // Initialize field statistics
  Object.keys(REQUIRED_FIELDS).forEach(field => {
    previewStats.fieldStats[field] = {
      missing: 0,
      present: 0
    };
  });

  try {
    const usersCollectionRef = db.collection(`artifacts/${appId}/users`);
    const userDocRefs = await usersCollectionRef.listDocuments();

    if (userDocRefs.length === 0) {
      console.log('No users found in the collection.');
      return;
    }

    console.log(`Found ${userDocRefs.length} user document(s) to analyze.\n`);
    previewStats.total = userDocRefs.length;

    for (const userDocRef of userDocRefs) {
      const userId = userDocRef.id;
      
      try {
        const profileRef = db.doc(`artifacts/${appId}/users/${userId}/math_whiz_data/profile`);
        const profileSnapshot = await profileRef.get();

        if (!profileSnapshot.exists) {
          console.log(`${userId}: No profile found - WOULD CREATE with all defaults`);
          previewStats.wouldCreate++;
          Object.keys(REQUIRED_FIELDS).forEach(field => {
            previewStats.fieldStats[field].missing++;
          });
          continue;
        }

        const profileData = profileSnapshot.data() || {};
        const missingFields = [];

        Object.keys(REQUIRED_FIELDS).forEach(field => {
          if (profileData.hasOwnProperty(field) && profileData[field] !== null && profileData[field] !== undefined) {
            previewStats.fieldStats[field].present++;
          } else {
            missingFields.push(field);
            previewStats.fieldStats[field].missing++;
          }
        });

        if (missingFields.length > 0) {
          console.log(`${userId}: Missing fields [${missingFields.join(', ')}] - WOULD UPDATE`);
          previewStats.wouldUpdate++;
        } else {
          console.log(`${userId}: All fields present - OK`);
          previewStats.alreadyValid++;
        }

      } catch (error) {
        console.log(`${userId}: Error analyzing - ${error.message}`);
      }
    }

    console.log('\n=====================================');
    console.log('DRY RUN SUMMARY');
    console.log('=====================================');
    console.log(`Total users: ${previewStats.total}`);
    console.log(`Already valid: ${previewStats.alreadyValid}`);
    console.log(`Would update: ${previewStats.wouldUpdate}`);
    console.log(`Would create: ${previewStats.wouldCreate}`);
    console.log('');

    console.log('FIELD ANALYSIS:');
    Object.keys(REQUIRED_FIELDS).forEach(field => {
      const stats = previewStats.fieldStats[field];
      const total = stats.present + stats.missing;
      console.log(`  ${field}: ${stats.missing}/${total} users missing this field`);
    });

    console.log('\nTo execute the validation, run: npm run validate:execute');

  } catch (error) {
    console.error('Error during dry run:', error);
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const shouldExecute = args.includes('--execute');
  const isDryRun = args.includes('--dry-run') || !shouldExecute;

  if (isDryRun) {
    await dryRunValidation();
  } else {
    console.log('⚠️  This will modify user profiles in your database!');
    console.log('   Missing fields will be added with default values.\n');
    
    // Wait for 3 seconds to give user time to cancel
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    await validateAndCompleteUserProfiles();
  }

  process.exit(0);
}

// Handle uncaught errors
process.on('unhandledRejection', (error) => {
  console.error('Unhandled promise rejection:', error);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
  process.exit(1);
});

main().catch(console.error);