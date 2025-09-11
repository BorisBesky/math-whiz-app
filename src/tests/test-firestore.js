// Import the Firebase Admin SDK
const admin = require("firebase-admin");

// Import your service account key
const serviceAccount = require("./math-whiz-1a337-firebase-adminsdk-fbsvc-34d55d222a.json");

// Initialize the app with a service account, granting admin privileges
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// Get a reference to the Firestore service
const db = admin.firestore();

// Now you can use the 'db' object to interact with Firestore
async function getDocs(collection) {
  const collectionRef = db.collection(collection);
  console.log(`getting docs from ${collectionRef.path}`);
  const docs = await collectionRef.listDocuments();
  
  if (docs.length === 0) {
    console.log('No matching documents.');
    return;
  }

  docs.forEach(doc => {
    console.log(doc.path, '=>', doc.path);
  });
}

async function getAllCollections() {
  const collections = await db.listCollections();
  if (collections.length === 0) {
    console.log('No collections found');
    return;
  }
  collections.forEach(collection => {
    console.log(`getting docs from ${collection.id}`);
    getDocs(collection.id);
  });
}

getAllCollections();
