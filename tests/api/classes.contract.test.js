/**
 * Contract Tests for Classes API Endpoint
 * Tests CRUD operations for class management
 */

const { handler } = require('../../netlify/functions/classes');

// Mock Firebase Admin
jest.mock('../../netlify/functions/firebase-admin', () => {
  const mockBatch = {
    delete: jest.fn(),
    update: jest.fn(),
    commit: jest.fn().mockResolvedValue(undefined)
  };

  return {
    admin: {
      firestore: {
        FieldValue: {
          arrayRemove: jest.fn(val => ({ _arrayRemove: val }))
        },
        FieldPath: {
          documentId: jest.fn(() => '__documentId__')
        }
      }
    },
    db: {
      collection: jest.fn(() => ({
        doc: jest.fn(() => ({
          collection: jest.fn(() => ({
            where: jest.fn(() => ({
              get: jest.fn().mockResolvedValue({
                empty: true,
                forEach: jest.fn(),
                docs: []
              })
            })),
            add: jest.fn().mockResolvedValue({ id: 'new-class-123' }),
            doc: jest.fn(() => ({
              get: jest.fn().mockResolvedValue({
                exists: true,
                id: 'class-123',
                data: () => ({
                  name: 'Math 101',
                  teacherId: 'teacher-123',
                  subject: 'Mathematics',
                  gradeLevel: '3rd'
                })
              }),
              update: jest.fn().mockResolvedValue(undefined),
              delete: jest.fn().mockResolvedValue(undefined)
            }))
          }))
        }))
      })),
      batch: jest.fn(() => mockBatch)
    }
  };
});

describe('Classes API Contract', () => {
  const validGetEvent = (overrides = {}) => ({
    httpMethod: 'GET',
    headers: {
      authorization: 'Bearer valid-token-123'
    },
    queryStringParameters: {
      teacherId: 'teacher-123'
    },
    body: null,
    ...overrides
  });

  const validPostEvent = (overrides = {}) => ({
    httpMethod: 'POST',
    headers: {
      authorization: 'Bearer valid-token-123'
    },
    body: JSON.stringify({
      teacherId: 'teacher-123',
      name: 'Math 101',
      subject: 'Mathematics',
      gradeLevel: '3rd',
      description: 'Introduction to math',
      period: '1st'
    }),
    ...overrides
  });

  describe('HTTP Method Validation', () => {
    it('returns 200 for OPTIONS preflight request', async () => {
      const event = validGetEvent({ httpMethod: 'OPTIONS' });
      const response = await handler(event);

      expect(response.statusCode).toBe(200);
      expect(response.headers['Access-Control-Allow-Origin']).toBe('*');
      expect(response.headers['Access-Control-Allow-Methods']).toContain('GET');
      expect(response.headers['Access-Control-Allow-Methods']).toContain('POST');
      expect(response.headers['Access-Control-Allow-Methods']).toContain('PUT');
      expect(response.headers['Access-Control-Allow-Methods']).toContain('DELETE');
    });

    it('accepts GET requests', async () => {
      const event = validGetEvent();
      const response = await handler(event);

      expect([200, 400]).toContain(response.statusCode);
    });

    it('accepts POST requests', async () => {
      const event = validPostEvent();
      const response = await handler(event);

      expect([201, 400, 500]).toContain(response.statusCode);
    });

    it('accepts PUT requests', async () => {
      const event = {
        ...validPostEvent(),
        httpMethod: 'PUT',
        queryStringParameters: { id: 'class-123' }
      };
      const response = await handler(event);

      expect([200, 400, 500]).toContain(response.statusCode);
    });

    it('accepts DELETE requests', async () => {
      const event = {
        ...validGetEvent(),
        httpMethod: 'DELETE',
        queryStringParameters: { id: 'class-123' }
      };
      const response = await handler(event);

      expect([200, 400, 404, 500]).toContain(response.statusCode);
    });
  });

  describe('Authentication Contract', () => {
    it('returns 401 when authorization header is missing', async () => {
      const event = validGetEvent({
        headers: {}
      });

      const response = await handler(event);

      expect(response.statusCode).toBe(401);
      expect(JSON.parse(response.body).error).toBe('Unauthorized');
    });

    it('returns 401 when authorization header has wrong format', async () => {
      const event = validGetEvent({
        headers: { authorization: 'InvalidFormat' }
      });

      const response = await handler(event);

      expect(response.statusCode).toBe(401);
    });
  });

  describe('GET /classes Contract', () => {
    it('returns 400 when teacherId is missing', async () => {
      const event = validGetEvent({
        queryStringParameters: {}
      });

      const response = await handler(event);

      expect(response.statusCode).toBe(400);
      expect(JSON.parse(response.body).error).toContain('Teacher ID');
    });

    it('returns array of classes on success', async () => {
      const firebaseAdmin = require('../../netlify/functions/firebase-admin');
      firebaseAdmin.db.collection.mockImplementationOnce(() => ({
        doc: jest.fn(() => ({
          collection: jest.fn(() => ({
            where: jest.fn(() => ({
              get: jest.fn().mockResolvedValue({
                forEach: (callback) => {
                  callback({
                    id: 'class-1',
                    data: () => ({ name: 'Math 101', teacherId: 'teacher-123' })
                  });
                  callback({
                    id: 'class-2',
                    data: () => ({ name: 'Math 102', teacherId: 'teacher-123' })
                  });
                }
              })
            }))
          }))
        }))
      }));

      const event = validGetEvent();
      const response = await handler(event);

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(Array.isArray(body)).toBe(true);
    });

    it('returns empty array when no classes found', async () => {
      const firebaseAdmin = require('../../netlify/functions/firebase-admin');
      firebaseAdmin.db.collection.mockImplementationOnce(() => ({
        doc: jest.fn(() => ({
          collection: jest.fn(() => ({
            where: jest.fn(() => ({
              get: jest.fn().mockResolvedValue({
                forEach: jest.fn()
              })
            }))
          }))
        }))
      }));

      const event = validGetEvent();
      const response = await handler(event);

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body).toEqual([]);
    });
  });

  describe('POST /classes Contract', () => {
    it('returns 400 when required fields are missing', async () => {
      const event = validPostEvent({
        body: JSON.stringify({
          teacherId: 'teacher-123'
          // Missing name, subject, gradeLevel
        })
      });

      const response = await handler(event);

      expect(response.statusCode).toBe(400);
      expect(JSON.parse(response.body).error).toContain('Missing required fields');
    });

    it('returns 201 with created class on success', async () => {
      const event = validPostEvent();
      const response = await handler(event);

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body).toHaveProperty('id');
      expect(body.name).toBe('Math 101');
      expect(body.teacherId).toBe('teacher-123');
    });

    it('includes timestamps in created class', async () => {
      const event = validPostEvent();
      const response = await handler(event);

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body).toHaveProperty('createdAt');
      expect(body).toHaveProperty('updatedAt');
    });

    it('initializes studentCount to 0', async () => {
      const event = validPostEvent();
      const response = await handler(event);

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body.studentCount).toBe(0);
    });

    it('accepts optional description and period fields', async () => {
      const event = validPostEvent({
        body: JSON.stringify({
          teacherId: 'teacher-123',
          name: 'Math 101',
          subject: 'Mathematics',
          gradeLevel: '3rd',
          description: 'Advanced math class',
          period: '2nd Period'
        })
      });

      const response = await handler(event);

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body.description).toBe('Advanced math class');
      expect(body.period).toBe('2nd Period');
    });
  });

  describe('PUT /classes Contract', () => {
    it('returns 400 when class ID is missing', async () => {
      const event = {
        ...validPostEvent(),
        httpMethod: 'PUT',
        queryStringParameters: {}
      };

      const response = await handler(event);

      expect(response.statusCode).toBe(400);
      expect(JSON.parse(response.body).error).toContain('Class ID');
    });

    it('returns 200 on successful update', async () => {
      const event = {
        ...validPostEvent(),
        httpMethod: 'PUT',
        queryStringParameters: { id: 'class-123' },
        body: JSON.stringify({ name: 'Updated Math' })
      };

      const response = await handler(event);

      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.body).message).toContain('updated');
    });
  });

  describe('DELETE /classes Contract', () => {
    it('returns 400 when class ID is missing', async () => {
      const event = {
        ...validGetEvent(),
        httpMethod: 'DELETE',
        queryStringParameters: {}
      };

      const response = await handler(event);

      expect(response.statusCode).toBe(400);
      expect(JSON.parse(response.body).error).toContain('Class ID');
    });

    it('returns 404 when class not found', async () => {
      const firebaseAdmin = require('../../netlify/functions/firebase-admin');
      firebaseAdmin.db.collection.mockImplementationOnce(() => ({
        doc: jest.fn(() => ({
          collection: jest.fn((collName) => {
            if (collName === 'classes') {
              return {
                doc: jest.fn(() => ({
                  get: jest.fn().mockResolvedValue({
                    exists: false
                  })
                }))
              };
            }
            return {
              where: jest.fn(() => ({
                get: jest.fn().mockResolvedValue({ docs: [] })
              }))
            };
          })
        }))
      }));

      const event = {
        ...validGetEvent(),
        httpMethod: 'DELETE',
        queryStringParameters: { id: 'nonexistent-class' }
      };

      const response = await handler(event);

      expect(response.statusCode).toBe(404);
      expect(JSON.parse(response.body).error).toContain('not found');
    });

    it('returns 200 on successful deletion', async () => {
      const event = {
        ...validGetEvent(),
        httpMethod: 'DELETE',
        queryStringParameters: { id: 'class-123' }
      };

      const response = await handler(event);

      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.body).message).toContain('deleted');
    });
  });

  describe('Response Contract', () => {
    it('includes CORS headers in all responses', async () => {
      const event = validGetEvent();
      const response = await handler(event);

      expect(response.headers['Access-Control-Allow-Origin']).toBe('*');
      expect(response.headers['Access-Control-Allow-Headers']).toContain('Authorization');
    });

    it('returns JSON content type implicitly', async () => {
      const event = validGetEvent();
      const response = await handler(event);

      // Body should be valid JSON
      expect(() => JSON.parse(response.body)).not.toThrow();
    });
  });
});
