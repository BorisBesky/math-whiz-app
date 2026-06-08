let mockGetIdToken;
let mockUpdateDoc;
let mockGetDocs;
let mockDoc;

jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(),
}));

jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(() => ({})),
  doc: (...args) => mockDoc(...args),
  collection: jest.fn(() => 'collection-ref'),
  query: jest.fn((ref) => ref),
  where: jest.fn(() => 'where-clause'),
  getDocs: (...args) => mockGetDocs(...args),
  updateDoc: (...args) => mockUpdateDoc(...args),
}));

const { renderHook } = require('@testing-library/react');
const useClassAssignments = require('../useClassAssignments').default;
const { getAuth } = require('firebase/auth');

describe('useClassAssignments', () => {
  beforeEach(() => {
    mockGetIdToken = jest.fn().mockResolvedValue('token-abc');
    mockUpdateDoc = jest.fn().mockResolvedValue(undefined);
    mockGetDocs = jest.fn();
    mockDoc = jest.fn((...parts) => ({ path: parts.join('/') }));
    getAuth.mockReturnValue({ currentUser: { getIdToken: mockGetIdToken } });
    global.fetch = jest.fn();
  });

  afterEach(() => {
    delete global.fetch;
  });

  describe('removeStudentFromClass', () => {
    it('throws when studentId or classId is missing', async () => {
      const { result } = renderHook(() => useClassAssignments({ appId: 'app-1' }));
      await expect(
        result.current.removeStudentFromClass({ studentId: '', classId: 'c1' })
      ).rejects.toThrow('Student ID and class ID are required');
    });

    it('deletes the enrollment record and updates the student profile', async () => {
      global.fetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [{ id: 'enroll-1', studentId: 'student-1', classId: 'class-1' }],
        })
        .mockResolvedValueOnce({ ok: true, json: async () => ({}) });

      mockGetDocs.mockResolvedValueOnce({
        empty: true,
        docs: [],
        forEach: () => {},
      });

      const { result } = renderHook(() => useClassAssignments({ appId: 'app-1' }));
      await result.current.removeStudentFromClass({ studentId: 'student-1', classId: 'class-1' });

      expect(global.fetch).toHaveBeenCalledTimes(2);
      expect(mockUpdateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ classId: null })
      );
    });

    it('sets the next primary classId when other enrollments remain', async () => {
      global.fetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [{ id: 'enroll-1', studentId: 'student-1', classId: 'class-1' }],
        })
        .mockResolvedValueOnce({ ok: true, json: async () => ({}) });

      mockGetDocs.mockResolvedValueOnce({
        empty: false,
        docs: [{ data: () => ({ classId: 'class-2' }) }],
        forEach: () => {},
      });

      const { result } = renderHook(() => useClassAssignments({ appId: 'app-1' }));
      await result.current.removeStudentFromClass({ studentId: 'student-1', classId: 'class-1' });

      expect(mockUpdateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ classId: 'class-2' })
      );
    });

    it('throws when enrollment lookup fails', async () => {
      global.fetch.mockResolvedValueOnce({ ok: false, json: async () => ({ error: 'Not found' }) });
      const { result } = renderHook(() => useClassAssignments({ appId: 'app-1' }));
      await expect(
        result.current.removeStudentFromClass({ studentId: 'student-1', classId: 'class-1' })
      ).rejects.toThrow('Not found');
    });

    it('throws when user is not authenticated', async () => {
      getAuth.mockReturnValueOnce({ currentUser: null });
      const { result } = renderHook(() => useClassAssignments({ appId: 'app-1' }));
      await expect(
        result.current.removeStudentFromClass({ studentId: 'student-1', classId: 'class-1' })
      ).rejects.toThrow('User not authenticated');
    });
  });

  describe('assignStudentToClass', () => {
    it('throws when studentId or classId is missing', async () => {
      const { result } = renderHook(() => useClassAssignments({ appId: 'app-1' }));
      await expect(
        result.current.assignStudentToClass({ studentId: '', classId: '' })
      ).rejects.toThrow('Student ID and class ID are required');
    });

    it('posts enrollment and updates the student profile classId', async () => {
      global.fetch.mockResolvedValueOnce({ ok: true, json: async () => ({ id: 'enroll-new' }) });

      const { result } = renderHook(() => useClassAssignments({ appId: 'app-1' }));
      await result.current.assignStudentToClass({
        studentId: 'student-2',
        classId: 'class-3',
        studentName: 'Bob',
        studentEmail: 'bob@school.com',
      });

      expect(global.fetch).toHaveBeenCalledWith(
        '/.netlify/functions/class-students',
        expect.objectContaining({ method: 'POST' })
      );
      expect(mockUpdateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ classId: 'class-3' })
      );
    });

    it('throws when the POST request fails', async () => {
      global.fetch.mockResolvedValueOnce({ ok: false, json: async () => ({ error: 'Duplicate' }) });
      const { result } = renderHook(() => useClassAssignments({ appId: 'app-1' }));
      await expect(
        result.current.assignStudentToClass({ studentId: 's1', classId: 'c1' })
      ).rejects.toThrow('Duplicate');
    });
  });
});
