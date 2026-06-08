let mockGetIdToken;

jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(),
}));

jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(() => ({})),
  collection: jest.fn(() => 'collection-ref'),
  addDoc: jest.fn(() => Promise.resolve({ id: 'new-class-id' })),
  query: jest.fn((ref) => ref),
  where: jest.fn(),
  onSnapshot: jest.fn((ref, success) => {
    success({ docs: [] });
    return jest.fn();
  }),
}));

const { renderHook, act } = require('@testing-library/react');
const usePortalClasses = require('../usePortalClasses').default;
const { getAuth } = require('firebase/auth');

describe('usePortalClasses - updateClass', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetIdToken = jest.fn().mockResolvedValue('token-abc');
    getAuth.mockReturnValue({ currentUser: { getIdToken: mockGetIdToken } });
    global.fetch = jest.fn();
    // Re-hook onSnapshot to call success callback
    const { onSnapshot } = require('firebase/firestore');
    onSnapshot.mockImplementation((ref, success) => { success({ docs: [] }); return jest.fn(); });
  });

  afterEach(() => {
    delete global.fetch;
  });

  const renderHookWithRole = (role = 'teacher') =>
    renderHook(() =>
      usePortalClasses({ appId: 'test-app', userRole: role, userId: 'uid-1', userEmail: 'teacher@test.com' })
    );

  it('throws when classId is missing', async () => {
    const { result } = renderHookWithRole();
    await expect(result.current.updateClass('', { name: 'New' })).rejects.toThrow('Class ID is required');
  });

  it('throws when user role is not authorized', async () => {
    const { result } = renderHookWithRole('student');
    await expect(result.current.updateClass('class-1', { name: 'New' })).rejects.toThrow(
      'You do not have permission to update classes'
    );
  });

  it('throws when there is no authenticated user', async () => {
    getAuth.mockReturnValueOnce({ currentUser: null });
    const { result } = renderHookWithRole('teacher');
    await expect(result.current.updateClass('class-1', { name: 'New' })).rejects.toThrow(
      'Authentication required'
    );
  });

  it('sends a PUT request with auth token and class data', async () => {
    global.fetch.mockResolvedValueOnce({ ok: true, json: async () => ({}) });
    const { result } = renderHookWithRole('teacher');
    await act(async () => {
      await result.current.updateClass('class-1', { name: 'Updated Room', gradeLevel: 'G4' });
    });

    expect(global.fetch).toHaveBeenCalledWith(
      '/.netlify/functions/classes?id=class-1',
      expect.objectContaining({
        method: 'PUT',
        headers: expect.objectContaining({
          Authorization: 'Bearer token-abc',
          'Content-Type': 'application/json',
        }),
        body: JSON.stringify({ name: 'Updated Room', gradeLevel: 'G4' }),
      })
    );
  });

  it('throws with the server error message when PUT fails', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Class not found' }),
    });
    const { result } = renderHookWithRole('admin');
    await expect(result.current.updateClass('class-1', {})).rejects.toThrow('Class not found');
  });

  it('also allows admin role to update', async () => {
    global.fetch.mockResolvedValueOnce({ ok: true, json: async () => ({}) });
    const { result } = renderHookWithRole('admin');
    await act(async () => {
      await result.current.updateClass('class-1', { name: 'Admin Updated' });
    });
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });
});
