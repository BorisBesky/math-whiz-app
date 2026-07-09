// Utility functions for working with subtopics
import { getTopicByName } from '../content/registry';

/**
 * Get subtopics for a topic by topic name and grade
 * @param {string} topicName - The topic name (e.g., "Measurement & Data 4th")
 * @param {string} grade - The grade (e.g., "G3" or "G4")
 * @returns {string[]} Array of subtopic strings, or empty array if topic has no subtopics
 */
export const getSubtopicsForTopic = (topicName, grade) => {
  try {
    // Registry lookup: exact name, then declared aliases, then normalized match.
    const topic = getTopicByName(topicName, grade);
    if (!topic) {
      console.warn(`[getSubtopicsForTopic] Unknown topic: ${topicName} for grade: ${grade}`);
      return [];
    }
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
