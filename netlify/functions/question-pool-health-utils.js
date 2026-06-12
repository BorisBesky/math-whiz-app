/**
 * Repeat-pressure analysis for a class's answered-question history.
 *
 * "Low question pool" shows up as the same question being served to students over and
 * over. Rather than guess each generator's variety, we measure the symptom directly:
 * group answered records by (topic, subtopic) and find questions that recurred at or
 * above a threshold. A high max-repeat for a subtopic means its effective pool is too
 * small and the teacher should generate (LLM) or import more questions for it.
 *
 * Pure/CommonJS so it can be unit-tested directly and required by the Netlify function.
 */

const DEFAULT_REPEAT_THRESHOLD = 3;

const signatureOf = (record) => (
  `${(record && record.question) || ''}|||${(record && record.correctAnswer) ?? ''}`
);

/**
 * @param {Array<{topic?:string, subtopic?:string, question?:string, correctAnswer?:any}>} records
 * @param {{repeatThreshold?: number}} [options]
 * @returns {{
 *   flags: Array<{topic:string, subtopic:string, distinctQuestions:number, totalAnswers:number,
 *                 maxRepeats:number, repeatedQuestionCount:number, sampleQuestion:string,
 *                 severity:'medium'|'high'}>,
 *   totalAnswers: number
 * }}
 */
function analyzeRepeatPressure(records, { repeatThreshold = DEFAULT_REPEAT_THRESHOLD } = {}) {
  const threshold = Math.max(2, repeatThreshold);
  const groups = new Map(); // `${topic}|||${subtopic}` -> { topic, subtopic, total, counts: Map }
  let totalAnswers = 0;

  for (const record of records || []) {
    if (!record || !record.question) continue;
    const topic = record.topic || 'Unknown';
    const subtopic = record.subtopic || '';
    const groupKey = `${topic}|||${subtopic}`;
    if (!groups.has(groupKey)) {
      groups.set(groupKey, { topic, subtopic, total: 0, counts: new Map() });
    }
    const group = groups.get(groupKey);
    group.total += 1;
    totalAnswers += 1;

    const sig = signatureOf(record);
    const entry = group.counts.get(sig) || { count: 0, sample: record.question };
    entry.count += 1;
    group.counts.set(sig, entry);
  }

  const flags = [];
  for (const group of groups.values()) {
    let maxRepeats = 0;
    let mostRepeatedSample = '';
    let repeatedQuestionCount = 0;
    for (const { count, sample } of group.counts.values()) {
      if (count >= threshold) repeatedQuestionCount += 1;
      if (count > maxRepeats) {
        maxRepeats = count;
        mostRepeatedSample = sample;
      }
    }
    if (maxRepeats >= threshold) {
      flags.push({
        topic: group.topic,
        subtopic: group.subtopic,
        distinctQuestions: group.counts.size,
        totalAnswers: group.total,
        maxRepeats,
        repeatedQuestionCount,
        sampleQuestion: mostRepeatedSample,
        severity: maxRepeats >= threshold * 2 ? 'high' : 'medium',
      });
    }
  }

  // Worst offenders first.
  flags.sort((a, b) => b.maxRepeats - a.maxRepeats || b.repeatedQuestionCount - a.repeatedQuestionCount);
  return { flags, totalAnswers };
}

module.exports = { analyzeRepeatPressure, signatureOf, DEFAULT_REPEAT_THRESHOLD };
