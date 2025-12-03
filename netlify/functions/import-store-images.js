const { admin, storage } = require('./firebase-admin');

/**
 * Netlify serverless function to import store images from Firebase Storage
 * Reads image-metadata.json and returns store items with public URLs
 */
exports.handler = async (event, context) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json',
  };

  // Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  // Only allow GET requests
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const bucket = storage.bucket();
    const metadataPath = 'store-images/image-metadata.json';

    // Read metadata file
    const metadataFile = bucket.file(metadataPath);
    
    // Check if file exists
    const [exists] = await metadataFile.exists();
    if (!exists) {
      console.log(`[import-store-images] Metadata file not found: ${metadataPath}`);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ images: [] }),
      };
    }

    // Download and parse metadata
    const [metadataContent] = await metadataFile.download();
    const metadata = JSON.parse(metadataContent.toString('utf-8'));

    if (!metadata.images || !Array.isArray(metadata.images)) {
      console.error('[import-store-images] Invalid metadata format: missing images array');
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ images: [] }),
      };
    }

    // Get storage bucket name for URL construction
    const bucketName = bucket.name;
    const baseUrl = `https://storage.googleapis.com/${bucketName}`;

    // Process each image
    const storeItems = [];
    let index = 1;

    for (const imageMeta of metadata.images) {
      try {
        // Validate required fields
        if (!imageMeta.name || !imageMeta.theme) {
          console.warn(`[import-store-images] Skipping image with missing name or theme:`, imageMeta);
          continue;
        }

        // Get filename (use filename from metadata or generate from name)
        const filename = imageMeta.filename || `${imageMeta.name.replace(/\s+/g, '-').toLowerCase()}.jpg`;
        
        // Construct image path
        const imagePath = `store-images/${filename}`;
        const imageFile = bucket.file(imagePath);

        // Check if image file exists
        const [imageExists] = await imageFile.exists();
        if (!imageExists) {
          console.warn(`[import-store-images] Image file not found: ${imagePath}`);
          continue;
        }

        // Generate ID from filename or use index
        const sanitizedFilename = filename.replace(/\.[^/.]+$/, '').replace(/[^a-z0-9-]/gi, '-').toLowerCase();
        let id;
        if (imageMeta.id && typeof imageMeta.id === 'string' && imageMeta.id.trim() !== '') {
          id = imageMeta.id.trim();
        } else if (sanitizedFilename && sanitizedFilename !== '') {
          id = `bg-${sanitizedFilename}`;
        } else {
          id = `bg-fallback-${index}`;
        }

        // Construct public URL (encode special characters in filename)
        const encodedFilename = encodeURIComponent(filename);
        const url = `${baseUrl}/store-images/${encodedFilename}`;

        // Create store item
        const storeItem = {
          id,
          name: imageMeta.name,
          url,
          description: imageMeta.description || '',
          theme: imageMeta.theme,
        };

        storeItems.push(storeItem);
        index++;
      } catch (error) {
        console.error(`[import-store-images] Error processing image:`, imageMeta, error);
        // Continue with other images even if one fails
      }
    }

    console.log(`[import-store-images] Successfully imported ${storeItems.length} store images`);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ images: storeItems }),
    };
  } catch (error) {
    console.error('[import-store-images] Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Failed to import store images',
        message: error.message 
      }),
    };
  }
};

