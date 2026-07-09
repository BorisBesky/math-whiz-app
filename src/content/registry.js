// Content registry facade (docs/PLUGGABLE_CONTENT_PLAN.md, Phase 2).
//
// The single query surface for grade/topic knowledge. Everything here derives
// from the per-topic manifest.json / per-grade grade.json files via the
// generated registry, so plugging in a new topic or grade folder updates every
// consumer of this module with no further edits.
//
// Conventions:
// - Student-facing list queries (getAllGrades, getTopicsForGrade) return only
//   enabled entries — "enabled": false stages content invisibly.
// - Lookup queries (getGrade, getTopicByName, getTopicContent) are permissive
//   and search disabled entries too, so existing data referencing staged or
//   later-disabled content still resolves.
import content from './index';

const allGrades = content.grades; // sorted by ordinal (codegen guarantee)
const enabledGrades = allGrades.filter((grade) => grade.enabled);
const allTopicsAcrossGrades = allGrades.flatMap((grade) => grade.topics);

// Same normalization family as subtopicUtils.normalizeTopicKey (kept local to
// avoid an import cycle): lowercase, & -> "and", drop pipes, drop whitespace.
const normalizeTopicKey = (value) => (
  String(value || '')
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[│|]/g, '')
    .replace(/\s+/g, '')
    .trim()
);

/** Enabled grades, sorted by ordinal. */
export const getAllGrades = () => enabledGrades;

/** Grade by key ('G4') or id ('g4'); searches disabled grades too. */
export const getGrade = (keyOrId) => {
  const raw = String(keyOrId || '');
  return allGrades.find(
    (grade) => grade.key === raw.toUpperCase() || grade.id === raw.toLowerCase()
  );
};

/** Key of the grade new students start in. */
export const getDefaultGradeKey = () => {
  const defaultGrade = enabledGrades.find((grade) => grade.default) || enabledGrades[0];
  return defaultGrade.key;
};

/**
 * Normalizes free-form grade values ('g4', '4th', 'Grade 4', 4) to a grade
 * key, or null when nothing matches. Only enabled grades participate: a class
 * pointing at a staged grade must not switch students into it.
 */
export const normalizeGradeKey = (value) => {
  if (value === null || value === undefined) return null;
  const normalized = String(value).trim().toUpperCase();
  if (!normalized) return null;

  const exact = enabledGrades.find((grade) => grade.key === normalized);
  if (exact) return exact.key;

  const byOrdinal = enabledGrades.find((grade) => normalized.includes(String(grade.ordinal)));
  return byOrdinal ? byOrdinal.key : null;
};

/**
 * Regex source matching grade vocabulary ('3rd', 'grade 4', 'g4') in
 * lowercased text — used to strip grade words when normalizing topic labels.
 * Includes disabled grades: text normalization stays permissive.
 */
export const gradeWordPattern = () => {
  const shortLabels = allGrades.map((grade) => grade.shortLabel.toLowerCase());
  const ordinals = allGrades.map((grade) => String(grade.ordinal));
  return `\\b(${shortLabels.join('|')}|grade\\s*(?:${ordinals.join('|')})|g(?:${ordinals.join('|')}))\\b`;
};

/** Enabled topic modules for a grade (key or id), in manifest order. */
export const getTopicsForGrade = (gradeKeyOrId) => {
  const grade = getGrade(gradeKeyOrId);
  if (!grade || !grade.enabled) return [];
  return grade.topics.filter((topic) => topic.enabled);
};

/** Enabled topic names for a grade, in manifest order. */
export const getTopicNamesForGrade = (gradeKeyOrId) =>
  getTopicsForGrade(gradeKeyOrId).map((topic) => topic.name);

/** Every topic module across all grades (teacher/data surface; unfiltered). */
export const getAllTopics = () => allTopicsAcrossGrades;

/**
 * Topic module by student-facing name: exact match, then declared aliases,
 * then normalized comparison. Optionally scoped to one grade.
 */
export const getTopicByName = (topicName, gradeKeyOrId) => {
  const scope = gradeKeyOrId ? getGrade(gradeKeyOrId)?.topics || [] : allTopicsAcrossGrades;

  const exact = scope.find((topic) => topic.name === topicName);
  if (exact) return exact;

  const byAlias = scope.find((topic) => (topic.aliases || []).includes(topicName));
  if (byAlias) return byAlias;

  const target = normalizeTopicKey(topicName);
  if (!target) return undefined;
  return scope.find(
    (topic) =>
      normalizeTopicKey(topic.name) === target ||
      (topic.aliases || []).some((alias) => normalizeTopicKey(alias) === target)
  );
};

/**
 * Topic module (manifest fields + lazy loaders) for a topic name — the
 * replacement for the old TOPIC_CONTENT_MAP + content.getTopic two-step.
 */
export const getTopicContent = (topicName) => getTopicByName(topicName);

/**
 * Applies the topic's optional display hook (loadQuestionHooks →
 * prepareForDisplay) to one question, e.g. regenerating a geometry diagram
 * SVG from the question text. Questions of topics without hooks pass through.
 */
export const prepareQuestionForDisplay = async (topicName, question) => {
  if (!question) return question;
  const topicContent = getTopicContent(topicName);
  if (!topicContent?.loadQuestionHooks) return question;

  const hooks = await topicContent.loadQuestionHooks();
  return typeof hooks?.prepareForDisplay === 'function'
    ? hooks.prepareForDisplay(question)
    : question;
};

/** prepareQuestionForDisplay over a whole quiz. */
export const prepareQuestionsForDisplay = async (topicName, questions) => {
  if (!Array.isArray(questions) || questions.length === 0) return questions;
  const topicContent = getTopicContent(topicName);
  if (!topicContent?.loadQuestionHooks) return questions;

  const hooks = await topicContent.loadQuestionHooks();
  if (typeof hooks?.prepareForDisplay !== 'function') return questions;
  return questions.map((question) => hooks.prepareForDisplay(question));
};
