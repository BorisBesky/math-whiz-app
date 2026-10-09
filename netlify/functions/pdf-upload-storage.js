// Helpers for PDF uploads that go through Firebase Storage.
//
// Netlify background functions only accept a request payload of about 256 KB,
// so the browser uploads the PDF straight to Firebase Storage at
// pdf-uploads/{uid}/{jobId}.pdf (see storage.rules) and then sends only that
// path to upload-pdf-questions-background, which downloads the file here.

const PDF_UPLOAD_PREFIX = "pdf-uploads";
const MAX_PDF_UPLOAD_BYTES = 10 * 1024 * 1024; // 10 MB (keep in sync with src/utils/pdfUpload.js)

const expectedStoragePath = (userId, jobId) =>
  `${PDF_UPLOAD_PREFIX}/${userId}/${jobId}.pdf`;

/**
 * Only accept the exact path this user's job would have written. That stops a
 * caller from pointing the function at somebody else's file.
 */
const validateStoragePath = (storagePath, userId, jobId) => {
  if (!storagePath || typeof storagePath !== "string") {
    throw new Error("storagePath is required");
  }
  if (!jobId) {
    throw new Error("A valid jobId is required with storagePath");
  }
  if (storagePath !== expectedStoragePath(userId, jobId)) {
    throw new Error("storagePath does not belong to this upload");
  }
  return storagePath;
};

const loadPdfFromStorage = async ({ bucket, storagePath, maxBytes = MAX_PDF_UPLOAD_BYTES }) => {
  const file = bucket.file(storagePath);
  const [exists] = await file.exists();
  if (!exists) {
    throw new Error("Uploaded PDF was not found in storage. Please upload it again.");
  }
  const [metadata] = await file.getMetadata();
  const size = Number(metadata?.size || 0);
  if (size > maxBytes) {
    throw new Error(`File size exceeds ${Math.round(maxBytes / (1024 * 1024))}MB limit`);
  }
  const [fileData] = await file.download();
  return {
    fileData,
    size: fileData.length,
    contentType: metadata?.contentType || "application/pdf",
  };
};

const deleteStoredPdf = async (bucket, storagePath) => {
  try {
    await bucket.file(storagePath).delete({ ignoreNotFound: true });
  } catch (error) {
    console.warn(`Could not delete uploaded PDF ${storagePath}:`, error.message);
  }
};

module.exports = {
  PDF_UPLOAD_PREFIX,
  MAX_PDF_UPLOAD_BYTES,
  expectedStoragePath,
  validateStoragePath,
  loadPdfFromStorage,
  deleteStoredPdf,
};
