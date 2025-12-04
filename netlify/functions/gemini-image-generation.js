const { admin, db } = require("./firebase-admin");
const fetch = require("node-fetch");

const getTimestamp = () => admin.firestore.Timestamp.now();

// Helper function to verify Firebase auth token
const verifyAuthToken = async (authHeader) => {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new Error("Missing or invalid authorization header");
  }

  const token = authHeader.split("Bearer ")[1];
  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    return decodedToken.uid;
  } catch (error) {
    throw new Error("Invalid authentication token");
  }
};

// Create a unique job ID
const createJobId = (userId) => `${userId}_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;


exports.handler = async (event) => {
  // Handle CORS for browser requests
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json",
  };

  // Handle preflight OPTIONS request
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers,
      body: "",
    };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: "Method Not Allowed" }),
    };
  }

  try {
    // Verify authentication
    const authHeader =
      event.headers.authorization || event.headers.Authorization;
    const userId = await verifyAuthToken(authHeader);

    const { action, theme, themeDescription, count, descriptions, selectedIndices, generatedImages } = JSON.parse(event.body);
    const appId = event.queryStringParameters?.appId || "default-app-id";

    if (!action) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Action is required" }),
      };
    }

    // Validate based on action
    if (action === "generate-descriptions") {
      if (!themeDescription || !count) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: "Theme description and count are required" }),
        };
      }
    }

    if (action === "generate-images") {
      if (!descriptions || !Array.isArray(descriptions) || descriptions.length === 0) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: "Descriptions array is required" }),
        };
      }

      if (!theme) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: "Theme is required" }),
        };
      }
    }

    if (action === "add-to-store") {
      if (!selectedIndices || !Array.isArray(selectedIndices) || selectedIndices.length === 0) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: "Selected indices array is required" }),
        };
      }

      if (!generatedImages || !Array.isArray(generatedImages)) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: "Generated images array is required" }),
        };
      }

      if (!theme) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: "Theme is required" }),
        };
      }
    }

    // Create a background job
    const jobId = createJobId(userId);
    const jobRef = db.collection('artifacts').doc(appId)
      .collection('imageGenerationJobs').doc(jobId);

    // Store job data
    await jobRef.set({
      userId,
      action,
      status: 'pending',
      progress: 0,
      createdAt: getTimestamp(),
    });

    // Invoke the background function
    const backgroundFunctionUrl = `${process.env.URL || 'http://localhost:8888'}/.netlify/functions/gemini-image-generation-background`;
    
    // Don't await - fire and forget
    fetch(backgroundFunctionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jobId,
        userId,
        appId,
        jobData: { action, theme, themeDescription, count, descriptions, selectedIndices, generatedImages }
      }),
    }).catch(err => console.error('Error invoking background function:', err));

    // Return job ID immediately
    return {
      statusCode: 202,
      headers,
      body: JSON.stringify({ 
        jobId,
        message: 'Job created and processing started',
        status: 'pending'
      }),
    };

  } catch (error) {
    console.error("Gemini image generation error:", error);
    console.error("Error stack:", error.stack);

    // Return appropriate error messages
    if (
      error.message.includes("authorization") ||
      error.message.includes("authentication") ||
      error.message.includes("Invalid authentication token")
    ) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: error.message }),
      };
    }

    // For debugging - include more error info in development
    const isDevelopment = process.env.NODE_ENV === "development";
    const errorResponse = {
      error: "Internal server error",
      message: error.message,
      ...(isDevelopment && { stack: error.stack }),
    };

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify(errorResponse),
    };
  }
};

