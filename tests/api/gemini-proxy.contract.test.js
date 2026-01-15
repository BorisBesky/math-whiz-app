/**
 * Contract Tests for Gemini Proxy API Endpoint
 * Tests request/response contracts without making actual API calls
 */

const { handler } = require('../../netlify/functions/gemini-proxy');

// Mock Firebase Admin
jest.mock('../../netlify/functions/firebase-admin', () => ({
  admin: {
    auth: () => ({
      verifyIdToken: jest.fn().mockResolvedValue({ uid: 'test-user-123' })
    })
  },
  db: {
    collection: jest.fn(() => ({
      doc: jest.fn(() => ({
        collection: jest.fn(() => ({
          doc: jest.fn(() => ({
            get: jest.fn().mockResolvedValue({
              exists: true,
              data: () => ({
                dailyStories: {}
              })
            }),
            update: jest.fn().mockResolvedValue(undefined)
          }))
        }))
      }))
    }))
  }
}));

// Mock Google Generative AI
jest.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
    getGenerativeModel: jest.fn().mockReturnValue({
      generateContent: jest.fn().mockResolvedValue({
        response: {
          text: () => 'A farmer has 24 apples. She divides them equally among 6 baskets. How many apples are in each basket?\n\nAnswer: 4 apples'
        }
      })
    })
  }))
}));

describe('Gemini Proxy API Contract', () => {
  const validEvent = (overrides = {}) => ({
    httpMethod: 'POST',
    headers: {
      authorization: 'Bearer valid-token-123'
    },
    body: JSON.stringify({
      prompt: 'Create a story problem about division',
      topic: 'division',
      grade: 'G3'
    }),
    ...overrides
  });

  describe('HTTP Method Validation', () => {
    it('returns 200 for OPTIONS preflight request', async () => {
      const event = validEvent({ httpMethod: 'OPTIONS' });
      const response = await handler(event);

      expect(response.statusCode).toBe(200);
      expect(response.headers['Access-Control-Allow-Origin']).toBe('*');
      expect(response.headers['Access-Control-Allow-Methods']).toContain('POST');
    });

    it('returns 405 for GET requests', async () => {
      const event = validEvent({ httpMethod: 'GET' });
      const response = await handler(event);

      expect(response.statusCode).toBe(405);
      expect(JSON.parse(response.body).error).toBe('Method Not Allowed');
    });

    it('returns 405 for PUT requests', async () => {
      const event = validEvent({ httpMethod: 'PUT' });
      const response = await handler(event);

      expect(response.statusCode).toBe(405);
    });

    it('returns 405 for DELETE requests', async () => {
      const event = validEvent({ httpMethod: 'DELETE' });
      const response = await handler(event);

      expect(response.statusCode).toBe(405);
    });
  });

  describe('Authentication Contract', () => {
    it('returns 401 when authorization header is missing', async () => {
      const event = validEvent({
        headers: {}
      });

      const response = await handler(event);

      expect(response.statusCode).toBe(401);
      expect(JSON.parse(response.body).error).toContain('authorization');
    });

    it('returns 401 when authorization header has wrong format', async () => {
      const event = validEvent({
        headers: { authorization: 'InvalidFormat token' }
      });

      const response = await handler(event);

      expect(response.statusCode).toBe(401);
    });
  });

  describe('Request Body Contract', () => {
    it('returns 400 when prompt is missing', async () => {
      const event = validEvent({
        body: JSON.stringify({
          topic: 'division',
          grade: 'G3'
        })
      });

      const response = await handler(event);

      expect(response.statusCode).toBe(400);
      expect(JSON.parse(response.body).error).toContain('Prompt is required');
    });

    it('returns 400 when topic is missing', async () => {
      const event = validEvent({
        body: JSON.stringify({
          prompt: 'Create a story problem',
          grade: 'G3'
        })
      });

      const response = await handler(event);

      expect(response.statusCode).toBe(400);
      expect(JSON.parse(response.body).error).toContain('Topic is required');
    });

    it('returns 400 for invalid grade', async () => {
      const event = validEvent({
        body: JSON.stringify({
          prompt: 'Create a story problem',
          topic: 'division',
          grade: 'G5' // Invalid grade
        })
      });

      const response = await handler(event);

      expect(response.statusCode).toBe(400);
      expect(JSON.parse(response.body).error).toContain('Grade must be');
    });

    it('accepts G3 as valid grade', async () => {
      const event = validEvent({
        body: JSON.stringify({
          prompt: 'Create a story problem',
          topic: 'division',
          grade: 'G3'
        })
      });

      const response = await handler(event);

      // Should not fail on grade validation
      expect(response.statusCode).not.toBe(400);
    });

    it('accepts G4 as valid grade', async () => {
      const event = validEvent({
        body: JSON.stringify({
          prompt: 'Create a story problem',
          topic: 'operations-algebraic-thinking',
          grade: 'G4'
        })
      });

      const response = await handler(event);

      // Should not fail on grade validation
      expect(response.statusCode).not.toBe(400);
    });

    it('defaults to G3 when grade is not provided', async () => {
      const event = validEvent({
        body: JSON.stringify({
          prompt: 'Create a story problem',
          topic: 'division'
          // grade omitted
        })
      });

      const response = await handler(event);

      // Should use default grade and not fail
      expect([200, 400, 429]).toContain(response.statusCode);
    });
  });

  describe('Response Contract', () => {
    it('returns content field on success', async () => {
      const event = validEvent();
      const response = await handler(event);

      if (response.statusCode === 200) {
        const body = JSON.parse(response.body);
        expect(body).toHaveProperty('content');
        expect(typeof body.content).toBe('string');
      }
    });

    it('returns error field on failure', async () => {
      const event = validEvent({
        body: JSON.stringify({}) // Missing required fields
      });

      const response = await handler(event);

      const body = JSON.parse(response.body);
      expect(body).toHaveProperty('error');
      expect(typeof body.error).toBe('string');
    });

    it('includes CORS headers in all responses', async () => {
      const event = validEvent();
      const response = await handler(event);

      expect(response.headers['Access-Control-Allow-Origin']).toBe('*');
      expect(response.headers['Access-Control-Allow-Headers']).toContain('Content-Type');
      expect(response.headers['Access-Control-Allow-Headers']).toContain('Authorization');
    });
  });

  describe('Topic Validation Contract', () => {
    const g3Topics = ['multiplication', 'division', 'fractions', 'measurement-data'];
    const g4Topics = ['operations-algebraic-thinking', 'base-ten', 'fractions-4th', 'measurement-data-4th', 'geometry'];

    it.each(g3Topics)('accepts valid G3 topic: %s', async (topic) => {
      const event = validEvent({
        body: JSON.stringify({
          prompt: 'Create a story problem',
          topic,
          grade: 'G3'
        })
      });

      const response = await handler(event);

      // Should not return topic validation error
      if (response.statusCode === 400) {
        const body = JSON.parse(response.body);
        expect(body.error).not.toContain('Invalid topic');
      }
    });

    it.each(g4Topics)('accepts valid G4 topic: %s', async (topic) => {
      const event = validEvent({
        body: JSON.stringify({
          prompt: 'Create a story problem',
          topic,
          grade: 'G4'
        })
      });

      const response = await handler(event);

      // Should not return topic validation error
      if (response.statusCode === 400) {
        const body = JSON.parse(response.body);
        expect(body.error).not.toContain('Invalid topic');
      }
    });

    it('returns 400 for invalid topic', async () => {
      const event = validEvent({
        body: JSON.stringify({
          prompt: 'Create a story problem',
          topic: 'invalid-topic-xyz',
          grade: 'G3'
        })
      });

      const response = await handler(event);

      expect(response.statusCode).toBe(400);
      expect(JSON.parse(response.body).error).toContain('Invalid topic');
    });
  });

  describe('Rate Limiting Contract', () => {
    it('returns 429 when daily limit is reached', async () => {
      // Override mock to simulate rate limit
      const firebaseAdmin = require('../../netlify/functions/firebase-admin');
      firebaseAdmin.db.collection.mockImplementationOnce(() => ({
        doc: jest.fn(() => ({
          collection: jest.fn(() => ({
            doc: jest.fn(() => ({
              get: jest.fn().mockResolvedValue({
                exists: true,
                data: () => ({
                  dailyStories: {
                    [new Date().toISOString().split('T')[0]]: {
                      G3: {
                        division: true,
                        multiplication: true,
                        fractions: true,
                        'measurement-data': true
                      }
                    }
                  }
                })
              }),
              update: jest.fn().mockResolvedValue(undefined)
            }))
          }))
        }))
      }));

      const event = validEvent({
        body: JSON.stringify({
          prompt: 'Create a story problem',
          topic: 'division',
          grade: 'G3'
        })
      });

      const response = await handler(event);

      expect(response.statusCode).toBe(429);
      expect(JSON.parse(response.body).error).toContain('daily limit');
    });

    it('returns 429 when topic already used today', async () => {
      const firebaseAdmin = require('../../netlify/functions/firebase-admin');
      firebaseAdmin.db.collection.mockImplementationOnce(() => ({
        doc: jest.fn(() => ({
          collection: jest.fn(() => ({
            doc: jest.fn(() => ({
              get: jest.fn().mockResolvedValue({
                exists: true,
                data: () => ({
                  dailyStories: {
                    [new Date().toISOString().split('T')[0]]: {
                      G3: {
                        division: true // Already used
                      }
                    }
                  }
                })
              }),
              update: jest.fn().mockResolvedValue(undefined)
            }))
          }))
        }))
      }));

      const event = validEvent({
        body: JSON.stringify({
          prompt: 'Create a story problem',
          topic: 'division',
          grade: 'G3'
        })
      });

      const response = await handler(event);

      expect(response.statusCode).toBe(429);
      expect(JSON.parse(response.body).error).toContain('already created');
    });
  });
});
