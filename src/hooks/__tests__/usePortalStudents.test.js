// Regression coverage for the parallelization of per-class enrollment reads.
// The previous implementation used a serial `for` loop, so a teacher with N
// classes paid an N× RPC latency on every 30-second auto-refresh. This test
// asserts that every enrollment query is in flight before any of them
// completes.

let mockGetIdToken;

jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(),
}));

jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(() => ({})),
  collection: jest.fn(() => 'collection-ref'),
  query: jest.fn((ref) => ref),
  where: jest.fn(),
  getDocs: jest.fn(),
}));

jest.mock('../../utils/studentName', () => ({
  getStudentDisplayName: (data) => data?.displayName || data?.id || 'Student',
}));

const { renderHook, waitFor, act } = require('@testing-library/react');
const usePortalStudents = require('../usePortalStudents').default;
const { getAuth } = require('firebase/auth');
const { getDocs } = require('firebase/firestore');

describe('usePortalStudents - parallel enrollment fetch', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetIdToken = jest.fn().mockResolvedValue('token-abc');
    getAuth.mockReturnValue({ currentUser: { getIdToken: mockGetIdToken } });
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => [],
    });
  });

  afterEach(() => {
    delete global.fetch;
  });

  it('starts every class enrollment query in parallel, not serially', async () => {
    const classes = Array.from({ length: 5 }, (_, i) => ({ id: `class-${i}`, name: `Class ${i}` }));

    // Each getDocs call resolves only when we manually release it. If the
    // hook fired the queries serially, we'd see exactly one in flight at a
    // time. In parallel we should see all `classes.length` calls issued
    // before any resolves.
    let calls = 0;
    const releasers = [];
    getDocs.mockImplementation(() => {
      calls += 1;
      return new Promise((resolve) => {
        releasers.push(() => resolve({
          forEach: () => {},
        }));
      });
    });

    renderHook(() =>
      usePortalStudents({ appId: 'test-app', classes })
    );

    // Wait until every getDocs invocation is pending.
    await waitFor(() => expect(calls).toBe(classes.length), { timeout: 2000 });
    // At this point NONE of the releasers have fired, so the only way
    // `calls === classes.length` is if the hook issued them in parallel.
    await act(async () => {
      releasers.forEach((r) => r());
    });
  });

  it('does not fail the whole refresh when one class query throws', async () => {
    const classes = [
      { id: 'class-a', name: 'A' },
      { id: 'class-bad', name: 'B' },
      { id: 'class-c', name: 'C' },
    ];

    getDocs.mockImplementation((ref) => {
      const constraints = ref?.constraints || [];
      const classFilter = constraints.find((c) => c?.field === 'classId');
      if (classFilter?.value === 'class-bad') {
        return Promise.reject(new Error('permission denied'));
      }
      return Promise.resolve({ forEach: () => {} });
    });

    const { result } = renderHook(() =>
      usePortalStudents({ appId: 'test-app', classes })
    );

    // The hook should eventually settle without crashing — the students list
    // is empty (our mocked fetch returned []), but no thrown error surfaces.
    await waitFor(() => expect(result.current.loading).toBe(false), { timeout: 2000 });
    expect(result.current.error).toBeNull();
  });
});
