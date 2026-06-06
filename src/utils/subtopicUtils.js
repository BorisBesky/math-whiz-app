// Utility functions for working with subtopics
import { content } from '../content/index.js';

/**
 * Get subtopics for a topic by topic name and grade
 * @param {string} topicName - The topic name (e.g., "Measurement & Data 4th")
 * @param {string} grade - The grade (e.g., "G3" or "G4")
 * @returns {string[]} Array of subtopic strings, or empty array if topic has no subtopics
 */
export const getSubtopicsForTopic = (topicName, grade) => {
  try {
    const gradeId = grade.toLowerCase(); // Convert G3 -> g3, G4 -> g4

    // Attempt to find the topicId by matching topicName to the display name in content
    const topicsForGrade = content.getTopicsForGrade
      ? content.getTopicsForGrade(gradeId)
      : (content[gradeId] || {});

    // topicsForGrade is an array of topic objects, not an object with topicIds as keys
    let topicId = null;
    const topicsArray = Array.isArray(topicsForGrade) ? topicsForGrade : Object.values(topicsForGrade);
    for (const topicObj of topicsArray) {
      // Try to match by displayName or name property
      if (
        (topicObj.displayName && topicObj.displayName === topicName) ||
        (topicObj.name && topicObj.name === topicName)
      ) {
        topicId = topicObj.id; // Use the actual topic.id, not array index
        break;
      }
    }

    if (!topicId) {
      console.warn(`[getSubtopicsForTopic] Unknown topic: ${topicName} for grade: ${gradeId}`);
      return [];
    }

    const topic = content.getTopic(gradeId, topicId);
    if (!topic) {
      console.warn(`[getSubtopicsForTopic] Topic not found: ${gradeId}/${topicId}`);
      return [];
    }

    // Return subtopics array if it exists, otherwise empty array
    return topic.subtopics || [];
  } catch (error) {
    console.error(`[getSubtopicsForTopic] Error getting subtopics for ${topicName}:`, error);
    return [];
  }
};

const unwrapFirestoreValue = (value) => {
  if (!value || typeof value !== 'object') return value;
  if (Object.prototype.hasOwnProperty.call(value, 'stringValue')) return value.stringValue;
  if (Object.prototype.hasOwnProperty.call(value, 'integerValue')) return value.integerValue;
  if (Object.prototype.hasOwnProperty.call(value, 'doubleValue')) return value.doubleValue;
  if (Object.prototype.hasOwnProperty.call(value, 'booleanValue')) return value.booleanValue;
  if (Object.prototype.hasOwnProperty.call(value, 'arrayValue')) {
    return (value.arrayValue.values || []).map(unwrapFirestoreValue);
  }
  if (Object.prototype.hasOwnProperty.call(value, 'mapValue')) {
    return value.mapValue.fields || {};
  }
  return value;
};

const normalizeTopicKey = (value) => (
  String(value || '')
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[│|]/g, '')
    .replace(/\s+/g, '')
    .trim()
);

export const normalizeSubtopicValue = (value) => (
  String(unwrapFirestoreValue(value) || '')
    .toLowerCase()
    .replace(/[│|]/g, '')
    .replace(/\s+/g, '')
    .trim()
);

export const normalizeAllowedSubtopics = (allowedSubtopics) => {
  const unwrapped = unwrapFirestoreValue(allowedSubtopics);

  if (Array.isArray(unwrapped)) {
    return unwrapped
      .map(unwrapFirestoreValue)
      .filter(Boolean);
  }

  return [];
};

export const normalizeAllowedSubtopicsByTopic = (allowedSubtopicsByTopic) => {
  const unwrapped = unwrapFirestoreValue(allowedSubtopicsByTopic);
  return unwrapped && typeof unwrapped === 'object' && !Array.isArray(unwrapped)
    ? unwrapped
    : {};
};

export const getAllowedSubtopicsForTopic = (allowedSubtopicsByTopic, topicName) => {
  const normalizedByTopic = normalizeAllowedSubtopicsByTopic(allowedSubtopicsByTopic);
  if (Object.prototype.hasOwnProperty.call(normalizedByTopic, topicName)) {
    return normalizeAllowedSubtopics(normalizedByTopic[topicName]);
  }

  const targetTopic = normalizeTopicKey(topicName);
  const matchingKey = Object.keys(normalizedByTopic).find((key) => (
    normalizeTopicKey(key) === targetTopic
  ));

  return matchingKey ? normalizeAllowedSubtopics(normalizedByTopic[matchingKey]) : [];
};

/**
 * Check if a question's subtopic is allowed based on restrictions
 * @param {Object} question - Question object with subtopic field
 * @param {string} topicName - The topic name
 * @param {Object} allowedSubtopicsByTopic - Map of topic name to array of allowed subtopics
 * @returns {boolean} True if question should be allowed, false otherwise
 */
export const isSubtopicAllowed = (question, topicName, allowedSubtopicsByTopic) => {
  // If no restrictions exist for this topic, allow all subtopics
  if (!allowedSubtopicsByTopic) {
    return true;
  }

  const allowedSubtopics = getAllowedSubtopicsForTopic(allowedSubtopicsByTopic, topicName);
  if (allowedSubtopics.length === 0) {
    const normalizedByTopic = normalizeAllowedSubtopicsByTopic(allowedSubtopicsByTopic);
    const hasRestrictionForTopic = Object.keys(normalizedByTopic).some((key) => (
      normalizeTopicKey(key) === normalizeTopicKey(topicName)
    ));
    return !hasRestrictionForTopic;
  }
  
  const rawQuestionSubtopic = question.subtopic || question.fields?.subtopic;

  // If question has no subtopic field and restrictions exist, reject it
  // (Backward compatibility only applies when no restrictions exist)
  if (!rawQuestionSubtopic) {
    return false;
  }

  const questionSubtopic = normalizeSubtopicValue(rawQuestionSubtopic);
  
  // Check if question's subtopic is in the allowed list
  return allowedSubtopics.some(allowed => normalizeSubtopicValue(allowed) === questionSubtopic);
};
