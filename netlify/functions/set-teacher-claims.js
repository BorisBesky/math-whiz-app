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

  const authHeader = event.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: "Missing authorization token" }),
    };
  }

  const { appId } = JSON.parse(event.body || '{}');
  if (!appId) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: "Missing appId" }),
    };
  }

  const token = authHeader.split("Bearer ")[1];

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    const uid = decodedToken.uid;

    // Verify the user has a teacher profile in Firestore
    const profileRef = db.doc(`artifacts/${appId}/users/${uid}/math_whiz_data/profile`);
    const profileSnap = await profileRef.get();

    if (!profileSnap.exists || profileSnap.data().role !== 'teacher') {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({ error: "User does not have a teacher profile." }),
      };
    }

    // Set the custom claim
    await admin.auth().setCustomUserClaims(uid, { role: "teacher" });
    console.log(`Teacher custom claim set for user ${uid}`);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true }),
    };
  } catch (error) {
    console.error("Error in set-teacher-claims:", error);
    if (error.code === 'auth/id-token-expired') {
      return { statusCode: 401, headers, body: JSON.stringify({ error: "Token expired." }) };
    }
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Internal Server Error", details: error.message }),
    };
  }
};
