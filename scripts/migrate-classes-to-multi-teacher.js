const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// Load environment variables from .env file
require('dotenv').config();

// Check for required environment variables
function validateEnvironment() {
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

  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
    credential = cert(serviceAccount);
  } else {
    let privateKey = process.env.FIREBASE_PRIVATE_KEY;
    if (privateKey && !privateKey.includes('BEGIN PRIVATE KEY')) {
      try {
        privateKey = Buffer.from(privateKey, 'base64').toString('utf8');
      } catch (error) {
        console.error('❌ Failed to decode base64 private key:', error.message);
        process.exit(1);
      }
    }
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
 * Migration Script: Backfill `teacherIds` array on class documents.
 *
 * For each class that has `teacherId` but not `teacherIds`, this sets:
 *   - teacherIds: [teacherId]
 *   - createdBy: teacherId
 *
 * Safe to run multiple times — skips classes that already have `teacherIds`.
 */
async function migrateClasses() {
  console.log('🚀 Starting multi-teacher migration...');
  const appId = process.env.APP_ID;
  console.log(`Using APP_ID: ${appId}`);

  const classesCol = db.collection('artifacts').doc(appId).collection('classes');
  const classesSnapshot = await classesCol.get();

  console.log(`📚 Found ${classesSnapshot.size} class documents.`);

  let migrated = 0;
  let skipped = 0;
  let errors = 0;
  let batch = db.batch();
  let batchCount = 0;

  for (const doc of classesSnapshot.docs) {
    const data = doc.data();

    // Skip if already migrated
    if (Array.isArray(data.teacherIds) && data.teacherIds.length > 0) {
      skipped++;
      continue;
    }

    if (!data.teacherId) {
      console.warn(`⚠️  Class ${doc.id} has no teacherId — skipping.`);
      skipped++;
      continue;
    }

    try {
      batch.update(doc.ref, {
        teacherIds: [data.teacherId],
        createdBy: data.teacherId,
      });
      batchCount++;
      migrated++;

      // Firestore batch limit is 500
      if (batchCount >= 500) {
        await batch.commit();
        console.log(`   Committed batch of ${batchCount} updates...`);
        batch = db.batch();
        batchCount = 0;
      }
    } catch (err) {
      console.error(`❌ Error preparing update for class ${doc.id}:`, err.message);
      errors++;
    }
  }

  // Commit remaining
  if (batchCount > 0) {
    await batch.commit();
    console.log(`   Committed final batch of ${batchCount} updates.`);
  }

  console.log('\n🎉 Migration complete!');
  console.log(`   ✅ Migrated: ${migrated}`);
  console.log(`   ⏭️  Skipped (already migrated or no teacherId): ${skipped}`);
  if (errors > 0) {
    console.log(`   ❌ Errors: ${errors}`);
  }
}

migrateClasses().catch(err => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
