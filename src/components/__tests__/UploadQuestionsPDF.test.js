import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

const mockUploadBytesResumable = jest.fn();
const mockDeleteObject = jest.fn();
const mockStorageBehavior = { error: null };

jest.mock('firebase/auth', () => ({
  getAuth: () => ({ currentUser: { uid: 'teacherUid', getIdToken: () => Promise.resolve('id-token') } }),
}));
jest.mock('firebase/firestore', () => ({
  getFirestore: () => ({}),
  collection: () => ({}),
  query: () => ({}),
  where: () => ({}),
  limit: () => ({}),
  doc: () => ({}),
  updateDoc: () => Promise.resolve(),
  onSnapshot: (q, next) => { next({ size: 0, forEach: () => {} }); return () => {}; },
}));
jest.mock('firebase/storage', () => ({
  getStorage: () => ({}),
  ref: (storage, path) => ({ fullPath: path }),
  uploadBytesResumable: (...args) => mockUploadBytesResumable(...args),
  deleteObject: (...args) => mockDeleteObject(...args),
}));
jest.mock('../QuestionReviewModal', () => ({ questions, fileName }) => (
  <div data-testid="review-modal">{fileName}: {questions.length} questions</div>
));

// eslint-disable-next-line import/first
import UploadQuestionsPDF from '../UploadQuestionsPDF';

const makePdf = (bytes, name = 'grade4_practice_test.pdf') => {
  const file = new File(['%PDF-1.4'], name, { type: 'application/pdf' });
  Object.defineProperty(file, 'size', { value: bytes });
  return file;
};

const selectFile = (file) => {
  fireEvent.change(screen.getByLabelText(/upload a pdf file/i), { target: { files: [file] } });
};

const jsonResponse = (status, body, extra = {}) => ({
  ok: status >= 200 && status < 300,
  status,
  statusText: '',
  headers: { get: (name) => (name.toLowerCase() === 'content-type' ? 'application/json' : null) },
  text: () => Promise.resolve(body === undefined ? '' : JSON.stringify(body)),
  ...extra,
});

describe('UploadQuestionsPDF', () => {
  beforeEach(() => {
    mockStorageBehavior.error = null;
    mockDeleteObject.mockResolvedValue(undefined);
    mockUploadBytesResumable.mockImplementation(() => ({
      on: (event, next, fail, complete) => {
        next({ bytesTransferred: 50, totalBytes: 100 });
        if (mockStorageBehavior.error) fail(mockStorageBehavior.error);
        else complete();
      },
    }));
    global.fetch = jest.fn();
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
    delete global.fetch;
  });

  it('advertises the 10 MB limit', () => {
    render(<UploadQuestionsPDF appId="app-1" />);
    expect(screen.getByText('PDF up to 10 MB')).toBeInTheDocument();
  });

  it('rejects a PDF over 10 MB before uploading, with a clear message', () => {
    render(<UploadQuestionsPDF appId="app-1" />);
    selectFile(makePdf(12.4 * 1024 * 1024));
    expect(screen.getByText(/This PDF is 12\.4 MB\. The maximum is 10 MB/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /upload & extract/i })).toBeDisabled();
    expect(mockUploadBytesResumable).not.toHaveBeenCalled();
  });

  it('uploads an ~8 MB PDF to storage, then sends only a JSON reference to the function', async () => {
    global.fetch
      .mockResolvedValueOnce({ ok: true, status: 202, statusText: '', headers: { get: () => null }, text: () => Promise.resolve('') })
      .mockResolvedValueOnce(jsonResponse(200, { status: 'completed', progress: 100, questions: [{ question: 'q1' }], fileName: 'grade4_practice_test.pdf' }));

    render(<UploadQuestionsPDF appId="app-1" classId="class-9" />);
    selectFile(makePdf(8 * 1024 * 1024));
    expect(screen.getByText('(8.0 MB)')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /upload & extract/i }));

    expect(await screen.findByTestId('review-modal')).toHaveTextContent('grade4_practice_test.pdf: 1 questions');

    const [storageRef, uploadedFile, metadata] = mockUploadBytesResumable.mock.calls[0];
    expect(storageRef.fullPath).toMatch(/^pdf-uploads\/teacherUid\/teacherUid_\d+_[a-z0-9]+\.pdf$/);
    expect(uploadedFile.size).toBe(8 * 1024 * 1024);
    expect(metadata.contentType).toBe('application/pdf');

    const [url, init] = global.fetch.mock.calls[0];
    expect(url).toBe('/.netlify/functions/upload-pdf-questions-background');
    expect(init.headers['Content-Type']).toBe('application/json');
    expect(init.headers.Authorization).toBe('Bearer id-token');
    const body = JSON.parse(init.body);
    expect(body).toMatchObject({ appId: 'app-1', classId: 'class-9', fileName: 'grade4_practice_test.pdf', storagePath: storageRef.fullPath });
    expect(storageRef.fullPath).toBe(`pdf-uploads/teacherUid/${body.jobId}.pdf`);
    expect(init.body.length).toBeLessThan(1024);

    expect(global.fetch.mock.calls[1][0]).toContain(`upload-pdf-questions-status?jobId=${body.jobId}&appId=app-1`);
    expect(mockDeleteObject).not.toHaveBeenCalled();
  });

  it('shows a friendly, non-empty message for a bodyless HTTP 413 and cleans up the upload', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false, status: 413, statusText: '', headers: { get: () => null }, text: () => Promise.resolve(''),
    });
    render(<UploadQuestionsPDF appId="app-1" />);
    selectFile(makePdf(5 * 1024 * 1024));
    fireEvent.click(screen.getByRole('button', { name: /upload & extract/i }));

    expect(await screen.findByText(/too large for the server to accept\. PDFs must be 10 MB or smaller/i)).toBeInTheDocument();
    expect(screen.queryByText(/HTTP 413/)).not.toBeInTheDocument();
    await waitFor(() => expect(mockDeleteObject).toHaveBeenCalled());
  });

  it('explains storage permission errors and never calls the function', async () => {
    mockStorageBehavior.error = Object.assign(new Error('denied'), { code: 'storage/unauthorized' });
    render(<UploadQuestionsPDF appId="app-1" />);
    selectFile(makePdf(1024 * 1024));
    fireEvent.click(screen.getByRole('button', { name: /upload & extract/i }));

    expect(await screen.findByText(/blocked by storage permissions/i)).toBeInTheDocument();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('shows a connection message when the function cannot be reached', async () => {
    global.fetch.mockRejectedValueOnce(new TypeError('Failed to fetch'));
    render(<UploadQuestionsPDF appId="app-1" />);
    selectFile(makePdf(1024 * 1024));
    fireEvent.click(screen.getByRole('button', { name: /upload & extract/i }));
    expect(await screen.findByText(/could not reach the server/i)).toBeInTheDocument();
  });
});
