/**
 * Quiz-load performance regression suite.
 *
 * For EVERY enabled topic in EVERY enabled grade (read from the content
 * registry, so new topics/grades are covered automatically) this measures the
 * student's "start a new quiz" data path — the same two calls
 * MainApp.startNewQuiz awaits before the first question can render:
 *
 *   getQuestionHistory(uid, topic, legacyHistory)   // adaptivity input
 *   generateQuizQuestions(topic, goals, history, …) // bank fetch + generation
 *
 * Two kinds of budget are enforced:
 *
 * 1. CPU time (real clock, instant network): cold first load (includes the
 *    code-split topic module import), warm reload, and worst-case loops —
 *    every question already mastered, single-subtopic Focus restrictions, a
 *    300-attempt history, and a 200-question class bank.
 *
 * 2. Waiting time (fake clock, simulated network faults): slow network,
 *    requests that never answer, offline, deadline-exceeded retries, and
 *    permission-denied class questions. A student must never wait longer than
 *    the documented timeouts, and the quiz must still open with questions.
 *
 * Firestore is mocked; question generators, the complexity engine, the
 * registry, and both services run for real. Per-topic timings are printed as
 * a table at the end of the run.
 */
import { setImmediate as realSetImmediate } from 'timers';

const mockNetwork = {
  mode: 'fast', // fast | slow | hang | offline | deadline | denied
  latencyMs: 0,
  // Only fault these collection kinds; others answer instantly.
  faultTargets: null, // null = all, or Set of 'history' | 'profile' | 'classQuestions' | 'banks'
  historyDocs: [],
  classQuestionDocs: [],
  requestCount: 0,
};

const mockSnapshot = (docs) => ({
  docs,
  empty: docs.length === 0,
  size: docs.length,
  forEach: (callback) => docs.forEach(callback),
});

const mockTargetOf = (path) => {
  if (path === 'attempts') return 'history';
  if (path === 'profile') return 'profile';
  if (/\/classes\/[^/]+\/questions$/.test(path)) return 'classQuestions';
  return 'banks';
};

const mockRespond = (target, payloadFactory) => {
  mockNetwork.requestCount += 1;
  const faulted = !mockNetwork.faultTargets || mockNetwork.faultTargets.has(target);
  const mode = faulted ? mockNetwork.mode : 'fast';
  switch (mode) {
    case 'slow':
      return new Promise((resolve) => setTimeout(() => resolve(payloadFactory()), mockNetwork.latencyMs));
    case 'hang':
      return new Promise(() => {});
    case 'offline':
      return Promise.reject(Object.assign(
        new Error('Failed to get documents from server. The client is offline.'),
        { code: 'unavailable' }
      ));
    case 'deadline':
      return Promise.reject(Object.assign(new Error('Deadline exceeded'), { code: 'deadline-exceeded' }));
    case 'denied':
      return Promise.reject(Object.assign(
        new Error('Missing or insufficient permissions.'),
        { code: 'permission-denied' }
      ));
    case 'fast':
    default:
      return Promise.resolve(payloadFactory());
  }
};

jest.mock('firebase/firestore', () => ({
  collection: (...segments) => ({ path: segments.slice(1).join('/') }),
  doc: (...segments) => ({ path: segments.slice(1).join('/') }),
  query: (reference, ...constraints) => ({ path: reference.path, constraints }),
  where: (field, operator, value) => ({ field, operator, value }),
  orderBy: (field, direction) => ({ orderBy: field, direction }),
  limit: (count) => ({ limit: count }),
  onSnapshot: () => () => {},
  getDocs: (queryRef) => {
    const target = mockTargetOf(queryRef.path);
    return mockRespond(target, () => {
      if (target === 'history') return mockSnapshot(mockNetwork.historyDocs);
      if (target === 'classQuestions') return mockSnapshot(mockNetwork.classQuestionDocs);
      return mockSnapshot([]);
    });
  },
  getDoc: (docRef) => mockRespond(mockTargetOf(docRef.path), () => ({
    exists: () => false,
    data: () => ({}),
  })),
}));

jest.mock('../firebase', () => ({ db: {} }));

jest.mock('../utils/firebaseHelpers', () => ({
  getUserAttemptsCollectionRef: () => ({ path: 'attempts' }),
  getUserDocRef: () => ({ path: 'profile' }),
}));

jest.mock('../utils/questionCache', () => ({
  getCachedClassQuestions: () => null,
  setCachedClassQuestions: () => {},
}));

const { getAllGrades, getTopicsForGrade } = require('../content/registry');
const { getQuestionHistory, QUESTION_HISTORY_TIMEOUT_MS } = require('../services/questionService');
const {
  generateQuizQuestions,
  QUESTION_BANK_FETCH_TIMEOUT_MS,
} = require('../services/quizGenerationService');

// ---------------------------------------------------------------- budgets ---
// CPU budgets are generous multiples of what a laptop measures so shared CI
// runners don't flake, yet tight enough to catch an accidental O(n²) loop, a
// retry storm, or a generator that spins without producing unique questions.
const QUIZ_LENGTH = 10;
const COLD_LOAD_BUDGET_MS = 1500;
const WARM_LOAD_BUDGET_MS = 250;
const WORST_CASE_LOOP_BUDGET_MS = 750;
const HEAVY_DATA_BUDGET_MS = 750;

// Simulated-time budgets for network faults.
const SLOW_NETWORK_LATENCY_MS = 800;
// Four serial round trips: history → class exact query → class normalized
// fallback scan (when the exact query is empty) → personal + shared banks in
// parallel. Any extra serial request is a regression.
const SLOW_NETWORK_BUDGET_MS = 4 * SLOW_NETWORK_LATENCY_MS;
const OFFLINE_BUDGET_MS = 250;
const HANG_BUDGET_MS = QUESTION_HISTORY_TIMEOUT_MS + QUESTION_BANK_FETCH_TIMEOUT_MS + 250;
const BANK_FAULT_BUDGET_MS = QUESTION_BANK_FETCH_TIMEOUT_MS + 250;

// ---------------------------------------------------------------- helpers ---
const GRADE_TOPICS = getAllGrades().flatMap((grade) =>
  getTopicsForGrade(grade.key).map((topic) => ({ grade: grade.key, topic }))
);
const CASES = GRADE_TOPICS.map(({ grade, topic }) => [`${grade} / ${topic.name}`, grade, topic]);

const timings = new Map(); // "G4 / Geometry" -> { scenario: ms }
const record = (label, scenario, ms) => {
  if (!timings.has(label)) timings.set(label, {});
  timings.get(label)[scenario] = Math.round(ms);
};

const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());

const loadNewQuiz = async (grade, topicName, options = {}) => {
  const history = await getQuestionHistory('student-1', topicName, options.legacyHistory || []);
  return generateQuizQuestions(
    topicName,
    { [topicName]: options.goal || QUIZ_LENGTH },
    history,
    options.difficulty ?? 0.5,
    grade,
    'student-1',
    options.classIds || [],
    [],
    'test-app',
    options.bankProbability ?? 0.7,
    options.allowedSubtopicsByTopic || null,
    options.tagMastery || {},
    options.tagMasteryThreshold ?? 3
  );
};

const timeRealClock = async (fn) => {
  const start = now();
  const value = await fn();
  return { value, ms: now() - start };
};

const flushMicrotasks = () => new Promise((resolve) => realSetImmediate(resolve));

// Runs `fn` under jest fake timers, advancing the clock in small steps until
// the promise settles. Returns the simulated milliseconds a student would
// have waited, or `settled: false` if it never finished within `maxMs`.
const timeFakeClock = async (fn, { stepMs = 50, maxMs = 30000 } = {}) => {
  jest.useFakeTimers();
  try {
    let settled = false;
    let value;
    let error;
    fn().then(
      (result) => { settled = true; value = result; },
      (err) => { settled = true; error = err; }
    );
    await flushMicrotasks();
    let elapsed = 0;
    while (!settled && elapsed < maxMs) {
      jest.advanceTimersByTime(stepMs);
      elapsed += stepMs;
      // eslint-disable-next-line no-await-in-loop
      await flushMicrotasks();
    }
    return { settled, value, error, simulatedMs: elapsed };
  } finally {
    jest.useRealTimers();
  }
};

const buildHistoryDocs = (generateQuestion, topicName, count) =>
  Array.from({ length: count }, (_, i) => {
    const q = generateQuestion(Math.random(), null);
    return {
      id: `attempt-${i}`,
      data: () => ({
        question: q.question,
        correctAnswer: q.correctAnswer,
        topic: topicName,
        subtopic: q.subtopic,
        isCorrect: i % 3 !== 0,
        timeTaken: 5 + (i % 20),
        timestamp: new Date(Date.UTC(2026, 0, 1, 0, i)).toISOString(),
      }),
    };
  });

const buildClassQuestionDocs = (generateQuestion, topicName, grade, count) =>
  Array.from({ length: count }, (_, i) => {
    const q = generateQuestion(Math.random(), null);
    return {
      id: `bank-${i}`,
      data: () => ({ ...q, topic: topicName, grade }),
    };
  });

const resetNetwork = () => {
  mockNetwork.mode = 'fast';
  mockNetwork.latencyMs = 0;
  mockNetwork.faultTargets = null;
  mockNetwork.historyDocs = [];
  mockNetwork.classQuestionDocs = [];
  mockNetwork.requestCount = 0;
};

const expectPlayableQuiz = (questions) => {
  expect(Array.isArray(questions)).toBe(true);
  expect(questions.length).toBeGreaterThan(0);
  questions.forEach((q) => {
    expect(typeof q.question).toBe('string');
    expect(q.question.length).toBeGreaterThan(0);
  });
};

// ------------------------------------------------------------------ suite ---
jest.setTimeout(60000);

let consoleSpies = [];
beforeAll(() => {
  // questionService logs every fetch step; keep CI output readable.
  consoleSpies = ['log', 'warn', 'error'].map((method) =>
    jest.spyOn(console, method).mockImplementation(() => {})
  );
});

afterAll(() => {
  consoleSpies.forEach((spy) => spy.mockRestore());
  const scenarios = Array.from(
    new Set(Array.from(timings.values()).flatMap((row) => Object.keys(row)))
  );
  const header = ['topic', ...scenarios];
  const rows = Array.from(timings.entries()).map(([label, row]) => [
    label,
    ...scenarios.map((scenario) => (row[scenario] === undefined ? '-' : String(row[scenario]))),
  ]);
  const widths = header.map((h, i) => Math.max(h.length, ...rows.map((r) => r[i].length)));
  const line = (cells) => cells.map((cell, i) => cell.padEnd(widths[i])).join('  ');
  // eslint-disable-next-line no-console
  console.log([
    'Quiz load timings in ms (cpu: real clock; net-*: simulated wait)',
    line(header),
    ...rows.map(line),
  ].join('\n'));
});

beforeEach(resetNetwork);

test('covers every enabled topic in every enabled grade', () => {
  const grades = getAllGrades().map((g) => g.key);
  expect(grades.length).toBeGreaterThan(0);
  grades.forEach((grade) => {
    expect(GRADE_TOPICS.filter((entry) => entry.grade === grade).length).toBeGreaterThan(0);
  });
});

describe('CPU time — instant network', () => {
  test.each(CASES)('%s: cold and warm new-quiz load stay within budget', async (label, grade, topic) => {
    const cold = await timeRealClock(() => loadNewQuiz(grade, topic.name));
    record(label, 'cpu-cold', cold.ms);
    expect(cold.value).toHaveLength(QUIZ_LENGTH);
    expect(cold.ms).toBeLessThan(COLD_LOAD_BUDGET_MS);

    const warmRuns = [];
    for (let i = 0; i < 5; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      const warm = await timeRealClock(() => loadNewQuiz(grade, topic.name));
      expect(warm.value).toHaveLength(QUIZ_LENGTH);
      warmRuns.push(warm.ms);
    }
    const warmMedian = warmRuns.sort((a, b) => a - b)[2];
    record(label, 'cpu-warm', warmMedian);
    expect(warmMedian).toBeLessThan(WARM_LOAD_BUDGET_MS);
  });

  test.each(CASES)('%s: every question already mastered exits the retry loop quickly', async (label, grade, topic) => {
    // Threshold 0 retires every generated question, forcing the generation
    // loop to exhaust its attempt budget — the worst case for a student who
    // has mastered a thin topic.
    const { value, ms } = await timeRealClock(() =>
      loadNewQuiz(grade, topic.name, { tagMasteryThreshold: 0, goal: 20 })
    );
    record(label, 'cpu-all-mastered', ms);
    expect(Array.isArray(value)).toBe(true);
    expect(ms).toBeLessThan(WORST_CASE_LOOP_BUDGET_MS);
  });

  test.each(CASES)('%s: single-subtopic Focus restrictions stay within budget', async (label, grade, topic) => {
    let slowest = 0;
    for (const subtopic of topic.subtopics) {
      // eslint-disable-next-line no-await-in-loop
      const { value, ms } = await timeRealClock(() =>
        loadNewQuiz(grade, topic.name, {
          allowedSubtopicsByTopic: { [topic.name]: [subtopic] },
        })
      );
      expect(Array.isArray(value)).toBe(true);
      value.forEach((q) => expect(q.subtopic).toBe(subtopic));
      slowest = Math.max(slowest, ms);
      expect(ms).toBeLessThan(WORST_CASE_LOOP_BUDGET_MS);
    }
    record(label, 'cpu-focus-max', slowest);
  });

  test.each(CASES)('%s: 300-attempt history and a 200-question class bank stay within budget', async (label, grade, topic) => {
    const generateQuestion = await topic.loadGenerateQuestion();
    mockNetwork.historyDocs = buildHistoryDocs(generateQuestion, topic.name, 300);
    mockNetwork.classQuestionDocs = buildClassQuestionDocs(generateQuestion, topic.name, grade, 200);

    const { value, ms } = await timeRealClock(() =>
      loadNewQuiz(grade, topic.name, { classIds: ['class-1'], bankProbability: 1 })
    );
    record(label, 'cpu-heavy', ms);
    expectPlayableQuiz(value);
    expect(ms).toBeLessThan(HEAVY_DATA_BUDGET_MS);
  });
});

describe('Waiting time — simulated network faults', () => {
  test.each(CASES)('%s: slow network (800 ms per request) opens within budget', async (label, grade, topic) => {
    await topic.loadGenerateQuestion();
    mockNetwork.mode = 'slow';
    mockNetwork.latencyMs = SLOW_NETWORK_LATENCY_MS;

    const result = await timeFakeClock(() => loadNewQuiz(grade, topic.name, { classIds: ['class-1'] }));
    record(label, 'net-slow', result.simulatedMs);
    expect(result.settled).toBe(true);
    expect(result.error).toBeUndefined();
    expectPlayableQuiz(result.value);
    expect(result.simulatedMs).toBeLessThanOrEqual(SLOW_NETWORK_BUDGET_MS);
  });

  test.each(CASES)('%s: requests that never answer cannot hang the quiz', async (label, grade, topic) => {
    await topic.loadGenerateQuestion();
    mockNetwork.mode = 'hang';

    const result = await timeFakeClock(() => loadNewQuiz(grade, topic.name, { classIds: ['class-1'] }));
    record(label, 'net-hang', result.simulatedMs);
    expect(result.settled).toBe(true);
    expect(result.error).toBeUndefined();
    expectPlayableQuiz(result.value);
    expect(result.simulatedMs).toBeLessThanOrEqual(HANG_BUDGET_MS);
  });

  test.each(CASES)('%s: offline falls back to generated questions immediately', async (label, grade, topic) => {
    await topic.loadGenerateQuestion();
    mockNetwork.mode = 'offline';

    const result = await timeFakeClock(() => loadNewQuiz(grade, topic.name, { classIds: ['class-1'] }));
    record(label, 'net-offline', result.simulatedMs);
    expect(result.settled).toBe(true);
    expect(result.error).toBeUndefined();
    expectPlayableQuiz(result.value);
    expect(result.simulatedMs).toBeLessThanOrEqual(OFFLINE_BUDGET_MS);
  });

  test.each(CASES)('%s: deadline-exceeded retries are capped by the bank timeout', async (label, grade, topic) => {
    await topic.loadGenerateQuestion();
    mockNetwork.mode = 'deadline';

    const result = await timeFakeClock(() => loadNewQuiz(grade, topic.name, { classIds: ['class-1'] }));
    record(label, 'net-deadline', result.simulatedMs);
    expect(result.settled).toBe(true);
    expect(result.error).toBeUndefined();
    expectPlayableQuiz(result.value);
    expect(result.simulatedMs).toBeLessThanOrEqual(BANK_FAULT_BUDGET_MS);
  });

  test.each(CASES)('%s: permission-denied class questions still open a generated quiz', async (label, grade, topic) => {
    await topic.loadGenerateQuestion();
    mockNetwork.mode = 'denied';
    mockNetwork.faultTargets = new Set(['classQuestions']);

    const result = await timeFakeClock(() => loadNewQuiz(grade, topic.name, { classIds: ['class-1'] }));
    record(label, 'net-denied', result.simulatedMs);
    expect(result.settled).toBe(true);
    expect(result.error).toBeUndefined();
    expectPlayableQuiz(result.value);
    expect(result.simulatedMs).toBeLessThanOrEqual(BANK_FAULT_BUDGET_MS);
  });

  test('MainApp.startNewQuiz does not await Firestore writes before generating questions', () => {
    // Static guard (MainApp is too large to mount here): write promises
    // resolve only on server ack, so an awaited write on the quiz-start path
    // stalls the quiz on flaky connections.
    // eslint-disable-next-line global-require
    const fs = require('fs');
    // eslint-disable-next-line global-require
    const path = require('path');
    const source = fs.readFileSync(path.join(__dirname, '..', 'MainApp.js'), 'utf8');
    const start = source.indexOf('const startNewQuiz = async');
    const end = source.indexOf('generateQuizQuestions(', start);
    expect(start).toBeGreaterThan(-1);
    expect(end).toBeGreaterThan(start);
    const criticalPath = source.slice(start, end);
    expect(criticalPath).not.toMatch(/await\s+(updateDoc|setDoc|addDoc|deleteDoc|writeBatch)/);
  });

  test('a 100% question-bank class that times out still opens a generated quiz', async () => {
    const { grade, topic } = GRADE_TOPICS[0];
    await topic.loadGenerateQuestion();
    mockNetwork.mode = 'hang';
    mockNetwork.faultTargets = new Set(['classQuestions', 'banks']);

    const result = await timeFakeClock(() =>
      loadNewQuiz(grade, topic.name, { classIds: ['class-1'], bankProbability: 1 })
    );
    expect(result.settled).toBe(true);
    expectPlayableQuiz(result.value);
    expect(result.simulatedMs).toBeLessThanOrEqual(BANK_FAULT_BUDGET_MS);
  });
});
