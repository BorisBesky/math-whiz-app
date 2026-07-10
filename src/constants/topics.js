// Topic name constants to ensure consistency across the application
// These constants should be used instead of hard-coded strings
// Note: Constants are imported from shared-constants.js to ensure consistency

const {
  GRADES: _GRADES,
  TOPICS: _TOPICS,
  VALID_TOPICS_BY_GRADE: _VALID_TOPICS_BY_GRADE,
  SUBTOPICS_BY_GRADE_TOPIC: _SUBTOPICS_BY_GRADE_TOPIC,
  APP_STATES: _APP_STATES,
  QUESTION_TYPES: _QUESTION_TYPES,
  ALL_QUESTION_TYPES: _ALL_QUESTION_TYPES,
  ALL_TOPICS: _ALL_TOPICS,
  ALL_APP_STATES: _ALL_APP_STATES,
} = require('./shared-constants.js');

// Re-export as ES modules
export const GRADES = _GRADES;
export const TOPICS = _TOPICS;
export const VALID_TOPICS_BY_GRADE = _VALID_TOPICS_BY_GRADE;
export const SUBTOPICS_BY_GRADE_TOPIC = _SUBTOPICS_BY_GRADE_TOPIC;
export const APP_STATES = _APP_STATES;
export const QUESTION_TYPES = _QUESTION_TYPES;
export const ALL_QUESTION_TYPES = _ALL_QUESTION_TYPES;
export const ALL_TOPICS = _ALL_TOPICS;
export const ALL_APP_STATES = _ALL_APP_STATES;
