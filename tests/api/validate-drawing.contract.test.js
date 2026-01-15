/**
 * Contract Tests for Validate Drawing API Endpoint
 * Tests request/response contracts for drawing validation
 */

const { handler } = require('../../netlify/functions/validate-drawing');

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
                dailyDrawingValidations: {}
              })
            }),
            update: jest.fn().mockResolvedValue(undefined)
          }))
        }))
      }))
    }))
  }
}));

// Mock Firebase Storage
jest.mock('firebase-admin/storage', () => ({
  getStorage: jest.fn().mockReturnValue({
    bucket: jest.fn().mockReturnValue({
      name: 'test-bucket',
      file: jest.fn().mockReturnValue({
        save: jest.fn().mockResolvedValue(undefined),
        makePublic: jest.fn().mockResolvedValue(undefined)
      })
    })
  })
}));

// Mock Google Generative AI
jest.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
    getGenerativeModel: jest.fn().mockReturnValue({
      generateContent: jest.fn().mockResolvedValue({
        response: {
          text: () => JSON.stringify({
            isCorrect: true,
            feedback: 'Great job! Your drawing correctly shows the shape.'
          })
        }
      })
    })
  }))
}));

describe('Validate Drawing API Contract', () => {
  // Sample base64 image (1x1 transparent PNG)
  const sampleBase64Image = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

  const validEvent = (overrides = {}) => ({
    httpMethod: 'POST',
    headers: {
      authorization: 'Bearer valid-token-123'
    },
    body: JSON.stringify({
      question: 'Draw a rectangle with 4 equal sides',
      questionType: 'drawing',
      drawingImageBase64: sampleBase64Image,
      expectedAnswer: 'A square (rectangle with equal sides)',
      questionId: 'q-123'
    }),
    ...overrides
  });

  describe('HTTP Method Validation', () => {
    it('returns 200 for OPTIONS preflight request', async () => {
      const event = validEvent({ httpMethod: 'OPTIONS' });
      const response = await handler(event);

      expect(response.statusCode).toBe(200);
      expect(response.headers['Access-Control-Allow-Origin']).toBe('*');
    });

    it('returns 405 for GET requests', async () => {
      const event = validEvent({ httpMethod: 'GET' });
      const response = await handler(event);

      expect(response.statusCode).toBe(405);
      expect(JSON.parse(response.body).error).toContain('not allowed');
    });

    it('returns 405 for PUT requests', async () => {
      const event = validEvent({ httpMethod: 'PUT' });
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
    });

    it('returns 401 for invalid token format', async () => {
      const event = validEvent({
        headers: { authorization: 'InvalidToken' }
      });

      const response = await handler(event);

      expect(response.statusCode).toBe(401);
    });
  });

  describe('Request Body Contract - Drawing Questions', () => {
    it('returns 400 when question is missing', async () => {
      const event = validEvent({
        body: JSON.stringify({
          questionType: 'drawing',
          drawingImageBase64: sampleBase64Image
        })
      });

      const response = await handler(event);

      expect(response.statusCode).toBe(400);
      expect(JSON.parse(response.body).error).toContain('question');
    });

    it('returns 400 when drawingImageBase64 is missing for drawing type', async () => {
      const event = validEvent({
        body: JSON.stringify({
          question: 'Draw a triangle',
          questionType: 'drawing'
          // drawingImageBase64 missing
        })
      });

      const response = await handler(event);

      expect(response.statusCode).toBe(400);
      expect(JSON.parse(response.body).error).toContain('drawingImageBase64');
    });

    it('accepts valid drawing question payload', async () => {
      const event = validEvent();
      const response = await handler(event);

      expect(response.statusCode).toBe(200);
    });
  });

  describe('Request Body Contract - Write-in Questions', () => {
    it('returns 400 when userWrittenAnswer is missing for write-in type', async () => {
      const event = validEvent({
        body: JSON.stringify({
          question: 'What is 5 + 3?',
          questionType: 'write-in'
          // userWrittenAnswer missing
        })
      });

      const response = await handler(event);

      expect(response.statusCode).toBe(400);
      expect(JSON.parse(response.body).error).toContain('userWrittenAnswer');
    });

    it('accepts valid write-in question payload', async () => {
      const event = validEvent({
        body: JSON.stringify({
          question: 'What is 5 + 3?',
          questionType: 'write-in',
          userWrittenAnswer: '8',
          expectedAnswer: '8'
        })
      });

      const response = await handler(event);

      expect(response.statusCode).toBe(200);
    });
  });

  describe('Request Body Contract - Drawing with Text', () => {
    it('requires both drawing and written answer for drawing-with-text type', async () => {
      const event = validEvent({
        body: JSON.stringify({
          question: 'Draw and explain a square',
          questionType: 'drawing-with-text',
          drawingImageBase64: sampleBase64Image
          // userWrittenAnswer missing
        })
      });

      const response = await handler(event);

      expect(response.statusCode).toBe(400);
      expect(JSON.parse(response.body).error).toContain('userWrittenAnswer');
    });

    it('accepts valid drawing-with-text payload', async () => {
      const event = validEvent({
        body: JSON.stringify({
          question: 'Draw and explain a square',
          questionType: 'drawing-with-text',
          drawingImageBase64: sampleBase64Image,
          userWrittenAnswer: 'A square has 4 equal sides and 4 right angles',
          expectedAnswer: 'Square with equal sides'
        })
      });

      const response = await handler(event);

      expect(response.statusCode).toBe(200);
    });
  });

  describe('Response Contract', () => {
    it('returns isCorrect boolean on success', async () => {
      const event = validEvent();
      const response = await handler(event);

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(typeof body.isCorrect).toBe('boolean');
    });

    it('returns feedback string on success', async () => {
      const event = validEvent();
      const response = await handler(event);

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(typeof body.feedback).toBe('string');
      expect(body.feedback.length).toBeGreaterThan(0);
    });

    it('returns imageUrl for drawing submissions', async () => {
      const event = validEvent();
      const response = await handler(event);

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.imageUrl).toBeDefined();
      expect(body.imageUrl).toContain('storage.googleapis.com');
    });

    it('returns null imageUrl for write-in submissions', async () => {
      const event = validEvent({
        body: JSON.stringify({
          question: 'What is 5 + 3?',
          questionType: 'write-in',
          userWrittenAnswer: '8'
        })
      });

      const response = await handler(event);

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.imageUrl).toBeNull();
    });

    it('includes CORS headers in all responses', async () => {
      const event = validEvent();
      const response = await handler(event);

      expect(response.headers['Access-Control-Allow-Origin']).toBe('*');
      expect(response.headers['Access-Control-Allow-Headers']).toContain('Authorization');
    });

    it('returns error field on failure', async () => {
      const event = validEvent({
        body: JSON.stringify({}) // Missing required fields
      });

      const response = await handler(event);

      const body = JSON.parse(response.body);
      expect(body).toHaveProperty('error');
    });
  });

  describe('Question Type Validation', () => {
    it('defaults to drawing type when questionType is not specified', async () => {
      const event = validEvent({
        body: JSON.stringify({
          question: 'Draw a circle',
          drawingImageBase64: sampleBase64Image
          // questionType omitted - should default to 'drawing'
        })
      });

      const response = await handler(event);

      // Should process as drawing type successfully
      expect(response.statusCode).toBe(200);
    });

    it.each(['drawing', 'write-in', 'drawing-with-text'])(
      'accepts valid questionType: %s',
      async (questionType) => {
        let body = {
          question: 'Test question',
          questionType
        };

        if (questionType === 'drawing' || questionType === 'drawing-with-text') {
          body.drawingImageBase64 = sampleBase64Image;
        }
        if (questionType === 'write-in' || questionType === 'drawing-with-text') {
          body.userWrittenAnswer = 'Test answer';
        }

        const event = validEvent({ body: JSON.stringify(body) });
        const response = await handler(event);

        expect(response.statusCode).toBe(200);
      }
    );
  });

  describe('Rate Limiting Contract', () => {
    it('returns 429 when daily validation limit is reached', async () => {
      const firebaseAdmin = require('../../netlify/functions/firebase-admin');
      firebaseAdmin.db.collection.mockImplementationOnce(() => ({
        doc: jest.fn(() => ({
          collection: jest.fn(() => ({
            doc: jest.fn(() => ({
              get: jest.fn().mockResolvedValue({
                exists: true,
                data: () => ({
                  dailyDrawingValidations: {
                    [new Date().toISOString().split('T')[0]]: {
                      count: 20 // At limit
                    }
                  }
                })
              }),
              update: jest.fn().mockResolvedValue(undefined)
            }))
          }))
        }))
      }));

      const event = validEvent();
      const response = await handler(event);

      expect(response.statusCode).toBe(429);
      expect(JSON.parse(response.body).error).toContain('daily limit');
    });
  });

  describe('Image Processing Contract', () => {
    it('handles base64 image with data URL prefix', async () => {
      const event = validEvent({
        body: JSON.stringify({
          question: 'Draw a shape',
          questionType: 'drawing',
          drawingImageBase64: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
        })
      });

      const response = await handler(event);

      expect(response.statusCode).toBe(200);
    });

    it('handles base64 image without data URL prefix', async () => {
      const event = validEvent({
        body: JSON.stringify({
          question: 'Draw a shape',
          questionType: 'drawing',
          drawingImageBase64: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
        })
      });

      const response = await handler(event);

      expect(response.statusCode).toBe(200);
    });
  });
});
