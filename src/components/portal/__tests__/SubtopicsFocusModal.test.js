// Tests for the shared SubtopicsFocusModal used by both ClassDetailPanel
// and StudentsSection. Covers:
//   - Rendering with student name and current grade
//   - Selecting/clearing subtopics
//   - Save warning when student is unassigned (classId missing)
//   - onSaved callback receives the updated allowedSubtopicsByTopic map
const React = require('react');
const { render, screen, fireEvent, waitFor } = require('@testing-library/react');

const mockUpdateDoc = jest.fn().mockResolvedValue(undefined);
const mockGetDoc = jest.fn().mockResolvedValue({ exists: () => false, data: () => ({}) });

jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(() => ({})),
  doc: jest.fn(() => ({})),
  getDoc: (...args) => mockGetDoc(...args),
  updateDoc: (...args) => mockUpdateDoc(...args),
}));

jest.mock('../../ui/ModalWrapper', () => {
  const React = require('react');
  return function MockModalWrapper({ isOpen, children }) {
    if (!isOpen) return null;
    return React.createElement('div', { 'data-testid': 'modal' }, children);
  };
});

// Provide deterministic subtopic data for tests.
jest.mock('../../../utils/subtopicUtils', () => ({
  __esModule: true,
  getSubtopicsForTopic: jest.fn(),
}));

const subtopicUtils = require('../../../utils/subtopicUtils');
const SubtopicsFocusModal = require('../SubtopicsFocusModal').default;

const baseStudent = {
  id: 'student-1',
  classId: 'class-1',
  grade: 'G3',
  name: 'Ada Lovelace',
};

const renderModal = (overrides = {}) =>
  render(
    React.createElement(SubtopicsFocusModal, {
      isOpen: true,
      onClose: jest.fn(),
      student: baseStudent,
      classId: 'class-1',
      initialAllowedSubtopicsByTopic: {},
      onSaved: jest.fn(),
      ...overrides,
    })
  );

describe('SubtopicsFocusModal', () => {
  beforeEach(() => {
    mockUpdateDoc.mockClear();
    mockGetDoc.mockClear();
    mockGetDoc.mockResolvedValue({ exists: () => false, data: () => ({}) });
    subtopicUtils.getSubtopicsForTopic.mockImplementation((topic) => {
      if (topic === 'Multiplication') return ['Times tables', 'Word problems', 'Arrays'];
      return [];
    });
  });

  test('renders with the student name and starting grade', () => {
    renderModal();
    expect(screen.getByText(/Ada Lovelace/i)).toBeInTheDocument();
    const gradeSelect = screen.getAllByRole('combobox')[0];
    expect(gradeSelect.value).toBe('G3');
  });

  test('toggling subtopics updates the selection counter', () => {
    renderModal();

    // Multiplication is the first G3 topic — its subtopics are mocked above.
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes.length).toBeGreaterThan(0);

    fireEvent.click(checkboxes[0]);
    expect(screen.getByText('1 selected')).toBeInTheDocument();

    fireEvent.click(checkboxes[1]);
    expect(screen.getByText('2 selected')).toBeInTheDocument();
  });

  test('Select all / Clear buttons toggle every subtopic', () => {
    renderModal();

    fireEvent.click(screen.getByRole('button', { name: /select all/i }));
    // The "Select all" button text matches as well, but the badge will display "3 selected".
    expect(screen.getByText('3 selected')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /clear/i }));
    expect(screen.queryByText(/selected/i)).not.toBeInTheDocument();
  });

  test('Save persists selected subtopics for the chosen topic and notifies parent', async () => {
    const onSaved = jest.fn();
    const onClose = jest.fn();
    renderModal({ onSaved, onClose });

    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[0]); // Times tables
    fireEvent.click(checkboxes[2]); // Arrays

    fireEvent.click(screen.getByRole('button', { name: /save focus/i }));

    await waitFor(() => expect(mockUpdateDoc).toHaveBeenCalledTimes(1));
    const [, payload] = mockUpdateDoc.mock.calls[0];
    expect(payload).toEqual({
      allowedSubtopicsByTopic: { Multiplication: ['Times tables', 'Arrays'] },
    });

    await waitFor(() => expect(onSaved).toHaveBeenCalled());
    expect(onSaved.mock.calls[0][0]).toEqual({
      Multiplication: ['Times tables', 'Arrays'],
    });
    expect(onClose).toHaveBeenCalled();
  });

  test('saving with no selections strips the topic from the allow-list', async () => {
    // Pre-existing focus has Multiplication restricted; saving with no selection
    // should remove Multiplication entirely so all subtopics are allowed.
    mockGetDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({
        allowedSubtopicsByTopic: { Multiplication: ['Times tables'] },
      }),
    });

    renderModal({
      initialAllowedSubtopicsByTopic: { Multiplication: ['Times tables'] },
    });

    // Clear all, then save.
    fireEvent.click(screen.getByRole('button', { name: /clear/i }));
    fireEvent.click(screen.getByRole('button', { name: /save focus/i }));

    await waitFor(() => expect(mockUpdateDoc).toHaveBeenCalled());
    const [, payload] = mockUpdateDoc.mock.calls[0];
    expect(payload.allowedSubtopicsByTopic).toEqual({});
  });

  test('refuses to save when student has no class and shows an inline warning', async () => {
    const onSaved = jest.fn();
    renderModal({
      classId: null,
      student: { ...baseStudent, classId: null },
      onSaved,
    });

    // The warning copy is rendered immediately for unassigned students.
    expect(
      screen.getByText(/not assigned to a class yet/i)
    ).toBeInTheDocument();

    const saveBtn = screen.getByRole('button', { name: /save focus/i });
    expect(saveBtn).toBeDisabled();

    expect(mockUpdateDoc).not.toHaveBeenCalled();
    expect(onSaved).not.toHaveBeenCalled();
  });
});
