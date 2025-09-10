// This script is used to grant admin privileges to a Firebase user.
// To run it, you need to have your Firebase Admin SDK credentials set up
// in a .env file at the root of your project.

// Usage: node set-admin.js <user-email-to-make-admin>

require('dotenv').config();
const admin = require('firebase-admin');

try {
  const serviceAccount = require('./math-whiz-1a337-firebase-adminsdk-fbsvc-34d55d222a.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
} catch (error) {
  console.error('Error initializing Firebase Admin SDK:', error.message);
  console.error('Please ensure the service account file exists at "./math-whiz-1a337-firebase-adminsdk-fbsvc-34d55d222a.json".');
  process.exit(1);
}

const userEmail = process.argv[2];

if (!userEmail) {
  console.error('Error: Please provide the email of the user to make an admin.');
  console.log('Usage: node set-admin.js <user-email-to-make-admin>');
  process.exit(1);
}


async function setAdminClaim() {
  try {
    // 1. Get the user by email
    const user = await admin.auth().getUserByEmail(userEmail);
    
    // 2. Check if the user is already an admin
    if (user.customClaims && user.customClaims.admin === true) {
      console.log(`User ${userEmail} (UID: ${user.uid}) is already an admin.`);
      return;
    }

    // 3. Set the custom claim { admin: true }
    await admin.auth().setCustomUserClaims(user.uid, { admin: true });
    
    console.log(`✅ Success! Custom claim { admin: true } has been set for user ${userEmail} (UID: ${user.uid}).`);
    console.log("They will have admin privileges on their next login.");

  } catch (error) {
    if (error.code === 'auth/user-not-found') {
      console.error(`Error: User with email "${userEmail}" not found in Firebase Authentication.`);
      console.error("Please create this user in the Firebase console first (Authentication -> Add user).");
    } else {
      console.error('An unexpected error occurred:', error);
    }
  }
}

setAdminClaim().then(() => process.exit(0));
