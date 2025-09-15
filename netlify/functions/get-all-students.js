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

    // 3. Get the authenticated user's ID (could be admin or teacher)
    const authenticatedUserId = decodedToken.uid;
    
    // 4. Check if this is a teacher by querying for their classes
    const classesRef = db.collection(`artifacts/${appId}/classes`);
    const teacherClassesQuery = classesRef.where('teacherId', '==', authenticatedUserId);
    const teacherClassesSnapshot = await teacherClassesQuery.get();
    
    // 5. Extract class IDs for teacher filtering (empty array if admin)
    const teacherClassIds = [];
    teacherClassesSnapshot.forEach(doc => {
      teacherClassIds.push(doc.id);
    });

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

      let studentData = null;

      // Check 1: Does the main user document contain data?
      if (userDocSnapshot.exists) {
        const userData = userDocSnapshot.data();
        // Check if the data object is not empty
        if (userData && Object.keys(userData).length > 0) {
          console.log(`Success: Found data directly in user document for ${userId}`);
          studentData = {
            id: userId,
            ...userData,
          };
        }
      }

      // Check 2: If not, does the nested 'profile' document exist and contain data?
      if (!studentData) {
        const profileDocRef = db.doc(`artifacts/${appId}/users/${userId}/math_whiz_data/profile`);
        const profileSnapshot = await profileDocRef.get();

        if (profileSnapshot.exists) {
          const profileData = profileSnapshot.data();
          if (profileData && Object.keys(profileData).length > 0) {
            console.log(`Success: Found data in nested profile document for ${userId}`);
            studentData = {
              id: userId,
              ...profileData,
            };
          }
        }
      }
      
      if (!studentData) {
        console.log(`Info: No data found for user ${userId} in any expected location.`);
        return null;
      }

      // 3. Filter by teacher's classes if this user is a teacher (has classes assigned)
      if (teacherClassIds.length > 0) {
        // This is a teacher, so filter students by classId
        if (!studentData.classId || !teacherClassIds.includes(studentData.classId)) {
          console.log(`Filtered out student ${userId} - not in teacher's classes`);
          return null;
        }
        console.log(`Student ${userId} belongs to teacher's class ${studentData.classId}`);
      }

      return studentData;
    });

    const studentData = (await Promise.all(studentDataPromises)).filter(Boolean);

    if (teacherClassIds.length > 0) {
      console.log(`Teacher filtering: Found ${teacherClassIds.length} classes for teacher ${authenticatedUserId}`);
      console.log(`Teacher class IDs: ${teacherClassIds.join(', ')}`);
      console.log(`Returning ${studentData.length} student(s) from teacher's classes.`);
    } else {
      console.log(`Admin access: Returning all ${studentData.length} student(s).`);
    }
    
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
