// Browser-safe constants facade. Netlify functions load the sibling
// shared-constants.js CommonJS module, but client bundles must not import it:
// webpack treats this file as ESM and rejects CommonJS module.exports writes.
import contentManifest from '../content/content-manifest.generated.json';

const contentGrades = contentManifest.grades
  .filter((grade) => grade.enabled)
  .map((grade) => ({
    ...grade,
    topics: grade.topics.filter((topic) => topic.enabled),
  }));

const toConstantKey = (name) =>
  name
    .toUpperCase()
    .replace(/&/g, ' ')
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

const LEGACY_CONCEPTS = {
  AREA: 'Area',
  PERIMETER: 'Perimeter',
  VOLUME: 'Volume',
  FRACTIONS_ADDITION: 'Fractions: Addition',
  FRACTIONS_SIMPLIFICATION: 'Fractions: Simplification',
  FRACTIONS_EQUIVALENCY: 'Fractions: Equivalency',
  FRACTIONS_COMPARISON: 'Fractions: Comparison',
};

export const GRADES = Object.fromEntries(
  contentGrades.map((grade) => [grade.key, grade.key])
);

const curriculumTopics = contentGrades.reduce((topics, grade) => {
  grade.topics.forEach((topic) => {
    topics[toConstantKey(topic.name)] = topic.name;
  });
  return topics;
}, {});

export const TOPICS = { ...curriculumTopics, ...LEGACY_CONCEPTS };

export const VALID_TOPICS_BY_GRADE = Object.fromEntries(
  contentGrades.map((grade) => [grade.key, grade.topics.map((topic) => topic.name)])
);

export const SUBTOPICS_BY_GRADE_TOPIC = Object.fromEntries(
  contentGrades.map((grade) => [
    grade.key,
    Object.fromEntries(grade.topics.map((topic) => [topic.name, topic.subtopics])),
  ])
);

export const APP_STATES = {
  TOPIC_SELECTION: 'topicSelection',
  IN_PROGRESS: 'inProgress',
  RESULTS: 'results',
  DASHBOARD: 'dashboard',
  STORE: 'store',
};

export const QUESTION_TYPES = {
  MULTIPLE_CHOICE: 'multiple-choice',
  NUMERIC: 'numeric',
  FILL_IN_THE_BLANKS: 'fill-in-the-blanks',
  DRAWING: 'drawing',
  WRITE_IN: 'write-in',
  DRAWING_WITH_TEXT: 'drawing-with-text',
};

export const ALL_QUESTION_TYPES = Object.values(QUESTION_TYPES);
export const ALL_TOPICS = Object.values(TOPICS);
export const ALL_APP_STATES = Object.values(APP_STATES);
