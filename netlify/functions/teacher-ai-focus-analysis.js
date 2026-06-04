const { GoogleGenerativeAI } = require("@google/generative-ai");
const { admin, db } = require("./firebase-admin");
const { generateContentWithRetry } = require("./retry-utils");
const { isTeacherOnClass } = require("./class-helpers");
const {
  GRADES,
  VALID_TOPICS_BY_GRADE,
  SUBTOPICS_BY_GRADE_TOPIC,
} = require("../../src/constants/shared-constants.js");

const MODES = new Set(["get", "suggest", "update", "delete", "apply"]);
const UNSPECIFIED_SUBTOPIC = "Unspecified";

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
  const dateString = String(value);
  if (dateString.includes("/")) {
    const [month, day, year] = dateString.split("/");
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }
  return dateString.split("T")[0];
};

const inferGradeForTopic = (topic, fallbackGrade = GRADES.G3) => {
  if (VALID_TOPICS_BY_GRADE[GRADES.G3].includes(topic)) return GRADES.G3;
  if (VALID_TOPICS_BY_GRADE[GRADES.G4].includes(topic)) return GRADES.G4;
  return fallbackGrade;
};

const normalizeText = (value) => String(value || "").trim().toLowerCase();

const SUBTOPIC_ALIASES = {
  [GRADES.G4]: {
    Geometry: {
      "line symmetry": "symmetry",
      "triangle classification": "triangles",
      "quadrilateral properties": "quadrilaterals",
    },
    "Base Ten": {
      "addition word problems": "addition",
      "subtraction word problems": "subtraction",
      "long division with remainder": "division",
    },
  },
};

const normalizeSubtopicForTopic = (grade, topic, subtopic) => {
  const raw = String(subtopic || "").trim();
  if (!raw) return UNSPECIFIED_SUBTOPIC;

  const valid = SUBTOPICS_BY_GRADE_TOPIC[grade]?.[topic] || [];
  const direct = valid.find((item) => normalizeText(item) === normalizeText(raw));
  if (direct) return direct;

  const alias = SUBTOPIC_ALIASES[grade]?.[topic]?.[raw] || SUBTOPIC_ALIASES[grade]?.[topic]?.[normalizeText(raw)];
  if (alias) return alias;

  return UNSPECIFIED_SUBTOPIC;
};

const verifyAuthToken = async (authHeader) => {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    const err = new Error("Missing or invalid authorization header");
    err.statusCode = 401;
    throw err;
  }
  const token = authHeader.split("Bearer ")[1];
  try {
    return await admin.auth().verifyIdToken(token);
  } catch {
    const err = new Error("Invalid authentication token");
    err.statusCode = 401;
    throw err;
  }
};

const getProfile = async (appId, userId) => {
  const ref = db.doc(`artifacts/${appId}/users/${userId}/math_whiz_data/profile`);
  const snap = await ref.get();
  return { ref, snap, data: snap.exists ? snap.data() : null };
};

const verifyTeacherAccess = async ({ appId, decodedToken, studentId, classId, mode }) => {
  const teacherId = decodedToken.uid;
  if (decodedToken.admin === true || decodedToken.role === "admin") {
    if (classId) {
      const enrollmentRef = db.doc(`artifacts/${appId}/classStudents/${classId}__${studentId}`);
      const enrollmentSnap = await enrollmentRef.get();
      if (!enrollmentSnap.exists || enrollmentSnap.data()?.studentId !== studentId) {
        const err = new Error("Student enrollment not found");
        err.statusCode = 404;
        throw err;
      }
      return { role: "admin", enrollmentRef, enrollmentData: enrollmentSnap.data() };
    }
    return { role: "admin", enrollmentRef: null, enrollmentData: null };
  }

  const teacherProfile = await getProfile(appId, teacherId);
  if (teacherProfile.data?.role === "admin") {
    if (classId) {
      const enrollmentRef = db.doc(`artifacts/${appId}/classStudents/${classId}__${studentId}`);
      const enrollmentSnap = await enrollmentRef.get();
      if (!enrollmentSnap.exists || enrollmentSnap.data()?.studentId !== studentId) {
        const err = new Error("Student enrollment not found");
        err.statusCode = 404;
        throw err;
      }
      return { role: "admin", enrollmentRef, enrollmentData: enrollmentSnap.data() };
    }
    return { role: "admin", enrollmentRef: null, enrollmentData: null };
  }

  const isTeacher = decodedToken.role === "teacher" || teacherProfile.data?.role === "teacher";
  if (!isTeacher) {
    const err = new Error("Forbidden: teacher access required");
    err.statusCode = 403;
    throw err;
  }

  if (!classId) {
    if (mode === "apply") {
      const err = new Error("Class ID is required to apply focus recommendations");
      err.statusCode = 400;
      throw err;
    }
    const studentProfile = await getProfile(appId, studentId);
    if (Array.isArray(studentProfile.data?.teacherIds) && studentProfile.data.teacherIds.includes(teacherId)) {
      return { role: "teacher", enrollmentRef: null, enrollmentData: null };
    }
    const err = new Error("Forbidden: teacher is not assigned to this student");
    err.statusCode = 403;
    throw err;
  }

  const enrollmentRef = db.doc(`artifacts/${appId}/classStudents/${classId}__${studentId}`);
  const enrollmentSnap = await enrollmentRef.get();
  if (!enrollmentSnap.exists || enrollmentSnap.data()?.studentId !== studentId) {
    const err = new Error("Student enrollment not found");
    err.statusCode = 404;
    throw err;
  }

  const classRef = db.doc(`artifacts/${appId}/classes/${classId}`);
  const classSnap = await classRef.get();
  if (!classSnap.exists || !isTeacherOnClass(classSnap.data(), teacherId)) {
    const err = new Error("Forbidden: teacher is not assigned to this class");
    err.statusCode = 403;
    throw err;
  }

  return { role: "teacher", enrollmentRef, enrollmentData: enrollmentSnap.data() };
};

const aggregateQuestions = (questions, { startDate, endDate, fallbackGrade }) => {
  const start = normalizeDate(startDate);
  const end = normalizeDate(endDate);
  const groups = new Map();
  const recentMisses = [];

  const inRange = questions.filter((question) => {
    const questionDate = normalizeDate(question.date || question.timestamp);
    return questionDate && questionDate >= start && questionDate <= end;
  });

  inRange.forEach((question) => {
    const topic = question.topic || "Unknown";
    const grade = [GRADES.G3, GRADES.G4].includes(question.grade)
      ? question.grade
      : inferGradeForTopic(topic, fallbackGrade);
    if (!VALID_TOPICS_BY_GRADE[grade]?.includes(topic)) return;

    const subtopic = normalizeSubtopicForTopic(grade, topic, question.subtopic);
    const key = `${grade}::${topic}::${subtopic}`;
    if (!groups.has(key)) {
      groups.set(key, {
        grade,
        topic,
        subtopic,
        attempts: 0,
        correct: 0,
        incorrect: 0,
        totalTime: 0,
        timedAttempts: 0,
        recentMisses: 0,
      });
    }

    const group = groups.get(key);
    group.attempts += 1;
    if (question.isCorrect) group.correct += 1;
    else {
      group.incorrect += 1;
      if (recentMisses.length < 8) {
        recentMisses.push({
          topic,
          subtopic,
          question: String(question.question || "").slice(0, 140),
        });
      }
    }
    const timeTaken = Number(question.timeTaken);
    if (Number.isFinite(timeTaken) && timeTaken > 0) {
      group.totalTime += timeTaken;
      group.timedAttempts += 1;
    }
  });

  const metrics = Array.from(groups.values()).map((group) => ({
    grade: group.grade,
    topic: group.topic,
    subtopic: group.subtopic,
    attempts: group.attempts,
    correct: group.correct,
    incorrect: group.incorrect,
    accuracy: Math.round((group.correct / group.attempts) * 100),
    averageTime: group.timedAttempts > 0 ? Math.round((group.totalTime / group.timedAttempts) * 10) / 10 : null,
  }));

  const rankedNeeds = metrics
    .map((item) => {
      const lowAccuracy = Math.max(0, 85 - item.accuracy);
      const smallSamplePenalty = item.attempts < 3 ? 12 : 0;
      const slowPenalty = item.averageTime && item.averageTime > 20 ? 8 : 0;
      const score = lowAccuracy + item.incorrect * 10 + smallSamplePenalty + slowPenalty;
      return { ...item, needScore: score };
    })
    .sort((a, b) => b.needScore - a.needScore);

  const notEnoughData = metrics
    .filter((item) => item.attempts > 0 && item.attempts < 3)
    .map((item) => ({
      grade: item.grade,
      topic: item.topic,
      subtopic: item.subtopic,
      attempts: item.attempts,
      note: "Fewer than 3 attempts in the selected range.",
    }));

  return {
    questionsInRange: inRange,
    metrics,
    rankedNeeds,
    recentMisses,
    notEnoughData,
  };
};

const extractJsonCandidate = (text) => {
  if (!text) return text;
  const fenced = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/```\s*([\s\S]*?)\s*```/);
  if (fenced) return fenced[1];
  const firstObject = text.indexOf("{");
  const lastObject = text.lastIndexOf("}");
  if (firstObject !== -1 && lastObject !== -1 && lastObject > firstObject) {
    return text.slice(firstObject, lastObject + 1);
  }
  return text;
};

const sanitizeLLMJsonString = (input) => {
  if (!input) return input;
  return input
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/\u2019/g, "'")
    .replace(/,\s*(\}|\])/g, "$1");
};

const buildPrompt = ({ student, startDate, endDate, metrics, rankedNeeds, notEnoughData, recentMisses }) => {
  return `You are an elementary math instructional coach for Math Whiz. Analyze the aggregate student performance data below and recommend which topics and subtopics need additional focus to achieve mastery.

Student context:
${JSON.stringify({
    grade: student.selectedGrade || student.grade || null,
    startDate,
    endDate,
  })}

Known curriculum subtopics:
${JSON.stringify(SUBTOPICS_BY_GRADE_TOPIC)}

Aggregate performance by topic/subtopic:
${JSON.stringify(metrics)}

Deterministic need ranking from the app:
${JSON.stringify(rankedNeeds.slice(0, 12))}

Areas with too little data:
${JSON.stringify(notEnoughData)}

Recent missed-question samples:
${JSON.stringify(recentMisses)}

Return ONLY valid JSON with this exact object shape:
{
  "summary": "1-2 sentence teacher-facing summary",
  "recommendations": [
    {
      "grade": "G3 or G4",
      "topic": "exact topic name",
      "subtopic": "exact subtopic name from Known curriculum subtopics, never Unspecified",
      "reason": "short reason tied to the aggregate metrics",
      "confidence": "high, medium, or low"
    }
  ],
  "notEnoughData": [
    {
      "grade": "G3 or G4",
      "topic": "exact topic name",
      "subtopic": "exact subtopic name or Unspecified",
      "note": "short note"
    }
  ]
}

Rules:
- Recommend no more than 6 subtopics.
- Do not recommend subtopics with 85%+ accuracy unless attempts are fewer than 3.
- Use "notEnoughData" for areas where the student has fewer than 3 attempts.
- Never invent topics or subtopics.
- Do not include student names or personal data.`;
};

const validateAnalysis = (parsed, aggregate) => {
  const rawRecommendations = Array.isArray(parsed?.recommendations) ? parsed.recommendations : [];
  const recommendations = [];
  const focusMap = {};
  const seen = new Set();

  rawRecommendations.forEach((item) => {
    const grade = [GRADES.G3, GRADES.G4].includes(item?.grade)
      ? item.grade
      : inferGradeForTopic(item?.topic);
    const topic = item?.topic;
    const subtopic = item?.subtopic;
    const validSubtopics = SUBTOPICS_BY_GRADE_TOPIC[grade]?.[topic] || [];
    const validSubtopic = validSubtopics.find((entry) => normalizeText(entry) === normalizeText(subtopic));
    if (!VALID_TOPICS_BY_GRADE[grade]?.includes(topic) || !validSubtopic) return;

    const key = `${grade}::${topic}::${validSubtopic}`;
    if (seen.has(key)) return;
    seen.add(key);

    const metric = aggregate.metrics.find(
      (entry) => entry.grade === grade && entry.topic === topic && entry.subtopic === validSubtopic
    );
    recommendations.push({
      grade,
      topic,
      subtopic: validSubtopic,
      reason: String(item.reason || "Needs additional practice to build mastery.").slice(0, 220),
      confidence: ["high", "medium", "low"].includes(item.confidence) ? item.confidence : "medium",
      metrics: metric || null,
    });
    focusMap[topic] = [...new Set([...(focusMap[topic] || []), validSubtopic])];
  });

  const validatedNotEnoughData = Array.isArray(parsed?.notEnoughData) && parsed.notEnoughData.length > 0
    ? parsed.notEnoughData.slice(0, 8).reduce((items, item) => {
        const topic = item?.topic;
        const grade = [GRADES.G3, GRADES.G4].includes(item?.grade)
          ? item.grade
          : inferGradeForTopic(topic);
        const validTopic = VALID_TOPICS_BY_GRADE[grade]?.includes(topic);
        const validSubtopics = SUBTOPICS_BY_GRADE_TOPIC[grade]?.[topic] || [];
        const subtopic = String(item?.subtopic || UNSPECIFIED_SUBTOPIC);
        const validSubtopic =
          subtopic === UNSPECIFIED_SUBTOPIC ||
          validSubtopics.some((entry) => normalizeText(entry) === normalizeText(subtopic));
        if (!validTopic || !validSubtopic) return items;
        items.push({
          grade,
          topic,
          subtopic,
          note: String(item?.note || "Not enough attempts in the selected range.").slice(0, 180),
        });
        return items;
      }, [])
    : aggregate.notEnoughData;

  return {
    summary: String(parsed?.summary || "Review the recommended focus areas below.").slice(0, 500),
    recommendations,
    focusMap,
    notEnoughData: validatedNotEnoughData,
  };
};

const validateFocusMap = (focusMap) => {
  if (!focusMap || typeof focusMap !== "object" || Array.isArray(focusMap)) {
    return null;
  }

  const validated = {};
  Object.entries(focusMap).forEach(([topic, subtopics]) => {
    if (!Array.isArray(subtopics)) return;
    const grade = inferGradeForTopic(topic, null);
    if (!grade || !VALID_TOPICS_BY_GRADE[grade]?.includes(topic)) return;

    const validSubtopics = SUBTOPICS_BY_GRADE_TOPIC[grade]?.[topic] || [];
    const filtered = subtopics.reduce((items, subtopic) => {
      const match = validSubtopics.find((entry) => normalizeText(entry) === normalizeText(subtopic));
      if (match && !items.includes(match)) items.push(match);
      return items;
    }, []);

    if (filtered.length > 0) {
      validated[topic] = filtered;
    }
  });

  return Object.keys(validated).length > 0 ? validated : null;
};

const buildRecommendationsFromFocusMap = (focusMap, existingRecommendations = []) => {
  return Object.entries(focusMap || {}).flatMap(([topic, subtopics]) => {
    const grade = inferGradeForTopic(topic);
    return (subtopics || []).map((subtopic) => {
      const existing = existingRecommendations.find(
        (item) => item.topic === topic && item.subtopic === subtopic
      );
      return existing || {
        grade,
        topic,
        subtopic,
        reason: "Teacher added this focus area after reviewing the AI recommendation.",
        confidence: "reviewed",
        metrics: null,
      };
    });
  });
};

const buildSavedRecommendation = ({
  analysis,
  metrics,
  startDate,
  endDate,
  teacherId,
  previous = null,
  status = "draft",
}) => {
  const now = new Date().toISOString();
  return {
    id: previous?.id || `ai-focus-${Date.now()}`,
    status,
    summary: analysis.summary,
    recommendations: analysis.recommendations,
    focusMap: analysis.focusMap,
    notEnoughData: analysis.notEnoughData,
    metrics,
    dateRange: { startDate, endDate },
    generatedBy: previous?.generatedBy || teacherId,
    generatedAt: previous?.generatedAt || now,
    updatedAt: now,
    appliedAt: status === "applied" ? now : previous?.appliedAt || null,
  };
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
    const body = JSON.parse(event.body || "{}");
    const {
      appId = "default-app-id",
      studentId,
      classId = "",
      startDate,
      endDate,
      mode = "suggest",
      focusMap,
    } = body;

    if (!studentId || !MODES.has(mode)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "studentId and valid mode are required" }),
      };
    }
    if ((mode === "get" || mode === "suggest" || mode === "update" || mode === "delete" || mode === "apply") && !classId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Class ID is required for AI focus recommendations" }),
      };
    }
    if (mode === "suggest" && (!startDate || !endDate)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "startDate and endDate are required to analyze focus recommendations" }),
      };
    }

    const access = await verifyTeacherAccess({ appId, decodedToken, studentId, classId, mode });
    const studentProfile = await getProfile(appId, studentId);
    if (!studentProfile.snap.exists) {
      return { statusCode: 404, headers, body: JSON.stringify({ error: "Student profile not found" }) };
    }

    const existingRecommendation = access.enrollmentData?.aiFocusRecommendation || null;

    if (mode === "get") {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          status: "ok",
          mode,
          savedRecommendation: existingRecommendation,
        }),
      };
    }

    if (mode === "delete") {
      await access.enrollmentRef.set({ aiFocusRecommendation: null }, { merge: true });
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          status: "ok",
          mode,
          deleted: true,
          savedRecommendation: null,
        }),
      };
    }

    const reviewedFocusMap = (mode === "update" || mode === "apply")
      ? validateFocusMap(focusMap || existingRecommendation?.focusMap)
      : null;
    if ((mode === "update" || mode === "apply") && !reviewedFocusMap) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "No valid focus recommendations were provided" }),
      };
    }

    if (mode === "update") {
      const nextRecommendation = {
        ...(existingRecommendation || {}),
        id: existingRecommendation?.id || `ai-focus-${Date.now()}`,
        status: "draft",
        summary: existingRecommendation?.summary || "Review the saved focus areas below.",
        recommendations: buildRecommendationsFromFocusMap(
          reviewedFocusMap,
          existingRecommendation?.recommendations || []
        ),
        focusMap: reviewedFocusMap,
        notEnoughData: existingRecommendation?.notEnoughData || [],
        metrics: existingRecommendation?.metrics || { questionsAnalyzed: 0, startDate, endDate },
        dateRange: existingRecommendation?.dateRange || { startDate, endDate },
        generatedBy: existingRecommendation?.generatedBy || decodedToken.uid,
        generatedAt: existingRecommendation?.generatedAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        appliedAt: null,
      };

      await access.enrollmentRef.set({ aiFocusRecommendation: nextRecommendation }, { merge: true });
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          status: "ok",
          mode,
          savedRecommendation: nextRecommendation,
        }),
      };
    }

    if (mode === "apply") {
      const nextRecommendation = existingRecommendation
        ? {
            ...existingRecommendation,
            status: "applied",
            focusMap: reviewedFocusMap,
            recommendations: buildRecommendationsFromFocusMap(
              reviewedFocusMap,
              existingRecommendation.recommendations || []
            ),
            updatedAt: new Date().toISOString(),
            appliedAt: new Date().toISOString(),
          }
        : {
            id: `ai-focus-${Date.now()}`,
            status: "applied",
            summary: "AI focus recommendations were applied to this student's Focus Areas.",
            recommendations: buildRecommendationsFromFocusMap(reviewedFocusMap),
            focusMap: reviewedFocusMap,
            notEnoughData: [],
            metrics: { questionsAnalyzed: 0, startDate, endDate },
            dateRange: { startDate, endDate },
            generatedBy: decodedToken.uid,
            generatedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            appliedAt: new Date().toISOString(),
          };

      await access.enrollmentRef.set(
        {
          classId,
          studentId,
          allowedSubtopicsByTopic: reviewedFocusMap,
          aiFocusRecommendation: nextRecommendation,
          aiFocusUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          status: "ok",
          mode,
          applied: true,
          summary: "AI focus recommendations were applied to this student's Focus Areas.",
          recommendations: [],
          focusMap: reviewedFocusMap,
          notEnoughData: [],
          metrics: { questionsAnalyzed: 0, startDate, endDate },
          savedRecommendation: nextRecommendation,
        }),
      };
    }

    const studentData = studentProfile.data || {};
    const aggregate = aggregateQuestions(Array.isArray(studentData.answeredQuestions) ? studentData.answeredQuestions : [], {
      startDate,
      endDate,
      fallbackGrade: studentData.selectedGrade || studentData.grade || GRADES.G3,
    });

    if (aggregate.questionsInRange.length === 0) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          status: "empty",
          mode,
          applied: false,
          summary: "No answered questions were found in the selected date range.",
          recommendations: [],
          focusMap: {},
          notEnoughData: [],
          metrics: { questionsAnalyzed: 0, startDate, endDate },
          savedRecommendation: null,
        }),
      };
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: process.env.GEMINI_MODEL_NAME || "gemini-2.5-flash",
      generationConfig: {
        maxOutputTokens: parseInt(process.env.GEMINI_MAX_OUTPUT_TOKENS, 10) || 4096,
      },
    });

    const prompt = buildPrompt({
      student: studentData,
      startDate,
      endDate,
      metrics: aggregate.metrics,
      rankedNeeds: aggregate.rankedNeeds,
      notEnoughData: aggregate.notEnoughData,
      recentMisses: aggregate.recentMisses,
    });

    const result = await generateContentWithRetry(model, prompt, { label: "teacher-ai-focus-analysis" });
    const text = result.response.text();
    let parsed;
    try {
      parsed = JSON.parse(sanitizeLLMJsonString(extractJsonCandidate(text)));
    } catch (parseError) {
      console.error("Teacher AI focus JSON parse failed:", parseError);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: "AI response could not be parsed. Please try again." }),
      };
    }

    const analysis = validateAnalysis(parsed, aggregate);
    const metrics = {
      questionsAnalyzed: aggregate.questionsInRange.length,
      startDate,
      endDate,
      bySubtopic: aggregate.metrics,
    };
    const savedRecommendation = buildSavedRecommendation({
      analysis,
      metrics,
      startDate,
      endDate,
      teacherId: decodedToken.uid,
      previous: existingRecommendation,
      status: "draft",
    });

    await access.enrollmentRef.set(
      {
        classId,
        studentId,
        aiFocusRecommendation: savedRecommendation,
      },
      { merge: true }
    );

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        status: "ok",
        mode,
        applied: false,
        ...analysis,
        metrics,
        savedRecommendation,
      }),
    };
  } catch (error) {
    console.error("Teacher AI focus analysis error:", error);
    return {
      statusCode: error.statusCode || 500,
      headers,
      body: JSON.stringify({ error: error.statusCode ? error.message : "Internal server error" }),
    };
  }
};

exports._test = {
  aggregateQuestions,
  validateAnalysis,
  validateFocusMap,
  buildRecommendationsFromFocusMap,
  buildPrompt,
};
