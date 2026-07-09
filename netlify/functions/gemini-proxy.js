const { GoogleGenerativeAI } = require("@google/generative-ai");
const { admin, db } = require("./firebase-admin");
const {
  getDefaultGradeKey,
  getEnabledGradeKeys,
  getGrade,
  gradeAdjective,
  isValidGradeKey,
  storyRequirementLines,
  topicGuidelineLines,
  topicNamesForGrade,
} = require("./content-registry");

// Valid grades/topics and prompt text derive from the content manifests

// Helper function to get today's date string
const getTodayDateString = () => {
  const today = new Date();
  return today.toISOString().split("T")[0]; // YYYY-MM-DD format
};

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

// Helper function to check and update rate limiting (grade-aware)
const checkRateLimit = async (userId, topic, grade = getDefaultGradeKey()) => {
  const today = getTodayDateString();
  const userDoc = db
    .collection("artifacts")
    .doc("default-app-id")
    .collection("users")
    .doc(userId)
    .collection("math_whiz_data")
    .doc("profile");

  const userData = await userDoc.get();
  if (!userData.exists) {
    throw new Error("User data not found");
  }

  const data = userData.data();
  const dailyStories = data.dailyStories?.[today]?.[grade] || {};

  // Check if user has already used this topic today for this grade
  if (dailyStories[topic]) {
    const gradeLabel = gradeAdjective(grade);
    throw new Error(
      `You have already created a story problem for ${topic} in ${gradeLabel} today. Please try a different topic or come back tomorrow.`
    );
  }

  // Check total queries for today for this grade (max 4 per day per grade)
  const totalStoriesToday = Object.keys(dailyStories).length;
  if (totalStoriesToday >= 4) {
    const gradeLabel = gradeAdjective(grade);
    throw new Error(
      `You have reached your daily limit of 4 story problems for ${gradeLabel}. Please come back tomorrow.`
    );
  }

  // Update the rate limit counter for this grade
  await userDoc.update({
    [`dailyStories.${today}.${grade}.${topic}`]: true,
  });

  return true;
};

// Helper function to validate topic and enhance prompt (grade-aware).
// Topic guidelines come from each topic manifest's ai.guidelines and the
// Requirements block from the grade manifest's ai.storyRequirements, so the
// story prompt stays in lockstep with question-generation guidance.
const validateAndEnhancePrompt = (originalPrompt, topic, grade = getDefaultGradeKey()) => {
  if (!isValidGradeKey(grade)) {
    throw new Error(
      `Invalid grade: ${grade}. Valid grades are: ${getEnabledGradeKeys().join(", ")}`
    );
  }

  const validTopics = topicNamesForGrade(grade);
  if (!validTopics.includes(topic)) {
    throw new Error(
      `Invalid topic: ${topic} for ${gradeAdjective(grade)}. Valid topics are: ${validTopics.join(", ")}`
    );
  }

  return buildStoryPrompt(grade, topic, originalPrompt);
};

const buildStoryPrompt = (gradeKey, topic, originalPrompt) => {
  const grade = getGrade(gradeKey);
  return `You are a helpful math tutor for ${grade.shortLabel} grade students. Please create a fun and educational story problem based ONLY on the topic "${topic}" for Math Whiz app users.

Topic Guidelines:
${topicGuidelineLines(gradeKey)}

Requirements:
${storyRequirementLines(gradeKey)}

Original request: ${originalPrompt}

Please create the story problem now:`;
};

exports.handler = async (event) => {
  // Handle CORS for browser requests
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
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

    const { prompt, topic, grade = getDefaultGradeKey() } = JSON.parse(event.body);

    if (!prompt) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Prompt is required" }),
      };
    }

    if (!topic) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Topic is required" }),
      };
    }

    if (!getEnabledGradeKeys().includes(grade)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: `Grade must be ${getEnabledGradeKeys().join(" or ")}` }),
      };
    }

    // Check rate limiting and topic validity (grade-aware)
    await checkRateLimit(userId, topic, grade);

    // Validate topic and enhance prompt for safety (grade-aware)
    const enhancedPrompt = validateAndEnhancePrompt(prompt, topic, grade);

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const result = await model.generateContent(enhancedPrompt);
    const response = await result.response;
    const text = response.text();

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ content: text }),
    };
  } catch (error) {
    console.error("Gemini API error:", error);
    console.error("Error stack:", error.stack);
    console.error("Error details:", {
      message: error.message,
      name: error.name,
      code: error.code,
    });

    // Return appropriate error messages
    if (
      error.message.includes("authorization") ||
      error.message.includes("authentication")
    ) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: error.message }),
      };
    }

    if (
      error.message.includes("daily limit") ||
      error.message.includes("already created")
    ) {
      return {
        statusCode: 429,
        headers,
        body: JSON.stringify({ error: error.message }),
      };
    }

    if (error.message.includes("Invalid topic")) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: error.message }),
      };
    }

    // Special handling for Firebase/Firestore connection errors
    if (
      error.message.includes("DECODER routines") ||
      error.message.includes("Getting metadata from plugin failed") ||
      error.code === 2
    ) {
      console.error(
        "Firebase connection error detected. Check private key encoding."
      );
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error:
            "Authentication service temporarily unavailable. Please try again later.",
          hint: "Firebase configuration issue",
        }),
      };
    }

    // For debugging - include more error info in development
    const isDevelopment = process.env.NODE_ENV === "development";
    const errorResponse = {
      error: "Internal server error",
      ...(isDevelopment && { details: error.message, stack: error.stack }),
    };

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify(errorResponse),
    };
  }
};

// Exposed for characterization tests only (see src/__tests__/ai-prompt-snapshots.test.js)
exports._test = {
  validateAndEnhancePrompt,
};
