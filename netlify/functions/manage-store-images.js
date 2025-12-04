const { storage } = require('./firebase-admin');

/**
 * Netlify serverless function to manage store images (update/delete/bulk-delete)
 * Handles updates to image-metadata.json and file deletions
 */
exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, PUT, DELETE, OPTIONS',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  // Helper to get metadata
  const getMetadata = async (bucket) => {
    const metadataFile = bucket.file('store-images/image-metadata.json');
    const [exists] = await metadataFile.exists();
    
    if (!exists) {
      return { images: [] };
    }
    
    const [content] = await metadataFile.download();
    return JSON.parse(content.toString('utf-8'));
  };

  // Helper to save metadata
  const saveMetadata = async (bucket, data) => {
    const metadataFile = bucket.file('store-images/image-metadata.json');
    await metadataFile.save(JSON.stringify(data, null, 2), {
      metadata: {
        contentType: 'application/json',
      }
    });
    await metadataFile.makePublic();
  };

  try {
    const bucket = storage.bucket();
    
    // Handle Update (PUT)
    if (event.httpMethod === 'PUT') {
      const body = JSON.parse(event.body);
      const { id, name, description, theme } = body;

      if (!id) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Missing image ID' }),
        };
      }

      const metadata = await getMetadata(bucket);
      const imageIndex = metadata.images.findIndex(img => img.id === id);

      if (imageIndex === -1) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ error: 'Image not found' }),
        };
      }

      // Update fields
      const updatedImage = {
        ...metadata.images[imageIndex],
        name: name !== undefined ? name : metadata.images[imageIndex].name,
        description: description !== undefined ? description : metadata.images[imageIndex].description,
        theme: theme !== undefined ? theme : metadata.images[imageIndex].theme,
      };

      metadata.images[imageIndex] = updatedImage;
      await saveMetadata(bucket, metadata);

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ message: 'Image updated successfully', image: updatedImage }),
      };
    }

    // Handle Delete (DELETE)
    if (event.httpMethod === 'DELETE') {
      const body = JSON.parse(event.body);
      const { id, theme, bulk } = body;

      if (bulk && theme) {
        // Bulk Delete by Theme (Case Insensitive)
        const metadata = await getMetadata(bucket);
        const targetTheme = theme.toLowerCase();
        const imagesToDelete = metadata.images.filter(img => (img.theme || '').toLowerCase() === targetTheme);
        const imagesToKeep = metadata.images.filter(img => (img.theme || '').toLowerCase() !== targetTheme);

        if (imagesToDelete.length === 0) {
           return {
            statusCode: 404,
            headers,
            body: JSON.stringify({ error: 'No images found for this theme' }),
          };
        }

        // Delete files
        for (const img of imagesToDelete) {
          if (img.filename) {
            const file = bucket.file(`store-images/${img.filename}`);
            try {
              const [exists] = await file.exists();
              if (exists) await file.delete();
            } catch (err) {
              console.warn(`Failed to delete file for ${img.id}:`, err);
            }
          }
        }

        // Update metadata
        metadata.images = imagesToKeep;
        await saveMetadata(bucket, metadata);

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ message: `Deleted ${imagesToDelete.length} images in theme "${theme}"` }),
        };
      } 
      
      if (id) {
        // Single Image Delete
        const metadata = await getMetadata(bucket);
        const imageIndex = metadata.images.findIndex(img => img.id === id);

        if (imageIndex === -1) {
          return {
            statusCode: 404,
            headers,
            body: JSON.stringify({ error: 'Image not found' }),
          };
        }

        const imageToDelete = metadata.images[imageIndex];

        // Delete the actual file from storage if it exists
        if (imageToDelete.filename) {
          const file = bucket.file(`store-images/${imageToDelete.filename}`);
          const [exists] = await file.exists();
          if (exists) {
            try {
              await file.delete();
              console.log(`Deleted file: store-images/${imageToDelete.filename}`);
            } catch (err) {
              console.error(`Error deleting file store-images/${imageToDelete.filename}:`, err);
            }
          }
        }

        // Remove from metadata
        metadata.images.splice(imageIndex, 1);
        await saveMetadata(bucket, metadata);

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ message: 'Image deleted successfully', id }),
        };
      }

      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing ID or Theme for deletion' }),
      };
    }

    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };

  } catch (error) {
    console.error('Error in manage-store-images:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error', details: error.message }),
    };
  }
};
