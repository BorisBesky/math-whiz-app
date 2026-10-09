// Shared rules and messages for the portal's "Upload PDF Questions" flow.
//
// The PDF goes straight from the browser to Firebase Storage
// (pdf-uploads/{uid}/{jobId}.pdf); the Netlify background function only gets
// a small JSON reference. Netlify background functions reject request bodies
// over ~256 KB with an empty 413, which is why PDFs used to fail.

export const MAX_PDF_UPLOAD_BYTES = 10 * 1024 * 1024; // keep in sync with netlify/functions/pdf-upload-storage.js
export const MAX_PDF_UPLOAD_LABEL = '10 MB';
export const PDF_UPLOAD_PREFIX = 'pdf-uploads';

export const getPdfStoragePath = (userId, jobId) => `${PDF_UPLOAD_PREFIX}/${userId}/${jobId}.pdf`;

export const formatFileSize = (bytes) => {
  if (!Number.isFinite(bytes) || bytes < 0) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

/** Returns a user-facing error string, or null when the file is OK. */
export const validatePdfFile = (file) => {
  if (!file) return 'Please select a PDF file.';
  const looksLikePdf = file.type === 'application/pdf' || (file.name || '').toLowerCase().endsWith('.pdf');
  if (!looksLikePdf) return 'Please select a PDF file.';
  if (!file.size) return 'This file is empty. Please choose another PDF.';
  if (file.size > MAX_PDF_UPLOAD_BYTES) {
    return `This PDF is ${formatFileSize(file.size)}. The maximum is ${MAX_PDF_UPLOAD_LABEL}. Try splitting it into smaller files or saving a compressed copy.`;
  }
  return null;
};

const STATUS_MESSAGES = {
  400: 'The server could not read this upload. Please try again.',
  401: 'Your session has expired. Please sign out and sign back in, then try again.',
  403: 'Only teacher or admin accounts can upload PDFs.',
  404: 'The upload service could not be found. Please try again later.',
  408: 'The upload timed out. Check your connection and try again.',
  413: `This file is too large for the server to accept. PDFs must be ${MAX_PDF_UPLOAD_LABEL} or smaller.`,
  429: 'Too many uploads right now. Please wait a minute and try again.',
};

/**
 * Turn a failed HTTP response into a non-empty, friendly message. Uses the
 * server's JSON `error` when present; otherwise falls back by status code
 * (Netlify's own 413/502 responses have no body and, over HTTP/2, no status
 * text either, which used to produce "HTTP 413:").
 */
export const describeHttpError = (status, bodyText = '') => {
  let serverMessage = '';
  if (bodyText && typeof bodyText === 'string') {
    try {
      const data = JSON.parse(bodyText);
      serverMessage = (data && (data.error || data.message)) || '';
    } catch (e) {
      serverMessage = '';
    }
  }
  if (serverMessage && typeof serverMessage === 'string' && serverMessage.trim()) {
    return serverMessage.trim();
  }
  if (STATUS_MESSAGES[status]) return STATUS_MESSAGES[status];
  if (status >= 500) return `The server had a problem processing the upload (error ${status}). Please try again in a moment.`;
  return `Upload failed (error ${status || 'unknown'}). Please try again.`;
};

/** Friendly message for Firebase Storage upload errors. */
export const describeStorageError = (error) => {
  const code = error?.code || '';
  switch (code) {
    case 'storage/unauthorized':
      return 'The upload was blocked by storage permissions. Ask an admin to deploy the latest Firebase Storage rules (storage.rules), then try again.';
    case 'storage/unauthenticated':
      return 'Your session has expired. Please sign out and sign back in, then try again.';
    case 'storage/canceled':
      return 'The upload was cancelled.';
    case 'storage/quota-exceeded':
      return 'File storage is full. Please contact an admin.';
    case 'storage/retry-limit-exceeded':
    case 'storage/server-file-wrong-size':
      return 'The upload kept failing. Check your internet connection and try again.';
    case 'storage/no-default-bucket':
    case 'storage/bucket-not-found':
      return 'File storage is not set up for this app. Please contact an admin.';
    default:
      return error?.message ? `The PDF could not be uploaded: ${error.message}` : 'The PDF could not be uploaded. Please try again.';
  }
};
