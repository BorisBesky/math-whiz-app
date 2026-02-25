const { GoogleGenerativeAI } = require("@google/generative-ai");
const { admin, db } = require("./firebase-admin");
const { GRADES, VALID_TOPICS_BY_GRADE, QUESTION_TYPES } = require("./constants");
const { generateContentWithRetry } = require("./retry-utils");

// Allowed question types for generation (exclude AI-evaluated types)
const GENERATABLE_TYPES = [
  QUESTION_TYPES.MULTIPLE_CHOICE,
  QUESTION_TYPES.NUMERIC,
  QUESTION_TYPES.FILL_IN_THE_BLANKS,
];

const MAX_QUESTIONS_PER_CALL = 25;

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

// Helper function to verify admin role
const verifyAdminRole = async (userId, appId) => {
  const profileRef = db.doc(
    `artifacts/${appId}/users/${userId}/math_whiz_data/profile`
  );
  const profileSnap = await profileRef.get();

  if (!profileSnap.exists) {
    throw new Error("User profile not found");
  }

  const profileData = profileSnap.data();
  if (profileData.role !== "admin") {
    throw new Error("Admin access required");
  }

  return true;
};

// JSON parsing utilities (from upload-pdf-questions-background.js)
const sanitizeLLMJsonString = (input) => {
  if (!input) return input;
  let result = "";
  let inString = false;
  let escapeNext = false;

  for (let i = 0; i < input.length; i++) {
    let char = input[i];
    if (char === "\u201C" || char === "\u201D") char = '"';
    if (char === "\u2019") char = "'";

    if (escapeNext) {
      result += char;
      escapeNext = false;
      continue;
    }
    if (char === "\\") {
      result += char;
      escapeNext = true;
      continue;
    }
    if (char === '"') {
      inString = !inString;
      result += char;
      continue;
    }
    if (inString) {
      if (char === "\n") { result += "\\n"; continue; }
      if (char === "\r") { result += "\\r"; continue; }
      if (char === "\t") { result += "\\t"; continue; }
    }
    result += char;
  }
  result = result.replace(/,\s*(\}|\])/g, "$1");
  return result;
};

const extractJsonCandidate = (text) => {
  if (!text) return text;
  const jsonMatch =
    text.match(/```json\s*([\s\S]*?)\s*```/) ||
    text.match(/```\s*([\s\S]*?)\s*```/) ||
    text.match(/\[[\s\S]*\]/);

  if (jsonMatch) {
    return jsonMatch[1] || jsonMatch[0];
  }

  const firstBracket = text.indexOf("[");
  const lastBracket = text.lastIndexOf("]");
  if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
    return text.slice(firstBracket, lastBracket + 1);
  }
  return text;
};

// Grade-specific topic guidelines
const TOPIC_GUIDELINES = {
  [GRADES.G3]: `Topic Guidelines for 3rd Grade:
- Multiplication: Focus on repeated addition, groups, arrays, and skip counting (2-12 times tables)
- Division: Focus on equal sharing, grouping, and the relationship with multiplication
- Fractions: Focus on parts of a whole, equivalent fractions, comparing fractions, and simple addition/subtraction
- Measurement & Data: Focus on area (length x width), perimeter (adding all sides), and volume (counting cubes or length x width x height)`,
  [GRADES.G4]: `Topic Guidelines for 4th Grade:
- Operations & Algebraic Thinking: Focus on multiplicative comparisons ("3 times as many"), prime/composite numbers, factors and multiples, number patterns, multi-step word problems
- Base Ten: Focus on place value to 1,000,000, rounding to any place, multi-digit addition/subtraction/multiplication, division with remainders, understanding place value relationships
- Fractions 4th: Focus on equivalent fractions, comparing fractions with different denominators, adding/subtracting fractions with like denominators, multiplying fractions by whole numbers, converting between mixed numbers and improper fractions, decimal notation for fractions, decimal operations (adding, subtracting, multiplying, and dividing decimals)
- Measurement & Data 4th: Focus on unit conversions (metric and customary), area and perimeter formulas, line plots with fractions, angles and angle measurement, solving problems involving measurement
- Geometry: Focus on points/lines/rays/angles, classifying triangles and quadrilaterals by their properties, line symmetry, parallel and perpendicular lines
- Binary Addition: Focus on converting between binary and decimal, adding binary numbers`,
};

// Build the Gemini prompt
const buildPrompt = (grade, topic, questionTypes, count) => {
  const gradeLabel = grade === GRADES.G3 ? "3rd grade" : "4th grade";
  const typeInstructions = questionTypes.map((type) => {
    switch (type) {
      case QUESTION_TYPES.MULTIPLE_CHOICE:
        return `- "multiple-choice": Provide exactly 4 options in the "options" array. "correctAnswer" MUST be exactly one of the 4 options (character-for-character match).`;
      case QUESTION_TYPES.NUMERIC:
        return `- "numeric": "correctAnswer" is the numeric answer as a string (e.g. "42"). "options" must be an empty array [].`;
      case QUESTION_TYPES.FILL_IN_THE_BLANKS:
        return `- "fill-in-the-blanks": Use "__" (double underscore) in the question text for each blank. "correctAnswer" uses " ;; " to separate answers for multiple blanks (e.g. "12 ;; 24"). Include an "inputTypes" array with one entry per blank, each being "numeric" or "mixed". "options" must be an empty array [].`;
      default:
        return "";
    }
  }).filter(Boolean).join("\n");

  return `You are an expert math curriculum designer. Generate exactly ${count} unique math questions for ${gradeLabel} students on the topic "${topic}".

${TOPIC_GUIDELINES[grade]}

Question types to generate: ${questionTypes.join(", ")}
Distribute questions roughly equally across the requested types.

Rules for each question type:
${typeInstructions}

Requirements:
- Questions must be age-appropriate for ${gradeLabel} students
- Vary difficulty from easy to challenging
- Use diverse, engaging real-world scenarios
- Each question must be unique and test different aspects of "${topic}"
- For multiple-choice, correctAnswer MUST be one of the 4 options (exact match)
- All answers must be mathematically correct
- Include a helpful "hint" for each question
- Include the relevant Common Core "standard" code (e.g. "3.OA.C.7")
- Include a brief "concept" label (e.g. "Multiplication Facts")

Return ONLY a valid JSON array (no markdown code fences, no text before or after). Each element must have this exact structure:
{
  "question": "The question text here",
  "topic": "${topic}",
  "grade": "${grade}",
  "questionType": "one of: ${questionTypes.join(", ")}",
  "correctAnswer": "the correct answer",
  "options": ["option1", "option2", "option3", "option4"],
  "inputTypes": [],
  "hint": "A helpful hint",
  "standard": "X.XX.X.X",
  "concept": "Brief concept name"
}

Notes:
- "options" is required for multiple-choice (exactly 4 items), empty array [] for other types
- "inputTypes" is only needed for fill-in-the-blanks, empty array [] for other types
- Do NOT include any fields other than those listed above
- Generate exactly ${count} questions`;
};

// Validate generated questions
const validateGeneratedQuestions = (questions, grade, topic, requestedTypes) => {
  if (!Array.isArray(questions)) {
    throw new Error("Expected an array of questions");
  }

  return questions
    .map((q) => {
      if (!q.question || typeof q.question !== "string") return null;

      const questionType = requestedTypes.includes(q.questionType)
        ? q.questionType
        : requestedTypes[0];

      const validated = {
        question: q.question,
        topic: topic,
        grade: grade,
        questionType: questionType,
        correctAnswer: q.correctAnswer || "",
        options: Array.isArray(q.options) ? q.options : [],
        inputTypes: Array.isArray(q.inputTypes) ? q.inputTypes : [],
        hint: q.hint || "",
        standard: q.standard || "",
        concept: q.concept || "",
        source: "ai-generated",
        images: [],
        pdfSource: "",
      };

      // Type-specific validation
      if (questionType === QUESTION_TYPES.MULTIPLE_CHOICE) {
        if (validated.options.length !== 4) {
          // Try to keep it if we have some options
          if (validated.options.length < 2) return null;
        }
        // Ensure correctAnswer is in options
        if (!validated.options.includes(validated.correctAnswer) && validated.options.length > 0) {
          validated.correctAnswer = validated.options[0];
        }
      } else if (questionType === QUESTION_TYPES.NUMERIC) {
        validated.options = [];
        if (!validated.correctAnswer) return null;
      } else if (questionType === QUESTION_TYPES.FILL_IN_THE_BLANKS) {
        validated.options = [];
        if (!validated.correctAnswer) return null;
        // Auto-detect inputTypes from correctAnswer if missing
        if (validated.inputTypes.length === 0) {
          const answers = validated.correctAnswer.split(";;").map((a) => a.trim());
          validated.inputTypes = answers.map((a) =>
            /^-?\d+(\.\d+)?$/.test(a) ? "numeric" : "mixed"
          );
        }
      }

      return validated;
    })
    .filter(Boolean);
};

exports.handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
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
    const authHeader = event.headers.authorization || event.headers.Authorization;
    const userId = await verifyAuthToken(authHeader);

    const { grade, topic, questionTypes, count, appId } = JSON.parse(event.body);

    // Validate inputs
    if (!grade || ![GRADES.G3, GRADES.G4].includes(grade)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: `Grade must be ${GRADES.G3} or ${GRADES.G4}` }),
      };
    }

    const validTopics = VALID_TOPICS_BY_GRADE[grade];
    if (!topic || !validTopics.includes(topic)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: `Invalid topic "${topic}" for ${grade}. Valid: ${validTopics.join(", ")}`,
        }),
      };
    }

    if (!Array.isArray(questionTypes) || questionTypes.length === 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "At least one question type is required" }),
      };
    }

    const invalidTypes = questionTypes.filter((t) => !GENERATABLE_TYPES.includes(t));
    if (invalidTypes.length > 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: `Invalid question types: ${invalidTypes.join(", ")}. Allowed: ${GENERATABLE_TYPES.join(", ")}`,
        }),
      };
    }

    const requestedCount = Math.min(Math.max(parseInt(count) || 10, 1), MAX_QUESTIONS_PER_CALL);

    // Verify admin role
    await verifyAdminRole(userId, appId || "default-app-id");

    // Build prompt and call Gemini
    const prompt = buildPrompt(grade, topic, questionTypes, requestedCount);

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: process.env.GEMINI_MODEL_NAME || "gemini-2.5-flash",
      generationConfig: {
        maxOutputTokens: parseInt(process.env.GEMINI_MAX_OUTPUT_TOKENS) || 65536,
      },
    });

    const result = await generateContentWithRetry(model, prompt, {
      label: "generate-questions",
    });
    const response = result.response;
    const text = response.text();

    // Parse JSON response
    const candidateJson = extractJsonCandidate(text);
    const sanitized = sanitizeLLMJsonString(candidateJson);
    let questions;
    try {
      questions = JSON.parse(sanitized);
    } catch (parseError) {
      console.error("JSON parse failed. Raw text:", text.substring(0, 500));
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: "Failed to generate valid questions. The AI response could not be parsed. Please try again.",
        }),
      };
    }

    // Validate questions
    const validatedQuestions = validateGeneratedQuestions(
      questions,
      grade,
      topic,
      questionTypes
    );

    if (validatedQuestions.length === 0) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: "No valid questions were generated. Please try again.",
        }),
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        questions: validatedQuestions,
        count: validatedQuestions.length,
        requestedCount: requestedCount,
      }),
    };
  } catch (error) {
    console.error("Generate questions error:", error);

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

    if (error.message.includes("Admin access required")) {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({ error: error.message }),
      };
    }

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Internal server error" }),
    };
  }
};
