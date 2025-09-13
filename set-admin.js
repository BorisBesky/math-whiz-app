// This script is used to grant admin privileges to a Firebase user.
// To run it, you need to have your Firebase Admin SDK credentials set up
// in a .env file at the root of your project with the following variables:
// - FIREBASE_PROJECT_ID
// - FIREBASE_CLIENT_EMAIL  
// - FIREBASE_PRIVATE_KEY

// Usage: node set-admin.js <user-email-to-make-admin>

require('dotenv').config();
const admin = require('firebase-admin');

// Initialize Firebase Admin SDK using environment variables
if (!admin.apps.length) {
  try {
    // Handle private key encoding for different environments
    let privateKey = process.env.FIREBASE_PRIVATE_KEY;

    if (!privateKey) {
      throw new Error('FIREBASE_PRIVATE_KEY environment variable is required');
    }

    // Handle different encoding scenarios
    try {
      // First try: Replace literal \n with actual newlines
      privateKey = privateKey.replace(/\\n/g, "\n");

      // Second try: If it's base64 encoded, decode it
      if (!privateKey.includes("-----BEGIN PRIVATE KEY-----")) {
        privateKey = Buffer.from(privateKey, "base64").toString("utf8");
      }

      // Third try: Ensure proper formatting
      if (!privateKey.includes("-----BEGIN PRIVATE KEY-----")) {
        throw new Error("Private key format invalid");
      }
    } catch (keyError) {
      console.error("Private key processing error:", keyError);
      throw new Error("Failed to process Firebase private key");
    }

    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: privateKey,
      }),
      databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}.firebaseio.com`,
    });

    console.log('Firebase Admin SDK initialized successfully using environment variables.');
  } catch (error) {
    console.error('Error initializing Firebase Admin SDK:', error.message);
    console.error('Please ensure the following environment variables are set in your .env file:');
    console.error('- FIREBASE_PROJECT_ID');
    console.error('- FIREBASE_CLIENT_EMAIL');
    console.error('- FIREBASE_PRIVATE_KEY');
    process.exit(1);
  }
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
