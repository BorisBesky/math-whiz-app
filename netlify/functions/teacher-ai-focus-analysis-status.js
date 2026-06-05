const { admin } = require("./firebase-admin");
const {
  _test: { getJobRef },
} = require("./teacher-ai-focus-analysis");

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Content-Type": "application/json",
};

const getTimestamp = () => admin.firestore.Timestamp.now();

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

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  if (event.httpMethod !== "GET") {
    return { statusCode: 405, headers, body: JSON.stringify({ error: "Method Not Allowed" }) };
  }

  const jobId = event.queryStringParameters?.jobId;
  const appId = event.queryStringParameters?.appId || "default-app-id";
  if (!jobId) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: "Job ID is required" }) };
  }

  try {
    const decodedToken = await verifyAuthToken(event.headers.authorization || event.headers.Authorization);
    const jobDoc = await getJobRef(appId, jobId).get();

    if (!jobDoc.exists) {
      return { statusCode: 404, headers, body: JSON.stringify({ error: "Job not found" }) };
    }

    const job = jobDoc.data();
    if (job.userId !== decodedToken.uid) {
      return { statusCode: 403, headers, body: JSON.stringify({ error: "Access denied" }) };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        jobId,
        status: job.status,
        progress: job.progress || 0,
        result: job.result || null,
        savedRecommendation: job.savedRecommendation || null,
        error: job.error || null,
        createdAt: job.createdAt || getTimestamp(),
        completedAt: job.completedAt || null,
      }),
    };
  } catch (error) {
    console.error("Teacher AI focus status error:", error);
    return {
      statusCode: error.statusCode || 500,
      headers,
      body: JSON.stringify({ error: error.statusCode ? error.message : "Failed to check AI focus status" }),
    };
  }
};
