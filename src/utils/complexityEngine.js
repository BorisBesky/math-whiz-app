// Complexity scoring and selection utilities

// Tunable weights and params
const TIME_WEIGHT = 0.6; // weight for time component
const INCORRECT_WEIGHT = 0.4; // weight for incorrectness
const MAX_TIME_MULTIPLIER = 2; // cap normalization for extreme outliers
const HISTORY_WINDOW = 20; // last N per topic for averaging
const PROGRESS_STEP = 0.08; // progressive increase step
const MIN_COMPLEXITY = 0.15;
const MAX_COMPLEXITY = 0.95;

function clamp01(x) {
  return Math.max(0, Math.min(1, x));
}

function percentile(sorted, p) {
  if (!sorted.length) return 0;
  p = clamp01(p);
  const idx = (sorted.length - 1) * p;
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sorted[lo];
  const w = idx - lo;
  return sorted[lo] * (1 - w) + sorted[hi] * w;
}

// Welford's online algorithm for computing mean and variance in one pass
function welfordStats(values) {
  let count = 0;
  let mean = 0;
  let m2 = 0;
  
  for (const x of values) {
    count += 1;
    const delta = x - mean;
    mean += delta / count;
    const delta2 = x - mean;
    m2 += delta * delta2;
  }
  
  const variance = count > 1 ? m2 / count : 0;
  return { mean, variance, stdDev: Math.sqrt(variance), count };
}

// Normalize time within a topic: compare each answer's time to the topic median,
// cap at MAX_TIME_MULTIPLIER, then map to [0,1]. Remove outliers beyond 3 standard deviations.
// Uses log-transformation since response times follow log-normal distribution.
function normalizeTimesWithinTopic(records) {
  const map = new Map(); // key -> normalized time [0,1]

  const byTopic = new Map();
  for (const r of records) {
    if (!byTopic.has(r.topic)) byTopic.set(r.topic, []);
    byTopic.get(r.topic).push(r);
  }

  const topicMedian = new Map();
  for (const [topic, recs] of byTopic.entries()) {
    const rawTimes = recs.map(r => Math.max(1, r.timeSpentMs)); // min 1ms to avoid log(0)
    
    // Remove outliers beyond 3 standard deviations using log-transformed times
    if (rawTimes.length > 2) {
      const logTimes = rawTimes.map(t => Math.log(t));
      const { mean: logMean, stdDev: logStdDev } = welfordStats(logTimes);
      
      // Filter outliers in log space, then transform back
      const filteredTimes = rawTimes.filter((t, i) => 
        Math.abs(logTimes[i] - logMean) <= 3 * logStdDev
      );
      
      const times = (filteredTimes.length > 0 ? filteredTimes : rawTimes).sort((a, b) => a - b);
      const med = percentile(times, 0.5) || 1;
      topicMedian.set(topic, med);
    } else {
      const times = rawTimes.sort((a, b) => a - b);
      const med = percentile(times, 0.5) || 1;
      topicMedian.set(topic, med);
    }
  }

  for (const r of records) {
    const med = topicMedian.get(r.topic) || 1;
    const ratio = med > 0 ? r.timeSpentMs / med : 1;
    const capped = Math.min(ratio, MAX_TIME_MULTIPLIER);
    const normalized = clamp01(capped / MAX_TIME_MULTIPLIER); // median ≈ 0.5
    const key = `${r.questionId}|${typeof r.createdAt === 'number' ? r.createdAt : (r.createdAt instanceof Date ? r.createdAt.getTime() : r.createdAt)}`;
    map.set(key, normalized);
  }

  return map;
}

// Rank questions by inferred complexity in [0,1].
export function rankQuestionsByComplexity(history) {
  if (!history || !history.length) return [];
  const normTimes = normalizeTimesWithinTopic(history);

  const ranked = history.map(r => {
    const key = `${r.questionId}|${typeof r.createdAt === 'number' ? r.createdAt : (r.createdAt instanceof Date ? r.createdAt.getTime() : r.createdAt)}`;
    const timeComponent = normTimes.get(key) ?? 0.5;
    const incorrectComponent = r.isCorrect ? 0 : 1;
    const score = clamp01(TIME_WEIGHT * timeComponent + INCORRECT_WEIGHT * incorrectComponent);
    return { ...r, complexityScore: score };
  });

  ranked.sort((a, b) => {
    if (b.complexityScore !== a.complexityScore) return b.complexityScore - a.complexityScore;
    const ta = a.createdAt instanceof Date ? a.createdAt.getTime() : Number(a.createdAt || 0);
    const tb = b.createdAt instanceof Date ? b.createdAt.getTime() : Number(b.createdAt || 0);
    return tb - ta;
  });

  return ranked;
}

// Compute per-topic average complexity (last HISTORY_WINDOW per topic)
export function computePerTopicComplexity(history) {
  const ranked = rankQuestionsByComplexity(history);
  const byTopic = new Map();
  for (const r of ranked) {
    if (!byTopic.has(r.topic)) byTopic.set(r.topic, []);
    byTopic.get(r.topic).push(r);
  }

  const topics = [];
  for (const [topic, recs] of byTopic.entries()) {
    const window = recs.slice(0, HISTORY_WINDOW);
    const avg = window.reduce((s, r) => s + (r.complexityScore ?? 0), 0) / Math.max(1, window.length);
    const last = recs.reduce((m, r) => {
      const t = r.createdAt instanceof Date ? r.createdAt.getTime() : Number(r.createdAt || 0);
      return Math.max(m, t);
    }, 0);
    topics.push({ topic, avg: clamp01(avg), count: recs.length, lastAnsweredAt: last ? new Date(last) : undefined });
  }

  topics.sort((a, b) => (b.lastAnsweredAt?.getTime?.() ?? 0) - (a.lastAnsweredAt?.getTime?.() ?? 0));
  return topics;
}

// Determine next target complexity for a topic and mode
export function nextTargetComplexity({ history, topic, mode = 'progressive', lastAskedComplexity }) {
  if (mode === 'random') return 0.5;

  const topicHistory = (history || []).filter(h => h.topic === topic);
  if (topicHistory.length === 0) {
    return 0.5; // no history => neutral starting complexity
  }

  const perTopic = computePerTopicComplexity(topicHistory);
  const stat = perTopic.find(t => t.topic === topic);
  const base = stat?.avg ?? 0.5;

  let target = base + PROGRESS_STEP; // nudge upward progressively
  if (typeof lastAskedComplexity === 'number') {
    target = Math.max(target, lastAskedComplexity + PROGRESS_STEP);
  }

  target = Math.min(MAX_COMPLEXITY, Math.max(MIN_COMPLEXITY, target));
  return clamp01(target);
}

// Helper to adapt app's answeredQuestions to engine format
export function adaptAnsweredHistory(answeredQuestions) {
  return (answeredQuestions || []).map(q => {
    // createdAt: prefer timestamp ISO if present; else date string; else Date.now
    let createdAt;
    if (q.timestamp) createdAt = new Date(q.timestamp);
    else if (q.date) createdAt = new Date(`${q.date}T00:00:00Z`);
    else createdAt = new Date();

    return {
      questionId: q.id || `${q.topic}|${q.question?.slice(0, 40) || 'unknown'}`,
      question: q.question,
      signature: q.signature,
      topic: q.topic,
      isCorrect: !!q.isCorrect,
      timeSpentMs: Math.max(0, Number(q.timeTaken || 0) * 1000),
      createdAt
    };
  });
}

export const __complexityTunables = {
  TIME_WEIGHT,
  INCORRECT_WEIGHT,
  MAX_TIME_MULTIPLIER,
  HISTORY_WINDOW,
  PROGRESS_STEP,
  MIN_COMPLEXITY,
  MAX_COMPLEXITY,
};
