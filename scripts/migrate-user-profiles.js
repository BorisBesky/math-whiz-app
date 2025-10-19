const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const path = require('path');

// Load environment variables from .env file
require('dotenv').config();

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
    console.error('\n   Also required:');
    console.error('   - APP_ID=default-app-id (or your app identifier)');
    process.exit(1);
  }

  if (!process.env.APP_ID) {
    console.warn('⚠️  APP_ID not set, using default: "default-app-id"');
    process.env.APP_ID = 'default-app-id';
  }

  if (hasServiceAccountJson) {
    try {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
      if (!serviceAccount.project_id) {
        console.error('❌ Invalid FIREBASE_SERVICE_ACCOUNT_KEY: missing project_id field');
        process.exit(1);
      }
    } catch (error) {
      console.error('❌ Invalid FIREBASE_SERVICE_ACCOUNT_KEY: not valid JSON');
      console.error('Error:', error.message);
      process.exit(1);
    }
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
 * Migration Script: Move user profiles from profile/main to math_whiz_data/profile
 * 
 * This script migrates user profile data from:
 *   artifacts/${appId}/users/${userId}/profile/main
 * To:
 *   artifacts/${appId}/users/${userId}/math_whiz_data/profile
 * 
 * The script preserves existing data in math_whiz_data/profile and merges
 * data from profile/main, with profile/main taking precedence for conflicts.
 */

async function migrateUserProfiles() {
  const appId = process.env.APP_ID || 'default-app-id';
  console.log(`Starting migration for app: ${appId}`);
  console.log(`Migration direction: profile/main → math_whiz_data/profile`);
  console.log('=====================================\n');

  let migrationStats = {
    total: 0,
    migrated: 0,
    skipped: 0,
    errors: 0,
    details: []
  };

  try {
    // Get all user documents
    const usersCollectionRef = db.collection(`artifacts/${appId}/users`);
    const userDocRefs = await usersCollectionRef.listDocuments();

    if (userDocRefs.length === 0) {
      console.log('No users found in the collection.');
      return;
    }

    console.log(`Found ${userDocRefs.length} user document(s) to process.\n`);
    migrationStats.total = userDocRefs.length;

    // Process each user
    for (const userDocRef of userDocRefs) {
      const userId = userDocRef.id;
      console.log(`Processing user: ${userId}`);

      try {
        // Check if profile/main exists
        const profileMainRef = db.doc(`artifacts/${appId}/users/${userId}/profile/main`);
        const profileMainSnapshot = await profileMainRef.get();

        if (!profileMainSnapshot.exists) {
          console.log(`  ℹ️  No profile/main data found - skipping`);
          migrationStats.skipped++;
          migrationStats.details.push({
            userId,
            status: 'skipped',
            reason: 'No profile/main data found'
          });
          continue;
        }

        const profileMainData = profileMainSnapshot.data();
        
        if (!profileMainData || Object.keys(profileMainData).length === 0) {
          console.log(`  ℹ️  Empty profile/main data - skipping`);
          migrationStats.skipped++;
          migrationStats.details.push({
            userId,
            status: 'skipped',
            reason: 'Empty profile/main data'
          });
          continue;
        }

        // Check if math_whiz_data/profile already exists
        const mathWhizProfileRef = db.doc(`artifacts/${appId}/users/${userId}/math_whiz_data/profile`);
        const mathWhizProfileSnapshot = await mathWhizProfileRef.get();

        let existingMathWhizData = {};
        if (mathWhizProfileSnapshot.exists) {
          existingMathWhizData = mathWhizProfileSnapshot.data() || {};
          console.log(`  📋 Found existing math_whiz_data/profile with ${Object.keys(existingMathWhizData).length} fields`);
        }

        // Merge data: existing math_whiz_data + profile/main (profile/main takes precedence)
        const mergedData = {
          ...existingMathWhizData,
          ...profileMainData,
          migratedAt: new Date(),
          migrationSource: 'profile/main'
        };

        // Write merged data to math_whiz_data/profile
        await mathWhizProfileRef.set(mergedData);
        console.log(`  ✅ Successfully migrated data to math_whiz_data/profile`);

        // Create a backup of the original profile/main data before deletion
        const backupRef = db.doc(`artifacts/${appId}/users/${userId}/profile/main_backup_${Date.now()}`);
        await backupRef.set({
          ...profileMainData,
          backupCreatedAt: new Date(),
          originalPath: 'profile/main'
        });
        console.log(`  💾 Created backup at profile/main_backup_${Date.now()}`);

        // Delete the original profile/main document
        await profileMainRef.delete();
        console.log(`  🗑️  Deleted original profile/main document`);

        migrationStats.migrated++;
        migrationStats.details.push({
          userId,
          status: 'migrated',
          fieldsCount: Object.keys(profileMainData).length,
          hadExistingData: mathWhizProfileSnapshot.exists
        });

      } catch (error) {
        console.error(`  ❌ Error processing user ${userId}:`, error.message);
        migrationStats.errors++;
        migrationStats.details.push({
          userId,
          status: 'error',
          error: error.message
        });
      }

      console.log(''); // Empty line for readability
    }

  } catch (error) {
    console.error('Fatal error during migration:', error);
    process.exit(1);
  }

  // Print migration summary
  console.log('\n=====================================');
  console.log('MIGRATION SUMMARY');
  console.log('=====================================');
  console.log(`Total users processed: ${migrationStats.total}`);
  console.log(`Successfully migrated: ${migrationStats.migrated}`);
  console.log(`Skipped (no data): ${migrationStats.skipped}`);
  console.log(`Errors: ${migrationStats.errors}`);
  console.log('');

  if (migrationStats.migrated > 0) {
    console.log('MIGRATED USERS:');
    migrationStats.details
      .filter(d => d.status === 'migrated')
      .forEach(detail => {
        console.log(`  - ${detail.userId}: ${detail.fieldsCount} fields${detail.hadExistingData ? ' (merged with existing data)' : ''}`);
      });
    console.log('');
  }

  if (migrationStats.errors > 0) {
    console.log('ERRORS:');
    migrationStats.details
      .filter(d => d.status === 'error')
      .forEach(detail => {
        console.log(`  - ${detail.userId}: ${detail.error}`);
      });
    console.log('');
  }

  if (migrationStats.skipped > 0) {
    console.log('SKIPPED USERS:');
    migrationStats.details
      .filter(d => d.status === 'skipped')
      .forEach(detail => {
        console.log(`  - ${detail.userId}: ${detail.reason}`);
      });
    console.log('');
  }

  console.log('Migration completed successfully! 🎉');
  
  if (migrationStats.migrated > 0) {
    console.log('\nNOTE: Backup documents were created for all migrated profiles.');
    console.log('You can safely delete the backup documents after verifying the migration.');
  }
}

/**
 * Dry run function to preview what the migration would do
 */
async function dryRunMigration() {
  const appId = process.env.APP_ID || 'default-app-id';
  console.log(`DRY RUN: Preview migration for app: ${appId}`);
  console.log(`Migration direction: profile/main → math_whiz_data/profile`);
  console.log('=====================================\n');

  try {
    const usersCollectionRef = db.collection(`artifacts/${appId}/users`);
    const userDocRefs = await usersCollectionRef.listDocuments();

    if (userDocRefs.length === 0) {
      console.log('No users found in the collection.');
      return;
    }

    console.log(`Found ${userDocRefs.length} user document(s) to analyze.\n`);

    let wouldMigrate = 0;
    let wouldSkip = 0;

    for (const userDocRef of userDocRefs) {
      const userId = userDocRef.id;
      
      try {
        // Check profile/main
        const profileMainRef = db.doc(`artifacts/${appId}/users/${userId}/profile/main`);
        const profileMainSnapshot = await profileMainRef.get();

        // Check math_whiz_data/profile
        const mathWhizProfileRef = db.doc(`artifacts/${appId}/users/${userId}/math_whiz_data/profile`);
        const mathWhizProfileSnapshot = await mathWhizProfileRef.get();

        if (profileMainSnapshot.exists && profileMainSnapshot.data() && Object.keys(profileMainSnapshot.data()).length > 0) {
          const profileData = profileMainSnapshot.data();
          const hasExisting = mathWhizProfileSnapshot.exists && mathWhizProfileSnapshot.data() && Object.keys(mathWhizProfileSnapshot.data()).length > 0;
          
          console.log(`${userId}:`);
          console.log(`  📄 profile/main: ${Object.keys(profileData).length} fields`);
          console.log(`  📁 math_whiz_data/profile: ${hasExisting ? `${Object.keys(mathWhizProfileSnapshot.data()).length} fields (would merge)` : 'does not exist'}`);
          console.log(`  🔄 Action: WOULD MIGRATE`);
          wouldMigrate++;
        } else {
          console.log(`${userId}: No profile/main data - WOULD SKIP`);
          wouldSkip++;
        }
      } catch (error) {
        console.log(`${userId}: Error analyzing - ${error.message}`);
        wouldSkip++;
      }
    }

    console.log('\n=====================================');
    console.log('DRY RUN SUMMARY');
    console.log('=====================================');
    console.log(`Total users: ${userDocRefs.length}`);
    console.log(`Would migrate: ${wouldMigrate}`);
    console.log(`Would skip: ${wouldSkip}`);
    console.log('\nTo execute the migration, run: node migrate-user-profiles.js --execute');

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
    await dryRunMigration();
  } else {
    console.log('⚠️  This will permanently modify your database!');
    console.log('   Backups will be created, but please ensure you have a database backup.\n');
    
    // Wait for 3 seconds to give user time to cancel
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    await migrateUserProfiles();
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