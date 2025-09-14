/* eslint-disable no-undef */
const { admin, db } = require("./firebase-admin");

exports.handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }
  
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers, body: JSON.stringify({ error: "Method Not Allowed" }) };
  }

  if (admin.apps.length === 0) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: "Firebase Admin SDK not initialized." }) };
  }

  const { appId } = JSON.parse(event.body);
  const authHeader = event.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ") || !appId) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: "Missing authorization token or appId" }) };
  }

  const token = authHeader.split("Bearer ")[1];

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    
    if (decodedToken.admin !== true) {
      return { statusCode: 403, headers, body: JSON.stringify({ error: "Forbidden: User is not an admin." }) };
    }

    const usersCollectionRef = db.collection(`artifacts/${appId}/users`);
    const userDocRefs = await usersCollectionRef.listDocuments();

    if (userDocRefs.length === 0) {
      return { statusCode: 200, headers, body: JSON.stringify([]) };
    }

    const teacherDataPromises = userDocRefs.map(async (userDocRef) => {
      const userId = userDocRef.id;
      const profileDocRef = db.doc(`artifacts/${appId}/users/${userId}/profile/main`);
      const profileSnapshot = await profileDocRef.get();

      if (profileSnapshot.exists) {
        const profileData = profileSnapshot.data();
        if (profileData && profileData.role === 'teacher') {
          return {
            id: userId,
            ...profileData,
          };
        }
      }
      return null;
    });

    const results = await Promise.all(teacherDataPromises);
    const teachers = results.filter(t => t !== null);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(teachers),
    };

  } catch (error) {
    console.error("Error fetching teachers:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Internal Server Error", details: error.message }),
    };
  }
};
