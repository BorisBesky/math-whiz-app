/* eslint-disable no-undef */
const { admin, db } = require("./firebase-admin");
const { Regex } = require("lucide-react");

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
    if (decodedToken.admin !== true && decodedToken.role !== 'teacher') {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({ error: "Forbidden: User is not an admin or teacher." }),
      };
    }

    // 3. Get the authenticated user's ID (could be admin or teacher)
    const authenticatedUserId = decodedToken.uid;

    // 4. Check if this is a teacher by querying for their profile
    const profileRef = db.doc(`artifacts/${appId}/users/${authenticatedUserId}/math_whiz_data/profile`);
    const profileSnap = await profileRef.get();
    // check if profile exists and has role 'teacher'
    let isTeacher = false;
    const enrollmentsByStudent = new Set();
    if (profileSnap.exists) {
      const profileData = profileSnap.data();
      if (profileData && profileData.role === 'teacher') {
        isTeacher = true;
        console.log(`User ${authenticatedUserId} is a teacher.`);
      }
    }

    console.log("getting user profiles group ...");
    const usersCollectionGroupRef = db.collectionGroup('math_whiz_data');

    let query;

    if (isTeacher) {
      console.log("User is teacher, will filter students by teacherId in their teacherIds array.");
      query = usersCollectionGroupRef.where('teacherIds', 'array-contains', authenticatedUserId);
    } else {
      console.log("User is admin, will return all students.");
      query = usersCollectionGroupRef;
    }

    console.log("Executing query to fetch user profiles...");
    const userDocsSnapshot = await query.get();

    if (userDocsSnapshot.empty) {
      console.log(`get users profiles returned 0 document references. The collection appears empty.`);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify([]),
      };
    }

    console.log(`get users profiles found ${userDocsSnapshot.size} document reference(s). Fetching data for each...`);
    
    const allStudentsData = [];
    userDocsSnapshot.forEach((userDoc) => {
      // extract userId from userDoc.id (the document ID is artifacts/{appId}/users/{userId}/math_whiz_data/profile)
      const userId = userDoc.ref.parent.parent.id
      console.log(`Extracted userId: ${userId}`);

      let studentData = null;

      // Get user data profile
      mathWhizProfileData = userDoc.data();
      if (mathWhizProfileData.role === 'student') {
        console.log(`Success: Found data in math_whiz_data/profile for ${userId}`);
        studentData = {
          id: userId,
          ...mathWhizProfileData,
        };
        allStudentsData.push(studentData);
      }

    });

    if (isTeacher) {
      console.log(`Teacher filtering: Returning ${allStudentsData.length} student(s) that have teacher ${authenticatedUserId} in their teacherIds array.`);
    } else {
      console.log(`Admin access: Returning all ${allStudentsData.length} student(s).`);
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(allStudentsData),
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
