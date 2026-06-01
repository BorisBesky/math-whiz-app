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
  BINARY_OPERATIONS: 'Binary Operations',
  
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
    TOPICS.BINARY_OPERATIONS,
  ],
};

const SUBTOPICS_BY_GRADE_TOPIC = {
  [GRADES.G3]: {
    [TOPICS.MULTIPLICATION]: [
      'basic multiplication',
      'skip counting',
      'arrays and groups',
      'word problems',
      'fact families',
    ],
    [TOPICS.DIVISION]: [
      'basic division',
      'equal sharing',
      'grouping',
      'fact families',
      'remainders',
      'arrays',
    ],
    [TOPICS.FRACTIONS]: [
      'equivalent fractions',
      'comparison',
      'addition',
      'subtraction',
      'simplification',
    ],
    [TOPICS.MEASUREMENT_DATA]: [
      'area',
      'perimeter',
      'volume',
    ],
  },
  [GRADES.G4]: {
    [TOPICS.OPERATIONS_ALGEBRAIC_THINKING]: [
      'multiplicative comparison',
      'prime vs composite',
      'factors',
      'multiples',
      'number patterns',
    ],
    [TOPICS.BASE_TEN]: [
      'place value',
      'rounding',
      'addition',
      'subtraction',
      'multiplication',
      'division',
      'comparison',
      'decimal place value',
    ],
    [TOPICS.FRACTIONS_4TH]: [
      'equivalent fractions',
      'comparison',
      'addition',
      'subtraction',
      'multiplication',
      'decimal notation',
      'decimal operations',
      'mixed numbers',
      'decimal number line',
    ],
    [TOPICS.MEASUREMENT_DATA_4TH]: [
      'length conversion',
      'weight and capacity conversion',
      'time conversion',
      'clock reading',
      'area',
      'perimeter',
      'angles',
      'data interpretation',
      'line plots',
    ],
    [TOPICS.GEOMETRY]: [
      'lines and angles',
      'points lines rays',
      'classify shapes',
      'symmetry',
      'triangles',
      'quadrilaterals',
      'angle measurement',
      'find missing side',
      'composite shapes',
      'rectangle to square',
      'photo collage',
    ],
    [TOPICS.BINARY_OPERATIONS]: [
      'binary to decimal conversion',
      'decimal to binary conversion',
      'binary addition',
      'binary subtraction',
      'binary multiplication',
      'binary division',
      'place value in binary',
      'comparing binary numbers',
    ],
  },
};

// Question type constants
const QUESTION_TYPES = {
  MULTIPLE_CHOICE: 'multiple-choice',
  NUMERIC: 'numeric',
  FILL_IN_THE_BLANKS: 'fill-in-the-blanks',
  DRAWING: 'drawing',
  WRITE_IN: 'write-in',
  DRAWING_WITH_TEXT: 'drawing-with-text',
};

// Export all question types as an array for validation/iteration
const ALL_QUESTION_TYPES = Object.values(QUESTION_TYPES);

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
  SUBTOPICS_BY_GRADE_TOPIC,
  APP_STATES,
  QUESTION_TYPES,
  ALL_TOPICS,
  ALL_APP_STATES,
  ALL_QUESTION_TYPES,
};
