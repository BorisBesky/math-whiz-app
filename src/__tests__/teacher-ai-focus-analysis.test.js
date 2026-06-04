const mockVerifyIdToken = jest.fn();
const mockDoc = jest.fn();
const mockGenerateContentWithRetry = jest.fn();
const mockGetGenerativeModel = jest.fn(() => ({ mocked: true }));

jest.mock('../../netlify/functions/firebase-admin', () => ({
  admin: {
    auth: () => ({
      verifyIdToken: (...args) => mockVerifyIdToken(...args),
    }),
    firestore: {
      FieldValue: {
        serverTimestamp: jest.fn(() => 'server-timestamp'),
      },
    },
  },
  db: {
    doc: (...args) => mockDoc(...args),
  },
}));

jest.mock('../../netlify/functions/retry-utils', () => ({
  generateContentWithRetry: (...args) => mockGenerateContentWithRetry(...args),
}));

jest.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: jest.fn(),
}));

const { handler } = require('../../netlify/functions/teacher-ai-focus-analysis');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const makeEvent = (body = {}, headers = { Authorization: 'Bearer test-token' }) => ({
  httpMethod: 'POST',
  headers,
  body: JSON.stringify({
    appId: 'test-app',
    studentId: 'student-1',
    classId: 'class-1',
    startDate: '2026-01-01',
    endDate: '2026-01-05',
    mode: 'suggest',
    ...body,
  }),
});

const makeSnap = (data) => ({
  exists: Boolean(data),
  data: () => data,
});

const makeQuestion = (overrides = {}) => ({
  date: '2026-01-02',
  grade: 'G3',
  topic: 'Multiplication',
  subtopic: 'basic multiplication',
  question: 'What is 3 x 4?',
  isCorrect: false,
  timeTaken: 24,
  ...overrides,
});

const makeAiJson = (overrides = {}) => ({
  summary: 'Focus on multiplication facts.',
  recommendations: [
    {
      grade: 'G3',
      topic: 'Multiplication',
      subtopic: 'basic multiplication',
      reason: 'Accuracy is below mastery in the selected range.',
      confidence: 'high',
    },
  ],
  notEnoughData: [],
  ...overrides,
});

let mockDocs;
let mockSets;

const installDocMock = (overrides = {}) => {
  mockSets = [];
  mockDocs = {
    'artifacts/test-app/classStudents/class-1__student-1': {
      studentId: 'student-1',
      classId: 'class-1',
      ...overrides.enrollment,
    },
    'artifacts/test-app/users/teacher-1/math_whiz_data/profile': {
      role: 'teacher',
      ...overrides.teacherProfile,
    },
    'artifacts/test-app/classes/class-1': {
      teacherIds: ['teacher-1'],
      ...overrides.classData,
    },
    'artifacts/test-app/users/student-1/math_whiz_data/profile': {
      selectedGrade: 'G3',
      answeredQuestions: [makeQuestion()],
      ...overrides.studentProfile,
    },
    ...overrides.docs,
  };

  mockDoc.mockImplementation((path) => ({
    path,
    get: jest.fn().mockResolvedValue(makeSnap(mockDocs[path] || null)),
    set: jest.fn().mockImplementation(async (payload, options) => {
      mockSets.push({ path, payload, options });
      mockDocs[path] = { ...(mockDocs[path] || {}), ...payload };
    }),
  }));
};

describe('teacher-ai-focus-analysis handler', () => {
  beforeEach(() => {
    process.env.GEMINI_API_KEY = 'test-key';
    process.env.GEMINI_MODEL_NAME = 'gemini-2.5-flash';
    jest.clearAllMocks();
    mockVerifyIdToken.mockResolvedValue({ uid: 'teacher-1', role: 'teacher' });
    GoogleGenerativeAI.mockImplementation(() => ({
      getGenerativeModel: (...args) => mockGetGenerativeModel(...args),
    }));
    mockGenerateContentWithRetry.mockResolvedValue({
      response: {
        text: () => JSON.stringify(makeAiJson()),
      },
    });
    installDocMock();
  });

  test('rejects unauthenticated requests', async () => {
    const response = await handler(makeEvent({}, {}));

    expect(response.statusCode).toBe(401);
    expect(JSON.parse(response.body).error).toMatch(/authorization/i);
    expect(mockGenerateContentWithRetry).not.toHaveBeenCalled();
  });

  test('rejects teacher access to unrelated students and classes', async () => {
    installDocMock({
      classData: { teacherIds: ['teacher-2'] },
    });

    const response = await handler(makeEvent());

    expect(response.statusCode).toBe(403);
    expect(JSON.parse(response.body).error).toMatch(/not assigned/i);
    expect(mockGenerateContentWithRetry).not.toHaveBeenCalled();
  });

  test('returns empty-data response without calling Gemini', async () => {
    installDocMock({
      studentProfile: {
        answeredQuestions: [
          makeQuestion({ date: '2026-02-01', question: 'Outside the selected range' }),
        ],
      },
    });

    const response = await handler(makeEvent());
    const body = JSON.parse(response.body);

    expect(response.statusCode).toBe(200);
    expect(body.status).toBe('empty');
    expect(body.summary).toMatch(/No answered questions/i);
    expect(mockGenerateContentWithRetry).not.toHaveBeenCalled();
    expect(mockSets).toEqual([]);
  });

  test('builds aggregate prompt data from the selected date range only', async () => {
    installDocMock({
      studentProfile: {
        answeredQuestions: [
          makeQuestion({ date: '2026-01-02', question: 'Included miss', isCorrect: false }),
          makeQuestion({
            date: '2026-02-02',
            subtopic: 'skip counting',
            question: 'Outside range miss',
            isCorrect: false,
          }),
        ],
      },
    });

    const response = await handler(makeEvent());
    const body = JSON.parse(response.body);
    const [, prompt] = mockGenerateContentWithRetry.mock.calls[0];

    expect(response.statusCode).toBe(200);
    expect(body.metrics.questionsAnalyzed).toBe(1);
    expect(body.metrics.bySubtopic).toHaveLength(1);
    expect(prompt).toContain('Included miss');
    expect(prompt).not.toContain('Outside range miss');
  });

  test('sanitizes Gemini JSON and drops invalid topics and subtopics', async () => {
    mockGenerateContentWithRetry.mockResolvedValueOnce({
      response: {
        text: () => JSON.stringify(makeAiJson({
          recommendations: [
            {
              grade: 'G3',
              topic: 'Multiplication',
              subtopic: 'basic multiplication',
              reason: 'Needs more fluent fact practice.',
              confidence: 'high',
            },
            {
              grade: 'G3',
              topic: 'Multiplication',
              subtopic: 'moon math',
              reason: 'Hallucinated subtopic.',
              confidence: 'high',
            },
            {
              grade: 'G3',
              topic: 'Geometry',
              subtopic: 'triangles',
              reason: 'Wrong grade topic.',
              confidence: 'medium',
            },
          ],
          notEnoughData: [
            {
              grade: 'G3',
              topic: 'Multiplication',
              subtopic: 'fake bucket',
              note: 'Invalid not enough data bucket.',
            },
          ],
        })),
      },
    });

    const response = await handler(makeEvent());
    const body = JSON.parse(response.body);

    expect(response.statusCode).toBe(200);
    expect(body.recommendations).toHaveLength(1);
    expect(body.recommendations[0]).toMatchObject({
      topic: 'Multiplication',
      subtopic: 'basic multiplication',
    });
    expect(body.focusMap).toEqual({ Multiplication: ['basic multiplication'] });
    expect(body.savedRecommendation.focusMap).toEqual({ Multiplication: ['basic multiplication'] });
  });

  test('applies reviewed focusMap only in apply mode', async () => {
    const suggestResponse = await handler(makeEvent());
    const suggestBody = JSON.parse(suggestResponse.body);
    const suggestWrite = mockSets[mockSets.length - 1];

    expect(suggestResponse.statusCode).toBe(200);
    expect(suggestBody.savedRecommendation.status).toBe('draft');
    expect(suggestWrite.payload.allowedSubtopicsByTopic).toBeUndefined();
    expect(mockGenerateContentWithRetry).toHaveBeenCalledTimes(1);

    mockSets = [];
    mockGenerateContentWithRetry.mockClear();

    const applyResponse = await handler(makeEvent({
      mode: 'apply',
      focusMap: { Multiplication: ['basic multiplication', 'skip counting', 'moon math'] },
    }));
    const applyBody = JSON.parse(applyResponse.body);
    const applyWrite = mockSets[mockSets.length - 1];

    expect(applyResponse.statusCode).toBe(200);
    expect(applyBody.applied).toBe(true);
    expect(mockGenerateContentWithRetry).not.toHaveBeenCalled();
    expect(applyWrite.payload.allowedSubtopicsByTopic).toEqual({
      Multiplication: ['basic multiplication', 'skip counting'],
    });
    expect(applyWrite.payload.aiFocusRecommendation.status).toBe('applied');
  });

  test('loads, updates, and deletes a saved recommendation draft', async () => {
    const savedRecommendation = {
      id: 'ai-focus-existing',
      status: 'draft',
      summary: 'Saved recommendation.',
      recommendations: [],
      focusMap: { Multiplication: ['basic multiplication'] },
      notEnoughData: [],
      metrics: { questionsAnalyzed: 2 },
      dateRange: { startDate: '2026-01-01', endDate: '2026-01-05' },
      generatedBy: 'teacher-1',
      generatedAt: '2026-01-05T00:00:00.000Z',
      updatedAt: '2026-01-05T00:00:00.000Z',
      appliedAt: null,
    };
    installDocMock({
      enrollment: { aiFocusRecommendation: savedRecommendation },
    });

    const getResponse = await handler(makeEvent({ mode: 'get' }));
    expect(JSON.parse(getResponse.body).savedRecommendation).toEqual(savedRecommendation);

    const updateResponse = await handler(makeEvent({
      mode: 'update',
      focusMap: { Multiplication: ['skip counting'] },
    }));
    const updateBody = JSON.parse(updateResponse.body);
    expect(updateResponse.statusCode).toBe(200);
    expect(updateBody.savedRecommendation.focusMap).toEqual({ Multiplication: ['skip counting'] });
    expect(updateBody.savedRecommendation.status).toBe('draft');

    const deleteResponse = await handler(makeEvent({ mode: 'delete' }));
    const deleteBody = JSON.parse(deleteResponse.body);
    expect(deleteResponse.statusCode).toBe(200);
    expect(deleteBody.deleted).toBe(true);
    expect(mockSets[mockSets.length - 1].payload).toEqual({ aiFocusRecommendation: null });
  });
});
