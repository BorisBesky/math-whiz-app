/* eslint-disable no-undef */
const { admin, db } = require("./firebase-admin");

exports.handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
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

  const { appId, userId } = JSON.parse(event.body);
  const authHeader = event.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ") || !appId || !userId) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: "Missing authorization token, appId, or userId" }),
    };
  }

  const token = authHeader.split("Bearer ")[1];

  try {
    // Verify the user's ID token and check for admin
    const decodedToken = await admin.auth().verifyIdToken(token);
    if (decodedToken.admin !== true) {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({ error: "Forbidden: User is not an admin." }),
      };
    }

    console.log(`🔍 Diagnosing user data locations for: ${userId}`);

    const locations = [
      {
        name: 'math_whiz_data/profile (current standard)',
        path: `artifacts/${appId}/users/${userId}/math_whiz_data/profile`
      },
      {
        name: 'profile/main (legacy)',
        path: `artifacts/${appId}/users/${userId}/profile/main`
      },
      {
        name: 'profile (legacy)',
        path: `artifacts/${appId}/users/${userId}/profile`
      }
    ];

    const results = {};

    for (const location of locations) {
      try {
        const docRef = db.doc(location.path);
        const docSnapshot = await docRef.get();
        
        if (docSnapshot.exists) {
          const data = docSnapshot.data();
          results[location.name] = {
            exists: true,
            path: location.path,
            dataKeys: Object.keys(data || {}),
            hasRole: !!data?.role,
            role: data?.role,
            hasEmail: !!data?.email,
            email: data?.email,
            isAnonymous: data?.isAnonymous,
            createdAt: data?.createdAt
          };
          console.log(`✅ Found data at: ${location.path}`);
        } else {
          results[location.name] = {
            exists: false,
            path: location.path
          };
          console.log(`❌ No data at: ${location.path}`);
        }
      } catch (error) {
        results[location.name] = {
          exists: false,
          path: location.path,
          error: error.message
        };
        console.log(`💥 Error checking: ${location.path} - ${error.message}`);
      }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        userId,
        results,
        summary: {
          hasCurrentLocation: results['math_whiz_data/profile (current standard)']?.exists || false,
          hasLegacyLocation: results['profile/main (legacy)']?.exists || results['profile (legacy)']?.exists || false,
          needsMigration: !results['math_whiz_data/profile (current standard)']?.exists && 
                         (results['profile/main (legacy)']?.exists || results['profile (legacy)']?.exists)
        }
      }),
    };
  } catch (error) {
    console.error("Error in diagnose-user-data function:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Internal Server Error", details: error.message }),
    };
  }
};