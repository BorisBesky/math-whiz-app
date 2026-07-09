// Server-side content registry (docs/PLUGGABLE_CONTENT_PLAN.md, Phase 3).
//
// CommonJS twin of src/content/registry.js for Netlify functions: read-only
// queries over the generated content manifest plus the prompt-text builders
// the AI functions share. Everything derives from the per-topic/per-grade
// manifests, so a new content folder reaches server-side validation and
// prompts with no function edits.
//
// Prompt-affecting helpers are frozen by src/__tests__/ai-prompt-snapshots.test.js.

const contentManifest = require('../../src/content/content-manifest.generated.json');

const allGrades = contentManifest.grades; // sorted by ordinal (codegen guarantee)
const enabledGrades = allGrades.filter((grade) => grade.enabled);

/** Grade entry (with topics) by key, or undefined. Searches disabled grades too. */
const getGrade = (gradeKey) => allGrades.find((grade) => grade.key === gradeKey);

/** Enabled grade keys, sorted by ordinal — the valid values for API `grade` params. */
const getEnabledGradeKeys = () => enabledGrades.map((grade) => grade.key);

/** Key of the grade new students start in. */
const getDefaultGradeKey = () =>
  (enabledGrades.find((grade) => grade.default) || enabledGrades[0]).key;

/** True when the value is an enabled grade key. */
const isValidGradeKey = (gradeKey) => enabledGrades.some((grade) => grade.key === gradeKey);

/** Human label like "3rd grade" (matches the historical prompt/error wording). */
const gradeAdjective = (gradeKey) => {
  const grade = getGrade(gradeKey);
  return grade ? `${grade.shortLabel} grade` : String(gradeKey);
};

/** Topic manifests for a grade key ([] for unknown grades). Includes staged topics. */
const topicsForGrade = (gradeKey) => getGrade(gradeKey)?.topics || [];

/** Topic names for a grade key, in display order. */
const topicNamesForGrade = (gradeKey) => topicsForGrade(gradeKey).map((topic) => topic.name);

/** Grade key whose topics include the given name, else the fallback. */
const inferGradeForTopic = (topicName, fallbackGradeKey) => {
  const owner = enabledGrades.find((grade) =>
    grade.topics.some((topic) => topic.name === topicName)
  );
  return owner ? owner.key : fallbackGradeKey;
};

/** subtopicAliases map ({ alias: canonical }) for a grade/topic pair. */
const subtopicAliasesFor = (gradeKey, topicName) => {
  const topic = topicsForGrade(gradeKey).find((entry) => entry.name === topicName);
  return topic?.subtopicAliases || {};
};

/** "- Topic: guideline" lines for every topic of a grade, joined with newlines. */
const topicGuidelineLines = (gradeKey) =>
  topicsForGrade(gradeKey)
    .map((topic) => `- ${topic.name}: ${topic.ai.guidelines}`)
    .join('\n');

/** The grade's story-prompt Requirements bullet lines, joined with newlines. */
const storyRequirementLines = (gradeKey) =>
  (getGrade(gradeKey)?.ai?.storyRequirements || []).join('\n');

module.exports = {
  getGrade,
  getEnabledGradeKeys,
  getDefaultGradeKey,
  isValidGradeKey,
  gradeAdjective,
  topicsForGrade,
  topicNamesForGrade,
  inferGradeForTopic,
  subtopicAliasesFor,
  topicGuidelineLines,
  storyRequirementLines,
};
