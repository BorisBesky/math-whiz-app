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
  TOPIC_CONTENT_MAP: { Geometry: ['g4', 'geometry'] },
}));

jest.mock('../../utils/subtopicUtils', () => ({
  isSubtopicAllowed: (...args) => mockIsSubtopicAllowed(...args),
}));

jest.mock('../questionService', () => ({
  fetchQuestionsFromFirestore: (...args) => mockFetchFirestore(...args),
}));

jest.mock('../../content', () => ({
  __esModule: true,
  default: {
    getTopic: () => ({ loadGenerateQuestion: async () => mockGenerate }),
  },
}));

const { generateQuizQuestions } = require('../quizGenerationService');

const run = (over = {}) => generateQuizQuestions(
  'Geometry',
  { Geometry: 1 }, // dailyGoals → 1 question
  [], // questionHistory
  0.5, // difficulty
  'G3', // grade kept non-G4 so refreshQuestionImages is a no-op
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
