import { TOPICS } from "./topics";
import { getAllGrades, getAllTopics, getTopicNamesForGrade } from "../content/registry";

export const DEFAULT_DAILY_GOAL = 4;
export const DAILY_GOAL_BONUS = 10;
export const STORE_BACKGROUND_COST = 20;
export const DEFAULT_BACKGROUND_IMAGE = "/images/default-background.webp";
export const GOAL_RANGE_MIN = 4;
export const GOAL_RANGE_MAX = 40;
export const GOAL_RANGE_STEP = 1;

// --- Concept Explanation HTML Files Mapping ---
// Topic entries derive from each manifest's legacyExplanationHtml; the literal
// entries below are legacy question.concept labels that are not topics (old
// fraction subtopic and geometry concept names still present in student data).
export const conceptExplanationFiles = {
  [TOPICS.FRACTIONS_ADDITION]: "/fractionAdditionExplanation.html",
  [TOPICS.FRACTIONS_SIMPLIFICATION]: "/fractionSimplificationExplanation.html",
  [TOPICS.FRACTIONS_EQUIVALENCY]: "/fractionEquivalencyExplanation.html",
  [TOPICS.FRACTIONS_COMPARISON]: "/fractionComparisonExplanation.html",
  [TOPICS.AREA]: "/areaExplanation.html",
  [TOPICS.PERIMETER]: "/perimeterExplanation.html",
  [TOPICS.VOLUME]: "/volumeExplanation.html",
};
getAllTopics().forEach((topic) => {
  if (topic.legacyExplanationHtml) {
    conceptExplanationFiles[topic.name] = topic.legacyExplanationHtml;
  }
});

/**
 * @deprecated Query src/content/registry (getTopicNamesForGrade) instead.
 * Kept as a derived alias while remaining imports migrate.
 */
export const quizTopicsByGrade = Object.fromEntries(
  getAllGrades().map((grade) => [grade.key, getTopicNamesForGrade(grade.key)])
);

/**
 * @deprecated Query src/content/registry (getTopicContent) instead.
 * Kept as a derived alias while remaining imports migrate.
 */
export const TOPIC_CONTENT_MAP = Object.fromEntries(
  getAllTopics().map((topic) => [topic.name, [topic.grade.toLowerCase(), topic.id]])
);
