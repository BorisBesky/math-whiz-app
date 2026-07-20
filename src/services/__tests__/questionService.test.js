const mockGetDocs = jest.fn();
const mockGetDoc = jest.fn();
const mockQuery = jest.fn((reference, ...constraints) => ({ reference, constraints }));
const mockWhere = jest.fn((field, operator, value) => ({ field, operator, value }));
const mockOrderBy = jest.fn((field, direction) => ({ orderBy: field, direction }));
const mockLimit = jest.fn((count) => ({ limit: count }));
const mockCollection = jest.fn((...segments) => ({ segments }));
const mockDoc = jest.fn((...segments) => ({ segments }));
const mockGetUserAttemptsCollectionRef = jest.fn();
const mockGetUserDocRef = jest.fn();
const mockGetCachedClassQuestions = jest.fn();
const mockSetCachedClassQuestions = jest.fn();
const mockIsSubtopicAllowed = jest.fn();

jest.mock('firebase/firestore', () => ({
  collection: (...args) => mockCollection(...args),
  query: (...args) => mockQuery(...args),
  where: (...args) => mockWhere(...args),
  orderBy: (...args) => mockOrderBy(...args),
  limit: (...args) => mockLimit(...args),
  getDocs: (...args) => mockGetDocs(...args),
  getDoc: (...args) => mockGetDoc(...args),
  doc: (...args) => mockDoc(...args),
}));

jest.mock('../../firebase', () => ({ db: { name: 'test-db' } }));

jest.mock('../../utils/firebaseHelpers', () => ({
  getUserAttemptsCollectionRef: (...args) => mockGetUserAttemptsCollectionRef(...args),
  getUserDocRef: (...args) => mockGetUserDocRef(...args),
}));

jest.mock('../../utils/questionCache', () => ({
  getCachedClassQuestions: (...args) => mockGetCachedClassQuestions(...args),
  setCachedClassQuestions: (...args) => mockSetCachedClassQuestions(...args),
}));

jest.mock('../../utils/subtopicUtils', () => ({
  isSubtopicAllowed: (...args) => mockIsSubtopicAllowed(...args),
}));

jest.mock('../../content/registry', () => ({
  gradeWordPattern: () => '(?:grade\\s*)?[345](?:st|nd|rd|th)?',
  normalizeGradeKey: (value) => value,
}));

const {
  fetchQuestionsFromFirestore,
  getQuestionHistory,
} = require('../questionService');

const makeSnapshot = (documents) => ({
  docs: documents,
  empty: documents.length === 0,
  size: documents.length,
  forEach: (callback) => documents.forEach(callback),
});

const makeDocument = (id, data) => ({
  id,
  data: () => data,
});

describe('questionService quiz-loading performance', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockQuery.mockImplementation((reference, ...constraints) => ({ reference, constraints }));
    mockWhere.mockImplementation((field, operator, value) => ({ field, operator, value }));
    mockOrderBy.mockImplementation((field, direction) => ({ orderBy: field, direction }));
    mockLimit.mockImplementation((count) => ({ limit: count }));
    mockCollection.mockImplementation((...segments) => ({ segments }));
    mockDoc.mockImplementation((...segments) => ({ segments }));
    mockGetUserAttemptsCollectionRef.mockReturnValue({ path: 'attempts' });
    mockGetUserDocRef.mockReturnValue({ path: 'profile' });
    mockGetCachedClassQuestions.mockReturnValue(null);
    mockIsSubtopicAllowed.mockReturnValue(true);
  });

  test('loads only the selected topic history when a topic is provided', async () => {
    mockGetDocs.mockResolvedValueOnce(makeSnapshot([
      makeDocument('attempt-2', { topic: 'Base Ten', timestamp: '2026-07-02T00:00:00Z' }),
      makeDocument('attempt-1', { topic: 'Base Ten', timestamp: '2026-07-01T00:00:00Z' }),
    ]));

    const history = await getQuestionHistory('student-1', 'Base Ten');

    expect(mockWhere).toHaveBeenCalledWith('topic', '==', 'Base Ten');
    expect(mockOrderBy).toHaveBeenCalledWith('timestamp', 'desc');
    expect(mockLimit).toHaveBeenCalledWith(300);
    expect(mockQuery).toHaveBeenCalledWith(
      { path: 'attempts' },
      { field: 'topic', operator: '==', value: 'Base Ten' },
      { orderBy: 'timestamp', direction: 'desc' },
      { limit: 300 }
    );
    expect(history.map((attempt) => attempt.id)).toEqual(['attempt-1', 'attempt-2']);
    expect(mockGetDoc).not.toHaveBeenCalled();
  });

  test('bounds the unfiltered history read used by the dashboard fallback', async () => {
    mockGetDocs.mockResolvedValueOnce(makeSnapshot([
      makeDocument('attempt-1', { topic: 'Base Ten', timestamp: '2026-07-01T00:00:00Z' }),
    ]));

    await getQuestionHistory('student-1');

    expect(mockWhere).not.toHaveBeenCalled();
    expect(mockQuery).toHaveBeenCalledWith(
      { path: 'attempts' },
      { orderBy: 'timestamp', direction: 'desc' },
      { limit: 300 }
    );
  });

  test('uses the already-loaded legacy history without another profile read', async () => {
    mockGetDocs.mockResolvedValueOnce(makeSnapshot([]));

    const history = await getQuestionHistory('student-1', 'Base Ten', [
      { id: 'base-ten-attempt', topic: 'Base Ten' },
      { id: 'fractions-attempt', topic: 'Fractions 4th' },
    ]);

    expect(history).toEqual([{ id: 'base-ten-attempt', topic: 'Base Ten' }]);
    expect(mockGetDoc).not.toHaveBeenCalled();
  });

  test('hydrates a repeated shared reference once and skips unused banks when the class pool is sufficient', async () => {
    const sharedReference = 'artifacts/test-app/sharedQuestionBank/shared-1';
    mockGetDocs.mockResolvedValueOnce(makeSnapshot([
      makeDocument('class-question-1', {
        topic: 'Base Ten',
        grade: 'G4',
        question: 'Question 1',
        questionBankRef: sharedReference,
      }),
      makeDocument('class-question-2', {
        topic: 'Base Ten',
        grade: 'G4',
        question: 'Question 2',
        questionBankRef: sharedReference,
      }),
    ]));
    mockGetDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({
        subtopic: 'place value',
        operation: 'place-value',
        tags: ['place-value'],
      }),
    });

    const questions = await fetchQuestionsFromFirestore(
      'Base Ten',
      'G4',
      'student-1',
      'class-1',
      [],
      'test-app',
      null,
      1
    );

    expect(questions).toHaveLength(2);
    expect(mockGetDoc).toHaveBeenCalledTimes(1);
    expect(mockGetDocs).toHaveBeenCalledTimes(1);
    expect(mockSetCachedClassQuestions).toHaveBeenCalledWith(
      'class-1',
      'Base Ten',
      'G4',
      'test-app',
      expect.arrayContaining([
        expect.objectContaining({ subtopic: 'place value', tags: ['place-value'] }),
      ])
    );
  });

  test('starts personal and shared question-bank reads in parallel', async () => {
    let resolveUserQuestions;
    let resolveSharedQuestions;
    const userQuestions = new Promise((resolve) => { resolveUserQuestions = resolve; });
    const sharedQuestions = new Promise((resolve) => { resolveSharedQuestions = resolve; });
    mockGetDocs
      .mockReturnValueOnce(userQuestions)
      .mockReturnValueOnce(sharedQuestions);

    const resultPromise = fetchQuestionsFromFirestore(
      'Multiplication',
      'G3',
      'student-1',
      null,
      [],
      'test-app'
    );

    expect(mockGetDocs).toHaveBeenCalledTimes(2);
    resolveUserQuestions(makeSnapshot([]));
    resolveSharedQuestions(makeSnapshot([]));
    const questions = await resultPromise;
    expect(questions).toHaveLength(0);
    expect(questions.errors).toEqual({});
  });
});
