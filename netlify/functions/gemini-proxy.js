const { GoogleGenerativeAI } = require('@google/generative-ai');
const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  // Handle private key encoding for different environments
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;
  
  if (privateKey) {
    // Handle different encoding scenarios
    try {
      // First try: Replace literal \n with actual newlines
      privateKey = privateKey.replace(/\\n/g, '\n');
      
      // Second try: If it's base64 encoded, decode it
      if (!privateKey.includes('-----BEGIN PRIVATE KEY-----')) {
        privateKey = Buffer.from(privateKey, 'base64').toString('utf8');
      }
      
      // Third try: Ensure proper formatting
      if (!privateKey.includes('-----BEGIN PRIVATE KEY-----')) {
        throw new Error('Private key format invalid');
      }
    } catch (error) {
      console.error('Private key processing error:', error);
      throw new Error('Failed to process Firebase private key');
    }
  }

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: privateKey,
    }),
    databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}.firebaseio.com`
  });
}

const db = admin.firestore();

// Valid math topics for the Math Whiz app
const VALID_TOPICS = ['Multiplication', 'Division', 'Fractions', 'Measurement & Data'];

// Helper function to get today's date string
const getTodayDateString = () => {
  const today = new Date();
  return today.toISOString().split('T')[0]; // YYYY-MM-DD format
};

// Helper function to verify Firebase auth token
const verifyAuthToken = async (authHeader) => {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Missing or invalid authorization header');
  }
  
  const token = authHeader.split('Bearer ')[1];
  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    return decodedToken.uid;
  } catch (error) {
    throw new Error('Invalid authentication token');
  }
};

// Helper function to check and update rate limiting
const checkRateLimit = async (userId, topic) => {
  const today = getTodayDateString();
  const userDoc = db.collection('artifacts').doc('default-app-id').collection('users').doc(userId).collection('math_whiz_data').doc('profile');
  
  const userData = await userDoc.get();
  if (!userData.exists) {
    throw new Error('User data not found');
  }
  
  const data = userData.data();
  const dailyQueries = data.dailyQueries?.[today] || {};
  
  // Check if user has already used this topic today
  if (dailyQueries[topic]) {
    throw new Error(`You have already created a story problem for ${topic} today. Please try a different topic or come back tomorrow.`);
  }
  
  // Check total queries for today (max 4 per day)
  const totalQueriesToday = Object.keys(dailyQueries).length;
  if (totalQueriesToday >= 4) {
    throw new Error('You have reached your daily limit of 4 story problems. Please come back tomorrow.');
  }
  
  // Update the rate limit counter
  await userDoc.update({
    [`dailyQueries.${today}.${topic}`]: true
  });
  
  return true;
};

// Helper function to validate topic and enhance prompt
const validateAndEnhancePrompt = (originalPrompt, topic) => {
  if (!VALID_TOPICS.includes(topic)) {
    throw new Error(`Invalid topic: ${topic}. Valid topics are: ${VALID_TOPICS.join(', ')}`);
  }
  
  // Enhance the prompt to ensure it stays on topic and is appropriate for 3rd graders
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

exports.handler = async (event) => {
  // Handle CORS for browser requests
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  // Handle preflight OPTIONS request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return { 
      statusCode: 405, 
      headers,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  try {
    // Verify authentication
    const authHeader = event.headers.authorization || event.headers.Authorization;
    const userId = await verifyAuthToken(authHeader);
    
    const { prompt, topic } = JSON.parse(event.body);
    
    if (!prompt) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Prompt is required' })
      };
    }
    
    if (!topic) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Topic is required' })
      };
    }

    // Check rate limiting and topic validity
    await checkRateLimit(userId, topic);
    
    // Validate topic and enhance prompt for safety
    const enhancedPrompt = validateAndEnhancePrompt(prompt, topic);

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    
    const result = await model.generateContent(enhancedPrompt);
    const response = await result.response;
    const text = response.text();
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ content: text })
    };
  } catch (error) {
    console.error('Gemini API error:', error);
    console.error('Error stack:', error.stack);
    console.error('Error details:', {
      message: error.message,
      name: error.name,
      code: error.code
    });
    
    // Return appropriate error messages
    if (error.message.includes('authorization') || error.message.includes('authentication')) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: error.message })
      };
    }
    
    if (error.message.includes('daily limit') || error.message.includes('already created')) {
      return {
        statusCode: 429,
        headers,
        body: JSON.stringify({ error: error.message })
      };
    }
    
    if (error.message.includes('Invalid topic')) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: error.message })
      };
    }
    
    // Special handling for Firebase/Firestore connection errors
    if (error.message.includes('DECODER routines') || error.message.includes('Getting metadata from plugin failed') || error.code === 2) {
      console.error('Firebase connection error detected. Check private key encoding.');
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: 'Authentication service temporarily unavailable. Please try again later.',
          hint: 'Firebase configuration issue'
        })
      };
    }
    
    // For debugging - include more error info in development
    const isDevelopment = process.env.NODE_ENV === 'development';
    const errorResponse = {
      error: 'Internal server error',
      ...(isDevelopment && { details: error.message, stack: error.stack })
    };
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify(errorResponse)
    };
  }
}; 