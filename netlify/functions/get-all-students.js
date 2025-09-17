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
    const profileRef = db.doc(`artifacts/${appId}/users/${authenticatedUserId}/profile/main`);
    const profileSnap = await profileRef.get();
    // check if profile exists and has role 'teacher'
    let isTeacher = false;
    let classStudents = [];
    if (profileSnap.exists) {
      const profileData = profileSnap.data();
      if (profileData && profileData.role === 'teacher') {
        isTeacher = true;
        let classes = profileData.classes || [];
        if (classes.length > 0) {
          console.log(`User ${authenticatedUserId} is a teacher with classes: ${classes.join(', ')}`);
          // if classes are there, use them to filter students from classStudents collection
          const studentClassesQuery = db.collection(`artifacts/${appId}/classStudents`).where('classId', 'in', classes);
          const studentClassesSnapshot = await studentClassesQuery.get();
          if (!studentClassesSnapshot.empty) {
            console.log(`Found ${studentClassesSnapshot.size} classStudents documents for teacher's classes.`);
            studentClassesSnapshot.forEach(doc => {
              console.log(` - classStudents doc: ${doc.id} =>`, doc.data());
              classStudents.push(doc.data().studentId);
            });
          } else {
            console.log(`User ${authenticatedUserId} is a teacher but has no classes assigned.`);
          }
        }
      }
    }

    const usersCollectionRef = db.collection(`artifacts/${appId}/users`);
    // if teacher, filter users to only those in their classes
    if (isTeacher && classStudents.length > 0) {
      console.log(`Teacher access: Filtering students to only those in teacher's classes.`);
      usersCollectionRef = usersCollectionRef.where(admin.firestore.FieldPath.documentId(), 'in', classStudents);
    } else {
      console.log(`Admin access: No filtering, retrieving all students.`);
    }
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
      if (userDocSnapshot.exists) {
        const mathWhizDataRef = db.doc(`artifacts/${appId}/users/${userId}/math_whiz_data/profile`);
        const mathWhizDataSnapshot = await mathWhizDataRef.get();

        if (mathWhizDataSnapshot.exists) {
          const mathWhizProfileData = mathWhizDataSnapshot.data();
          if (mathWhizProfileData && Object.keys(mathWhizProfileData).length > 0) {
            console.log(`Success: Found data in nested profile document for ${userId}`);
            studentData = {
              id: userId,
              ...mathWhizProfileData,
            };
          }
        }

        const mainProfileRef = db.doc(`artifacts/${appId}/users/${userId}/profile/main`);
        const mainProfileSnapshot = await mainProfileRef.get();

        if (mainProfileSnapshot.exists) {
          const mainProfileData = mainProfileSnapshot.data();
          if (mainProfileData && Object.keys(mainProfileData).length > 0) {
            console.log(`Success: Found data in main profile document for ${userId}`);
            // append or overwrite studentData
            studentData = {
              id: userId,
              ...studentData, // existing data from math_whiz_data/profile if any
              ...mainProfileData, // overwrite/add data from profile/main
            };
          }
        }

      }
      
      if (!studentData) {
        console.log(`Info: No data found for user ${userId} in any expected location.`);
        return null;
      }

      return studentData;
    });

    const studentData = (await Promise.all(studentDataPromises)).filter(Boolean);

    if (classStudents.length > 0) {
      console.log(`Teacher filtering: Found ${classStudents.length} classes for teacher ${authenticatedUserId}`);
      console.log(`Teacher class IDs: ${classStudents.join(', ')}`);
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
