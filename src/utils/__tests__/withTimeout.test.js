import { TimeoutError, isTimeoutError, withTimeout } from '../withTimeout';

describe('withTimeout', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  test('resolves with the value when the promise settles in time', async () => {
    await expect(withTimeout(Promise.resolve('ok'), 100, 'read')).resolves.toBe('ok');
  });

  test('passes through the original rejection', async () => {
    const error = new Error('boom');
    await expect(withTimeout(Promise.reject(error), 100, 'read')).rejects.toBe(error);
  });

  test('rejects with a TimeoutError when the promise never settles', async () => {
    jest.useFakeTimers();
    const pending = withTimeout(new Promise(() => {}), 500, 'Attempt history read');
    jest.advanceTimersByTime(500);
    await expect(pending).rejects.toBeInstanceOf(TimeoutError);
    await expect(pending).rejects.toThrow('Attempt history read timed out after 500ms');
  });

  test('clears its timer once the promise settles', async () => {
    jest.useFakeTimers();
    await withTimeout(Promise.resolve(1), 1000, 'read');
    expect(jest.getTimerCount()).toBe(0);
  });

  test('isTimeoutError only matches TimeoutError', () => {
    expect(isTimeoutError(new TimeoutError('x', 1))).toBe(true);
    expect(isTimeoutError(new Error('x timed out'))).toBe(false);
    expect(isTimeoutError(null)).toBe(false);
  });
});
