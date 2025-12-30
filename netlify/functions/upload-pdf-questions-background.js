const { admin, db } = require("./firebase-admin");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { GRADES, TOPICS, VALID_TOPICS_BY_GRADE } = require("./constants");
const Busboy = require("busboy");

const MAX_UPLOAD_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
const JOB_ID_MAX_LENGTH = 160;

const createJobId = (userId) => `${userId}_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;

const sanitizeJobId = (jobId, userId) => {
  if (!jobId || typeof jobId !== 'string') return null;
  const trimmed = jobId.trim();
  if (!trimmed.startsWith(`${userId}_`)) return null;
  if (trimmed.length > JOB_ID_MAX_LENGTH) return null;
  if (!/^[A-Za-z0-9_\-]+$/.test(trimmed)) return null;
  return trimmed;
};

// Helper to get Firestore Timestamp
const getTimestamp = () => admin.firestore.Timestamp.now();

// Helper to check if job was cancelled
const checkJobCancelled = async (jobRef) => {
  const jobDoc = await jobRef.get();
  if (!jobDoc.exists) {
    throw new Error('Job no longer exists');
  }
  const status = jobDoc.data().status;
  if (status === 'cancelled') {
    throw new Error('Job was cancelled by user');
  }
  return false;
};

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

const sanitizeLLMJsonString = (input) => {
  if (!input) return input;
  let result = "";
  let inString = false;
  let escapeNext = false;

  for (let i = 0; i < input.length; i++) {
    let char = input[i];

    // Normalize smart quotes
    if (char === "“" || char === "”") char = '"';
    if (char === "’") char = "'";

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
      if (char === "\n") {
        result += "\\n";
        continue;
      }
      if (char === "\r") {
        result += "\\r";
        continue;
      }
      if (char === "\t") {
        result += "\\t";
        continue;
      }
    }

    result += char;
  }

  // Remove trailing commas before closing braces/brackets
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

// Parse multipart/form-data using busboy
const parseMultipartFormData = (event) => {
  return new Promise((resolve, reject) => {
    const contentType = event.headers['content-type'] || event.headers['Content-Type'] || '';
    
    console.log('Content-Type header:', contentType);
    
    if (!contentType.includes('multipart/form-data')) {
      reject(new Error(`Content-Type must be multipart/form-data, got: ${contentType}`));
      return;
    }

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

    const fields = {};
    let fileData = null;
    let fileName = null;
    let fileContentType = null;
    let fileTooLarge = false;

    // Create a readable stream from the buffer
    const { Readable } = require('stream');
    const bufferStream = new Readable();
    bufferStream.push(bodyBuffer);
    bufferStream.push(null);

    // Initialize busboy with the content-type header
    const busboy = Busboy({ 
      headers: { 'content-type': contentType },
      limits: { fileSize: MAX_UPLOAD_SIZE_BYTES }
    });

    // Handle regular form fields
    busboy.on('field', (fieldname, val) => {
      console.log(`Field [${fieldname}]: ${val.substring(0, 50)}...`);
      fields[fieldname] = val;
    });

    // Handle file uploads
    busboy.on('file', (fieldname, file, info) => {
      const { filename, encoding, mimeType } = info;
      console.log(`File [${fieldname}]: filename: ${filename}, encoding: ${encoding}, mimeType: ${mimeType}`);
      
      fileName = filename || 'upload.pdf';
      fileContentType = mimeType || 'application/pdf';
      
      const chunks = [];
      file.on('data', (data) => {
        chunks.push(data);
      });

      file.on('limit', () => {
        console.warn(`File [${fieldname}] exceeded size limit of ${MAX_UPLOAD_SIZE_BYTES} bytes`);
        fileTooLarge = true;
        file.resume();
      });
      
      file.on('end', () => {
        fileData = Buffer.concat(chunks);
        console.log(`File [${fieldname}] size: ${fileData.length} bytes`);
      });

      file.on('error', (err) => {
        console.error(`File [${fieldname}] error:`, err);
        reject(err);
      });
    });

    // Handle errors
    busboy.on('error', (err) => {
      console.error('Busboy error:', err);
      reject(err);
    });

    // Handle completion
    busboy.on('finish', () => {
      console.log('Busboy finished parsing');
      console.log(`Parsed fields:`, Object.keys(fields));
      console.log(`File data present:`, !!fileData);
      if (fileTooLarge) {
        reject(new Error('File size exceeds 10MB limit'));
        return;
      }
      resolve({ fields, fileData, fileName, fileContentType });
    });

    // Handle errors on bufferStream
    bufferStream.on('error', (err) => {
      console.error('Buffer stream error:', err);
      reject(err);
    });

    // Pipe the buffer stream to busboy
    bufferStream.pipe(busboy);
  });
};

exports.handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Expose-Headers": "X-Job-Id",
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

  // Handle GET requests for job status polling
  if (event.httpMethod === "GET") {
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
      const appId = event.queryStringParameters?.appId || 'default-app-id';

      // Get job status from Firestore
      const jobRef = db.collection('artifacts').doc(appId)
        .collection('pdfProcessingJobs').doc(jobId);
      const jobDoc = await jobRef.get();

      if (!jobDoc.exists) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ error: "Job not found" }),
        };
      }

      const jobData = jobDoc.data();
      
      // Verify user owns this job
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
          questions: jobData.questions || null,
          fileName: jobData.fileName || null,
          totalQuestions: jobData.totalQuestions || 0,
          error: jobData.error || null,
          createdAt: jobData.createdAt,
          completedAt: jobData.completedAt || null
        }),
      };
    } catch (error) {
      console.error("Job status check error:", error);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: "Failed to check job status", details: error.message }),
      };
    }
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
      const parsed = await parseMultipartFormData(event);
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
    const grade = fields.grade || GRADES.G3; // Default to Grade 3 if not specified
    const providedJobId = sanitizeJobId(fields.jobId, userId);

    // Verify teacher role
    await verifyTeacherRole(userId, appId);

    // Generate job ID
    const jobId = providedJobId || createJobId(userId);
    
    // Create job document in Firestore with initial status
    const jobRef = db.collection('artifacts').doc(appId)
      .collection('pdfProcessingJobs').doc(jobId);
    
    await jobRef.set({
      userId,
      status: 'processing',
      progress: 0,
      fileName: fileName,
      classId: classId,
      grade: grade,
      createdAt: getTimestamp(),
      appId
    });

    // Return job ID immediately (background function will process asynchronously)
    // Process the PDF asynchronously with timeout protection
    processPDFAsyncWithTimeout(jobId, userId, appId, classId, grade, fileData, fileName, fileContentType)
      .catch(async error => {
        console.error('Async processing error:', error);
        await jobRef.update({
          status: 'error',
          error: error.message,
          completedAt: getTimestamp()
        });
      });

    // Return job ID in both header and body for reliability
    return {
      statusCode: 202, // Accepted - processing started
      headers: {
        ...headers,
        'X-Job-Id': jobId, // Also include in header in case body is stripped
      },
      body: JSON.stringify({ 
        jobId,
        status: 'processing',
        message: 'PDF processing started. Poll /upload-pdf-questions-background?jobId=' + jobId + ' for status.'
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

// Async function to process PDF in the background
async function processPDFAsync(jobId, userId, appId, classId, grade, fileData, fileName, fileContentType) {
  const jobRef = db.collection('artifacts').doc(appId)
    .collection('pdfProcessingJobs').doc(jobId);

  try {
    // Validate file
    if (!fileData || fileData.length === 0) {
      throw new Error("No file uploaded");
    }

    // Check file size (10MB limit)
    if (fileData.length > MAX_UPLOAD_SIZE_BYTES) {
      await jobRef.update({
        status: 'error',
        error: 'File size exceeds 10MB limit',
        completedAt: getTimestamp()
      });
      return;
    }

    // Validate PDF content type
    if (!fileContentType.includes('pdf') && !fileName.toLowerCase().endsWith('.pdf')) {
      await jobRef.update({
        status: 'error',
        error: 'File must be a PDF',
        completedAt: getTimestamp()
      });
      return;
    }

    // Update progress: Starting PDF extraction
    await jobRef.update({ progress: 10 });

    // Check if job was cancelled before starting PDF extraction
    await checkJobCancelled(jobRef);

    // Convert PDF to base64 for Gemini
    const base64Pdf = fileData.toString('base64');
    const mimeType = 'application/pdf';

    // Initialize Gemini
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    // Use environment variable for model name, fallback to stable default
    const modelName = process.env.GEMINI_MODEL_NAME || "gemini-2.5-flash";
    console.log('Using Gemini model:', modelName);
    const maxOutputTokens = parseInt(process.env.GEMINI_MAX_OUTPUT_TOKENS) || 65536;
    console.log('Using maxOutputTokens:', maxOutputTokens);
    let model;
    try {
      model = genAI.getGenerativeModel({ 
        model: modelName,
        generationConfig: {
          maxOutputTokens: maxOutputTokens
        }
      });
    } catch (err) {
      await jobRef.update({
        status: 'error',
        error: `Failed to initialize Gemini model "${modelName}": ${err.message}`,
        completedAt: getTimestamp()
      });
      throw new Error(`Gemini model initialization failed: ${err.message}`);
    }

    // Get grade-specific topics for the prompt
    const gradeTopics = VALID_TOPICS_BY_GRADE[grade] || VALID_TOPICS_BY_GRADE[GRADES.G3];
    const topicsListForPrompt = gradeTopics.join(', ');
    const gradeLabel = grade === GRADES.G4 ? 'Grade 4' : 'Grade 3';

    // Create prompt for question extraction
    const extractionPrompt = `You are an expert at extracting math quiz questions from PDF documents. 
Analyze this PDF and extract all math questions you find. If a question consists of multiple parts, create a separate question for each. Then, for each question, provide:

1. The question text
2. Question type: (choose ONLY from these 6: 'multiple-choice', 'numeric', 'drawing', 'fill-in-the-blanks', 'write-in', 'drawing-with-text')
   - 'numeric': if the answer is a numeric value (e.g., "5.3", "-1.2", "0.001")
   - 'fill-in-the-blanks': if the question has one or more blanks to fill in (e.g., "5 × ____ = 20" or "The product of ____ and ____ is 24")
     * Use __ (two underscores) to indicate each blank in the question text
     * Provide answers separated by ;; (double semicolons) in the correctAnswer field
     * Example: question: "5 × ____ = ____", correctAnswer: "4 ;; 20"
   - 'drawing': if the user has to draw or mark something on an existing graphic (e.g., "Draw an obtuse triangle", "Mark the point on the number line")
   - 'write-in': if the user has to write a text explanation or show work (e.g., "Explain your reasoning", "Show how you solved this")
   - 'drawing-with-text': if the user has to both draw/mark something AND write an explanation
   - 'multiple-choice': all other questions with answer choices
3. The correct answer. Do not include the units in the correct answer for numeric questions. (REQUIRED for 'multiple-choice' and 'numeric', OPTIONAL for 'drawing', 'write-in', 'drawing-with-text')
   - For 'drawing', 'write-in', and 'drawing-with-text' questions, you can provide an expected answer description in 'correctAnswer' or omit it.
4. Multiple choice options (REQUIRED for 'multiple-choice', empty array for others)
   - Must provide exactly 4 options for multiple-choice questions
5. A helpful hint (if available)
6. The math topic (choose ONLY from these ${gradeLabel} topics: ${topicsListForPrompt})

IMPORTANT: 
- The topic MUST be one of these exact values: ${topicsListForPrompt}
- Question type MUST be exactly one of: 'multiple-choice', 'numeric', 'drawing', 'fill-in-the-blanks', 'write-in', 'drawing-with-text' (lowercase, with hyphen)
- For 'fill-in-the-blanks': Use __ (two underscores) for blanks, separate answers with ;; in correctAnswer

Return the results as a JSON array where each question has this structure:
{
  "question": "question text (use __ for blanks in fill-in-the-blanks)",
  "questionType": "multiple-choice" | "numeric" | "drawing" | "fill-in-the-blanks" | "write-in" | "drawing-with-text",
  "correctAnswer": "correct answer (use ;; to separate multiple answers for fill-in-the-blanks)",
  "options": ["option1", "option2", "option3", "option4"] (required for multiple-choice, empty array for others),
  "hint": "helpful hint or explanation",
  "topic": "topic name from the allowed list"
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
    
    // Check if response was truncated
    const finishReason = response.candidates?.[0]?.finishReason;
    const isTruncated = finishReason === 'MAX_TOKENS' || finishReason === 'OTHER';
    
    if (isTruncated) {
      console.warn(`Response was truncated (finishReason: ${finishReason}). Attempting to parse partial JSON...`);
    }

    // Parse the extracted JSON
    let questions = [];
    try {
      const candidateJson = extractJsonCandidate(extractedText);
      
      // Check if JSON appears incomplete (doesn't end with ] or } or has unmatched brackets)
      // NOTE: This simple bracket counting doesn't account for escaped brackets within strings.
      // For example, a question containing "What is \[x\]?" would be counted incorrectly,
      // potentially leading to false positives when detecting incomplete JSON.
      const trimmed = candidateJson.trim();
      const isIncomplete = isTruncated ||
        (!trimmed.endsWith(']') && !trimmed.endsWith('}')) ||
        (trimmed.split('[').length - 1) !== (trimmed.split(']').length - 1) ||
        (trimmed.split('{').length - 1) !== (trimmed.split('}').length - 1);
      
      if (isIncomplete) {
        // Try to close the JSON array/object
        let repairedJson = trimmed;
        
        // Count open brackets/braces
        const openBrackets = (repairedJson.match(/\[/g) || []).length;
        const closeBrackets = (repairedJson.match(/\]/g) || []).length;
        let openBraces = (repairedJson.match(/\{/g) || []).length;
        let closeBraces = (repairedJson.match(/\}/g) || []).length;
        
        // If we're in an array, try to close it
        if (openBrackets > closeBrackets) {
          // Remove trailing comma if present
          repairedJson = repairedJson.replace(/,\s*$/, '');
          // Close any open objects
          while (openBraces > closeBraces) {
            repairedJson += '}';
            closeBraces++;
          }
          // Close the array
          repairedJson += ']';
        } else if (openBraces > closeBraces) {
          // Remove trailing comma if present
          repairedJson = repairedJson.replace(/,\s*$/, '');
          // Close any open braces
          while (openBraces > closeBraces) {
            repairedJson += '}';
            closeBraces++;
          }
        }
        
        console.warn("Attempting to repair incomplete JSON...");
        try {
          questions = JSON.parse(repairedJson);
          console.warn(`Successfully parsed repaired JSON with ${questions.length} questions (response was truncated)`);
        } catch (repairError) {
          // If repair failed, try original with sanitization
          console.warn("Repair failed, trying sanitization...");
          const sanitized = sanitizeLLMJsonString(candidateJson);
          questions = JSON.parse(sanitized);
        }
      } else {
        try {
          questions = JSON.parse(candidateJson);
        } catch (primaryParseError) {
          console.warn("Primary JSON parse failed, attempting sanitation...");
          const sanitized = sanitizeLLMJsonString(candidateJson);
          questions = JSON.parse(sanitized);
        }
      }
    } catch (parseError) {
      console.error("Error parsing extracted questions:", parseError);
      console.error("Raw response length:", extractedText.length);
      console.error("Raw response preview:", extractedText.substring(0, 500));
      console.error("Raw response ending:", extractedText.substring(Math.max(0, extractedText.length - 500)));
      console.error("Finish reason:", finishReason);
      
      await jobRef.update({
        status: 'error',
        error: isTruncated 
          ? 'Response was truncated by Gemini (too many questions). Please try splitting the PDF into smaller sections.'
          : 'Failed to parse extracted questions',
        completedAt: getTimestamp()
      });
      return;
    }

    // Update progress: Questions extracted
    await jobRef.update({ progress: 50 });

    // Check if job was cancelled after extraction
    await checkJobCancelled(jobRef);

    // Validate questions structure
    if (!Array.isArray(questions)) {
      questions = [questions];
    }

    // Validate and clean questions
    let validatedQuestions = questions.map((q, index) => {
      // Validate required fields
      if (!q.question) {
        throw new Error(`Question ${index + 1} is missing question text`);
      }

      // Process and validate question type
      let questionType = (q.questionType || '').toLowerCase().trim();
      const validQuestionTypes = ['multiple-choice', 'numeric', 'drawing', 'fill-in-the-blanks', 'write-in', 'drawing-with-text'];
      
      // Handle variations and normalize question type
      if (!questionType || !validQuestionTypes.includes(questionType)) {
        // Try to infer from question content or default
        const questionLower = q.question.toLowerCase();
        if (questionLower.includes('draw') || questionLower.includes('sketch') || questionLower.includes('mark')) {
          questionType = 'drawing';
        } else {
          questionType = 'multiple-choice';
        }
        console.warn(`Question ${index + 1} has invalid/missing question type "${q.questionType}". Inferred as: ${questionType}`);
      }

      // Validate correctAnswer based on question type
      // Drawing questions don't require correctAnswer (AI validates the drawing)
      // Multiple-choice and numeric questions require correctAnswer
      if (!['drawing', 'write-in', 'drawing-with-text'].includes(questionType) && !q.correctAnswer) {
        throw new Error(`Question ${index + 1} (${questionType}) is missing required correctAnswer field`);
      }

      // Validate topic against grade-specific topics
      const validTopics = VALID_TOPICS_BY_GRADE[grade] || VALID_TOPICS_BY_GRADE[GRADES.G3];
      let questionTopic = q.topic || validTopics[0]; // Default to first topic if not specified
      
      // Check if the provided topic is valid for this grade
      if (!validTopics.includes(questionTopic)) {
        console.warn(`Question ${index + 1} has invalid topic "${questionTopic}" for grade ${grade}. Using default: ${validTopics[0]}`);
        questionTopic = validTopics[0];
      }

      // Process options based on question type
      let processedOptions = [];
      if (questionType === 'multiple-choice') {
        // Multiple-choice questions need options
        processedOptions = Array.isArray(q.options) ? q.options.filter(opt => opt && opt.trim() !== '') : [];
      } else {
        // Numeric, drawing, and fill-in-the-blanks questions should not have options
        processedOptions = [];
      }
      
      // For fill-in-the-blanks, validate blank count matches answer count
      if (questionType === 'fill-in-the-blanks') {
        const blanks = (q.question || '').match(/_{2,}/g) || [];
        const answers = (q.correctAnswer || '').split(';;').map(a => a.trim()).filter(Boolean);
        if (blanks.length !== answers.length) {
          throw new Error(`Question ${index + 1} (fill-in-the-blanks) has ${blanks.length} blanks but ${answers.length} answers. Counts must match.`);
        }
        if (blanks.length === 0) {
          throw new Error(`Question ${index + 1} (fill-in-the-blanks) has no blanks (use __ to create blanks)`);
        }
      }

      // Build the validated question object
      const validatedQuestion = {
        question: q.question.trim() || '',
        questionType: questionType,
        hint: (q.hint || '').trim(),
        topic: questionTopic,
        grade: grade, // Always use the grade specified by the teacher
        images: [],
        source: 'pdf-upload',
        pdfSource: fileName
      };

      // Add correctAnswer only for non-drawing questions
      if (!['drawing', 'write-in', 'drawing-with-text'].includes(questionType)) {
        validatedQuestion.correctAnswer = String(q.correctAnswer || '').trim();
      }

      // Add options only for multiple-choice questions
      if (questionType === 'multiple-choice') {
        validatedQuestion.options = processedOptions;
      }
      
      // For fill-in-the-blanks, ensure options is empty array
      if (questionType === 'fill-in-the-blanks') {
        validatedQuestion.options = [];
      }

      return validatedQuestion;
    });

    // Generate options for questions that don't have them
    const questionsNeedingOptions = validatedQuestions.filter(q => 
      q.questionType === 'multiple-choice' && (!q.options || q.options.length === 0 || q.options.every(opt => !opt || opt.trim() === ''))
    );

    if (questionsNeedingOptions.length > 0) {
      console.log(`Generating options for ${questionsNeedingOptions.length} question(s) without options`);
      
      // Process questions in batches to avoid timeout while respecting rate limits
      // Configurable via environment variables with sensible defaults
      const BATCH_SIZE = parseInt(process.env.PDF_OPTIONS_BATCH_SIZE) || 5; // Process 5 questions concurrently per batch
      const DELAY_BETWEEN_BATCHES = parseInt(process.env.PDF_OPTIONS_BATCH_DELAY) || 2000; // 2 seconds between batches (in milliseconds)
      
      console.log(`Using batch size: ${BATCH_SIZE}, delay between batches: ${DELAY_BETWEEN_BATCHES}ms`);
      
      const batches = [];
      for (let i = 0; i < questionsNeedingOptions.length; i += BATCH_SIZE) {
        batches.push(questionsNeedingOptions.slice(i, i + BATCH_SIZE));
      }
      
      console.log(`Processing ${batches.length} batch(es) of questions`);
      
      for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
        const batch = batches[batchIndex];
        
        // Check if job was cancelled before processing each batch
        await checkJobCancelled(jobRef);
        
        // Add delay between batches (except for first batch)
        if (batchIndex > 0) {
          console.log(`Waiting ${DELAY_BETWEEN_BATCHES / 1000} seconds before processing batch ${batchIndex + 1}...`);
          await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES));
        }
        
        // Process all questions in this batch concurrently
        const batchPromises = batch.map(async (question, indexInBatch) => {
          const overallIndex = batchIndex * BATCH_SIZE + indexInBatch;
          
          try {
            const optionsPrompt = `You are a math teacher creating multiple choice options for a quiz question.

Question: ${question.question}
Correct Answer: ${question.correctAnswer}
Topic: ${question.topic}
Grade Level: ${question.grade}

Generate 4 multiple choice options (A, B, C, D) where:
1. One option is the correct answer: "${question.correctAnswer}"
2. The other 3 options are plausible but incorrect answers that a student might choose
3. The incorrect options should be similar in format/type to the correct answer
4. For math questions, make the wrong answers common mistakes or close but incorrect values
5. If the question is asking for numeric answer, only provide the numeric options.

Return ONLY a JSON array with exactly 4 options as strings, where one of them matches the correct answer exactly.
Example format: ["option1", "option2", "option3", "option4"]

Do not include any explanation or other text, just the JSON array.`;

            const optionsResult = await model.generateContent(optionsPrompt);
            const optionsResponse = await optionsResult.response;
            const optionsText = optionsResponse.text();

            // Parse the options
            let generatedOptions = [];
            try {
              // Try to extract JSON array
              const jsonMatch = optionsText.match(/\[[\s\S]*\]/);
              if (jsonMatch) {
                generatedOptions = JSON.parse(jsonMatch[0]);
              } else {
                // Try parsing the entire response
                generatedOptions = JSON.parse(optionsText);
              }
              
              // Ensure we have exactly 4 options
              if (!Array.isArray(generatedOptions) || generatedOptions.length < 4) {
                throw new Error('Invalid options format');
              }
              
              // Ensure correct answer is included
              const correctAnswerStr = String(question.correctAnswer).trim();
              const hasCorrectAnswer = generatedOptions.some(opt => 
                String(opt).trim() === correctAnswerStr
              );
              
              if (!hasCorrectAnswer) {
                // Replace one option with the correct answer (preferably the first)
                generatedOptions[0] = question.correctAnswer;
              }
              
              // Trim and clean options
              generatedOptions = generatedOptions.slice(0, 4).map(opt => String(opt).trim());
              
              // Find the question in validatedQuestions and update it
              const questionIndex = validatedQuestions.findIndex(q => 
                q.question === question.question && q.correctAnswer === question.correctAnswer
              );
              
              if (questionIndex !== -1) {
                // shuffle the options
                generatedOptions = generatedOptions.sort(() => Math.random() - 0.5);
                validatedQuestions[questionIndex].options = generatedOptions;
                console.log(`Generated options for question ${questionIndex + 1}:`, generatedOptions);
              }
            } catch (parseError) {
              console.error(`Failed to parse generated options for question ${overallIndex + 1}:`, parseError);
              console.error('Raw response:', optionsText);
              // Fallback: create simple options with correct answer
              const correctAnswerStr = String(question.correctAnswer);
              const questionIndex = validatedQuestions.findIndex(q => 
                q.question === question.question && q.correctAnswer === question.correctAnswer
              );
              if (questionIndex !== -1) {
                validatedQuestions[questionIndex].options = [
                  correctAnswerStr,
                  'Incorrect',
                  'Incorrect',
                  'Incorrect'
                ];
              }
            }
          } catch (error) {
            console.error(`Failed to generate options for question ${overallIndex + 1}:`, error);
            // Fallback: create simple options with correct answer
            const questionIndex = validatedQuestions.findIndex(q => 
              q.question === question.question && q.correctAnswer === question.correctAnswer
            );
            if (questionIndex !== -1) {
              const correctAnswerStr = String(question.correctAnswer);
              validatedQuestions[questionIndex].options = [
                correctAnswerStr,
                'Incorrect',
                'Incorrect',
                'Incorrect'
              ];
            }
          }
        });
        
        // Wait for all questions in this batch to complete
        await Promise.all(batchPromises);
        
        // Update progress after each batch
        const progressPercent = 50 + Math.floor((batchIndex + 1) / batches.length * 40);
        await jobRef.update({ progress: progressPercent });
        console.log(`Completed batch ${batchIndex + 1}/${batches.length} (${progressPercent}% overall)`);
      }
    }

    // Save final results to Firestore
    await jobRef.update({
      status: 'completed',
      progress: 100,
      questions: validatedQuestions,
      totalQuestions: validatedQuestions.length,
      completedAt: getTimestamp(),
      imported: false // Track if user has imported these questions
    });

    console.log(`Job ${jobId} completed successfully with ${validatedQuestions.length} questions`);

  } catch (error) {
    console.error(`Error processing PDF for job ${jobId}:`, error);
    await jobRef.update({
      status: 'error',
      error: error.message || 'Unknown error occurred',
      completedAt: getTimestamp()
    });
  }
};

// Timeout for PDF processing (10 minutes)
const PDF_PROCESS_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes

// Wrap processPDFAsync with timeout logic
async function processPDFAsyncWithTimeout(...args) {
  // Helper to wrap the original function in a promise
  const processingPromise = processPDFAsync(...args);
  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('PDF processing timed out after 10 minutes')), PDF_PROCESS_TIMEOUT_MS)
  );
  try {
    await Promise.race([processingPromise, timeoutPromise]);
  } catch (error) {
    // Extract jobId, appId from args to construct jobRef
    // args[0] is jobId, args[2] is appId (not args[1] which is userId)
    const jobId = args[0];
    const appId = args[2];
    const jobRef = db.collection('artifacts').doc(appId)
      .collection('pdfProcessingJobs').doc(jobId);
    console.error(`Error (possibly timeout) processing PDF for job ${jobId}:`, error);
    await jobRef.update({
      status: 'error',
      error: error.message || 'Unknown error occurred',
      completedAt: getTimestamp()
    });
  }
}
