// Load environment variables from .env file
require('dotenv').config();

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');

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
}

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
    credential,
    projectId: process.env.FIREBASE_PROJECT_ID
  });
  console.log('✅ Firebase Admin initialized successfully');
} catch (error) {
  console.error('❌ Firebase Admin initialization error:', error.message);
  process.exit(1);
}

const db = getFirestore(app);

async function userHasMathWhizData(userId, appId) {
  // Check if subcollection math_whiz_data has at least one document (e.g., profile)
  // Using a specific doc check for performance: profile
  const profileRef = db.doc(`artifacts/${appId}/users/${userId}/math_whiz_data/profile`);
  const snap = await profileRef.get();
  if (snap.exists) return true;

  // Fallback: list any docs in math_whiz_data subcollection
  try {
    const subcolRef = db.collection(`artifacts/${appId}/users/${userId}/math_whiz_data`);
    const docs = await subcolRef.listDocuments();
    return docs.length > 0;
  } catch (e) {
    // If listing fails (e.g., permission), treat as not existing
    return false;
  }
}

async function deleteUserDoc(userDocRef, options) {
  const { recursive = true } = options || {};
  if (!recursive) {
    await userDocRef.delete();
    return { deleted: 1, subcollectionsDeleted: 0 };
  }

  // Recursively delete all subcollections under this user doc
  let subcollectionsDeleted = 0;
  try {
    const subcollections = await userDocRef.listCollections();
    for (const subcol of subcollections) {
      const batchDeletes = await deleteCollectionRecursive(subcol, 200);
      subcollectionsDeleted += batchDeletes;
    }
  } catch (e) {
    console.warn(`   ⚠️  Failed to list/delete subcollections: ${e.message}`);
  }

  await userDocRef.delete();
  return { deleted: 1, subcollectionsDeleted };
}

async function deleteCollectionRecursive(collectionRef, batchSize = 200) {
  let totalDeleted = 0;
  while (true) {
    const snapshot = await collectionRef.limit(batchSize).get();
    if (snapshot.empty) break;

    const batch = db.batch();
    snapshot.docs.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();
    totalDeleted += snapshot.size;
  }
  return totalDeleted;
}

async function dryRun(appId) {
  const usersRef = db.collection(`artifacts/${appId}/users`);
  const userDocRefs = await usersRef.listDocuments();

  console.log(`DRY RUN: scanning ${userDocRefs.length} user doc(s) in app "${appId}"`);

  let candidates = [];
  let errors = [];

  for (const userRef of userDocRefs) {
    const userId = userRef.id;
    try {
      const hasData = await userHasMathWhizData(userId, appId);
      if (!hasData) {
        candidates.push(userId);
        console.log(` - ${userId}: NO math_whiz_data -> WOULD DELETE`);
      } else {
        console.log(` - ${userId}: has math_whiz_data -> KEEP`);
      }
    } catch (e) {
      console.log(` - ${userId}: Error checking -> ${e.message}`);
      errors.push({ userId, error: e.message });
    }
  }

  console.log('\nSUMMARY');
  console.log('=======');
  console.log(`Total users: ${userDocRefs.length}`);
  console.log(`Would delete: ${candidates.length}`);
  console.log(`Errors: ${errors.length}`);

  return { candidates, errors, total: userDocRefs.length };
}

async function executeDeletion(appId, options) {
  const usersRef = db.collection(`artifacts/${appId}/users`);
  const userDocRefs = await usersRef.listDocuments();

  console.log(`Executing deletion for users without math_whiz_data in app "${appId}"`);
  console.log('This will permanently delete user docs (with subcollections).');

  let deleted = 0;
  let skipped = 0;
  let subDeleted = 0;
  let errors = [];

  for (const userRef of userDocRefs) {
    const userId = userRef.id;
    try {
      const hasData = await userHasMathWhizData(userId, appId);
      if (!hasData) {
        const res = await deleteUserDoc(userRef, options);
        deleted += res.deleted;
        subDeleted += res.subcollectionsDeleted;
        console.log(` - ${userId}: deleted (sub-docs: ${res.subcollectionsDeleted})`);
      } else {
        skipped++;
        console.log(` - ${userId}: has math_whiz_data -> skipped`);
      }
    } catch (e) {
      console.log(` - ${userId}: ERROR -> ${e.message}`);
      errors.push({ userId, error: e.message });
    }
  }

  console.log('\nDELETION SUMMARY');
  console.log('================');
  console.log(`Processed users: ${userDocRefs.length}`);
  console.log(`Deleted users: ${deleted}`);
  console.log(`Skipped users: ${skipped}`);
  console.log(`Sub-docs deleted: ${subDeleted}`);
  console.log(`Errors: ${errors.length}`);

  if (errors.length) {
    console.log('\nERROR DETAILS');
    errors.forEach(e => console.log(` - ${e.userId}: ${e.error}`));
  }
}

async function main() {
  const args = process.argv.slice(2);
  const shouldExecute = args.includes('--execute');
  const isDryRun = args.includes('--dry-run') || !shouldExecute;
  const recursive = !args.includes('--no-recursive');

  const appId = process.env.APP_ID || 'default-app-id';

  if (isDryRun) {
    await dryRun(appId);
  } else {
    console.log('⚠️  DANGEROUS OPERATION: Deleting user docs without math_whiz_data');
    console.log('   Starting in 3 seconds. Press Ctrl+C to abort.');
    await new Promise(r => setTimeout(r, 3000));
    await executeDeletion(appId, { recursive });
  }

  process.exit(0);
}

process.on('unhandledRejection', (err) => {
  console.error('Unhandled promise rejection:', err);
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
  process.exit(1);
});

main().catch(console.error);
