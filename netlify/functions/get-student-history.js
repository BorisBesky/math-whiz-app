const { admin, db } = require("./firebase-admin");
const { isTeacherOnClass } = require("./class-helpers");

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const normalizeDate = (value) => {
  if (!value) return "";
  if (value instanceof Date) return value.toISOString().split("T")[0];
  if (value && typeof value === "object" && typeof value.seconds === "number") {
    return new Date(value.seconds * 1000).toISOString().split("T")[0];
  }
  return String(value).split("T")[0];
};

const verifyAuthToken = async (authorization = "") => {
  const token = authorization.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length)
    : "";
  if (!token) {
    const err = new Error("Missing authorization token");
    err.statusCode = 401;
    throw err;
  }
  return admin.auth().verifyIdToken(token);
};

const canReadStudentHistory = async ({ appId, decodedToken, studentId, classId }) => {
  if (decodedToken.admin === true || decodedToken.uid === studentId) return true;

  const profileRef = db.doc(`artifacts/${appId}/users/${decodedToken.uid}/math_whiz_data/profile`);
  const profileSnap = await profileRef.get();
  const isTeacher = decodedToken.role === "teacher" || profileSnap.data()?.role === "teacher";
  if (!isTeacher) return false;

  if (classId && await isTeacherOnClass({ db, appId, classId, teacherId: decodedToken.uid })) {
    return true;
  }

  const studentProfileRef = db.doc(`artifacts/${appId}/users/${studentId}/math_whiz_data/profile`);
  const studentProfileSnap = await studentProfileRef.get();
  const teacherIds = studentProfileSnap.data()?.teacherIds || [];
  return Array.isArray(teacherIds) && teacherIds.includes(decodedToken.uid);
};

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers, body: JSON.stringify({ error: "Method Not Allowed" }) };
  }

  try {
    const decodedToken = await verifyAuthToken(event.headers.authorization || event.headers.Authorization);
    const {
      appId = "default-app-id",
      studentId,
      classId = "",
      startDate,
      endDate,
    } = JSON.parse(event.body || "{}");

    if (!studentId) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: "studentId is required" }) };
    }

    const authorized = await canReadStudentHistory({ appId, decodedToken, studentId, classId });
    if (!authorized) {
      return { statusCode: 403, headers, body: JSON.stringify({ error: "Forbidden" }) };
    }

    const normalizedStart = normalizeDate(startDate);
    const normalizedEnd = normalizeDate(endDate);
    const attemptsRef = db
      .collection("artifacts")
      .doc(appId)
      .collection("users")
      .doc(studentId)
      .collection("attempts");

    let attemptsQuery = attemptsRef;
    if (normalizedStart) {
      attemptsQuery = attemptsQuery.where("date", ">=", normalizedStart);
    }
    if (normalizedEnd) {
      attemptsQuery = attemptsQuery.where("date", "<=", normalizedEnd);
    }
    attemptsQuery = attemptsQuery.orderBy("date", "desc");

    const attemptsSnap = await attemptsQuery.get();
    let answeredQuestions = attemptsSnap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })).sort((a, b) => String(b.timestamp || "").localeCompare(String(a.timestamp || "")));

    if (answeredQuestions.length === 0) {
      const profileRef = db.doc(`artifacts/${appId}/users/${studentId}/math_whiz_data/profile`);
      const profileSnap = await profileRef.get();
      const legacy = Array.isArray(profileSnap.data()?.answeredQuestions)
        ? profileSnap.data().answeredQuestions
        : [];
      answeredQuestions = legacy.filter((question) => {
        const date = normalizeDate(question.date || question.timestamp);
        if (normalizedStart && date < normalizedStart) return false;
        if (normalizedEnd && date > normalizedEnd) return false;
        return true;
      });
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ answeredQuestions }),
    };
  } catch (error) {
    console.error("Error in get-student-history function:", error);
    return {
      statusCode: error.statusCode || 500,
      headers,
      body: JSON.stringify({ error: error.message || "Internal Server Error" }),
    };
  }
};
