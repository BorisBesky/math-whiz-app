const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const getErrorSummary = (err) => {
  if (!err) return { name: undefined, message: undefined };
  const summary = {
    name: err.name,
    message: err.message,
  };
  // undici/Node fetch errors frequently include a nested cause
  if (err.cause) {
    summary.cause = {
      name: err.cause.name,
      message: err.cause.message,
      code: err.cause.code,
    };
  }
  if (typeof err.code !== "undefined") summary.code = err.code;
  return summary;
};

const isRetryableNetworkError = (err) => {
  const message = (err?.message || "").toLowerCase();
  const causeCode = err?.cause?.code;
  return (
    (err?.name === "TypeError" && message.includes("fetch failed")) ||
    (causeCode &&
      [
        "ECONNRESET",
        "ETIMEDOUT",
        "EAI_AGAIN",
        "ENOTFOUND",
        "ECONNREFUSED",
        "UND_ERR_CONNECT_TIMEOUT",
      ].includes(causeCode)) ||
    message.includes("socket hang up") ||
    message.includes("timed out")
  );
};

const isRetryableFirestoreError = (err) => {
  // gRPC status codes: 4 = DEADLINE_EXCEEDED, 14 = UNAVAILABLE, 13 = INTERNAL
  const code = err?.code;
  const message = (err?.message || "").toLowerCase();
  return (
    code === 4 ||
    code === 14 ||
    code === 13 ||
    message.includes("deadline") ||
    message.includes("unavailable")
  );
};

const runWithTimeout = async (promise, timeoutMs, timeoutMessage) => {
  let timeoutHandle;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutHandle = setTimeout(
      () => reject(new Error(timeoutMessage)),
      timeoutMs
    );
  });
  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    clearTimeout(timeoutHandle);
  }
};

const updateDocWithRetry = async (
  docRef,
  data,
  { retries = 3, baseDelayMs = 500, operationLabel = "Firestore update" } = {}
) => {
  for (let attempt = 1; attempt <= retries + 1; attempt++) {
    try {
      await docRef.update(data);
      return;
    } catch (err) {
      const retryable =
        isRetryableFirestoreError(err) || isRetryableNetworkError(err);
      console.error(
        `${operationLabel} failed (attempt ${attempt}/${retries + 1})`,
        getErrorSummary(err)
      );
      if (!retryable || attempt === retries + 1) throw err;
      await sleep(baseDelayMs * Math.pow(2, attempt - 1));
    }
  }
};

const setDocWithRetry = async (
  docRef,
  data,
  { retries = 3, baseDelayMs = 500, operationLabel = "Firestore set" } = {}
) => {
  for (let attempt = 1; attempt <= retries + 1; attempt++) {
    try {
      await docRef.set(data);
      return;
    } catch (err) {
      const retryable =
        isRetryableFirestoreError(err) || isRetryableNetworkError(err);
      console.error(
        `${operationLabel} failed (attempt ${attempt}/${retries + 1})`,
        getErrorSummary(err)
      );
      if (!retryable || attempt === retries + 1) throw err;
      await sleep(baseDelayMs * Math.pow(2, attempt - 1));
    }
  }
};

const generateContentWithRetry = async (
  model,
  input,
  { label = "generateContent", retries = 2 } = {}
) => {
  const timeoutMs = parseInt(process.env.GEMINI_REQUEST_TIMEOUT_MS) || 180000; // 3 minutes
  for (let attempt = 1; attempt <= retries + 1; attempt++) {
    try {
      const result = await runWithTimeout(
        model.generateContent(input),
        timeoutMs,
        `Gemini request timed out after ${timeoutMs}ms (${label})`
      );
      return result;
    } catch (err) {
      const retryable = isRetryableNetworkError(err);
      console.error(
        `Gemini ${label} failed (attempt ${attempt}/${retries + 1})`,
        getErrorSummary(err)
      );
      if (!retryable || attempt === retries + 1) throw err;
      await sleep(800 * Math.pow(2, attempt - 1));
    }
  }
};

module.exports = {
  sleep,
  getErrorSummary,
  isRetryableNetworkError,
  isRetryableFirestoreError,
  runWithTimeout,
  updateJobWithRetry: updateDocWithRetry,
  setJobWithRetry: setDocWithRetry,
  generateContentWithRetry,
};
