// Constants for Netlify functions - Importing from shared constants
// This ensures consistency and eliminates duplication

const {
  GRADES,
  TOPICS,
  VALID_TOPICS_BY_GRADE,
  QUESTION_TYPES,
} = require('../../src/constants/shared-constants.js');

module.exports = {
  GRADES,
  TOPICS,
  VALID_TOPICS_BY_GRADE,
  QUESTION_TYPES,
};
