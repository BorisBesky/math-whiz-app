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
    const profileRef = db.doc(`artifacts/${appId}/users/${authenticatedUserId}/math_whiz_data/profile`);
    const profileSnap = await profileRef.get();
    // check if profile exists and has role 'teacher'
    let isTeacher = false;
    let classStudents = [];
    const enrollmentsByStudent = {};
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
              const data = doc.data();
              console.log(` - classStudents doc: ${doc.id} =>`, data);
              classStudents.push(data.studentId);
              if (data.studentId && data.classId && !enrollmentsByStudent[data.studentId]) {
                enrollmentsByStudent[data.studentId] = data.classId;
              }
            });
          } else {
            console.log(`User ${authenticatedUserId} is a teacher but has no classes assigned.`);
          }
        }
      }
    }

    // Use let so we can optionally apply a teacher filter below
    let usersCollectionRef = db.collection(`artifacts/${appId}/users`);
    // if teacher, filter users to only those in their classes
    if (isTeacher && classStudents.length > 0) {
      console.log(`Teacher access: Filtering students to only those in teacher's classes.`);
      usersCollectionRef = usersCollectionRef.where(admin.firestore.FieldPath.documentId(), 'in', classStudents);
    } else {
      console.log(`Admin access: No filtering, retrieving all students.`);
      // For admins, build a map of enrollments so we can reflect class assignment
      try {
        const allEnrollmentsSnap = await db.collection(`artifacts/${appId}/classStudents`).get();
        console.log(`Admin access: found ${allEnrollmentsSnap.size} enrollment records.`);
        allEnrollmentsSnap.forEach(doc => {
          const data = doc.data();
          if (data.studentId && data.classId && !enrollmentsByStudent[data.studentId]) {
            enrollmentsByStudent[data.studentId] = data.classId;
          }
        });
      } catch (e) {
        console.warn('Warning: failed to load class enrollments for admin mapping:', e.message);
      }
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
      // Note: parent doc may not exist; subcollections can exist independently
      let studentData = null;

      // Try the primary location first: /math_whiz_data/profile
      const mathWhizDataRef = db.doc(`artifacts/${appId}/users/${userId}/math_whiz_data/profile`);
      const mathWhizDataSnapshot = await mathWhizDataRef.get();

      if (mathWhizDataSnapshot.exists) {
        const mathWhizProfileData = mathWhizDataSnapshot.data();
        if (mathWhizProfileData && Object.keys(mathWhizProfileData).length > 0) {
          console.log(`Success: Found data in math_whiz_data/profile for ${userId}`);
          studentData = {
            id: userId,
            ...mathWhizProfileData,
          };
        }
      }

      if (!studentData) {
        console.log(`Info: No data found for user ${userId} in any expected location.`);
        return null;
      }

      // If classId not present on profile, try to populate from enrollments mapping
      if (!studentData.classId && enrollmentsByStudent[userId]) {
        studentData.classId = enrollmentsByStudent[userId];
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
