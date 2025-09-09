// Shared constants that work with both ES modules and CommonJS
// This file uses CommonJS format to be compatible with both environments

// Grade constants
const GRADES = {
  G3: 'G3',
  G4: 'G4',
};

// Core math topics
const TOPICS = {
  // 3rd Grade Topics
  MULTIPLICATION: 'Multiplication',
  DIVISION: 'Division',
  FRACTIONS: 'Fractions',
  MEASUREMENT_DATA: 'Measurement & Data',
  AREA: 'Area',
  PERIMETER: 'Perimeter',
  VOLUME: 'Volume',
  
  // 4th Grade Topics
  OPERATIONS_ALGEBRAIC_THINKING: 'Operations & Algebraic Thinking',
  BASE_TEN: 'Base Ten',
  FRACTIONS_4TH: 'Fractions 4th',  // Note: Same as 3rd grade fractions
  MEASUREMENT_DATA_4TH: 'Measurement & Data 4th',
  GEOMETRY: 'Geometry',
  
  // Fraction subtopics
  FRACTIONS_ADDITION: 'Fractions: Addition',
  FRACTIONS_SIMPLIFICATION: 'Fractions: Simplification',
  FRACTIONS_EQUIVALENCY: 'Fractions: Equivalency',
  FRACTIONS_COMPARISON: 'Fractions: Comparison',
};

// Valid topics by grade (for gemini-proxy validation)
const VALID_TOPICS_BY_GRADE = {
  [GRADES.G3]: [
    TOPICS.MULTIPLICATION,
    TOPICS.DIVISION,
    TOPICS.FRACTIONS,
    TOPICS.MEASUREMENT_DATA,
  ],
  [GRADES.G4]: [
    TOPICS.OPERATIONS_ALGEBRAIC_THINKING,
    TOPICS.BASE_TEN,
    TOPICS.FRACTIONS_4TH,
    TOPICS.MEASUREMENT_DATA_4TH,
    TOPICS.GEOMETRY,
  ],
};

// Application state constants
const APP_STATES = {
  TOPIC_SELECTION: 'topicSelection',
  IN_PROGRESS: 'inProgress',
  RESULTS: 'results',
  DASHBOARD: 'dashboard',
  STORE: 'store',
};

// Export all topic values as an array for validation/iteration
const ALL_TOPICS = Object.values(TOPICS);

// Export all app states as an array for validation/iteration
const ALL_APP_STATES = Object.values(APP_STATES);

// CommonJS exports
module.exports = {
  GRADES,
  TOPICS,
  VALID_TOPICS_BY_GRADE,
  APP_STATES,
  ALL_TOPICS,
  ALL_APP_STATES,
};
