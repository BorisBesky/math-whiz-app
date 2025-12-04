const { admin, db } = require("./firebase-admin");

const getTimestamp = () => admin.firestore.Timestamp.now();

const verifyAuthToken = async (authHeader) => {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new Error("Missing or invalid authorization header");
  }

  const token = authHeader.split("Bearer ")[1];
  try {
    return await admin.auth().verifyIdToken(token);
  } catch (error) {
    throw new Error("Invalid authentication token");
  }
};

exports.handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Content-Type": "application/json",
  };

  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers,
      body: "",
    };
  }

  if (event.httpMethod !== "GET") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: "Method Not Allowed" }),
    };
  }

  const jobId = event.queryStringParameters?.jobId;
  if (!jobId) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: "Job ID is required" }),
    };
  }

  try {
    const authHeader = event.headers.authorization || event.headers.Authorization;
    const decodedToken = await verifyAuthToken(authHeader);
    const userId = decodedToken.uid;
    const appId = event.queryStringParameters?.appId || "default-app-id";

    const jobRef = db.collection("artifacts").doc(appId)
      .collection("imageGenerationJobs").doc(jobId);
    const jobDoc = await jobRef.get();

    if (!jobDoc.exists) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: "Job not found" }),
      };
    }

    const jobData = jobDoc.data();

    if (jobData.userId !== userId) {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({ error: "Access denied" }),
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        jobId,
        status: jobData.status,
        progress: jobData.progress || 0,
        message: jobData.message || '',
        descriptions: jobData.descriptions || null,
        images: jobData.images || null,
        addedImages: jobData.addedImages || null,
        error: jobData.error || null,
        createdAt: jobData.createdAt || getTimestamp(),
        completedAt: jobData.completedAt || null,
      }),
    };
  } catch (error) {
    console.error("Job status check error:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: "Failed to check job status",
        details: error.message,
      }),
    };
  }
};

