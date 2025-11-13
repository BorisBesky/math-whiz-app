const { admin, db } = require("./firebase-admin");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { GRADES, TOPICS, VALID_TOPICS_BY_GRADE } = require("./constants");

// Helper to get Firestore Timestamp
const getTimestamp = () => admin.firestore.Timestamp.now();

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
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
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

    // Generate job ID
    const jobId = `${userId}_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    
    // Create job document in Firestore with initial status
    const jobRef = db.collection('artifacts').doc(appId)
      .collection('pdfProcessingJobs').doc(jobId);
    
    await jobRef.set({
      userId,
      status: 'processing',
      progress: 0,
      fileName: fileName,
      classId: classId,
      createdAt: getTimestamp(),
      appId
    });

    // Return job ID immediately (background function will process asynchronously)
    // Process the PDF asynchronously
    processPDFAsync(jobId, userId, appId, classId, fileData, fileName, fileContentType)
      .catch(error => {
        console.error('Async processing error:', error);
        jobRef.update({
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
async function processPDFAsync(jobId, userId, appId, classId, fileData, fileName, fileContentType) {
  const jobRef = db.collection('artifacts').doc(appId)
    .collection('pdfProcessingJobs').doc(jobId);

  try {
    // Validate file
    if (!fileData || fileData.length === 0) {
      throw new Error("No file uploaded");
    }

    // Check file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (fileData.length > maxSize) {
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
      await jobRef.update({
        status: 'error',
        error: 'Failed to parse extracted questions',
        completedAt: getTimestamp()
      });
      return;
    }

    // Update progress: Questions extracted
    await jobRef.update({ progress: 50 });

    // Validate questions structure
    if (!Array.isArray(questions)) {
      questions = [questions];
    }

    // Validate and clean questions
    let validatedQuestions = questions.map((q, index) => {
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

    // Generate options for questions that don't have them
    const questionsNeedingOptions = validatedQuestions.filter(q => 
      !q.options || q.options.length === 0 || q.options.every(opt => !opt || opt.trim() === '')
    );

    if (questionsNeedingOptions.length > 0) {
      console.log(`Generating options for ${questionsNeedingOptions.length} question(s) without options`);
      
      // Generate options for each question that needs them
      for (let i = 0; i < questionsNeedingOptions.length; i++) {
        const question = questionsNeedingOptions[i];
        
        // Add delay between requests to avoid rate limiting (except for first request)
        if (i > 0) {
          console.log(`Waiting 2 seconds before generating options for question ${i + 1}...`);
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
        
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
              validatedQuestions[questionIndex].options = generatedOptions;
              console.log(`Generated options for question ${questionIndex + 1}:`, generatedOptions);
              
              // Update progress
              const progressPercent = 50 + Math.floor((i + 1) / questionsNeedingOptions.length * 40);
              await jobRef.update({ progress: progressPercent });
            }
          } catch (parseError) {
            console.error(`Failed to parse generated options for question ${i + 1}:`, parseError);
            console.error('Raw response:', optionsText);
            // Fallback: create simple options with correct answer
            const correctAnswerStr = String(question.correctAnswer);
            validatedQuestions.find(q => 
              q.question === question.question && q.correctAnswer === question.correctAnswer
            ).options = [
              correctAnswerStr,
              'Incorrect',
              'Incorrect',
              'Incorrect'
            ];
          }
        } catch (error) {
          console.error(`Failed to generate options for question ${i + 1}:`, error);
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

