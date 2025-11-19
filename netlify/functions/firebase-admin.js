const admin = require("firebase-admin");

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  // Handle private key encoding for different environments
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (privateKey) {
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
    } catch (error) {
      console.error("Private key processing error:", error);
      throw new Error("Failed to process Firebase private key");
    }
  }

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: privateKey,
    }),
    databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}.firebaseio.com`,
    storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET, // Add this line
  });
}

const db = admin.firestore();
const storage = admin.storage(); 

module.exports = { admin, db, storage }; // Export storage