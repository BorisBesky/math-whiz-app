// Regression coverage for the batched `classId in [...]` enrollment reads.
// Earlier shapes paid either N round-trips in a serial loop, then N in
// parallel; this test pins the current shape: one Firestore query per chunk
// of up to 30 classes, so a typical teacher's refresh is a single round-trip
// instead of one per class.

let mockGetIdToken;

jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(),
}));

jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(() => ({})),
  collection: jest.fn(() => 'collection-ref'),
  query: jest.fn((ref, ...constraints) => ({ ref, constraints })),
  where: jest.fn((field, op, value) => ({ field, op, value })),
  getDocs: jest.fn(),
}));

jest.mock('../../utils/studentName', () => ({
  getStudentDisplayName: (data) => data?.displayName || data?.id || 'Student',
}));

const { renderHook, waitFor, act } = require('@testing-library/react');
const usePortalStudents = require('../usePortalStudents').default;
const { getAuth } = require('firebase/auth');
const { collection, query, where, getDocs, getFirestore } = require('firebase/firestore');

describe('usePortalStudents - parallel enrollment fetch', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // react-scripts sets `resetMocks: true` in its default jest config, which
    // wipes implementations between tests. Re-install them here so the
    // mocked Firestore helpers still return the shapes we assert on.
    getFirestore.mockImplementation(() => ({}));
    collection.mockImplementation(() => 'collection-ref');
    query.mockImplementation((ref, ...constraints) => ({ ref, constraints }));
    where.mockImplementation((field, op, value) => ({ field, op, value }));

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

  it('batches all class enrollments into one query per 30-class chunk', async () => {
    const classes = Array.from({ length: 5 }, (_, i) => ({ id: `class-${i}`, name: `Class ${i}` }));

    const seenQueries = [];
    getDocs.mockImplementation((queryRef) => {
      seenQueries.push(queryRef);
      return Promise.resolve({ forEach: () => {} });
    });

    renderHook(() => usePortalStudents({ appId: 'test-app', classes }));

    // 5 classes fit into a single `classId in [...]` chunk — one Firestore
    // round-trip, not five.
    await waitFor(() => expect(seenQueries.length).toBe(1), { timeout: 2000 });
    const constraint = seenQueries[0].constraints[0];
    expect(constraint.field).toBe('classId');
    expect(constraint.op).toBe('in');
    expect(new Set(constraint.value)).toEqual(new Set(classes.map((c) => c.id)));
  });

  it('splits into multiple chunks when a teacher has more than 30 classes', async () => {
    // Firestore's `in` operator caps at 30 values.
    const classes = Array.from({ length: 42 }, (_, i) => ({ id: `class-${i}`, name: `Class ${i}` }));

    const seenQueries = [];
    getDocs.mockImplementation((queryRef) => {
      seenQueries.push(queryRef);
      return Promise.resolve({ forEach: () => {} });
    });

    renderHook(() => usePortalStudents({ appId: 'test-app', classes }));

    await waitFor(() => expect(seenQueries.length).toBe(2), { timeout: 2000 });
    const sizes = seenQueries.map((q) => q.constraints[0].value.length).sort((a, b) => a - b);
    expect(sizes).toEqual([12, 30]);
    const allIds = new Set(seenQueries.flatMap((q) => q.constraints[0].value));
    expect(allIds.size).toBe(42);
  });

  it('does not refetch when the classes array identity flips but the id set is unchanged', async () => {
    // usePortalClasses is backed by onSnapshot, which hands back a new array
    // identity on every tick regardless of whether the data changed. The
    // Students tab must not pay a round-trip + /get-all-students call per
    // tick — only when the actual set of enrolled classes changes.
    getDocs.mockResolvedValue({ forEach: () => {} });

    const makeClasses = () => [
      { id: 'class-a', name: 'A' },
      { id: 'class-b', name: 'B' },
    ];

    const { rerender } = renderHook(
      ({ classes }) => usePortalStudents({ appId: 'test-app', classes }),
      { initialProps: { classes: makeClasses() } }
    );
    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));

    // Fresh array, same ids, different OBJECT identity on every element too —
    // the exact pattern an onSnapshot tick produces.
    rerender({ classes: makeClasses() });
    rerender({ classes: makeClasses() });
    rerender({ classes: makeClasses() });

    // Give any accidental useEffect refetch a chance to fire.
    await act(() => new Promise((resolve) => setTimeout(resolve, 10)));
    expect(global.fetch).toHaveBeenCalledTimes(1);

    // ADD a class — the id set changed, this SHOULD refetch.
    rerender({ classes: [...makeClasses(), { id: 'class-c', name: 'C' }] });
    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(2));
  });

  it('does not fail the whole refresh when one chunk query throws', async () => {
    // >30 classes so the hook emits multiple chunk queries; one of them
    // throws and the hook must still settle with error:null.
    const classes = Array.from({ length: 35 }, (_, i) => ({ id: `class-${i}`, name: `Class ${i}` }));

    let callIndex = 0;
    getDocs.mockImplementation(() => {
      callIndex += 1;
      if (callIndex === 1) {
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
