import { getQuestionMasteryKey } from '../../utils/questionKey';

// A single generated question the stub generator always returns.
const GEN_QUESTION = {
  question: 'What is an exact location with no size?',
  correctAnswer: 'point',
  options: ['point', 'line', 'ray', 'segment'],
  questionType: 'multiple-choice',
  subtopic: 'lines and angles',
};

// Module-level mock fns; implementations are (re)set in beforeEach because CRA's Jest
// config resets mock implementations between tests.
const mockGenerate = jest.fn();
const mockFetchFirestore = jest.fn();
const mockAdapt = jest.fn();
const mockRank = jest.fn();
const mockIsSubtopicAllowed = jest.fn();

jest.mock('../../utils/complexityEngine', () => ({
  adaptAnsweredHistory: (...args) => mockAdapt(...args),
  rankQuestionsByComplexity: (...args) => mockRank(...args),
}));

jest.mock('../../constants/appConstants', () => ({
  DEFAULT_DAILY_GOAL: 1,
}));

jest.mock('../../utils/subtopicUtils', () => ({
  isSubtopicAllowed: (...args) => mockIsSubtopicAllowed(...args),
}));

jest.mock('../questionService', () => ({
  fetchQuestionsFromFirestore: (...args) => mockFetchFirestore(...args),
}));

jest.mock('../../content/registry', () => ({
  getDefaultGradeKey: () => 'G3',
  getTopicContent: () => ({ loadGenerateQuestion: async () => mockGenerate }),
  prepareQuestionForDisplay: async (topic, question) => question,
}));

const { generateQuizQuestions, isMultipleChoiceAnswerable } = require('../quizGenerationService');

const run = (over = {}) => generateQuizQuestions(
  'Geometry',
  { Geometry: 1 }, // dailyGoals → 1 question
  [], // questionHistory
  0.5, // difficulty
  'G3', // grade (display hooks are identity in this test's registry mock)
  'student-1',
  ['class-1'],
  [], // answeredQuestionIds
  'app-1',
  0, // questionBankProbability → always use the generated pool
  null, // allowedSubtopicsByTopic
  over.tagMastery || {},
  over.tagMasteryThreshold ?? 3,
);

describe('generateQuizQuestions — generated-question retirement', () => {
  let randomSpy;
  beforeEach(() => {
    mockGenerate.mockImplementation(() => ({ ...GEN_QUESTION }));
    mockFetchFirestore.mockResolvedValue([]);
    mockAdapt.mockReturnValue([]);
    mockRank.mockReturnValue([]);
    mockIsSubtopicAllowed.mockReturnValue(true);
    // Make probabilistic acceptance deterministic (always accept).
    randomSpy = jest.spyOn(Math, 'random').mockReturnValue(0);
  });
  afterEach(() => {
    randomSpy.mockRestore();
    jest.clearAllMocks();
  });

  test('serves the generated question when it is below the mastery threshold', async () => {
    const questions = await run({ tagMastery: {}, tagMasteryThreshold: 3 });
    expect(questions).toHaveLength(1);
    expect(questions[0].question).toBe(GEN_QUESTION.question);
  });

  test('retires the generated question once its mastery count reaches the threshold', async () => {
    const key = getQuestionMasteryKey(GEN_QUESTION);
    const questions = await run({ tagMastery: { [key]: 3 }, tagMasteryThreshold: 3 });
    // The only available question is retired → none returned (previously it would repeat).
    expect(questions).toHaveLength(0);
  });

  test('a higher threshold keeps the question in rotation', async () => {
    const key = getQuestionMasteryKey(GEN_QUESTION);
    const questions = await run({ tagMastery: { [key]: 3 }, tagMasteryThreshold: 5 });
    expect(questions).toHaveLength(1);
  });
});

describe('isMultipleChoiceAnswerable', () => {
  test('accepts an MC question whose options contain the correct answer', () => {
    expect(isMultipleChoiceAnswerable(GEN_QUESTION)).toBe(true);
  });

  test('rejects an MC question whose correct answer is not among the options', () => {
    // e.g. "What is 4 × 2/10?" with a hallucinated/bad option set that omits 4/5.
    expect(isMultipleChoiceAnswerable({
      question: 'What is 4 × 2/10?',
      correctAnswer: '4/5',
      options: ['2/10', '6/10', '4/10', '2/5'],
    })).toBe(false);
  });

  test('compares as strings so number-vs-string does not false-positive', () => {
    expect(isMultipleChoiceAnswerable({ correctAnswer: 12, options: ['6', '12', '18', '24'] })).toBe(true);
    expect(isMultipleChoiceAnswerable({ correctAnswer: '12', options: [6, 12, 18, 24] })).toBe(true);
  });

  test('exempts questions with no options list (fill-in / drawing)', () => {
    expect(isMultipleChoiceAnswerable({ correctAnswer: '42', options: [] })).toBe(true);
    expect(isMultipleChoiceAnswerable({ correctAnswer: '42' })).toBe(true);
  });

  test('rejects an options-bearing question with a missing correct answer', () => {
    expect(isMultipleChoiceAnswerable({ correctAnswer: '', options: ['a', 'b'] })).toBe(false);
  });
});

describe('generateQuizQuestions — hot-loop allocation guards', () => {
  // These tests pin the two perf fixes that keep "Start quiz" latency flat
  // when the retry loop runs many candidates (focused student, high mastery,
  // narrow allowed-subtopic set). A regression here is invisible to
  // correctness tests but shows up as a slower first question.
  let randomSpy;
  const mockLoadGenerateQuestion = jest.fn();

  beforeEach(() => {
    // Rebuild the registry mock so we can count `loadGenerateQuestion` /
    // `prepareQuestionForDisplay` calls per run.
    jest.resetModules();
    mockLoadGenerateQuestion.mockReset();
    mockLoadGenerateQuestion.mockResolvedValue(mockGenerate);
    mockFetchFirestore.mockReset();
    mockFetchFirestore.mockResolvedValue([]);
    mockAdapt.mockReset();
    mockAdapt.mockReturnValue([]);
    mockRank.mockReset();
    mockRank.mockReturnValue([]);
    mockIsSubtopicAllowed.mockReset();
    mockIsSubtopicAllowed.mockReturnValue(true);
    randomSpy = jest.spyOn(Math, 'random').mockReturnValue(0);
  });
  afterEach(() => {
    randomSpy.mockRestore();
    jest.clearAllMocks();
  });

  test('loadGenerateQuestion is awaited ONCE per quiz, not once per attempt', async () => {
    const prepareSpy = jest.fn(async (_topic, q) => q);
    jest.doMock('../../content/registry', () => ({
      getDefaultGradeKey: () => 'G3',
      getTopicContent: () => ({ loadGenerateQuestion: mockLoadGenerateQuestion }),
      prepareQuestionForDisplay: prepareSpy,
    }));
    const { generateQuizQuestions: isolatedGenerate } = require('../quizGenerationService');

    // Ask for 5 questions and let the generator return a fresh question each
    // call. If loadGenerateQuestion were still inside the while-loop, the
    // mock would log once per attempt (≥5).
    let counter = 0;
    mockGenerate.mockImplementation(() => ({
      ...GEN_QUESTION,
      question: `${GEN_QUESTION.question} #${counter++}`,
    }));

    const questions = await isolatedGenerate(
      'Geometry', { Geometry: 5 }, [], 0.5, 'G3',
      'student-1', ['class-1'], [], 'app-1', 0, null, {}, 3,
    );

    expect(questions).toHaveLength(5);
    expect(mockLoadGenerateQuestion).toHaveBeenCalledTimes(1);
  });

  test('prepareQuestionForDisplay is only applied to KEPT questions, not every candidate', async () => {
    const prepareSpy = jest.fn(async (_topic, q) => q);
    jest.doMock('../../content/registry', () => ({
      getDefaultGradeKey: () => 'G3',
      getTopicContent: () => ({ loadGenerateQuestion: mockLoadGenerateQuestion }),
      prepareQuestionForDisplay: prepareSpy,
    }));
    const { generateQuizQuestions: isolatedGenerate } = require('../quizGenerationService');

    // Each draw is a UNIQUE candidate so the usedQuestions set never blocks a
    // retry. The subtopic gate rejects half of them: 2 asked, 4 draws total
    // (accept, reject, accept, reject...), so prepareQuestionForDisplay must
    // run exactly 2 times — once per KEPT question. If the pre-fix behavior
    // regressed (prep before accept), the spy would record 4+ calls.
    let draw = 0;
    mockGenerate.mockImplementation(() => {
      const index = draw;
      draw += 1;
      return {
        ...GEN_QUESTION,
        question: `uniq#${index}`,
        correctAnswer: `a${index}`,
        options: [`a${index}`, 'b', 'c', 'd'],
      };
    });

    // Accept every other candidate: gateCall even → true, odd → false.
    let gateCall = 0;
    mockIsSubtopicAllowed.mockImplementation(() => {
      const allowed = gateCall % 2 === 0;
      gateCall += 1;
      return allowed;
    });

    const questions = await isolatedGenerate(
      'Geometry', { Geometry: 2 }, [], 0.5, 'G3',
      'student-1', ['class-1'], [], 'app-1', 0, null, {}, 3,
    );

    expect(questions.length).toBe(2);
    // Hook invoked exactly `questions.length` times — never for a rejected draw.
    expect(prepareSpy).toHaveBeenCalledTimes(2);
    // Sanity: the subtopic gate was called more times than the hook — the
    // rejected candidates DID exist, we just skipped the expensive prep.
    expect(gateCall).toBeGreaterThan(prepareSpy.mock.calls.length);
  });
});

describe('generateQuizQuestions — unanswerable-question safety net', () => {
  let randomSpy;
  beforeEach(() => {
    mockFetchFirestore.mockResolvedValue([]);
    mockAdapt.mockReturnValue([]);
    mockRank.mockReturnValue([]);
    mockIsSubtopicAllowed.mockReturnValue(true);
    randomSpy = jest.spyOn(Math, 'random').mockReturnValue(0);
  });
  afterEach(() => {
    randomSpy.mockRestore();
    jest.clearAllMocks();
  });

  test('skips a generated MC question whose correct answer is not among its options', async () => {
    mockGenerate.mockImplementation(() => ({
      question: 'What is 4 × 2/10?',
      correctAnswer: '4/5',
      options: ['2/10', '6/10', '4/10', '2/5'], // no 4/5 → unanswerable
      questionType: 'multiple-choice',
      subtopic: 'multiplication',
    }));
    const questions = await run();
    expect(questions).toHaveLength(0);
  });

  test('serves the question once its options include the correct answer', async () => {
    mockGenerate.mockImplementation(() => ({
      question: 'What is 4 × 2/10?',
      correctAnswer: '4/5',
      options: ['4/5', '3/5', '9/10', '8/11'],
      questionType: 'multiple-choice',
      subtopic: 'multiplication',
    }));
    const questions = await run();
    expect(questions).toHaveLength(1);
    expect(questions[0].options).toContain('4/5');
  });
});
