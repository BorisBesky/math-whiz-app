const React = require('react');
const { render, screen, fireEvent, waitFor, act } = require('@testing-library/react');

const mockGetDoc = jest.fn();
const mockUpdateDoc = jest.fn(() => Promise.resolve());
const mockSetDoc = jest.fn(() => Promise.resolve());
const mockDoc = jest.fn((...parts) => ({ path: parts.join('/') }));

jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(() => ({})),
  doc: (...args) => mockDoc(...args),
  getDoc: (...args) => mockGetDoc(...args),
  updateDoc: (...args) => mockUpdateDoc(...args),
  setDoc: (...args) => mockSetDoc(...args),
}));

jest.mock('../../../utils/common_utils', () => ({
  getAppId: () => 'test-app',
  getTopicsForGrade: (g) =>
    g === 'G3'
      ? ['Multiplication', 'Division']
      : ['Operations & Algebraic Thinking', 'Geometry'],
}));

jest.mock('../../../utils/subtopicUtils', () => ({
  getSubtopicsForTopic: (topic) => {
    if (topic === 'Multiplication') return ['One-digit', 'Two-digit', 'Multi-digit'];
    if (topic === 'Division') return ['Basic division', 'Long division'];
    if (topic === 'Geometry') return ['Shapes', 'Angles'];
    return [];
  },
}));

jest.mock('../../../utils/studentName', () => ({
  getStudentDisplayName: (s) => s.displayName || s.email || s.id,
}));

jest.mock('../../ui/ModalWrapper', () => {
  const React = require('react');
  return function MockModalWrapper({ isOpen, children }) {
    if (!isOpen) return null;
    return React.createElement('div', { role: 'dialog' }, children);
  };
});

const StudentFocusModal = require('../StudentFocusModal').default;

const student = {
  id: 'student-1',
  displayName: 'Ada Lovelace',
  grade: 'G3',
  classId: 'class-1',
  className: 'Room 101',
};

const renderModal = (overrides = {}) =>
  render(
    React.createElement(StudentFocusModal, {
      isOpen: true,
      onClose: jest.fn(),
      student,
      appId: 'test-app',
      ...overrides,
    })
  );

describe('StudentFocusModal', () => {
  beforeEach(() => {
    mockGetDoc.mockReset();
    mockUpdateDoc.mockReset();
    mockSetDoc.mockReset();
    mockDoc.mockClear();
    mockUpdateDoc.mockResolvedValue(undefined);
    mockSetDoc.mockResolvedValue(undefined);
  });

  test('renders student name and current focus header', async () => {
    mockGetDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({ allowedSubtopicsByTopic: {} }),
    });

    await act(async () => {
      renderModal();
    });

    expect(screen.getByText('Focus Areas')).toBeInTheDocument();
    expect(screen.getByText(/Ada Lovelace/)).toBeInTheDocument();
    expect(screen.getByText(/Room 101/)).toBeInTheDocument();
  });

  test('loads existing restrictions and displays subtopic count badges', async () => {
    mockGetDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({
        allowedSubtopicsByTopic: {
          Multiplication: ['One-digit', 'Two-digit'],
        },
      }),
    });

    await act(async () => {
      renderModal();
    });

    await waitFor(() => {
      // The Multiplication topic button should show a count badge of 2
      expect(screen.getAllByText('2').length).toBeGreaterThan(0);
    });
  });

  test('saves merged restrictions when Save is clicked', async () => {
    mockGetDoc
      .mockResolvedValueOnce({
        exists: () => true,
        data: () => ({ allowedSubtopicsByTopic: {} }),
      })
      .mockResolvedValueOnce({
        exists: () => true,
        data: () => ({ allowedSubtopicsByTopic: {} }),
      });

    await act(async () => {
      renderModal();
    });

    // Click the first subtopic
    const subtopicLabel = await screen.findByText('One-digit');
    fireEvent.click(subtopicLabel);

    fireEvent.click(screen.getByRole('button', { name: /Save Focus/i }));

    await waitFor(() => expect(mockUpdateDoc).toHaveBeenCalled());
    const updatePayload = mockUpdateDoc.mock.calls[0][1];
    expect(updatePayload.allowedSubtopicsByTopic).toEqual({
      Multiplication: ['One-digit'],
    });
  });

  test('Select all and Clear adjust the subtopic selection', async () => {
    mockGetDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({ allowedSubtopicsByTopic: {} }),
    });

    await act(async () => {
      renderModal();
    });

    // Initially none selected
    expect(
      screen.getByText(/No subtopics selected/i)
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Select all/i }));
    await waitFor(() =>
      expect(screen.getByText(/3 subtopics focused/i)).toBeInTheDocument()
    );

    fireEvent.click(screen.getByRole('button', { name: /Clear/i }));
    await waitFor(() =>
      expect(screen.getByText(/No subtopics selected/i)).toBeInTheDocument()
    );
  });

  test('shows a warning when student has no class', async () => {
    await act(async () => {
      render(
        React.createElement(StudentFocusModal, {
          isOpen: true,
          onClose: jest.fn(),
          student: { ...student, classId: null },
          appId: 'test-app',
        })
      );
    });

    expect(
      screen.getByText(/isn't assigned to a class yet/i)
    ).toBeInTheDocument();

    // Save button is disabled when there's no class
    expect(screen.getByRole('button', { name: /Save Focus/i })).toBeDisabled();
  });
});

export {};
