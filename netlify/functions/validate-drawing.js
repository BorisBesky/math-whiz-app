const { GoogleGenerativeAI } = require("@google/generative-ai");
const { admin, db } = require("./firebase-admin");
const { getStorage } = require("firebase-admin/storage");

// Helper to get today's date string
const getTodayDateString = () => {
  const today = new Date();
  return today.toISOString().split("T")[0]; // YYYY-MM-DD format
};

// Helper to verify Firebase auth token
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

// Helper to check rate limit for drawing validations (max 20 per day)
const checkRateLimit = async (userId) => {
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
  const dailyValidations = data.dailyDrawingValidations?.[today] || { count: 0 };

  // Check if user has reached daily limit (20 validations per day)
  if (dailyValidations.count >= 20) {
    throw new Error(
      "You have reached your daily limit of 20 drawing validations. Please come back tomorrow."
    );
  }

  // Update the rate limit counter
  await userDoc.update({
    [`dailyDrawingValidations.${today}.count`]: (dailyValidations.count || 0) + 1,
    [`dailyDrawingValidations.${today}.lastValidation`]: new Date(),
  });

  return true;
};

// Helper to upload drawing image to Firebase Storage
const uploadDrawingImage = async (userId, questionId, imageBase64) => {
  try {
    const bucket = getStorage().bucket();
    const filename = `drawings/${userId}/${questionId}_${Date.now()}.png`;
    
    // Remove data URL prefix if present
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    
    const file = bucket.file(filename);
    await file.save(buffer, {
      metadata: {
        contentType: 'image/png',
        metadata: {
          userId: userId,
          questionId: questionId,
          uploadedAt: new Date().toISOString()
        }
      }
    });

    // Make the file publicly accessible
    await file.makePublic();
    
    // Return the public URL
    return `https://storage.googleapis.com/${bucket.name}/${filename}`;
  } catch (error) {
    console.error('Error uploading drawing image:', error);
    throw new Error('Failed to upload drawing image');
  }
};

exports.handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };

  // Handle preflight request
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers,
      body: "",
    };
  }

  // Only allow POST requests
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  try {
    // Verify authentication
    const userId = await verifyAuthToken(event.headers.authorization);

    // Parse request body
    const { question, drawingImageBase64, questionId } = JSON.parse(event.body);

    if (!question || !drawingImageBase64) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: "Missing required fields: question and drawingImageBase64" 
        }),
      };
    }

    // Check rate limit
    await checkRateLimit(userId);

    // Upload drawing image to Firebase Storage
    const imageUrl = await uploadDrawingImage(
      userId, 
      questionId || `drawing_${Date.now()}`, 
      drawingImageBase64
    );

    // Initialize Gemini AI
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL_NAME || "gemini-2.5-flash" });

    // Prepare the image data for Gemini
    const base64Data = drawingImageBase64.replace(/^data:image\/\w+;base64,/, '');
    
    const imagePart = {
      inlineData: {
        data: base64Data,
        mimeType: "image/png",
      },
    };

    // Create validation prompt
    const prompt = `You are a helpful math teacher evaluating a student's drawing for a math question.

Question: ${question}

Please analyze the student's drawing and determine if it correctly answers the question.

Your response MUST be in the following JSON format:
{
  "isCorrect": true/false,
  "feedback": "Brief explanation of why the answer is correct or incorrect, and if incorrect, what the student should fix"
}

Be encouraging and constructive in your feedback. If the drawing is correct, praise the student. If incorrect, explain what's wrong and how to improve.

Focus on the geometric properties and mathematical accuracy, not artistic quality. Don't expect perfection in drawings and accept minor inaccuracies, 

such as angles not being perfectly equal to the expected values. For example if an angle is 60 degrees, a drawing showing greater than 45 and less than 90 should be accepted.`;

    // Call Gemini Vision API
    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    const text = response.text();

    // Parse the JSON response
    let validationResult;
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/\{[\s\S]*\}/);
      const jsonText = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : text;
      validationResult = JSON.parse(jsonText);
    } catch (parseError) {
      console.error('Failed to parse Gemini response:', text);
      // Fallback: try to determine correctness from the text
      const lowerText = text.toLowerCase();
      const isCorrect = lowerText.includes('correct') && !lowerText.includes('incorrect');
      validationResult = {
        isCorrect: isCorrect,
        feedback: text
      };
    }

    // Return validation result along with the image URL
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        isCorrect: validationResult.isCorrect,
        feedback: validationResult.feedback,
        imageUrl: imageUrl
      }),
    };

  } catch (error) {
    console.error("Error in validate-drawing function:", error);

    // Handle rate limit errors
    if (error.message.includes("daily limit")) {
      return {
        statusCode: 429,
        headers,
        body: JSON.stringify({ error: error.message }),
      };
    }

    // Handle authentication errors
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

    // Handle validation errors
    if (error.message.includes("Missing required fields")) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: error.message }),
      };
    }

    // Generic error
    const isDevelopment = process.env.NODE_ENV === "development";
    const errorResponse = {
      error: "Failed to validate drawing",
      ...(isDevelopment && { details: error.message, stack: error.stack }),
    };

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify(errorResponse),
    };
  }
};
