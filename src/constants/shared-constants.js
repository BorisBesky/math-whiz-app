// Shared constants that work with both ES modules and CommonJS
// This file uses CommonJS format to be compatible with both environments
//
// Topic and grade data DERIVE from the generated content manifest — the
// single source of truth is src/content/<grade>/<topic>/manifest.json plus
// src/content/<grade>/grade.json (see docs/PLUGGABLE_CONTENT_PLAN.md).
// Regenerate with: node scripts/build-content-registry.js
// Export names and shapes are unchanged so existing consumers (client code
// and Netlify functions alike) keep working.

const contentManifest = require('../content/content-manifest.generated.json');

// Enabled grades/topics only, sorted by ordinal (codegen guarantees order).
// Staged content ("enabled": false) is excluded from every derived constant:
// these feed validation lists, AI prompts, and teacher-facing pickers, all of
// which must only see the live curriculum. Data-matching lookups that need to
// see staged/retired content use the registries' permissive queries instead.
const contentGrades = contentManifest.grades
  .filter((grade) => grade.enabled)
  .map((grade) => ({
    ...grade,
    topics: grade.topics.filter((topic) => topic.enabled),
  }));

// Grade constants, e.g. { G3: 'G3', G4: 'G4' }
const GRADES = {};
contentGrades.forEach((grade) => {
  GRADES[grade.key] = grade.key;
});

// 'Measurement & Data 4th' -> 'MEASUREMENT_DATA_4TH'
const toConstantKey = (name) =>
  name
    .toUpperCase()
    .replace(/&/g, ' ')
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

// Legacy concept labels that are NOT topics: historical explanation/concept
// keys still present in student data and conceptExplanationFiles. They have
// no manifest and never will.
const LEGACY_CONCEPTS = {
  AREA: 'Area',
  PERIMETER: 'Perimeter',
  VOLUME: 'Volume',

  // Fraction subtopics
  FRACTIONS_ADDITION: 'Fractions: Addition',
  FRACTIONS_SIMPLIFICATION: 'Fractions: Simplification',
  FRACTIONS_EQUIVALENCY: 'Fractions: Equivalency',
  FRACTIONS_COMPARISON: 'Fractions: Comparison',
};

// Core math topics: derived constants like TOPICS.MULTIPLICATION plus the
// legacy concept labels above.
const TOPICS = {};
contentGrades.forEach((grade) => {
  grade.topics.forEach((topic) => {
    TOPICS[toConstantKey(topic.name)] = topic.name;
  });
});
Object.assign(TOPICS, LEGACY_CONCEPTS);

// Valid topics by grade (for gemini-proxy validation and question imports).
// Includes disabled (staged) topics on purpose: validation surfaces stay
// permissive; student-facing lists filter on "enabled" instead.
const VALID_TOPICS_BY_GRADE = {};
contentGrades.forEach((grade) => {
  VALID_TOPICS_BY_GRADE[grade.key] = grade.topics.map((topic) => topic.name);
});

const SUBTOPICS_BY_GRADE_TOPIC = {};
contentGrades.forEach((grade) => {
  SUBTOPICS_BY_GRADE_TOPIC[grade.key] = {};
  grade.topics.forEach((topic) => {
    SUBTOPICS_BY_GRADE_TOPIC[grade.key][topic.name] = topic.subtopics;
  });
});

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
