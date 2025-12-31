// Topic name constants to ensure consistency across the application
// These constants should be used instead of hard-coded strings
// Note: Constants are imported from shared-constants.js to ensure consistency

import {
  GRADES as _GRADES,
  TOPICS as _TOPICS,
  VALID_TOPICS_BY_GRADE as _VALID_TOPICS_BY_GRADE,
  APP_STATES as _APP_STATES,
  QUESTION_TYPES as _QUESTION_TYPES,
  ALL_QUESTION_TYPES as _ALL_QUESTION_TYPES,
  ALL_TOPICS as _ALL_TOPICS,
  ALL_APP_STATES as _ALL_APP_STATES,
} from './shared-constants.js';

// Re-export as ES modules
export const GRADES = _GRADES;
export const TOPICS = _TOPICS;
export const VALID_TOPICS_BY_GRADE = _VALID_TOPICS_BY_GRADE;
export const APP_STATES = _APP_STATES;
export const QUESTION_TYPES = _QUESTION_TYPES;
export const ALL_QUESTION_TYPES = _ALL_QUESTION_TYPES;
export const ALL_TOPICS = _ALL_TOPICS;
export const ALL_APP_STATES = _ALL_APP_STATES;
