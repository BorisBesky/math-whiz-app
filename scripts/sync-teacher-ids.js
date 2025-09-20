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

/**
 * Synchronization Script: Sync `teacherIds` in student profiles.
 * 
 * This script ensures that the `teacherIds` array in each student's profile
 * (`/users/{userId}/math_whiz_data/profile`) is consistent with their
 * current class enrollments in the `classStudents` collection.
 */
async function syncTeacherIds() {
  console.log('🚀 Starting teacher ID synchronization...');
  const appId = process.env.APP_ID;
  console.log(`Using APP_ID: ${appId}`);

  const artifacts = db.collection('artifacts').doc(appId);
  const classesCol = artifacts.collection('classes');
  const enrollmentsCol = artifacts.collection('classStudents');
  const usersCol = artifacts.collection('users');

  try {
    // 1. Create a map of classId -> teacherId
    console.log('📚 Fetching all classes to map teacher IDs...');
    const classMap = new Map();
    const classesSnapshot = await classesCol.get();
    classesSnapshot.forEach(doc => {
      classMap.set(doc.id, doc.data().teacherId);
    });
    console.log(`✅ Found ${classMap.size} classes.`);

    // 2. Fetch all enrollments and group by student
    console.log('🧑‍🎓 Fetching all student enrollments...');
    const studentEnrollments = new Map();
    const enrollmentsSnapshot = await enrollmentsCol.get();
    enrollmentsSnapshot.forEach(doc => {
      const { studentId, classId } = doc.data();
      if (!studentId || !classId) return;
      if (!studentEnrollments.has(studentId)) {
        studentEnrollments.set(studentId, []);
      }
      studentEnrollments.get(studentId).push(classId);
    });
    console.log(`✅ Found enrollments for ${studentEnrollments.size} students.`);

    let studentsUpdated = 0;
    const totalStudents = studentEnrollments.size;
    let studentIndex = 0;

    // 3. Iterate through each student and sync their teacherIds
    for (const [studentId, classIds] of studentEnrollments.entries()) {
      studentIndex++;
      console.log(`\n[${studentIndex}/${totalStudents}] Processing student: ${studentId}`);

      // Determine the correct set of teacher IDs for the student
      const correctTeacherIds = new Set();
      classIds.forEach(classId => {
        const teacherId = classMap.get(classId);
        if (teacherId) {
          correctTeacherIds.add(teacherId);
        }
      });
      const correctTeacherIdsArray = Array.from(correctTeacherIds);

      // Get the student's current profile
      const profileRef = usersCol.doc(studentId).collection('math_whiz_data').doc('profile');
      const profileSnap = await profileRef.get();

      if (!profileSnap.exists) {
        console.warn(`   - ⚠️  Profile not found for student ${studentId}. Creating with correct teacherIds.`);
        await profileRef.set({ teacherIds: correctTeacherIdsArray, updatedAt: new Date() }, { merge: true });
        studentsUpdated++;
        continue;
      }

      const profileData = profileSnap.data();
      const currentTeacherIds = profileData.teacherIds || [];
      
      // Sort arrays to ensure consistent comparison
      const sortedCurrent = [...currentTeacherIds].sort();
      const sortedCorrect = [...correctTeacherIdsArray].sort();

      if (JSON.stringify(sortedCurrent) !== JSON.stringify(sortedCorrect)) {
        console.log(`   - 🔄 Mismatch found for student ${studentId}.`);
        console.log(`     - Current: [${sortedCurrent.join(', ')}]`);
        console.log(`     - Correct: [${sortedCorrect.join(', ')}]`);
        console.log('   - Updating profile...');
        await profileRef.update({ teacherIds: correctTeacherIdsArray });
        studentsUpdated++;
      } else {
        console.log(`   - ✅ Profile is already in sync for student ${studentId}.`);
      }
    }

    console.log('\n\n🎉 Synchronization complete!');
    console.log(`- Total students with enrollments processed: ${totalStudents}`);
    console.log(`- Students updated: ${studentsUpdated}`);

  } catch (error) {
    console.error('❌ An error occurred during synchronization:', error);
    process.exit(1);
  }
}

// Execute the script
syncTeacherIds().then(() => {
  console.log('Script finished.');
  process.exit(0);
}).catch(err => {
  console.error('Script failed with unhandled error:', err);
  process.exit(1);
});
