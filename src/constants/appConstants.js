import { TOPICS } from "./topics";

export const DEFAULT_DAILY_GOAL = 4;
export const DAILY_GOAL_BONUS = 10;
export const STORE_BACKGROUND_COST = 20;
export const GOAL_RANGE_MIN = 4;
export const GOAL_RANGE_MAX = 40;
export const GOAL_RANGE_STEP = 1;

// --- Concept Explanation HTML Files Mapping ---
export const conceptExplanationFiles = {
  // 3rd Grade Topics
  [TOPICS.MULTIPLICATION]: "/multiplicationExplanation.html",
  [TOPICS.DIVISION]: "/divisionExplanation.html",
  // Fraction subtopics
  [TOPICS.FRACTIONS_ADDITION]: "/fractionAdditionExplanation.html",
  [TOPICS.FRACTIONS_SIMPLIFICATION]: "/fractionSimplificationExplanation.html",
  [TOPICS.FRACTIONS_EQUIVALENCY]: "/fractionEquivalencyExplanation.html",
  [TOPICS.FRACTIONS_COMPARISON]: "/fractionComparisonExplanation.html",
  // Fallback for any generic fractions (kept for backward compatibility)
  [TOPICS.FRACTIONS]: "/fractionAdditionExplanation.html",
  [TOPICS.AREA]: "/areaExplanation.html",
  [TOPICS.PERIMETER]: "/perimeterExplanation.html",
  [TOPICS.VOLUME]: "/volumeExplanation.html",
  // 4th Grade Topics
  [TOPICS.OPERATIONS_ALGEBRAIC_THINKING]: "/oa4Explanation.html",
  [TOPICS.BASE_TEN]: "/nbt4Explanation.html",
  [TOPICS.FRACTIONS_4TH]: "/nf4Explanation.html",
  [TOPICS.MEASUREMENT_DATA_4TH]: "/md4Explanation.html",
  [TOPICS.GEOMETRY]: "/g4Explanation.html",
  [TOPICS.BINARY_OPERATIONS]: "/binaryOperationsExplanation.html",
};

// Grade-specific topics
export const quizTopicsByGrade = {
  G3: [TOPICS.MULTIPLICATION, TOPICS.DIVISION, TOPICS.FRACTIONS, TOPICS.MEASUREMENT_DATA],
  G4: [
    TOPICS.OPERATIONS_ALGEBRAIC_THINKING,
    TOPICS.BASE_TEN,
    TOPICS.FRACTIONS_4TH,
    TOPICS.MEASUREMENT_DATA_4TH,
    TOPICS.GEOMETRY,
    TOPICS.BINARY_OPERATIONS,
  ],
};

// Topic-to-content mapping: maps each TOPICS constant to its [gradeId, topicId] in the content system
export const TOPIC_CONTENT_MAP = {
  [TOPICS.MULTIPLICATION]:               ['g3', 'multiplication'],
  [TOPICS.DIVISION]:                     ['g3', 'division'],
  [TOPICS.FRACTIONS]:                    ['g3', 'fractions'],
  [TOPICS.MEASUREMENT_DATA]:             ['g3', 'measurement-data'],
  [TOPICS.OPERATIONS_ALGEBRAIC_THINKING]:['g4', 'operations-algebraic-thinking'],
  [TOPICS.BASE_TEN]:                     ['g4', 'base-ten'],
  [TOPICS.FRACTIONS_4TH]:               ['g4', 'fractions'],
  [TOPICS.MEASUREMENT_DATA_4TH]:        ['g4', 'measurement-data'],
  [TOPICS.GEOMETRY]:                     ['g4', 'geometry'],
  [TOPICS.BINARY_OPERATIONS]:            ['g4', 'binary-operations'],
};
