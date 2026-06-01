// Tests for SubtopicsFocusModal used by ClassDetailPanel.
// The modal uses pill tabs for grade selection and a sidebar button list for
// topics (matching the portal design pattern). Covers:
//   - Rendering with student name and current grade tab selected
//   - Topic sidebar selection
//   - Selecting/clearing subtopics
//   - Save warning when student is unassigned (classId missing)
//   - onSaved callback receives the updated allowedSubtopicsByTopic map
const React = require('react');
const { render, screen, fireEvent, waitFor } = require('@testing-library/react');

const mockSetDoc = jest.fn().mockResolvedValue(undefined);
const mockGetDoc = jest.fn().mockResolvedValue({ exists: () => false, data: () => ({}) });

jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(() => ({})),
  doc: jest.fn(() => ({})),
  getDoc: (...args) => mockGetDoc(...args),
  setDoc: (...args) => mockSetDoc(...args),
}));

jest.mock('../../ui/ModalWrapper', () => {
  const React = require('react');
  return function MockModalWrapper({ isOpen, children }) {
    if (!isOpen) return null;
    return React.createElement('div', { 'data-testid': 'modal' }, children);
  };
});

jest.mock('../../../utils/subtopicUtils', () => ({
  __esModule: true,
  getSubtopicsForTopic: jest.fn(),
}));

jest.mock('../../../utils/common_utils', () => ({
  getAppId: () => 'test-app',
  getTopicsForGrade: (g) =>
    g === 'G3'
      ? ['Multiplication', 'Division']
      : ['Operations & Algebraic Thinking', 'Geometry'],
}));

jest.mock('../../../utils/studentName', () => ({
  getStudentDisplayName: (s) => s?.name || s?.displayName || s?.id || 'Student',
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
    mockSetDoc.mockClear();
    mockGetDoc.mockClear();
    mockGetDoc.mockResolvedValue({ exists: () => false, data: () => ({}) });
    subtopicUtils.getSubtopicsForTopic.mockImplementation((topic) => {
      if (topic === 'Multiplication') return ['Times tables', 'Word problems', 'Arrays'];
      if (topic === 'Division') return ['Basic division', 'Long division'];
      return [];
    });
  });

  test('renders with the student name', () => {
    renderModal();
    expect(screen.getByText(/Ada Lovelace/i)).toBeInTheDocument();
  });

  test('renders grade pill tabs with G3 selected by default', () => {
    renderModal();
    const g3Tab = screen.getByRole('tab', { name: /3rd grade/i });
    const g4Tab = screen.getByRole('tab', { name: /4th grade/i });
    expect(g3Tab).toBeInTheDocument();
    expect(g4Tab).toBeInTheDocument();
    expect(g3Tab).toHaveAttribute('aria-selected', 'true');
    expect(g4Tab).toHaveAttribute('aria-selected', 'false');
  });

  test('switching grade tab updates topic sidebar with G4 topics', () => {
    renderModal();
    fireEvent.click(screen.getByRole('tab', { name: /4th grade/i }));
    expect(screen.getByRole('button', { name: /Operations & Algebraic Thinking/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Geometry/i })).toBeInTheDocument();
  });

  test('renders topic sidebar buttons for the selected grade', () => {
    renderModal();
    expect(screen.getByRole('button', { name: /Multiplication/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Division/i })).toBeInTheDocument();
  });

  test('clicking a topic sidebar button switches the subtopic list', () => {
    renderModal();
    // Multiplication is the initial topic; switch to Division
    fireEvent.click(screen.getByRole('button', { name: /Division/i }));
    expect(screen.getByText('Basic division')).toBeInTheDocument();
    expect(screen.getByText('Long division')).toBeInTheDocument();
  });

  test('toggling subtopics updates the selection count in the hint text', () => {
    renderModal();
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes.length).toBeGreaterThan(0);

    fireEvent.click(checkboxes[0]);
    expect(screen.getByText(/1 selected subtopic/i)).toBeInTheDocument();

    fireEvent.click(checkboxes[1]);
    expect(screen.getByText(/2 selected subtopics/i)).toBeInTheDocument();
  });

  test('Select all / Clear buttons toggle every subtopic', () => {
    renderModal();

    fireEvent.click(screen.getByRole('button', { name: /select all/i }));
    expect(screen.getByText(/3 selected subtopics/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /clear/i }));
    expect(screen.getByText(/Empty selection means all subtopics are allowed/i)).toBeInTheDocument();
  });

  test('topic badge shows restricted count for topics with selections', () => {
    renderModal({ initialAllowedSubtopicsByTopic: { Multiplication: ['Times tables', 'Arrays'] } });
    // The Multiplication topic sidebar button should show count badge 2
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  test('Save persists selected subtopics and notifies parent', async () => {
    const onSaved = jest.fn();
    const onClose = jest.fn();
    renderModal({ onSaved, onClose });

    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[0]); // Times tables
    fireEvent.click(checkboxes[2]); // Arrays

    fireEvent.click(screen.getByRole('button', { name: /save focus/i }));

    await waitFor(() => expect(mockSetDoc).toHaveBeenCalledTimes(1));
    const [, payload, options] = mockSetDoc.mock.calls[0];
    expect(payload).toEqual({
      allowedSubtopicsByTopic: { Multiplication: ['Times tables', 'Arrays'] },
    });
    expect(options).toEqual({ merge: true });

    await waitFor(() => expect(onSaved).toHaveBeenCalled());
    expect(onSaved.mock.calls[0][0]).toEqual({
      Multiplication: ['Times tables', 'Arrays'],
    });
    expect(onClose).toHaveBeenCalled();
  });

  test('saving with no selections strips the topic from the allow-list', async () => {
    renderModal({
      initialAllowedSubtopicsByTopic: { Multiplication: ['Times tables'] },
    });

    fireEvent.click(screen.getByRole('button', { name: /clear/i }));
    fireEvent.click(screen.getByRole('button', { name: /save focus/i }));

    await waitFor(() => expect(mockSetDoc).toHaveBeenCalled());
    const [, payload] = mockSetDoc.mock.calls[0];
    expect(payload.allowedSubtopicsByTopic).toEqual({});
  });

  test('save succeeds when the enrollment doc does not exist yet (setDoc with merge)', async () => {
    mockGetDoc.mockResolvedValue({ exists: () => false, data: () => ({}) });
    const onSaved = jest.fn();
    renderModal({ onSaved, initialAllowedSubtopicsByTopic: {} });

    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[0]); // Times tables
    fireEvent.click(screen.getByRole('button', { name: /save focus/i }));

    await waitFor(() => expect(mockSetDoc).toHaveBeenCalledTimes(1));
    const [, payload, options] = mockSetDoc.mock.calls[0];
    expect(payload).toEqual({
      allowedSubtopicsByTopic: { Multiplication: ['Times tables'] },
    });
    expect(options).toEqual({ merge: true });
    await waitFor(() => expect(onSaved).toHaveBeenCalled());
  });

  test('shows warning and disables Save when student has no class', () => {
    renderModal({
      classId: null,
      student: { ...baseStudent, classId: null },
    });

    expect(screen.getByText(/not assigned to a class yet/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /save focus/i })).toBeDisabled();
    expect(mockSetDoc).not.toHaveBeenCalled();
  });
});
