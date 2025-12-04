const { GoogleGenerativeAI } = require("@google/generative-ai");
const { admin, db, storage } = require("./firebase-admin");
const { getStorage } = require("firebase-admin/storage");
const sharp = require("sharp");

const getTimestamp = () => admin.firestore.Timestamp.now();

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
const generateDescriptions = async (themeDescription, count) => {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const prompt = `Generate ${count} image descriptions for a theme: "${themeDescription}". 
Each description should be suitable for generating a high-quality image for a math rewards store background.
The images should be appropriate for elementary school students (ages 6-12).

If the theme description specifies a style (e.g., "realistic", "watercolor", "sketch", "3d render", "pixel art"), strictly adhere to that style in the descriptions.
If no style is specified, assume a fun, child-friendly style.

For each image, provide:
1. fullDescription: A detailed 2-3 sentence description that clearly describes what the image should look like, INCLUDING THE ART STYLE (for image generation)
2. shortDescription: A brief 1 sentence description suitable for display in a store (for the store image description field)
3. shortName: A short, friendly name (2-4 words) suitable for use as a filename (e.g., "cute-giraffe", "happy-lion", "playful-penguin")

Return the descriptions as a JSON array of objects. Example format:
[
  {
    "fullDescription": "A realistic photograph of a giraffe standing in a savanna with warm sunlight, detailed fur texture and natural lighting",
    "shortDescription": "A realistic giraffe in the sunlight",
    "shortName": "realistic-giraffe"
  }
]

Theme: ${themeDescription}
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
  
  // Use gemini with image generation capability
  const model = genAI.getGenerativeModel({ 
    model: process.env.GEMINI_MODEL_NAME_IMAGES || "gemini-2.5-flash-image",
    generationConfig: {
      responseModalities: ['IMAGE']
    }
  });

  const prompt = `Generate a high-quality image based on this description: "${description}". 
The image should be suitable for elementary school students (ages 6-12) and suitable as a background for a math rewards store.
The style should match the description provided by the user. If no specific style is mentioned in the description, default to a fun, colorful, child-friendly style.
Make it engaging and visually appealing.`;

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

// Process image generation job
const processImageGenerationJob = async (jobId, userId, appId, jobData) => {
  const jobRef = db.collection('artifacts').doc(appId)
    .collection('imageGenerationJobs').doc(jobId);

  try {
    const { action, theme, themeDescription, count, descriptions, selectedIndices, generatedImages } = jobData;
    const bucket = getStorage().bucket();

    if (action === "generate-descriptions") {
      await jobRef.update({
        status: 'processing',
        progress: 10,
        message: 'Generating descriptions...',
      });

      const generatedDescriptions = await generateDescriptions(themeDescription, parseInt(count));

      await jobRef.update({
        status: 'completed',
        progress: 100,
        descriptions: generatedDescriptions,
        completedAt: getTimestamp(),
      });

      console.log(`Job ${jobId} completed: generated ${generatedDescriptions.length} descriptions`);
    }

    else if (action === "generate-images") {
      const images = [];
      const timestamp = Date.now();
      const totalImages = descriptions.length;

      for (let i = 0; i < descriptions.length; i++) {
        try {
          await jobRef.update({
            status: 'processing',
            progress: Math.round((i / totalImages) * 90),
            message: `Generating image ${i + 1} of ${totalImages}...`,
          });

          const descObj = descriptions[i];
          const fullDescription = typeof descObj === 'string' ? descObj : descObj.fullDescription || descObj.description || '';
          const { buffer, mimeType } = await generateImage(fullDescription);

          // Convert PNG to JPG for storage efficiency
          let imageBuffer = buffer;
          const isPng = mimeType && mimeType.includes('png');
          
          if (isPng) {
            imageBuffer = await sharp(buffer)
              .jpeg({ quality: 90 })
              .toBuffer();
          }

          const contentType = 'image/jpeg';
          const extension = 'jpg';
          
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
            description: fullDescription,
            url,
            filename,
            index: i
          });
        } catch (error) {
          console.error(`Error generating image ${i + 1}:`, error);
          // Continue with other images even if one fails
        }
      }

      await jobRef.update({
        status: 'completed',
        progress: 100,
        images: images,
        completedAt: getTimestamp(),
        message: `Generated ${images.length} images successfully`,
      });

      console.log(`Job ${jobId} completed: generated ${images.length} images`);
    }

    else if (action === "add-to-store") {
      await jobRef.update({
        status: 'processing',
        progress: 50,
        message: 'Adding images to store...',
      });

      const metadata = await readMetadata(bucket);
      const bucketName = bucket.name;
      const newImages = [];

      for (const index of selectedIndices) {
        const imageData = generatedImages[index];
        if (imageData && imageData.filename) {
          const name = imageData.shortName 
            ? imageData.shortName.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
            : (imageData.shortDescription || imageData.description || 'Unnamed Image').split(' ').slice(0, 4).join(' ');

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

      await updateMetadata(bucket, newImages);

      await jobRef.update({
        status: 'completed',
        progress: 100,
        addedImages: newImages,
        completedAt: getTimestamp(),
        message: `Added ${newImages.length} images to store`,
      });

      console.log(`Job ${jobId} completed: added ${newImages.length} images to store`);
    }

  } catch (error) {
    console.error(`Error processing job ${jobId}:`, error);
    await jobRef.update({
      status: 'error',
      error: error.message || 'Unknown error occurred',
      completedAt: getTimestamp(),
    });
  }
};

// Timeout for image generation processing (10 minutes)
const IMAGE_GENERATION_TIMEOUT_MS = 10 * 60 * 1000;

async function processImageGenerationJobWithTimeout(...args) {
  const processingPromise = processImageGenerationJob(...args);
  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Image generation timed out after 10 minutes')), IMAGE_GENERATION_TIMEOUT_MS)
  );
  
  try {
    await Promise.race([processingPromise, timeoutPromise]);
  } catch (error) {
    const jobId = args[0];
    const appId = args[2];
    const jobRef = db.collection('artifacts').doc(appId)
      .collection('imageGenerationJobs').doc(jobId);
    console.error(`Error processing job ${jobId}:`, error);
    await jobRef.update({
      status: 'error',
      error: error.message || 'Unknown error occurred',
      completedAt: getTimestamp(),
    });
  }
}

exports.handler = async (event, context) => {
  // Parse the event body to get job parameters
  const { jobId, userId, appId, jobData } = JSON.parse(event.body);
  
  console.log(`Starting background job ${jobId} for user ${userId}`);
  
  // Process the job asynchronously (no await - background processing)
  processImageGenerationJobWithTimeout(jobId, userId, appId, jobData);
  
  // Return immediately
  return {
    statusCode: 202,
    body: JSON.stringify({ message: 'Job started' }),
  };
};

