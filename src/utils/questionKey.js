/**
 * Stable identity helpers for quiz questions.
 *
 * Dynamically generated questions have no Firestore document id and (for most topics)
 * no `questionTag`, so the two existing repeat-guards — the answered-question-bank id
 * exclusion and the per-tag "Question Mastery Threshold" — never applied to them, and
 * they recurred freely. These helpers give every question a stable key so generated
 * questions obey the same retirement rules as tagged/bank questions.
 */

/**
 * Signature for a question: its text plus the correct answer. The answer is included
 * so questions that share wording but differ in answer (e.g. clock reading) are treated
 * as distinct.
 * @param {object} q
 * @returns {string}
 */
export const getQuestionSignature = (q) => (
  `${q?.question ?? ''}|||${q?.correctAnswer ?? ''}`
);

/**
 * FNV-1a hash → short base36 string. Used to turn a free-text signature (which may
 * contain '.', '/', '?', spaces — all unsafe in a Firestore field path) into a compact,
 * path-safe map key.
 * @param {string} str
 * @returns {string}
 */
const hashString = (str) => {
  let hash = 0x811c9dc5;
  for (let i = 0; i < str.length; i += 1) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(36);
};

/**
 * Retirement key for a question, used both to record mastery (increment on correct
 * answers) and to skip already-mastered questions during quiz generation.
 *
 * Prefers an explicit `questionTag` (the existing tagged generators, e.g. g4 base-ten)
 * so their behavior is unchanged; otherwise derives a path-safe key from the signature
 * so untagged generated questions also obey the class Mastery Threshold.
 * @param {object} q
 * @returns {string}
 */
export const getQuestionMasteryKey = (q) => {
  if (q?.questionTag) return q.questionTag;
  return `gen_${hashString(getQuestionSignature(q))}`;
};
