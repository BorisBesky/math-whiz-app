const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');

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
const auth = getAuth(app);

/**
 * Teacher Role Validation Script: Validate and update teacher role claims.
 * 
 * This script finds users with role 'teacher' in their profile document
 * and ensures they have the corresponding 'teacher' custom claim in Firebase Auth.
 * If the claim is missing, it adds the claim.
 */
async function validateTeacherRoles() {
  console.log('🚀 Starting teacher role validation...');
  const appId = process.env.APP_ID;
  console.log(`Using APP_ID: ${appId}`);

   const usersCollectionRef = db.collection(`artifacts/${appId}/users`);
   const userDocRefs = await usersCollectionRef.listDocuments();

  try {
    console.log('👨‍🏫 Scanning all user profiles for teachers...');
    
    const teacherIds = [];
    let totalUsers = 0;
    let profilesScanned = 0;
    
    // Get all users
    console.log(`Found ${userDocRefs.length} user document(s) to validate.\n`);

    // Process each user
    for (const userDoc of userDocRefs) {
      const userId = userDoc.id;
      console.log(`\n[${profilesScanned + 1}/${totalUsers}] Checking user: ${userId}`);
      
      try {
        // Check if user has a math_whiz_data/profile document
        const profileRef = usersCollectionRef.doc(userId).collection('math_whiz_data').doc('profile');
        const profileSnap = await profileRef.get();
        
        if (!profileSnap.exists) {
          console.log(`   - ⚠️  No profile found for user ${userId}`);
          profilesScanned++;
          continue;
        }

        const profileData = profileSnap.data();
        if (profileData.role === 'teacher') {
          console.log(`   - ✅ Found teacher profile: ${profileData.email || profileData.displayName || userId}`);
          teacherIds.push(userId);
        } else {
          console.log(`   - 👤 User role: ${profileData.role || 'undefined'}`);
        }
        
        profilesScanned++;
      } catch (error) {
        console.error(`   - ❌ Error checking profile for user ${userId}:`, error.message);
        profilesScanned++;
        continue;
      }
    }

    console.log(`\n📈 Profile scan complete:`);
    console.log(`   - Total users scanned: ${profilesScanned}`);
    console.log(`   - Teachers found: ${teacherIds.length}`);

    if (teacherIds.length === 0) {
      console.log('\n🎉 No teachers found to validate. Script complete.');
      return;
    }

    console.log('\n🔍 Validating Firebase Auth claims for teachers...');
    
    let claimsUpdated = 0;
    let claimsAlreadySet = 0;
    let claimsErrors = 0;
    
    for (let i = 0; i < teacherIds.length; i++) {
      const teacherId = teacherIds[i];
      console.log(`\n[${i + 1}/${teacherIds.length}] Validating claims for teacher: ${teacherId}`);
      
      try {
        // Get user's current custom claims
        const userRecord = await auth.getUser(teacherId);
        const currentClaims = userRecord.customClaims || {};
        
        console.log(`   - Current claims:`, currentClaims);
        
        if (currentClaims.role === 'teacher' && Object.keys(currentClaims).length === 1) {
          console.log(`   - ✅ Teacher claim already set correctly`);
          claimsAlreadySet++;
        } else {
          console.log(`   - 🔄 Setting teacher claim...`);
          
          // Set the teacher role claim
          const updatedClaims = { role: 'teacher' };
          await auth.setCustomUserClaims(teacherId, updatedClaims);
          
          console.log(`   - ✅ Teacher claim set successfully`);
          claimsUpdated++;
        }
        
      } catch (error) {
        if (error.code === 'auth/user-not-found') {
          console.error(`   - ❌ User not found in Firebase Auth: ${teacherId}`);
          console.error(`     This user exists in Firestore but not in Firebase Auth.`);
        } else {
          console.error(`   - ❌ Error updating claims for ${teacherId}:`, error.message);
        }
        claimsErrors++;
      }
    }

    console.log('\n\n🎉 Teacher role validation complete!');
    console.log(`📊 Summary:`);
    console.log(`   - Total teachers found: ${teacherIds.length}`);
    console.log(`   - Claims already set correctly: ${claimsAlreadySet}`);
    console.log(`   - Claims updated: ${claimsUpdated}`);
    console.log(`   - Errors encountered: ${claimsErrors}`);
    
    if (claimsErrors > 0) {
      console.log('\n⚠️  Some errors were encountered. Please review the log above.');
      console.log('   Common issues:');
      console.log('   - Users in Firestore but not in Firebase Auth (orphaned data)');
      console.log('   - Insufficient permissions in service account');
    }

  } catch (error) {
    console.error('❌ An error occurred during teacher role validation:', error);
    process.exit(1);
  }
}

// Execute the script
validateTeacherRoles().then(() => {
  console.log('Script finished.');
  process.exit(0);
}).catch(err => {
  console.error('Script failed with unhandled error:', err);
  process.exit(1);
});