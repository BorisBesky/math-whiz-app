/**
 * Utility for loading store images from Firebase Storage
 * Uses localStorage with TTL (Time To Live) to cache images
 */

const CACHE_KEY = 'store_images_cache';
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

/**
 * Get cached store images if available and not expired
 * @returns {Array|null} Cached store items or null if not found/expired
 */
export const getCachedStoreImages = () => {
  try {
    const cachedData = localStorage.getItem(CACHE_KEY);
    
    if (!cachedData) {
      return null;
    }
    
    const { images, timestamp } = JSON.parse(cachedData);
    const now = Date.now();
    
    // Check if cache is expired
    if (now - timestamp > CACHE_TTL_MS) {
      // Remove expired cache
      localStorage.removeItem(CACHE_KEY);
      console.log('[storeImages] Cache expired');
      return null;
    }
    
    console.log(`[storeImages] Cache hit, returning ${images.length} images`);
    return images;
  } catch (error) {
    console.error('[storeImages] Error reading cache:', error);
    return null;
  }
};

/**
 * Cache store images
 * @param {Array} images - Store items to cache
 */
export const setCachedStoreImages = (images) => {
  try {
    const cacheData = {
      images,
      timestamp: Date.now()
    };
    
    localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
    console.log(`[storeImages] Cached ${images.length} images`);
  } catch (error) {
    console.error('[storeImages] Error writing cache:', error);
    // If storage is full, try to clear cache
    if (error.name === 'QuotaExceededError') {
      try {
        localStorage.removeItem(CACHE_KEY);
        console.log('[storeImages] Cleared cache due to storage quota');
      } catch (clearError) {
        console.error('[storeImages] Error clearing cache:', clearError);
      }
    }
  }
};

/**
 * Clear store images cache
 */
export const clearStoreImagesCache = () => {
  try {
    localStorage.removeItem(CACHE_KEY);
    console.log('[storeImages] Cleared cache');
  } catch (error) {
    console.error('[storeImages] Error clearing cache:', error);
  }
};

/**
 * Load store images from Firebase Storage via Netlify function
 * @param {boolean} forceRefresh - If true, bypass cache and fetch fresh data
 * @returns {Promise<Array>} Array of store items
 */
export const loadStoreImages = async (forceRefresh = false) => {
  // Check cache first if not forcing refresh
  if (!forceRefresh) {
    const cached = getCachedStoreImages();
    if (cached !== null) {
      return cached;
    }
  }

  try {
    console.log('[storeImages] Fetching store images from server...');
    const response = await fetch('/.netlify/functions/import-store-images', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch store images: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Validate response structure
    if (!data.images || !Array.isArray(data.images)) {
      console.warn('[storeImages] Invalid response format, returning empty array');
      return [];
    }

    // Ensure each item has required properties
    const storeItems = data.images.map((item, index) => ({
      id: item.id || `bg-${index + 1}`,
      name: item.name || 'Unnamed Image',
      url: item.url || '',
      description: item.description || '',
      theme: item.theme || 'animals',
    })).filter(item => item.url); // Filter out items without URLs

    // Cache the results
    setCachedStoreImages(storeItems);

    console.log(`[storeImages] Successfully loaded ${storeItems.length} store images`);
    return storeItems;
  } catch (error) {
    console.error('[storeImages] Error loading store images:', error);
    
    // Try to return cached data even if expired as fallback
    const cached = getCachedStoreImages();
    if (cached !== null) {
      console.log('[storeImages] Using expired cache as fallback');
      return cached;
    }
    
    // Return empty array as last resort
    return [];
  }
};

/**
 * Update a store image
 * @param {Object} image - Image object with id and fields to update
 * @returns {Promise<Object>} Updated image object
 */
export const updateStoreImage = async (image) => {
  try {
    const response = await fetch('/.netlify/functions/manage-store-images', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(image),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update image');
    }

    const data = await response.json();
    
    // Clear cache so next load gets fresh data
    clearStoreImagesCache();
    
    return data.image;
  } catch (error) {
    console.error('[storeImages] Error updating image:', error);
    throw error;
  }
};

/**
 * Delete a store image
 * @param {string} imageId - ID of image to delete
 * @returns {Promise<void>}
 */
export const deleteStoreImage = async (imageId) => {
  try {
    const response = await fetch('/.netlify/functions/manage-store-images', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id: imageId }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete image');
    }

    // Clear cache so next load gets fresh data
    clearStoreImagesCache();
  } catch (error) {
    console.error('[storeImages] Error deleting image:', error);
    throw error;
  }
};

/**
 * Delete all store images in a specific theme
 * @param {string} theme - Theme name to delete
 * @returns {Promise<void>}
 */
export const deleteStoreTheme = async (theme) => {
  try {
    const response = await fetch('/.netlify/functions/manage-store-images', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ theme, bulk: true }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete theme');
    }

    // Clear cache so next load gets fresh data
    clearStoreImagesCache();
  } catch (error) {
    console.error('[storeImages] Error deleting theme:', error);
    throw error;
  }
};

