/* eslint-disable no-undef */
const { admin, db } = require("./firebase-admin");

exports.handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*", // Or your specific domain
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }
  
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: "Method Not Allowed" }),
    };
  }

  if (admin.apps.length === 0) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Internal Server Error: Firebase Admin SDK not initialized." }),
    };
  }

  // Get token from header, appId from body
  const { appId } = JSON.parse(event.body);
  console.log("appId=", appId);
  const authHeader = event.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ") || !appId) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: "Missing authorization token or appId" }),
    };
  }

  const token = authHeader.split("Bearer ")[1];

  try {
    // 1. Verify the user's ID token
    const decodedToken = await admin.auth().verifyIdToken(token);
    
    // 2. IMPORTANT: Check for admin custom claim
    if (decodedToken.admin !== true) {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({ error: "Forbidden: User is not an admin." }),
      };
    }

    const usersCollectionRef = db.collection(`artifacts/${appId}/users`);
    const userDocRefs = await usersCollectionRef.listDocuments();

    if (userDocRefs.length === 0) {
      console.log("listDocuments() returned 0 document references. The collection appears empty.");
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify([]),
      };
    }

    console.log(`listDocuments() found ${userDocRefs.length} document reference(s). Fetching data for each...`);

    const studentDataPromises = userDocRefs.map(async (userDocRef) => {
      const userId = userDocRef.id;
      const userDocSnapshot = await userDocRef.get();

      // Check 1: Does the main user document contain data?
      if (userDocSnapshot.exists) {
        const userData = userDocSnapshot.data();
        // Check if the data object is not empty
        if (userData && Object.keys(userData).length > 0) {
          console.log(`Success: Found data directly in user document for ${userId}`);
          return {
            id: userId,
            ...userData,
          };
        }
      }

      // Check 2: If not, does the nested 'profile' document exist and contain data?
      const profileDocRef = db.doc(`artifacts/${appId}/users/${userId}/math_whiz_data/profile`);
      const profileSnapshot = await profileDocRef.get();

      if (profileSnapshot.exists) {
        const profileData = profileSnapshot.data();
        if (profileData && Object.keys(profileData).length > 0) {
          console.log(`Success: Found data in nested profile document for ${userId}`);
          return {
            id: userId,
            ...profileData,
          };
        }
      }
      
      console.log(`Info: No data found for user ${userId} in any expected location.`);
      return null;
    });

    const studentData = (await Promise.all(studentDataPromises)).filter(Boolean);

    console.log(`Successfully processed ${studentData.length} student(s).`);
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(studentData),
    };
  } catch (error) {
    console.error("Error in get-all-students function:", error);
    if (error.code === 'auth/id-token-expired') {
        return { statusCode: 401, headers, body: JSON.stringify({ error: "Token expired. Please log in again." }) };
    }
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Internal Server Error", details: error.message }),
    };
  }
};
