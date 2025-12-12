// Utility functions for working with subtopics
import { content } from '../content/index.js';
import { TOPICS } from '../constants/topics';

/**
 * Get subtopics for a topic by topic name and grade
 * @param {string} topicName - The topic name (e.g., "Measurement & Data 4th")
 * @param {string} grade - The grade (e.g., "G3" or "G4")
 * @returns {string[]} Array of subtopic strings, or empty array if topic has no subtopics
 */
export const getSubtopicsForTopic = (topicName, grade) => {
  try {
    // Map topic names to topic IDs in the content system
    const topicIdMap = {
      [TOPICS.MULTIPLICATION]: 'multiplication',
      [TOPICS.DIVISION]: 'division',
      [TOPICS.FRACTIONS]: 'fractions',
      [TOPICS.MEASUREMENT_DATA]: 'measurement-data',
      [TOPICS.OPERATIONS_ALGEBRAIC_THINKING]: 'operations-algebraic-thinking',
      [TOPICS.BASE_TEN]: 'base-ten',
      [TOPICS.FRACTIONS_4TH]: 'fractions',
      [TOPICS.MEASUREMENT_DATA_4TH]: 'measurement-data',
      [TOPICS.GEOMETRY]: 'geometry',
      [TOPICS.BINARY_ADDITION]: 'binary-addition',
    };

    const gradeId = grade.toLowerCase(); // Convert G3 -> g3, G4 -> g4
    const topicId = topicIdMap[topicName];

    if (!topicId) {
      console.warn(`[getSubtopicsForTopic] Unknown topic: ${topicName}`);
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

/**
 * Check if a question's subtopic is allowed based on restrictions
 * @param {Object} question - Question object with subtopic field
 * @param {string} topicName - The topic name
 * @param {Object} allowedSubtopicsByTopic - Map of topic name to array of allowed subtopics
 * @returns {boolean} True if question should be allowed, false otherwise
 */
export const isSubtopicAllowed = (question, topicName, allowedSubtopicsByTopic) => {
  // If no restrictions exist for this topic, allow all subtopics
  if (!allowedSubtopicsByTopic || !allowedSubtopicsByTopic[topicName]) {
    return true;
  }

  const allowedSubtopics = allowedSubtopicsByTopic[topicName];
  
  // If empty array, no subtopics are allowed (shouldn't happen, but handle it)
  if (allowedSubtopics.length === 0) {
    return false;
  }

  // If question has no subtopic field, allow it (backward compatibility)
  if (!question.subtopic) {
    return true;
  }

  // Normalize subtopic names for comparison (case-insensitive, trim whitespace)
  const normalize = (str) => str.toLowerCase().trim();
  const questionSubtopic = normalize(question.subtopic);
  
  // Check if question's subtopic is in the allowed list
  return allowedSubtopics.some(allowed => normalize(allowed) === questionSubtopic);
};
