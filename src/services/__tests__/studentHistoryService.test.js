let mockGetIdToken;

jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(),
}));

const { fetchStudentHistory } = require('../studentHistoryService');
const { getAuth } = require('firebase/auth');

const okResponse = (body) =>
  Promise.resolve({ ok: true, json: async () => body });

const errResponse = (status, body) =>
  Promise.resolve({ ok: false, status, json: async () => body });

describe('fetchStudentHistory', () => {
  beforeEach(() => {
    mockGetIdToken = jest.fn().mockResolvedValue('token-test');
    getAuth.mockReturnValue({ currentUser: { getIdToken: mockGetIdToken } });
    global.fetch = jest.fn();
  });

  afterEach(() => {
    delete global.fetch;
  });

  it('throws when no authenticated user', async () => {
    getAuth.mockReturnValueOnce({ currentUser: null });
    await expect(
      fetchStudentHistory({ studentId: 'student-1' })
    ).rejects.toThrow('No authenticated user found');
  });

  it('throws when studentId is missing', async () => {
    await expect(fetchStudentHistory({})).rejects.toThrow('studentId is required');
  });

  it('sends a POST to get-student-history with correct payload', async () => {
    global.fetch.mockResolvedValue(okResponse({ answeredQuestions: [] }));
    await fetchStudentHistory({
      appId: 'app-1',
      studentId: 'student-1',
      classId: 'class-1',
      startDate: '2026-01-01',
      endDate: '2026-01-07',
    });
    expect(global.fetch).toHaveBeenCalledWith(
      '/.netlify/functions/get-student-history',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer token-test',
          'Content-Type': 'application/json',
        }),
        body: JSON.stringify({
          appId: 'app-1',
          studentId: 'student-1',
          classId: 'class-1',
          startDate: '2026-01-01',
          endDate: '2026-01-07',
        }),
      })
    );
  });

  it('returns the answeredQuestions array on success', async () => {
    const questions = [{ id: 'q1', isCorrect: true }];
    global.fetch.mockResolvedValue(okResponse({ answeredQuestions: questions }));
    const result = await fetchStudentHistory({ studentId: 's1' });
    expect(result).toEqual(questions);
  });

  it('returns an empty array when answeredQuestions is missing', async () => {
    global.fetch.mockResolvedValue(okResponse({}));
    const result = await fetchStudentHistory({ studentId: 's1' });
    expect(result).toEqual([]);
  });

  it('throws with server error message on non-ok response', async () => {
    global.fetch.mockResolvedValue(errResponse(500, { error: 'Server error' }));
    await expect(fetchStudentHistory({ studentId: 's1' })).rejects.toThrow('Server error');
  });

  it('throws a generic status message when error body is empty', async () => {
    global.fetch.mockResolvedValue(
      Promise.resolve({ ok: false, status: 503, json: async () => { throw new Error('bad json'); } })
    );
    await expect(fetchStudentHistory({ studentId: 's1' })).rejects.toThrow('Request failed with status 503');
  });

  it('uses default appId when not provided', async () => {
    global.fetch.mockResolvedValue(okResponse({ answeredQuestions: [] }));
    await fetchStudentHistory({ studentId: 's1' });
    const body = JSON.parse(global.fetch.mock.calls[0][1].body);
    expect(body.appId).toBe('default-app-id');
  });
});
