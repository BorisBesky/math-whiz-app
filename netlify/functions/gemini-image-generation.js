const { GoogleGenerativeAI } = require("@google/generative-ai");
const { admin, db, storage } = require("./firebase-admin");
const { getStorage } = require("firebase-admin/storage");
const sharp = require("sharp");

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

// Helper to upload image to Firebase Storage
const uploadImageToStorage = async (bucket, filename, imageBuffer, contentType) => {
  const filePath = `store-images/${filename}`;
  const file = bucket.file(filePath);

  await file.save(imageBuffer, {
    metadata: {
      contentType: contentType || 'image/jpeg',
      metadata: {
        uploadedAt: new Date().toISOString(),
      }
    }
  });

  // Make the file publicly accessible
  await file.makePublic();

  return filePath;
};

// Helper to read existing metadata
const readMetadata = async (bucket) => {
  const metadataPath = 'store-images/image-metadata.json';
  const metadataFile = bucket.file(metadataPath);
  
  const [exists] = await metadataFile.exists();
  if (!exists) {
    return { images: [] };
  }

  const [metadataContent] = await metadataFile.download();
  return JSON.parse(metadataContent.toString('utf-8'));
};

// Helper to update metadata
const updateMetadata = async (bucket, newImages) => {
  const metadata = await readMetadata(bucket);
  
  // Add new images to existing metadata
  metadata.images = [...metadata.images, ...newImages];

  const metadataPath = 'store-images/image-metadata.json';
  const metadataFile = bucket.file(metadataPath);
  const metadataContent = JSON.stringify(metadata, null, 2);
  
  await metadataFile.save(metadataContent, {
    metadata: {
      contentType: 'application/json',
    }
  });

  // Make metadata file publicly accessible
  await metadataFile.makePublic();

  return metadata;
};

// Generate image descriptions using Gemini
const generateDescriptions = async (theme, count) => {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const prompt = `Generate ${count} image descriptions for a theme: "${theme}". 
Each description should be suitable for generating a fun, child-friendly image for a math rewards store background.
The images should be appropriate for elementary school students (ages 6-12).

For each image, provide:
1. fullDescription: A detailed 2-3 sentence description that clearly describes what the image should look like (for image generation)
2. shortDescription: A brief 1 sentence description suitable for display in a store (for the store image description field)
3. shortName: A short, friendly name (2-4 words) suitable for use as a filename (e.g., "cute-giraffe", "happy-lion", "playful-penguin")

Return the descriptions as a JSON array of objects. Example format:
[
  {
    "fullDescription": "A playful cartoon giraffe with big expressive eyes wearing a colorful bow tie, standing in a bright sunny savanna with green grass and blue sky in the background",
    "shortDescription": "A playful cartoon giraffe with a colorful bow tie",
    "shortName": "cute-giraffe"
  },
  {
    "fullDescription": "A friendly lion cub playing with a red ball in a sunny savanna setting with acacia trees in the background and warm golden sunlight",
    "shortDescription": "A friendly lion cub playing with a ball",
    "shortName": "happy-lion"
  }
]

Theme: ${theme}
Number of descriptions: ${count}

Return only the JSON array, no additional text.`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Extract JSON array from response
    let descriptions = [];
    try {
      // Try to parse as JSON directly
      descriptions = JSON.parse(text);
    } catch (e) {
      // If that fails, try to extract JSON from markdown code blocks
      const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const jsonText = jsonMatch[1] || jsonMatch[0];
        descriptions = JSON.parse(jsonText);
      } else {
        throw new Error('Could not parse descriptions from response');
      }
    }

    // Ensure we have the right number of descriptions
    if (!Array.isArray(descriptions)) {
      descriptions = [descriptions];
    }

    // Validate structure and ensure all required fields exist
    descriptions = descriptions.slice(0, count).map((desc, index) => {
      if (typeof desc === 'string') {
        // Fallback: if we got strings, convert to object format
        return {
          fullDescription: desc,
          shortDescription: desc.split('.').slice(0, 1).join('.').trim() || desc.substring(0, 50),
          shortName: desc.split(' ').slice(0, 2).join('-').toLowerCase().replace(/[^a-z0-9-]/g, '') || `image-${index + 1}`
        };
      }
      return {
        fullDescription: desc.fullDescription || desc.description || '',
        shortDescription: desc.shortDescription || desc.short || '',
        shortName: desc.shortName || desc.name || `image-${index + 1}`
      };
    });

    return descriptions;
  } catch (error) {
    console.error('Error generating descriptions:', error);
    throw new Error(`Failed to generate descriptions: ${error.message}`);
  }
};

// Generate image using Gemini
const generateImage = async (description) => {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  
  // Use gemini (nano banana) with image generation capability
  const model = genAI.getGenerativeModel({ 
    model: process.env.GEMINI_MODEL_NAME_IMAGES || "gemini-2.5-flash-image",
    generationConfig: {
      responseModalities: ['IMAGE']
    }
  });

  const prompt = `Generate a fun, colorful, child-friendly image based on this description: "${description}". 
The image should be appropriate for elementary school students (ages 6-12) and suitable as a background for a math rewards store.
Make it bright, cheerful, and engaging.`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    
    // Check if response contains an image
    if (response.candidates && response.candidates[0] && response.candidates[0].content) {
      const parts = response.candidates[0].content.parts;
      
      // Find image part
      const imagePart = parts.find(part => part.inlineData);
      
      if (imagePart && imagePart.inlineData) {
        // Convert base64 to buffer
        const base64Data = imagePart.inlineData.data;
        const mimeType = imagePart.inlineData.mimeType || 'image/png';
        
        // Remove data URL prefix if present
        const base64Clean = base64Data.replace(/^data:image\/\w+;base64,/, '');
        const buffer = Buffer.from(base64Clean, 'base64');
        
        return {
          buffer,
          mimeType
        };
      }
    }
    
    throw new Error('No image generated in response');
  } catch (error) {
    console.error('Error generating image:', error);
    throw new Error(`Failed to generate image: ${error.message}`);
  }
};

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

    const { action, theme, count, descriptions, selectedIndices, generatedImages } = JSON.parse(event.body);

    if (!action) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Action is required" }),
      };
    }

    const bucket = getStorage().bucket();

    if (action === "generate-descriptions") {
      if (!theme || !count) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: "Theme and count are required" }),
        };
      }

      const generatedDescriptions = await generateDescriptions(theme, parseInt(count));

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ descriptions: generatedDescriptions }),
      };
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

      const images = [];
      const timestamp = Date.now();

      for (let i = 0; i < descriptions.length; i++) {
        try {
          const descObj = descriptions[i];
          const fullDescription = typeof descObj === 'string' ? descObj : descObj.fullDescription || descObj.description || '';
          const { buffer, mimeType } = await generateImage(fullDescription);

          // Convert PNG to JPG for storage efficiency
          let imageBuffer = buffer;
          const isPng = mimeType && mimeType.includes('png');
          
          if (isPng) {
            // Convert PNG to JPG using sharp
            imageBuffer = await sharp(buffer)
              .jpeg({ quality: 90 }) // High quality JPG
              .toBuffer();
          }

          // Always use JPG format for storage
          const contentType = 'image/jpeg';
          const extension = 'jpg';
          
          // Use shortName for filename, or generate from theme
          const shortName = typeof descObj === 'string' 
            ? `${theme}-${i + 1}`.toLowerCase().replace(/[^a-z0-9-]/g, '-')
            : (descObj.shortName || `${theme}-${i + 1}`).toLowerCase().replace(/[^a-z0-9-]/g, '-');
          const filename = `${shortName}-${timestamp}.${extension}`;

          // Upload to Firebase Storage
          await uploadImageToStorage(bucket, filename, imageBuffer, contentType);

          // Get public URL
          const bucketName = bucket.name;
          const encodedFilename = encodeURIComponent(filename);
          const url = `https://storage.googleapis.com/${bucketName}/store-images/${encodedFilename}`;

          images.push({
            fullDescription: fullDescription,
            shortDescription: typeof descObj === 'string' ? fullDescription.substring(0, 100) : (descObj.shortDescription || fullDescription.substring(0, 100)),
            shortName: shortName,
            description: fullDescription, // Keep for backward compatibility
            url,
            filename,
            index: i
          });
        } catch (error) {
          console.error(`Error generating image ${i + 1}:`, error);
          // Continue with other images even if one fails
        }
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ images }),
      };
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

      // Read existing metadata
      const metadata = await readMetadata(bucket);
      const bucketName = bucket.name;

      // Create new image entries for selected images
      const newImages = [];
      const timestamp = Date.now();

      for (const index of selectedIndices) {
        const imageData = generatedImages[index];
        if (imageData && imageData.filename) {
          // Use shortName for name, or generate from shortDescription
          const name = imageData.shortName 
            ? imageData.shortName.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
            : (imageData.shortDescription || imageData.description || 'Unnamed Image').split(' ').slice(0, 4).join(' ');

          // Generate ID from filename
          const filenameWithoutExt = imageData.filename.replace(/\.[^/.]+$/, '');
          const id = `bg-${filenameWithoutExt}`;

          newImages.push({
            id,
            name,
            description: imageData.shortDescription || imageData.description || '',
            theme,
            filename: imageData.filename
          });
        }
      }

      // Update metadata
      await updateMetadata(bucket, newImages);

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ 
          success: true, 
          added: newImages.length,
          images: newImages 
        }),
      };
    }

    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: "Invalid action" }),
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

