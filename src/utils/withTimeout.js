export class TimeoutError extends Error {
  constructor(label, ms) {
    super(`${label} timed out after ${ms}ms`);
    this.name = 'TimeoutError';
    this.timeoutMs = ms;
  }
}

export const isTimeoutError = (error) => error instanceof TimeoutError;

// Rejects with TimeoutError if `promise` hasn't settled within `ms`. The
// underlying work is not cancelled (Firestore reads can't be), only abandoned.
export const withTimeout = (promise, ms, label = 'operation') => {
  let timerId;
  const timeout = new Promise((_, reject) => {
    timerId = setTimeout(() => reject(new TimeoutError(label, ms)), ms);
  });
  return Promise.race([Promise.resolve(promise), timeout]).finally(() => clearTimeout(timerId));
};

export default withTimeout;
