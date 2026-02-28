jest.mock('../../netlify/functions/firebase-admin', () => ({
  admin: {
    auth: () => ({
      verifyIdToken: jest.fn().mockResolvedValue({ uid: 'admin-user' }),
    }),
  },
  db: {
    doc: jest.fn(() => ({
      get: jest.fn().mockResolvedValue({
        exists: true,
        data: () => ({ role: 'admin' }),
      }),
    })),
  },
}));

const mockGenerateContentWithRetry = jest.fn();

jest.mock('../../netlify/functions/retry-utils', () => ({
  generateContentWithRetry: (...args) => mockGenerateContentWithRetry(...args),
}));

jest.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
    getGenerativeModel: jest.fn(() => ({ mocked: true })),
  })),
}));

const { QUESTION_TYPES } = require('../../src/constants/topics');
const { VALID_TOPICS_BY_GRADE, GRADES } = require('../../src/constants/shared-constants.js');
const firebaseAdmin = require('../../netlify/functions/firebase-admin');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { handler } = require('../../netlify/functions/gemini-generate-questions');

describe('gemini-generate-questions handler', () => {
  beforeEach(() => {
    process.env.GEMINI_API_KEY = 'test-key';
    process.env.GEMINI_MODEL_NAME = 'gemini-2.5-flash';

    firebaseAdmin.admin.auth = jest.fn(() => ({
      verifyIdToken: jest.fn().mockResolvedValue({ uid: 'admin-user' }),
    }));
    firebaseAdmin.db.doc = jest.fn(() => ({
      get: jest.fn().mockResolvedValue({
        exists: true,
        data: () => ({ role: 'admin' }),
      }),
    }));
    GoogleGenerativeAI.mockImplementation(() => ({
      getGenerativeModel: jest.fn(() => ({ mocked: true })),
    }));

    mockGenerateContentWithRetry.mockResolvedValue({
      response: {
        text: () => JSON.stringify([
          {
            question: 'What is 2 + 2?',
            topic: VALID_TOPICS_BY_GRADE[GRADES.G3][0],
            grade: 'G3',
            questionType: QUESTION_TYPES.MULTIPLE_CHOICE,
            correctAnswer: '4',
            options: ['3', '4', '5', '6'],
            inputTypes: [],
            hint: 'Add two and two',
            standard: '3.OA.A.1',
            concept: 'Addition',
          },
        ]),
      },
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('includes normalized additional instructions in generated prompt', async () => {
    const event = {
      httpMethod: 'POST',
      headers: { Authorization: 'Bearer test-token' },
      body: JSON.stringify({
        grade: 'G3',
        topic: VALID_TOPICS_BY_GRADE[GRADES.G3][0],
        questionTypes: [QUESTION_TYPES.MULTIPLE_CHOICE],
        count: 1,
        appId: 'default-app-id',
        additionalInstructions: '   use grocery shopping scenarios   ',
      }),
    };

    const response = await handler(event);

    expect(response.statusCode).toBe(200);
    expect(mockGenerateContentWithRetry).toHaveBeenCalled();

    const [, prompt] = mockGenerateContentWithRetry.mock.calls[0];
    expect(prompt).toContain('Additional User Instructions:');
    expect(prompt).toContain('use grocery shopping scenarios');
  });

  test('caps additional instructions to 500 characters', async () => {
    const longInstructions = 'z'.repeat(700);

    const event = {
      httpMethod: 'POST',
      headers: { Authorization: 'Bearer test-token' },
      body: JSON.stringify({
        grade: 'G3',
        topic: VALID_TOPICS_BY_GRADE[GRADES.G3][0],
        questionTypes: [QUESTION_TYPES.MULTIPLE_CHOICE],
        count: 1,
        appId: 'default-app-id',
        additionalInstructions: longInstructions,
      }),
    };

    const response = await handler(event);

    expect(response.statusCode).toBe(200);

    const [, prompt] = mockGenerateContentWithRetry.mock.calls[0];
    const capped = 'z'.repeat(500);
    expect(prompt).toContain(capped);
    expect(prompt).not.toContain('z'.repeat(501));
  });
});
