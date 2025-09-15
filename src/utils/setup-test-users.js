// Test User Setup Script
// Run this in the browser console or as a Node.js script to create test users

const setupTestUsers = async () => {
  // This assumes Firebase is already initialized and auth/firestore are available
  const { getAuth, createUserWithEmailAndPassword } = require('firebase/auth');
  const { getFirestore, doc, setDoc } = require('firebase/firestore');
  
  const auth = getAuth();
  const db = getFirestore();
  const appId = 'default-app-id';

  const testUsers = [
    {
      email: 'teacher@test.com',
      password: 'teacher123',
      role: 'teacher',
      displayName: 'Test Teacher'
    },
    {
      email: 'admin@test.com', 
      password: 'admin123',
      role: 'admin',
      displayName: 'Test Admin'
    },
    {
      email: 'student@test.com',
      password: 'student123', 
      role: 'student',
      displayName: 'Test Student'
    }
  ];

  for (const userData of testUsers) {
    try {
      console.log(`Creating user: ${userData.email}`);
      
      // Create Firebase Auth user
      const userCredential = await createUserWithEmailAndPassword(auth, userData.email, userData.password);
      const user = userCredential.user;
      
      // Create user profile in Firestore
      await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'main'), {
        email: userData.email,
        role: userData.role,
        displayName: userData.displayName,
        createdAt: new Date(),
        isAnonymous: false
      });
      
      console.log(`✅ Created ${userData.role}: ${userData.email}`);
    } catch (error) {
      console.error(`❌ Error creating ${userData.email}:`, error.message);
    }
  }
  
  console.log('Setup complete!');
  console.log('Test credentials:');
  console.log('Teacher: teacher@test.com / teacher123');
  console.log('Admin: admin@test.com / admin123'); 
  console.log('Student: student@test.com / student123');
};

// For browser console usage:
// Copy and paste this entire script, then call: setupTestUsers()

// Export for Node.js usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { setupTestUsers };
}
