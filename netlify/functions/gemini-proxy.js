const { GoogleGenerativeAI } = require("@google/generative-ai");
const admin = require("firebase-admin");

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  // Handle private key encoding for different environments
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (privateKey) {
    // Handle different encoding scenarios
    try {
      // First try: Replace literal \n with actual newlines
      privateKey = privateKey.replace(/\\n/g, "\n");

      // Second try: If it's base64 encoded, decode it
      if (!privateKey.includes("-----BEGIN PRIVATE KEY-----")) {
        privateKey = Buffer.from(privateKey, "base64").toString("utf8");
      }

      // Third try: Ensure proper formatting
      if (!privateKey.includes("-----BEGIN PRIVATE KEY-----")) {
        throw new Error("Private key format invalid");
      }
    } catch (error) {
      console.error("Private key processing error:", error);
      throw new Error("Failed to process Firebase private key");
    }
  }

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: privateKey,
    }),
    databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}.firebaseio.com`,
  });
}

const db = admin.firestore();

// Valid math topics by grade for the Math Whiz app
const VALID_TOPICS_BY_GRADE = {
  G3: ["Multiplication", "Division", "Fractions", "Measurement & Data"],
  G4: [
    "Operations & Algebraic Thinking (4.OA)",
    "Number & Operations in Base Ten (4.NBT)",
    "Number & Operations - Fractions (4.NF)",
    "Measurement & Data (4.MD)",
    "Geometry (4.G)",
  ],
};

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
const checkRateLimit = async (userId, topic, grade = "G3") => {
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
    const gradeLabel = grade === "G3" ? "3rd grade" : "4th grade";
    throw new Error(
      `You have already created a story problem for ${topic} in ${gradeLabel} today. Please try a different topic or come back tomorrow.`
    );
  }

  // Check total queries for today for this grade (max 4 per day per grade)
  const totalStoriesToday = Object.keys(dailyStories).length;
  if (totalStoriesToday >= 4) {
    const gradeLabel = grade === "G3" ? "3rd grade" : "4th grade";
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

// Helper function to validate topic and enhance prompt (grade-aware)
const validateAndEnhancePrompt = (originalPrompt, topic, grade = "G3") => {
  const validTopics = VALID_TOPICS_BY_GRADE[grade];
  if (!validTopics || !validTopics.includes(topic)) {
    const gradeLabel = grade === "G3" ? "3rd grade" : "4th grade";
    throw new Error(
      `Invalid topic: ${topic} for ${gradeLabel}. Valid topics are: ${
        validTopics ? validTopics.join(", ") : "none defined"
      }`
    );
  }

  // Grade-specific prompt enhancement
  if (grade === "G3") {
    return enhance3rdGradePrompt(originalPrompt, topic);
  } else if (grade === "G4") {
    return enhance4thGradePrompt(originalPrompt, topic);
  } else {
    throw new Error(`Invalid grade: ${grade}. Valid grades are: G3, G4`);
  }
};

// 3rd grade prompt enhancement (existing logic)
const enhance3rdGradePrompt = (originalPrompt, topic) => {
  const enhancedPrompt = `You are a helpful math tutor for 3rd grade students. Please create a fun and educational story problem based ONLY on the topic "${topic}" for Math Whiz app users.

Topic Guidelines:
- Multiplication: Focus on repeated addition, groups, arrays, and skip counting (2-12 times tables)
- Division: Focus on equal sharing, grouping, and the relationship with multiplication
- Fractions: Focus on parts of a whole, equivalent fractions, comparing fractions, and simple addition/subtraction
- Measurement & Data: Focus on area (length × width), perimeter (adding all sides), and volume (counting cubes or length × width × height)

Requirements:
- Keep the story age-appropriate for 3rd graders (ages 8-9)
- Use fun, relatable scenarios (animals, food, toys, school, etc.)
- Make the math problem clear and solvable
- End with a clear question
- Provide the answer on a new line in the format "Answer: [your answer]"
- Keep the story to one paragraph
- Use only topics and concepts appropriate for 3rd grade math

Original request: ${originalPrompt}

Please create the story problem now:`;

  return enhancedPrompt;
};

// 4th grade prompt enhancement (new)
const enhance4thGradePrompt = (originalPrompt, topic) => {
  const enhancedPrompt = `You are a helpful math tutor for 4th grade students. Please create a fun and educational story problem based ONLY on the topic "${topic}" for Math Whiz app users.

Topic Guidelines:
- Operations & Algebraic Thinking (4.OA): Focus on multiplicative comparisons ("3 times as many"), prime/composite numbers, factors and multiples, number patterns
- Number & Operations in Base Ten (4.NBT): Focus on place value to 1,000,000, rounding to any place, multi-digit addition/subtraction/multiplication, division with remainders
- Number & Operations - Fractions (4.NF): Focus on equivalent fractions, comparing fractions, adding/subtracting fractions with like denominators, multiplying fractions by whole numbers, decimal notation
- Measurement & Data (4.MD): Focus on unit conversions (metric and customary), area and perimeter formulas, line plots with fractions, angles and measurement
- Geometry (4.G): Focus on points/lines/rays/angles, classifying triangles and quadrilaterals, line symmetry

Requirements:
- Keep the story age-appropriate for 4th graders (ages 9-10)
- Use engaging, realistic scenarios that connect to their experiences
- Make the math problem clear and solvable using 4th grade methods
- End with a clear question
- Provide the answer on a new line in the format "Answer: [your answer]"
- Keep the story to one paragraph
- Use only topics and concepts appropriate for 4th grade math (Common Core 4th grade standards)

Original request: ${originalPrompt}

Please create the story problem now:`;

  return enhancedPrompt;
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

    const { prompt, topic, grade = "G3" } = JSON.parse(event.body);

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

    if (!["G3", "G4"].includes(grade)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Grade must be G3 or G4" }),
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
