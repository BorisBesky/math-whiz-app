let mockVerifyIdToken;
let mockDoc;
let mockDocs;
let mockSets;
let mockGenerateContentWithRetry;
let mockFetch;

jest.mock('../../netlify/functions/firebase-admin', () => ({
  admin: {
    auth: () => ({
      verifyIdToken: (...args) => mockVerifyIdToken(...args),
    }),
    firestore: {
      FieldValue: {
        serverTimestamp: jest.fn(() => 'SERVER_TIME'),
      },
      Timestamp: {
        now: jest.fn(() => 'NOW_TIME'),
      },
    },
  },
  db: {
    doc: (...args) => mockDoc(...args),
    collection: (name) => ({
      doc: (id) => mockDoc(`${name}/${id}`),
    }),
  },
}));

jest.mock('../../netlify/functions/retry-utils', () => ({
  generateContentWithRetry: (...args) => mockGenerateContentWithRetry(...args),
}));

jest.mock('node-fetch', () => (...args) => mockFetch(...args));

jest.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
    getGenerativeModel: jest.fn(() => ({ mocked: true })),
  })),
}));

const { handler, _test } = require('../../netlify/functions/teacher-ai-focus-analysis');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const docSnap = (data) => ({
  exists: Boolean(data),
  data: () => data,
});

const eventFor = (body, headers = { authorization: 'Bearer token' }) => ({
  httpMethod: 'POST',
  headers,
  body: JSON.stringify({
    appId: 'app-test',
    studentId: 'student-1',
    classId: 'class-1',
    startDate: '2026-01-10',
    endDate: '2026-01-12',
    mode: 'suggest',
    ...body,
  }),
});

const processSuggestion = (overrides = {}) => _test.processTeacherAiFocusSuggestion({
  appId: 'app-test',
  studentId: 'student-1',
  classId: 'class-1',
  startDate: '2026-01-10',
  endDate: '2026-01-12',
  decodedToken: { uid: 'teacher-1', role: 'teacher' },
  ...overrides,
});

const seedTeacherAccess = () => {
  mockDocs.set('artifacts/app-test/users/teacher-1/math_whiz_data/profile', docSnap({ role: 'teacher' }));
  mockDocs.set('artifacts/app-test/classStudents/class-1__student-1', docSnap({ classId: 'class-1', studentId: 'student-1' }));
  mockDocs.set('artifacts/app-test/classes/class-1', docSnap({ teacherIds: ['teacher-1'] }));
};

describe('teacher-ai-focus-analysis handler', () => {
  beforeEach(() => {
    mockDocs = new Map();
    mockSets = [];
    mockVerifyIdToken = jest.fn().mockResolvedValue({ uid: 'teacher-1', role: 'teacher' });
    const makeDocRef = (path) => ({
      path,
      get: jest.fn().mockResolvedValue(mockDocs.get(path) || docSnap(null)),
      set: jest.fn().mockImplementation(async (data, options) => {
        mockSets.push({ path, data, options });
      }),
      collection: (name) => ({
        doc: (id) => makeDocRef(`${path}/${name}/${id}`),
      }),
    });
    mockDoc = jest.fn((path) => makeDocRef(path));
    mockFetch = jest.fn().mockResolvedValue({ status: 202 });
    mockGenerateContentWithRetry = jest.fn().mockResolvedValue({
      response: {
        text: () => JSON.stringify({
          summary: 'Focus on multiplication facts and arrays.',
          recommendations: [
            {
              grade: 'G3',
              topic: 'Multiplication',
              subtopic: 'basic multiplication',
              reason: 'Accuracy is below mastery.',
              confidence: 'high',
            },
          ],
          notEnoughData: [],
        }),
      },
    });
    GoogleGenerativeAI.mockImplementation(() => ({
      getGenerativeModel: jest.fn(() => ({ mocked: true })),
    }));
    seedTeacherAccess();
    mockDocs.set('artifacts/app-test/users/student-1/math_whiz_data/profile', docSnap({
      role: 'student',
      selectedGrade: 'G3',
      answeredQuestions: [
        {
          date: '2026-01-10',
          topic: 'Multiplication',
          subtopic: 'basic multiplication',
          question: 'inside miss',
          isCorrect: false,
          timeTaken: 24,
        },
        {
          date: '2026-01-11',
          topic: 'Multiplication',
          subtopic: 'basic multiplication',
          question: 'inside correct',
          isCorrect: true,
          timeTaken: 18,
        },
        {
          date: '2026-01-01',
          topic: 'Multiplication',
          subtopic: 'arrays and groups',
          question: 'outside miss',
          isCorrect: false,
          timeTaken: 12,
        },
      ],
    }));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('rejects unauthenticated requests', async () => {
    const response = await handler(eventFor({}, {}));
    expect(response.statusCode).toBe(401);
    expect(mockGenerateContentWithRetry).not.toHaveBeenCalled();
  });

  test('rejects teacher access to unrelated classes', async () => {
    mockDocs.set('artifacts/app-test/classes/class-1', docSnap({ teacherIds: ['other-teacher'] }));

    const response = await handler(eventFor({}));

    expect(response.statusCode).toBe(403);
    expect(mockGenerateContentWithRetry).not.toHaveBeenCalled();
  });

  test('returns empty-data response without calling Gemini', async () => {
    mockDocs.set('artifacts/app-test/users/student-1/math_whiz_data/profile', docSnap({
      role: 'student',
      selectedGrade: 'G3',
      answeredQuestions: [],
    }));

    const body = await processSuggestion();

    expect(body.status).toBe('empty');
    expect(body.metrics.questionsAnalyzed).toBe(0);
    expect(mockGenerateContentWithRetry).not.toHaveBeenCalled();
  });

  test('builds aggregate prompt data from the selected date range only', async () => {
    const body = await processSuggestion();
    const [, prompt] = mockGenerateContentWithRetry.mock.calls[0];

    expect(body.metrics.questionsAnalyzed).toBe(2);
    expect(prompt).toContain('inside miss');
    expect(prompt).not.toContain('outside miss');
  });

  test('uses provided question history when the student profile has no stored answers', async () => {
    mockDocs.set('artifacts/app-test/users/student-1/math_whiz_data/profile', docSnap({
      role: 'student',
      selectedGrade: 'G3',
      answeredQuestions: [],
    }));

    const body = await processSuggestion({
      answeredQuestions: [
        {
          date: '2026-01-10',
          topic: 'Multiplication',
          subtopic: 'basic multiplication',
          question: 'fallback miss',
          isCorrect: false,
          timeTaken: 24,
        },
        {
          date: '2026-01-11',
          topic: 'Multiplication',
          subtopic: 'basic multiplication',
          question: 'fallback correct',
          isCorrect: true,
          timeTaken: 18,
        },
      ],
    });
    const [, prompt] = mockGenerateContentWithRetry.mock.calls[0];

    expect(body.metrics.questionsAnalyzed).toBe(2);
    expect(prompt).toContain('fallback miss');
  });

  test('sanitizes AI recommendations and drops invalid subtopics', async () => {
    mockGenerateContentWithRetry.mockResolvedValueOnce({
      response: {
        text: () => JSON.stringify({
          summary: 'Use targeted practice.',
          recommendations: [
            {
              grade: 'G3',
              topic: 'Multiplication',
              subtopic: 'basic multiplication',
              reason: 'Needs practice.',
              confidence: 'high',
            },
            {
              grade: 'G3',
              topic: 'Multiplication',
              subtopic: 'invented subtopic',
              reason: 'Not real.',
              confidence: 'high',
            },
          ],
        }),
      },
    });

    const body = await processSuggestion();

    expect(body.recommendations).toHaveLength(1);
    expect(body.focusMap).toEqual({ Multiplication: ['basic multiplication'] });
  });

  test('parses fenced JSON with byte-order marks and uppercase language tags', () => {
    const parsed = _test.parseLLMJson('\uFEFF```JSON\n{"summary":"ok","recommendations":[]}\n```');
    expect(parsed).toEqual({ summary: 'ok', recommendations: [] });
  });

  test('falls back to deterministic recommendations when Gemini returns malformed JSON', async () => {
    mockGenerateContentWithRetry.mockResolvedValueOnce({
      response: {
        text: () => 'Here are the recommendations: summary: focus on multiplication',
      },
    });

    const body = await processSuggestion();

    expect(body.usedDeterministicFallback).toBe(true);
    expect(body.summary).toMatch(/Math Whiz used the selected-range performance metrics/i);
    expect(body.recommendations).toHaveLength(1);
    expect(body.focusMap).toEqual({ Multiplication: ['basic multiplication'] });
    expect(mockSets[0].data.aiFocusRecommendation.focusMap).toEqual({
      Multiplication: ['basic multiplication'],
    });
  });

  test('applies reviewed focusMap without another Gemini call', async () => {
    await processSuggestion();
    expect(mockSets).toHaveLength(1);
    expect(mockSets[0].data.aiFocusRecommendation.focusMap).toEqual({
      Multiplication: ['basic multiplication'],
    });
    expect(mockGenerateContentWithRetry).toHaveBeenCalledTimes(1);
    mockSets = [];

    const applyResponse = await handler(eventFor({
      mode: 'apply',
      focusMap: {
        Multiplication: ['basic multiplication', 'invented subtopic'],
      },
    }));
    expect(applyResponse.statusCode).toBe(200);
    expect(mockSets).toHaveLength(1);
    expect(mockGenerateContentWithRetry).toHaveBeenCalledTimes(1);
    expect(mockSets[0]).toMatchObject({
      path: 'artifacts/app-test/classStudents/class-1__student-1',
      options: { merge: true },
    });
    expect(mockSets[0].data.allowedSubtopicsByTopic).toEqual({
      Multiplication: ['basic multiplication'],
    });
  });

  test('starts suggestion analysis as a background job', async () => {
    const response = await handler(eventFor({ mode: 'suggest' }));
    const body = JSON.parse(response.body);

    expect(response.statusCode).toBe(202);
    expect(body.status).toBe('pending');
    expect(body.jobId).toMatch(/^teacher-1_/);
    expect(mockGenerateContentWithRetry).not.toHaveBeenCalled();
    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:8888/.netlify/functions/teacher-ai-focus-analysis-background',
      expect.objectContaining({ method: 'POST' })
    );
    expect(mockSets[0]).toMatchObject({
      path: expect.stringContaining('/teacherAiFocusJobs/'),
      data: expect.objectContaining({ status: 'pending' }),
    });
  });

  test('loads, updates, and deletes a saved recommendation draft', async () => {
    const savedRecommendation = {
      id: 'rec-1',
      status: 'draft',
      summary: 'Saved draft',
      recommendations: [],
      focusMap: { Multiplication: ['basic multiplication'] },
      notEnoughData: [],
      metrics: { questionsAnalyzed: 2 },
      dateRange: { startDate: '2026-01-10', endDate: '2026-01-12' },
    };
    mockDocs.set('artifacts/app-test/classStudents/class-1__student-1', docSnap({
      classId: 'class-1',
      studentId: 'student-1',
      aiFocusRecommendation: savedRecommendation,
    }));

    const getResponse = await handler(eventFor({ mode: 'get' }));
    expect(JSON.parse(getResponse.body).savedRecommendation).toEqual(savedRecommendation);

    const updateResponse = await handler(eventFor({
      mode: 'update',
      focusMap: { Multiplication: ['arrays and groups'] },
    }));
    expect(updateResponse.statusCode).toBe(200);
    expect(mockSets[0].data.aiFocusRecommendation.focusMap).toEqual({
      Multiplication: ['arrays and groups'],
    });

    const deleteResponse = await handler(eventFor({ mode: 'delete' }));
    expect(deleteResponse.statusCode).toBe(200);
    expect(mockSets[1].data.aiFocusRecommendation).toBeNull();
  });
});
