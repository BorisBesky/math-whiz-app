/* global __app_id */
/**
 * Cache utility for class questions from questionBank
 * Uses localStorage with TTL (Time To Live) to cache questions
 */

const CACHE_PREFIX = 'class_questions_cache_';
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Generate cache key from parameters
 */
const getCacheKey = (classId, topic, grade, appId) => {
  const currentAppId = appId || (typeof __app_id !== "undefined" ? __app_id : "default-app-id");
  return `${CACHE_PREFIX}${currentAppId}_${classId}_${topic}_${grade}`;
};

/**
 * Serialize Firestore data for localStorage
 * Converts Firestore Timestamps to ISO strings
 */
const serializeQuestion = (question) => {
  const serialized = { ...question };
  
  // Convert Firestore Timestamps to ISO strings
  if (serialized.createdAt && typeof serialized.createdAt.toDate === 'function') {
    serialized.createdAt = serialized.createdAt.toDate().toISOString();
  }
  if (serialized.updatedAt && typeof serialized.updatedAt.toDate === 'function') {
    serialized.updatedAt = serialized.updatedAt.toDate().toISOString();
  }
  if (serialized.assignedAt && typeof serialized.assignedAt.toDate === 'function') {
    serialized.assignedAt = serialized.assignedAt.toDate().toISOString();
  }
  
  return serialized;
};

/**
 * Deserialize data from localStorage
 * Converts ISO strings back to Date objects (Firestore will handle conversion)
 */
const deserializeQuestion = (question) => {
  const deserialized = { ...question };
  
  // Convert ISO strings back to Date objects
  if (deserialized.createdAt && typeof deserialized.createdAt === 'string') {
    deserialized.createdAt = new Date(deserialized.createdAt);
  }
  if (deserialized.updatedAt && typeof deserialized.updatedAt === 'string') {
    deserialized.updatedAt = new Date(deserialized.updatedAt);
  }
  if (deserialized.assignedAt && typeof deserialized.assignedAt === 'string') {
    deserialized.assignedAt = new Date(deserialized.assignedAt);
  }
  
  return deserialized;
};

/**
 * Get cached questions if available and not expired
 * @param {string} classId - Class ID
 * @param {string} topic - Topic name
 * @param {string} grade - Grade (G3, G4, etc.)
 * @param {string} appId - App ID
 * @returns {Array|null} Cached questions or null if not found/expired
 */
export const getCachedClassQuestions = (classId, topic, grade, appId) => {
  try {
    const cacheKey = getCacheKey(classId, topic, grade, appId);
    const cachedData = localStorage.getItem(cacheKey);
    
    if (!cachedData) {
      return null;
    }
    
    const { questions, timestamp } = JSON.parse(cachedData);
    const now = Date.now();
    
    // Check if cache is expired
    if (now - timestamp > CACHE_TTL_MS) {
      // Remove expired cache
      localStorage.removeItem(cacheKey);
      console.log(`[questionCache] Cache expired for ${cacheKey}`);
      return null;
    }
    
    // Deserialize questions
    const deserializedQuestions = questions.map(deserializeQuestion);
    console.log(`[questionCache] Cache hit for ${cacheKey}, returning ${deserializedQuestions.length} questions`);
    return deserializedQuestions;
  } catch (error) {
    console.error('[questionCache] Error reading cache:', error);
    return null;
  }
};

/**
 * Cache questions
 * @param {string} classId - Class ID
 * @param {string} topic - Topic name
 * @param {string} grade - Grade (G3, G4, etc.)
 * @param {string} appId - App ID
 * @param {Array} questions - Questions to cache
 */
export const setCachedClassQuestions = (classId, topic, grade, appId, questions) => {
  try {
    const cacheKey = getCacheKey(classId, topic, grade, appId);
    
    // Serialize questions
    const serializedQuestions = questions.map(serializeQuestion);
    
    const cacheData = {
      questions: serializedQuestions,
      timestamp: Date.now()
    };
    
    localStorage.setItem(cacheKey, JSON.stringify(cacheData));
    console.log(`[questionCache] Cached ${questions.length} questions for ${cacheKey}`);
  } catch (error) {
    console.error('[questionCache] Error writing cache:', error);
    // If storage is full, try to clear old entries
    if (error.name === 'QuotaExceededError') {
      clearExpiredCacheEntries();
    }
  }
};

/**
 * Clear cache for specific class/topic/grade combination
 * @param {string} classId - Class ID
 * @param {string} topic - Topic name
 * @param {string} grade - Grade (G3, G4, etc.)
 * @param {string} appId - App ID
 */
export const clearCachedClassQuestions = (classId, topic, grade, appId) => {
  try {
    const cacheKey = getCacheKey(classId, topic, grade, appId);
    localStorage.removeItem(cacheKey);
    console.log(`[questionCache] Cleared cache for ${cacheKey}`);
  } catch (error) {
    console.error('[questionCache] Error clearing cache:', error);
  }
};

/**
 * Clear all expired cache entries
 */
export const clearExpiredCacheEntries = () => {
  try {
    const keysToRemove = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(CACHE_PREFIX)) {
        try {
          const cachedData = JSON.parse(localStorage.getItem(key));
          const now = Date.now();
          
          if (now - cachedData.timestamp > CACHE_TTL_MS) {
            keysToRemove.push(key);
          }
        } catch (e) {
          // If we can't parse it, remove it
          keysToRemove.push(key);
        }
      }
    }
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    if (keysToRemove.length > 0) {
      console.log(`[questionCache] Cleared ${keysToRemove.length} expired cache entries`);
    }
  } catch (error) {
    console.error('[questionCache] Error clearing expired cache:', error);
  }
};

/**
 * Clear all class question cache entries
 */
export const clearAllClassQuestionCache = () => {
  try {
    const keysToRemove = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(CACHE_PREFIX)) {
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
    console.log(`[questionCache] Cleared all class question cache (${keysToRemove.length} entries)`);
  } catch (error) {
    console.error('[questionCache] Error clearing all cache:', error);
  }
};

