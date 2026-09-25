/**
 * Quiz-generation performance regression guard.
 *
 * Every registered topic exposes a `generateQuestion(difficulty, allowedSubtopics)`
 * that the quiz pipeline calls once per question at quiz start (see
 * `src/services/quizGenerationService.js`). A generator that quietly becomes
 * much slower — an accidental O(n²) loop, an unbounded retry, an SVG rebuilt
 * on every draw — degrades the student's "Start quiz" latency without failing
 * any correctness test. This suite measures the per-question generation time
 * for each topic (including its display hook, e.g. geometry's diagram rebuild)
 * and fails when it blows past a generous budget.
 *
 * Making it robust across wildly different CI hardware without going flaky:
 *   - A fixed synthetic calibration loop runs first and yields a `speedFactor`
 *     relative to the machine this budget was tuned on. Slower runners get a
 *     proportionally larger budget; faster runners are never held to a TIGHTER
 *     budget than the reference (speedFactor is clamped to >= 1), so a fast box
 *     can't make the suite flaky.
 *   - Each topic's time is the MEDIAN of several batches, so a single GC pause
 *     mid-batch doesn't fail the run.
 *   - Budgets sit ~10-15x above observed timings. This guard is meant to catch
 *     order-of-magnitude regressions, not micro-optimizations.
 *
 * A new topic folder is covered automatically (it inherits DEFAULT_BUDGET_MS).
 * If a topic is legitimately heavier, add an entry to BUDGET_OVERRIDES_MS
 * rather than weakening the default.
 */
import content from '../index';

const DIFFICULTIES = [0, 0.25, 0.5, 0.75, 1];

// Batches per topic (median resists GC spikes) and questions per batch.
const BATCHES = 5;
const BATCH_SIZE = 400;
const WARMUP = 100;

// Reference calibration time (ms) for CALIBRATION_ITERATIONS on the machine
// these budgets were tuned on. speedFactor = machineCalibration / this.
const CALIBRATION_ITERATIONS = 1_500_000;
const REFERENCE_CALIBRATION_MS = 165;
// Never tighten below the reference (avoids flakes on fast machines); never
// loosen by more than 25x (a machine that slow would have other problems).
const MIN_SPEED_FACTOR = 1;
const MAX_SPEED_FACTOR = 25;

// Per-question budget in ms, at reference machine speed. Observed timings on
// the reference machine are ~0.005-0.08 ms/question, so these leave >10x room.
const DEFAULT_BUDGET_MS = 0.75;
const BUDGET_OVERRIDES_MS = {
  // Measurement & Data builds clock SVGs and line-plot data — the heaviest
  // generators in the suite (~0.06-0.08 ms/question observed).
  'g4/measurement-data': 1.25,
  'g5/measurement-data': 1.25,
  // Geometry rebuilds angle-addition diagrams via its display hook.
  'g4/geometry': 1.0,
  'g5/geometry': 1.0,
};

// Absolute catastrophe backstop (unscaled): even on a very slow runner, no
// single question should take this long. Catches infinite-ish retry loops.
const HARD_CEILING_MS = 40;

const measureCalibration = () => {
  const run = () => {
    const start = performance.now();
    let acc = 0;
    for (let i = 0; i < CALIBRATION_ITERATIONS; i++) {
      acc += Math.sqrt(i * 1.000001) % 7;
    }
    // Guard against dead-code elimination of the loop.
    if (acc === Infinity) throw new Error('unreachable');
    return performance.now() - start;
  };
  run(); // warm
  const samples = [run(), run(), run()].sort((a, b) => a - b);
  return samples[1]; // median of 3
};

const median = (values) => {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
};

// Median per-question time (ms) for one topic, generating a displayable
// question the same way the quiz pipeline does: generate + prepareForDisplay.
const measureTopic = (generateQuestion, prepareForDisplay) => {
  const generateOne = (i) => {
    const q = generateQuestion(DIFFICULTIES[i % DIFFICULTIES.length], null);
    if (prepareForDisplay && q) prepareForDisplay(q);
    return q;
  };

  for (let i = 0; i < WARMUP; i++) generateOne(i);

  const perQuestion = [];
  for (let b = 0; b < BATCHES; b++) {
    const start = performance.now();
    for (let i = 0; i < BATCH_SIZE; i++) generateOne(i);
    perQuestion.push((performance.now() - start) / BATCH_SIZE);
  }
  return median(perQuestion);
};

const topics = [];
content.grades.forEach((grade) => {
  grade.topics.forEach((topic) => {
    topics.push({ key: `${grade.id}/${topic.id}`, topic });
  });
});

describe('quiz-generation performance', () => {
  let speedFactor = 1;
  const timings = new Map(); // key -> { perQ, budget }

  beforeAll(async () => {
    const calibrationMs = measureCalibration();
    speedFactor = Math.min(
      MAX_SPEED_FACTOR,
      Math.max(MIN_SPEED_FACTOR, calibrationMs / REFERENCE_CALIBRATION_MS)
    );

    for (const { key, topic } of topics) {
      const generateQuestion = await topic.loadGenerateQuestion();
      const hooks = topic.loadQuestionHooks ? await topic.loadQuestionHooks() : null;
      const prepareForDisplay =
        hooks && typeof hooks.prepareForDisplay === 'function' ? hooks.prepareForDisplay : null;

      const perQ = measureTopic(generateQuestion, prepareForDisplay);
      const budget = (BUDGET_OVERRIDES_MS[key] || DEFAULT_BUDGET_MS) * speedFactor;
      timings.set(key, { perQ, budget });
    }

    // Visibility: a sortable table so a human can spot relative drift even when
    // every topic is still under budget.
    const rows = [...timings.entries()]
      .map(([key, { perQ, budget }]) => ({
        topic: key,
        perQuestionMs: Number(perQ.toFixed(4)),
        budgetMs: Number(budget.toFixed(3)),
        headroomX: Number((budget / perQ).toFixed(1)),
      }))
      .sort((a, b) => b.perQuestionMs - a.perQuestionMs);
    // eslint-disable-next-line no-console
    console.log(
      `quiz-generation timing (speedFactor ${speedFactor.toFixed(2)}):\n` +
        JSON.stringify(rows, null, 2)
    );
  });

  test('every topic is measured', () => {
    expect(timings.size).toBe(topics.length);
    expect(topics.length).toBeGreaterThan(0);
  });

  test.each(topics.map(({ key }) => key))(
    '%s generates each question well under budget',
    (key) => {
      const { perQ, budget } = timings.get(key);
      // Absolute backstop first: catches a runaway loop regardless of budget math.
      expect(perQ).toBeLessThan(HARD_CEILING_MS);
      // Scaled budget: the actual regression guard.
      expect(perQ).toBeLessThan(budget);
    }
  );
});
