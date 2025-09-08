// Topic name constants to ensure consistency across the application
// These constants should be used instead of hard-coded strings

// Core math topics
export const TOPICS = {
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

// Application state constants
export const APP_STATES = {
  TOPIC_SELECTION: 'topicSelection',
  IN_PROGRESS: 'inProgress',
  RESULTS: 'results',
  DASHBOARD: 'dashboard',
  STORE: 'store',
};

// Export all topic values as an array for validation/iteration
export const ALL_TOPICS = Object.values(TOPICS);

// Export all app states as an array for validation/iteration
export const ALL_APP_STATES = Object.values(APP_STATES);
