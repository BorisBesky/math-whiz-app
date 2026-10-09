import {
  MAX_PDF_UPLOAD_BYTES,
  describeHttpError,
  describeStorageError,
  formatFileSize,
  getPdfStoragePath,
  validatePdfFile,
} from '../pdfUpload';

const pdf = (size, name = 'grade4_practice_test.pdf', type = 'application/pdf') => ({ size, name, type });

describe('pdfUpload utils', () => {
  test('accepts PDFs up to and including 10 MB', () => {
    expect(validatePdfFile(pdf(200 * 1024))).toBeNull();
    expect(validatePdfFile(pdf(8 * 1024 * 1024))).toBeNull();
    expect(validatePdfFile(pdf(MAX_PDF_UPLOAD_BYTES))).toBeNull();
  });

  test('rejects oversize files with a clear message', () => {
    const message = validatePdfFile(pdf(12.4 * 1024 * 1024));
    expect(message).toMatch(/12\.4 MB/);
    expect(message).toMatch(/maximum is 10 MB/);
  });

  test('rejects non-PDF and empty files', () => {
    expect(validatePdfFile(pdf(1000, 'notes.docx', 'application/msword'))).toMatch(/PDF/);
    expect(validatePdfFile(pdf(0))).toMatch(/empty/);
    expect(validatePdfFile(null)).toMatch(/select a PDF/);
    // Some browsers give PDFs an empty MIME type; the extension is enough.
    expect(validatePdfFile(pdf(1000, 'test.PDF', ''))).toBeNull();
  });

  test('formats sizes', () => {
    expect(formatFileSize(512)).toBe('512 B');
    expect(formatFileSize(300 * 1024)).toBe('300 KB');
    expect(formatFileSize(8 * 1024 * 1024)).toBe('8.0 MB');
  });

  test('storage path is per user and per job', () => {
    expect(getPdfStoragePath('u1', 'u1_1_x')).toBe('pdf-uploads/u1/u1_1_x.pdf');
  });

  describe('describeHttpError', () => {
    test('never returns an empty message for a bodyless 413', () => {
      const message = describeHttpError(413, '');
      expect(message).toMatch(/too large/i);
      expect(message).toMatch(/10 MB/);
    });

    test('prefers the server JSON error', () => {
      expect(describeHttpError(400, JSON.stringify({ error: 'storagePath is required' }))).toBe('storagePath is required');
    });

    test('ignores non-JSON bodies (e.g. gateway HTML) and falls back by status', () => {
      expect(describeHttpError(502, '<html>Bad gateway</html>')).toMatch(/server had a problem.*502/i);
      expect(describeHttpError(401, '')).toMatch(/session has expired/i);
      expect(describeHttpError(403, '')).toMatch(/teacher or admin/i);
      expect(describeHttpError(418, '')).toMatch(/error 418/);
      expect(describeHttpError(undefined, '')).toMatch(/unknown/);
    });
  });

  test('describeStorageError explains permission failures', () => {
    expect(describeStorageError({ code: 'storage/unauthorized' })).toMatch(/storage rules/i);
    expect(describeStorageError({ code: 'storage/retry-limit-exceeded' })).toMatch(/connection/i);
    expect(describeStorageError({ code: 'storage/other', message: 'boom' })).toMatch(/boom/);
    expect(describeStorageError(undefined)).toMatch(/could not be uploaded/);
  });
});
