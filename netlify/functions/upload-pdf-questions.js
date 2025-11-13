const { admin, db } = require("./firebase-admin");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { GRADES, TOPICS, VALID_TOPICS_BY_GRADE } = require("./constants");

// Helper function to verify Firebase auth token
const verifyAuthToken = async (authHeader) => {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new Error("Missing or invalid authorization header");
  }

  const token = authHeader.split("Bearer ")[1];
  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    return decodedToken;
  } catch (error) {
    throw new Error("Invalid authentication token");
  }
};

// Helper function to verify teacher role
const verifyTeacherRole = async (userId, appId) => {
  const profileRef = db.doc(`artifacts/${appId}/users/${userId}/math_whiz_data/profile`);
  const profileSnap = await profileRef.get();
  
  if (!profileSnap.exists) {
    throw new Error("User profile not found");
  }
  
  const profileData = profileSnap.data();
  if (profileData.role !== 'teacher' && profileData.role !== 'admin') {
    throw new Error("User is not a teacher or admin");
  }
  
  return true;
};

// Parse multipart/form-data
const parseMultipartFormData = (event) => {
  const contentType = event.headers['content-type'] || event.headers['Content-Type'] || '';
  
  console.log('Content-Type header:', contentType);
  
  if (!contentType.includes('multipart/form-data')) {
    throw new Error(`Content-Type must be multipart/form-data, got: ${contentType}`);
  }

  // Extract boundary - handle both quoted and unquoted boundaries
  let boundaryMatch = contentType.match(/boundary=([^;,\s]+)/);
  if (!boundaryMatch) {
    boundaryMatch = contentType.match(/boundary="([^"]+)"/);
  }
  if (!boundaryMatch) {
    throw new Error(`Missing boundary in Content-Type: ${contentType}`);
  }
  const boundary = boundaryMatch[1].trim();
  console.log('Extracted boundary:', boundary);

  // Get body as buffer
  let bodyBuffer;
  if (event.isBase64Encoded) {
    bodyBuffer = Buffer.from(event.body, 'base64');
  } else if (typeof event.body === 'string') {
    // Try binary first, if that fails, use utf8
    try {
      bodyBuffer = Buffer.from(event.body, 'binary');
    } catch (e) {
      bodyBuffer = Buffer.from(event.body, 'utf8');
    }
  } else {
    bodyBuffer = Buffer.isBuffer(event.body) ? event.body : Buffer.from(event.body);
  }
  
  console.log('Body buffer length:', bodyBuffer.length);
  console.log('First 100 bytes:', bodyBuffer.slice(0, 100).toString('hex'));

  // Split by boundary - multipart boundaries in body start with -- and end with --
  // The boundary in Content-Type is without the leading --, but in body it's --boundary
  const boundaryMarker = `--${boundary}`;
  const boundaryBuffer = Buffer.from(boundaryMarker);
  const parts = [];
  let start = 0;

  while (true) {
    const index = bodyBuffer.indexOf(boundaryBuffer, start);
    if (index === -1) break;
    
    if (start > 0) {
      // Extract part between boundaries (exclude trailing CRLF before boundary)
      let partEnd = index;
      // Remove trailing CRLF if present
      if (partEnd >= 2 && bodyBuffer[partEnd - 2] === 0x0D && bodyBuffer[partEnd - 1] === 0x0A) {
        partEnd -= 2;
      }
      const partBuffer = bodyBuffer.slice(start, partEnd);
      if (partBuffer.length > 0) {
        parts.push(partBuffer);
      }
    }
    
    start = index + boundaryBuffer.length;
    // Skip CRLF after boundary
    if (bodyBuffer[start] === 0x0D && bodyBuffer[start + 1] === 0x0A) {
      start += 2;
    } else if (bodyBuffer[start] === 0x0A) {
      start += 1;
    }
    
    // Check if this is the final boundary (ends with --)
    if (start < bodyBuffer.length - 2) {
      const nextTwo = bodyBuffer.slice(start, start + 2);
      if (nextTwo.toString() === '--') {
        break; // Final boundary marker
      }
    }
  }

  const fields = {};
  let fileData = null;
  let fileName = null;
  let fileContentType = null;

  console.log(`Found ${parts.length} parts in multipart data`);
  
  for (let i = 0; i < parts.length; i++) {
    const partBuffer = parts[i];
    
    // Find header/body separator (CRLF CRLF or LF LF)
    let separator = Buffer.from('\r\n\r\n');
    let separatorIndex = partBuffer.indexOf(separator);
    
    if (separatorIndex === -1) {
      separator = Buffer.from('\n\n');
      separatorIndex = partBuffer.indexOf(separator);
    }
    
    if (separatorIndex === -1) {
      console.log(`Part ${i}: No header separator found, skipping`);
      continue;
    }

    const headerBuffer = partBuffer.slice(0, separatorIndex);
    const bodyStart = separatorIndex + separator.length;
    const bodyBuffer = partBuffer.slice(bodyStart);
    
    // Remove trailing CRLF or LF from body
    let cleanBody = bodyBuffer;
    if (cleanBody.length >= 2 && cleanBody[cleanBody.length - 2] === 0x0D && cleanBody[cleanBody.length - 1] === 0x0A) {
      cleanBody = cleanBody.slice(0, -2);
    } else if (cleanBody.length >= 1 && cleanBody[cleanBody.length - 1] === 0x0A) {
      cleanBody = cleanBody.slice(0, -1);
    }

    const headers = headerBuffer.toString('utf8');
    console.log(`Part ${i} headers:`, headers.substring(0, 200));
    
    // Match name="..." but NOT filename="..." - need to match name= specifically before filename=
    // The format is: Content-Disposition: form-data; name="file"; filename="..."
    // We want to match name="file" specifically
    let fieldName = null;
    
    // First try to match name="..." that comes before filename=
    const nameBeforeFilename = headers.match(/;\s*name="([^"]+)"\s*;\s*filename=/);
    if (nameBeforeFilename) {
      fieldName = nameBeforeFilename[1];
    } else {
      // If no filename, just match name="..."
      const nameMatch = headers.match(/;\s*name="([^"]+)"/);
      if (nameMatch) {
        fieldName = nameMatch[1];
      } else {
        // Fallback: try to find name= that's not part of filename=
        const altMatch = headers.match(/(?:^|[^f])name="([^"]+)"/);
        if (altMatch) {
          fieldName = altMatch[1];
        }
      }
    }
    
    if (!fieldName) {
      console.log(`Part ${i}: No Content-Disposition name found`);
      continue;
    }
    
    console.log(`Part ${i} field name:`, fieldName);

    if (fieldName === 'file') {
      const filenameMatch = headers.match(/filename="([^"]+)"/);
      fileName = filenameMatch ? filenameMatch[1] : 'upload.pdf';
      console.log(`File name: ${fileName}`);
      
      const contentTypeMatch = headers.match(/Content-Type:\s*([^\r\n]+)/i);
      fileContentType = contentTypeMatch ? contentTypeMatch[1].trim() : 'application/pdf';
      console.log(`File content type: ${fileContentType}`);
      console.log(`File data length: ${cleanBody.length}`);

      fileData = cleanBody;
    } else {
      // Regular form field
      fields[fieldName] = cleanBody.toString('utf8');
      console.log(`Field ${fieldName}: ${fields[fieldName].substring(0, 50)}...`);
    }
  }
  
  console.log(`Parsed fields:`, Object.keys(fields));
  console.log(`File data present:`, !!fileData);

  return { fields, fileData, fileName, fileContentType };
};

exports.handler = async (event) => {
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
    const authHeader = event.headers.authorization || event.headers.Authorization;
    const decodedToken = await verifyAuthToken(authHeader);
    const userId = decodedToken.uid;

    // Parse multipart form data
    let fields, fileData, fileName, fileContentType;
    try {
      const parsed = parseMultipartFormData(event);
      fields = parsed.fields;
      fileData = parsed.fileData;
      fileName = parsed.fileName;
      fileContentType = parsed.fileContentType;
    } catch (parseError) {
      console.error('Multipart parsing error:', parseError);
      console.error('Error stack:', parseError.stack);
      console.error('Content-Type:', event.headers['content-type'] || event.headers['Content-Type']);
      console.error('Body type:', typeof event.body);
      console.error('Body length:', event.body ? event.body.length : 0);
      console.error('isBase64Encoded:', event.isBase64Encoded);
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: "Failed to parse multipart form data",
          details: parseError.message,
          contentType: event.headers['content-type'] || event.headers['Content-Type'] || 'not set'
        }),
      };
    }

    const appId = fields.appId || 'default-app-id';
    const classId = fields.classId || null; // Optional: can be null for global question bank

    // Verify teacher role
    await verifyTeacherRole(userId, appId);

    // Validate file
    if (!fileData || fileData.length === 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "No file uploaded" }),
      };
    }

    // Check file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (fileData.length > maxSize) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "File size exceeds 10MB limit" }),
      };
    }

    // Validate PDF content type
    if (!fileContentType.includes('pdf') && !fileName.toLowerCase().endsWith('.pdf')) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "File must be a PDF" }),
      };
    }

    // Convert PDF to base64 for Gemini
    const base64Pdf = fileData.toString('base64');
    const mimeType = 'application/pdf';

    // Initialize Gemini
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

    // Create prompt for question extraction
    const extractionPrompt = `You are an expert at extracting math quiz questions from PDF documents. 
Analyze this PDF and extract all math questions you find. For each question, provide:

1. The question text (including any diagrams, images, or graphics - describe them in detail)
2. The correct answer
3. Multiple choice options (if applicable, otherwise provide empty array)
4. A helpful hint (if available)
5. The math topic (choose from: Multiplication, Division, Fractions, Measurement & Data, Operations & Algebraic Thinking, Base Ten, Fractions 4th, Measurement & Data 4th, Geometry, Binary Addition)
6. The grade level (G3 or G4)
7. Any images or graphics associated with the question (describe their content and position)

Return the results as a JSON array where each question has this structure:
{
  "question": "question text with image descriptions",
  "correctAnswer": "correct answer",
  "options": ["option1", "option2", "option3", "option4"],
  "hint": "helpful hint or explanation",
  "topic": "topic name",
  "grade": "G3" or "G4",
  "images": [
    {
      "type": "question" | "answer" | "hint",
      "description": "detailed description of the image/graphic",
      "position": "where in the question this image appears"
    }
  ],
  "standard": "optional standard code",
  "concept": "optional concept name"
}

Extract ALL questions from the PDF. Be thorough and accurate.`;

    // Use Gemini File API or direct PDF processing
    // For Gemini 2.0 Flash, we can pass PDF directly
    const result = await model.generateContent([
      {
        inlineData: {
          data: base64Pdf,
          mimeType: mimeType
        }
      },
      extractionPrompt
    ]);

    const response = await result.response;
    const extractedText = response.text();

    // Parse the extracted JSON
    let questions = [];
    try {
      // Try to extract JSON from the response (might be wrapped in markdown code blocks)
      const jsonMatch = extractedText.match(/```json\s*([\s\S]*?)\s*```/) || 
                       extractedText.match(/```\s*([\s\S]*?)\s*```/) ||
                       extractedText.match(/\[[\s\S]*\]/);
      
      if (jsonMatch) {
        questions = JSON.parse(jsonMatch[1] || jsonMatch[0]);
      } else {
        // Try parsing the entire response as JSON
        questions = JSON.parse(extractedText);
      }
    } catch (parseError) {
      console.error("Error parsing extracted questions:", parseError);
      console.error("Raw response:", extractedText);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: "Failed to parse extracted questions",
          rawResponse: extractedText.substring(0, 500) // First 500 chars for debugging
        }),
      };
    }

    // Validate questions structure
    if (!Array.isArray(questions)) {
      questions = [questions];
    }

    // Validate and clean questions
    const validatedQuestions = questions.map((q, index) => {
      if (!q.question || !q.correctAnswer) {
        throw new Error(`Question ${index + 1} is missing required fields`);
      }

      return {
        question: q.question || '',
        correctAnswer: q.correctAnswer || '',
        options: Array.isArray(q.options) ? q.options : [],
        hint: q.hint || '',
        topic: q.topic || 'Multiplication',
        grade: q.grade || 'G3',
        standard: q.standard || '',
        concept: q.concept || '',
        images: Array.isArray(q.images) ? q.images : [],
        source: 'pdf-upload',
        pdfSource: fileName
      };
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        questions: validatedQuestions,
        fileName: fileName,
        totalQuestions: validatedQuestions.length
      }),
    };

  } catch (error) {
    console.error("PDF upload error:", error);
    console.error("Error stack:", error.stack);
    console.error("Error name:", error.name);
    console.error("Error message:", error.message);

    if (error.message.includes("authorization") || error.message.includes("authentication") || error.message.includes("Missing or invalid")) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: error.message }),
      };
    }

    if (error.message.includes("not a teacher") || error.message.includes("not a teacher or admin")) {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({ error: error.message }),
      };
    }

    // Check if it's a validation error (should be 400)
    if (error.message.includes("Content-Type") || error.message.includes("boundary") || error.message.includes("multipart")) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: error.message,
          details: "Please ensure the file is uploaded as multipart/form-data"
        }),
      };
    }

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: "Internal server error",
        details: error.message 
      }),
    };
  }
};

