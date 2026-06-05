const { admin } = require("./firebase-admin");
const {
  _test: {
    getJobRef,
    processTeacherAiFocusSuggestion,
  },
} = require("./teacher-ai-focus-analysis");

const getTimestamp = () => admin.firestore.Timestamp.now();

exports.handler = async (event) => {
  const {
    jobId,
    appId = "default-app-id",
    studentId,
    classId,
    startDate,
    endDate,
    answeredQuestions,
    decodedToken,
  } = JSON.parse(event.body || "{}");

  const jobRef = getJobRef(appId, jobId);

  try {
    await jobRef.set({
      status: "processing",
      progress: 15,
      updatedAt: getTimestamp(),
    }, { merge: true });

    const result = await processTeacherAiFocusSuggestion({
      appId,
      studentId,
      classId,
      startDate,
      endDate,
      answeredQuestions,
      decodedToken,
    });

    await jobRef.set({
      status: "completed",
      progress: 100,
      result,
      savedRecommendation: result.savedRecommendation || null,
      error: null,
      updatedAt: getTimestamp(),
      completedAt: getTimestamp(),
    }, { merge: true });

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "AI focus analysis completed" }),
    };
  } catch (error) {
    console.error("Teacher AI focus background error:", error);
    await jobRef.set({
      status: "failed",
      progress: 100,
      error: error.statusCode ? error.message : "AI focus analysis failed",
      updatedAt: getTimestamp(),
      completedAt: getTimestamp(),
    }, { merge: true });

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "AI focus analysis failed" }),
    };
  }
};
