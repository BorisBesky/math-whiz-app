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
