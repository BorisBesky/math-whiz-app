/* eslint-disable no-undef */
const { admin, db } = require("./firebase-admin");

const getTodayDateString = () => new Date().toISOString().split('T')[0];

const compactProfileFields = [
  'role',
  'teacherIds',
  'email',
  'displayName',
  'name',
  'firstName',
  'lastName',
  'selectedGrade',
  'grade',
  'coins',
  'classId',
  'className',
  'dailyGoals',
  'dailyGoalsByGrade',
  'progress',
  'progressByGrade',
  'questionSummary',
  'questionStatsByDate',
];

const getQuestionSummary = (profileData) => {
  const summary = profileData.questionSummary || {};
  const today = getTodayDateString();
  const todayStats = profileData.questionStatsByDate?.[today] || {};
  const totalQuestions = Number(summary.total || 0);
  const correctQuestions = Number(summary.correct || 0);
  return {
    totalQuestions,
    correctQuestions,
    questionsToday: Number(todayStats.total || 0),
    correctToday: Number(todayStats.correct || 0),
    latestActivity: summary.latestActivity || null,
    accuracy: totalQuestions > 0 ? Math.round((correctQuestions / totalQuestions) * 100) : 0,
  };
};

const buildStudentResponse = (userDoc, { appId, includeHistory, seenStudentIds }) => {
  const docPath = userDoc.ref.path;
  const studentProfilePathPrefix = `artifacts/${appId}/users/`;
  // collectionGroup matches every `math_whiz_data` subtree in the project; constrain to this app.
  if (!docPath.startsWith(studentProfilePathPrefix)) return null;

  const userId = userDoc.ref.parent.parent.id;
  if (!userId || seenStudentIds.has(userId)) return null;

  const fullProfileData = userDoc.data();
  if (!fullProfileData || fullProfileData.role !== 'student') return null;

  seenStudentIds.add(userId);
  const profileData = includeHistory
    ? fullProfileData
    : compactProfileFields.reduce((acc, field) => {
        if (Object.prototype.hasOwnProperty.call(fullProfileData, field)) {
          acc[field] = fullProfileData[field];
        }
        return acc;
      }, {});
  const questionSummary = getQuestionSummary(fullProfileData);
  return {
    id: userId,
    ...profileData,
    ...questionSummary,
  };
};

const getTeacherStudentProfileDocs = async ({ appId, teacherId }) => {
  const artifactRef = db.collection('artifacts').doc(appId);
  const classesSnapshot = await artifactRef
    .collection('classes')
    .where('teacherIds', 'array-contains', teacherId)
    .get();

  if (classesSnapshot.empty) {
    return getLegacyTeacherStudentProfileDocs({ appId, teacherId });
  }

  const classIds = classesSnapshot.docs.map((classDoc) => classDoc.id);
  const enrollmentSnapshots = await Promise.all(classIds.map((classId) => (
    artifactRef.collection('classStudents').where('classId', '==', classId).get()
  )));

  const studentIds = new Set();
  enrollmentSnapshots.forEach((snapshot) => {
    snapshot.docs.forEach((enrollmentDoc) => {
      const studentId = enrollmentDoc.data()?.studentId;
      if (studentId) studentIds.add(studentId);
    });
  });

  const profileRefs = [...studentIds].map((studentId) => (
    artifactRef.collection('users').doc(studentId).collection('math_whiz_data').doc('profile')
  ));
  const profileSnaps = await Promise.all(profileRefs.map((profileRef) => profileRef.get()));
  const profileDocs = profileSnaps.filter((profileSnap) => profileSnap.exists);

  if (profileDocs.length > 0) {
    return profileDocs;
  }

  return getLegacyTeacherStudentProfileDocs({ appId, teacherId });
};

const getLegacyTeacherStudentProfileDocs = async ({ appId, teacherId }) => {
  try {
    console.log("No enrollment-backed students found; checking legacy profile.teacherIds.");
    const snapshot = await db.collectionGroup('math_whiz_data')
      .where('teacherIds', 'array-contains', teacherId)
      .get();
    const docs = [];
    snapshot.forEach((doc) => {
      if (doc.ref.path.startsWith(`artifacts/${appId}/users/`)) {
        docs.push(doc);
      }
    });
    return docs;
  } catch (error) {
    console.warn("Legacy teacher profile lookup failed; continuing with no students.", error);
    return [];
  }
};

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
  const { appId, includeHistory = false } = JSON.parse(event.body);
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

    // 2. Check for admin/teacher authorization via custom claims or Firestore profile
    let isAuthorized = decodedToken.admin === true || decodedToken.role === 'teacher';

    if (!isAuthorized) {
      // Fallback: check Firestore profile for teacher role (handles self-registered teachers
      // whose custom claims may not yet be propagated)
      const authProfileRef = db.doc(`artifacts/${appId}/users/${decodedToken.uid}/math_whiz_data/profile`);
      const authProfileSnap = await authProfileRef.get();
      if (authProfileSnap.exists && authProfileSnap.data().role === 'teacher') {
        isAuthorized = true;
      }
    }

    if (!isAuthorized) {
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

    let userDocsSnapshot;

    if (isTeacher) {
      console.log("User is teacher, will fetch students through class enrollments.");
      const teacherStudentDocs = await getTeacherStudentProfileDocs({
        appId,
        teacherId: authenticatedUserId,
      });
      userDocsSnapshot = {
        empty: teacherStudentDocs.length === 0,
        size: teacherStudentDocs.length,
        forEach: (cb) => teacherStudentDocs.forEach(cb),
      };
    } else {
      console.log("getting user profiles group ...");
      const usersCollectionGroupRef = db.collectionGroup('math_whiz_data');
      console.log("User is admin, will return all students.");
      const query = usersCollectionGroupRef.where('role', '==', 'student');
      console.log("Executing query to fetch user profiles...");
      // Note: we intentionally do NOT use Firestore's native `.select()` projection here.
      // Projection queries on a collectionGroup query are served directly from the index
      // and require a dedicated composite index covering every selected field; without one
      // (none is provisioned for this app) Firestore throws FAILED_PRECONDITION at query time.
      // Instead we fetch full documents and trim fields in-process below.
      userDocsSnapshot = await query.get();
    }

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
    const seenStudentIds = new Set();

    userDocsSnapshot.forEach((userDoc) => {
      const student = buildStudentResponse(userDoc, { appId, includeHistory, seenStudentIds });
      if (student) allStudentsData.push(student);
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
