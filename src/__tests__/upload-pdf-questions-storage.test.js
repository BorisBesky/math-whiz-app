/**
 * upload-pdf-questions-background: PDFs now arrive as a Firebase Storage
 * reference (tiny JSON body) instead of an inline multipart body, because
 * Netlify background functions reject request bodies over ~256 KB with 413.
 */
const mockDocs = new Map();
const mockFiles = new Map();
const mockDeleted = [];
const mockGenerateContent = jest.fn();
const mockVerifyIdToken = jest.fn();

const mockDocRef = (path) => ({
  path,
  get: async () => ({ exists: mockDocs.has(path), data: () => mockDocs.get(path) }),
  set: async (data) => { mockDocs.set(path, { ...data }); },
  update: async (data) => {
    if (!mockDocs.has(path)) throw new Error(`No document to update: ${path}`);
    mockDocs.set(path, { ...mockDocs.get(path), ...data });
  },
  collection: (name) => mockCollectionRef(`${path}/${name}`),
});
const mockCollectionRef = (path) => ({ doc: (id) => mockDocRef(`${path}/${id}`) });

jest.mock('../../netlify/functions/firebase-admin', () => ({
  admin: {
    auth: () => ({ verifyIdToken: (...args) => mockVerifyIdToken(...args) }),
    firestore: { Timestamp: { now: () => 'NOW' } },
  },
  db: {
    collection: (name) => mockCollectionRef(name),
    doc: (path) => mockDocRef(path),
  },
  storage: {
    bucket: () => ({
      file: (path) => ({
        exists: async () => [mockFiles.has(path)],
        getMetadata: async () => [{ size: String(mockFiles.get(path)?.length || 0), contentType: 'application/pdf' }],
        download: async () => [mockFiles.get(path)],
        delete: async () => { mockDeleted.push(path); mockFiles.delete(path); },
      }),
    }),
  },
}));

// Plain class (not jest.fn) because CRA's resetMocks wipes mock implementations.
jest.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: class {
    getGenerativeModel() {
      return { generateContent: (...args) => mockGenerateContent(...args) };
    }
  },
}));

const { topicNamesForGrade } = require('../../netlify/functions/content-registry');
const storageHelpers = require('../../netlify/functions/pdf-upload-storage');
const uploadFn = require('../../netlify/functions/upload-pdf-questions-background');

const UID = 'teacherUid123';
const JOB_ID = `${UID}_1760000000000_abc123def`;
const STORAGE_PATH = `pdf-uploads/${UID}/${JOB_ID}.pdf`;
const JOB_PATH = `artifacts/default-app-id/pdfProcessingJobs/${JOB_ID}`;

const jsonEvent = (body) => ({
  httpMethod: 'POST',
  headers: { authorization: 'Bearer token', 'content-type': 'application/json' },
  body: JSON.stringify(body),
});

const validBody = () => ({
  appId: 'default-app-id',
  grade: 'G4',
  jobId: JOB_ID,
  classId: null,
  storagePath: STORAGE_PATH,
  fileName: 'grade4_practice_test.pdf',
});

describe('pdf-upload-storage helpers', () => {
  test('limit is 10 MB and matches the client constant', () => {
    const client = require('../utils/pdfUpload');
    expect(storageHelpers.MAX_PDF_UPLOAD_BYTES).toBe(10 * 1024 * 1024);
    expect(client.MAX_PDF_UPLOAD_BYTES).toBe(storageHelpers.MAX_PDF_UPLOAD_BYTES);
    expect(client.getPdfStoragePath(UID, JOB_ID)).toBe(storageHelpers.expectedStoragePath(UID, JOB_ID));
  });

  test('only accepts the uploader\'s own job path', () => {
    expect(storageHelpers.validateStoragePath(STORAGE_PATH, UID, JOB_ID)).toBe(STORAGE_PATH);
    expect(() => storageHelpers.validateStoragePath(`pdf-uploads/otherUid/${JOB_ID}.pdf`, UID, JOB_ID)).toThrow(/does not belong/);
    expect(() => storageHelpers.validateStoragePath(`pdf-uploads/${UID}/../x.pdf`, UID, JOB_ID)).toThrow(/does not belong/);
    expect(() => storageHelpers.validateStoragePath(undefined, UID, JOB_ID)).toThrow(/required/);
    expect(() => storageHelpers.validateStoragePath(STORAGE_PATH, UID, null)).toThrow(/jobId/);
  });
});

describe('upload-pdf-questions-background with a storage reference', () => {
  const originalKey = process.env.GEMINI_API_KEY;

  beforeEach(() => {
    mockDocs.clear();
    mockFiles.clear();
    mockDeleted.length = 0;
    mockVerifyIdToken.mockResolvedValue({ uid: UID });
    mockDocs.set(`artifacts/default-app-id/users/${UID}/math_whiz_data/profile`, { role: 'teacher' });
    process.env.GEMINI_API_KEY = 'test-key';
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
    if (originalKey === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = originalKey;
  });

  test('processes an ~8 MB PDF from storage and deletes it afterwards', async () => {
    const eightMb = Buffer.alloc(8 * 1024 * 1024, 7);
    mockFiles.set(STORAGE_PATH, eightMb);
    const topic = topicNamesForGrade('G4')[0];
    mockGenerateContent.mockResolvedValue({
      response: {
        text: () => JSON.stringify([
          { question: 'What is 6 x 7?', questionType: 'numeric', correctAnswer: '42', options: [], hint: 'Skip count by 7', topic },
        ]),
        candidates: [{ finishReason: 'STOP' }],
      },
    });

    const event = jsonEvent(validBody());
    // The request body the function receives is tiny, far below Netlify's
    // 256 KB background-function payload limit.
    expect(Buffer.byteLength(event.body)).toBeLessThan(1024);

    const res = await uploadFn.handler(event);
    expect(res.statusCode).toBe(202);

    const [input] = mockGenerateContent.mock.calls[0];
    expect(input[0].inlineData.mimeType).toBe('application/pdf');
    expect(Buffer.from(input[0].inlineData.data, 'base64').length).toBe(eightMb.length);

    const job = mockDocs.get(JOB_PATH);
    expect(job.status).toBe('completed');
    expect(job.userId).toBe(UID);
    expect(job.fileName).toBe('grade4_practice_test.pdf');
    expect(job.grade).toBe('G4');
    expect(job.questions).toHaveLength(1);
    expect(mockDeleted).toEqual([STORAGE_PATH]);
  });

  test('rejects a storagePath that belongs to someone else without reading it', async () => {
    const otherPath = `pdf-uploads/otherUid/${JOB_ID}.pdf`;
    mockFiles.set(otherPath, Buffer.from('%PDF'));
    const res = await uploadFn.handler(jsonEvent({ ...validBody(), storagePath: otherPath }));
    expect(res.statusCode).toBe(400);
    expect(JSON.parse(res.body).error).toMatch(/does not belong/);
    expect(mockGenerateContent).not.toHaveBeenCalled();
    expect(mockDeleted).toEqual([]);
    expect(mockDocs.has(JOB_PATH)).toBe(false);
  });

  test('marks the job as an error when the uploaded file is missing', async () => {
    const res = await uploadFn.handler(jsonEvent(validBody()));
    expect(res.statusCode).toBe(202);
    const job = mockDocs.get(JOB_PATH);
    expect(job.status).toBe('error');
    expect(job.error).toMatch(/not found in storage/i);
    expect(mockGenerateContent).not.toHaveBeenCalled();
  });

  test('marks the job as an error when the stored file is over 10 MB', async () => {
    mockFiles.set(STORAGE_PATH, Buffer.alloc(10 * 1024 * 1024 + 1));
    await uploadFn.handler(jsonEvent(validBody()));
    const job = mockDocs.get(JOB_PATH);
    expect(job.status).toBe('error');
    expect(job.error).toMatch(/10MB/);
    expect(mockGenerateContent).not.toHaveBeenCalled();
    expect(mockDeleted).toEqual([STORAGE_PATH]);
  });

  test('non-teachers get an error on their job and the upload is deleted', async () => {
    mockDocs.set(`artifacts/default-app-id/users/${UID}/math_whiz_data/profile`, { role: 'student' });
    mockFiles.set(STORAGE_PATH, Buffer.from('%PDF-1.4'));
    const res = await uploadFn.handler(jsonEvent(validBody()));
    expect(res.statusCode).toBe(403);
    expect(mockDocs.get(JOB_PATH)).toMatchObject({ status: 'error', userId: UID });
    expect(mockDeleted).toEqual([STORAGE_PATH]);
    expect(mockGenerateContent).not.toHaveBeenCalled();
  });

  test('returns 400 for a malformed JSON body', async () => {
    const res = await uploadFn.handler({ ...jsonEvent(validBody()), body: '{not json' });
    expect(res.statusCode).toBe(400);
    expect(JSON.parse(res.body).error).toMatch(/valid JSON/);
  });

  test('requires authentication', async () => {
    const res = await uploadFn.handler({ ...jsonEvent(validBody()), headers: { 'content-type': 'application/json' } });
    expect(res.statusCode).toBe(401);
  });
});
