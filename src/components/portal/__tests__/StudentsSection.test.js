const React = require('react');
const { render, screen, fireEvent, waitFor } = require('@testing-library/react');

const mockGetDoc = jest.fn();

jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(() => ({})),
  doc: jest.fn(() => ({})),
  getDoc: (...args) => mockGetDoc(...args),
  writeBatch: jest.fn(() => ({ update: jest.fn(), delete: jest.fn(), commit: jest.fn() })),
}));

jest.mock('../../../utils/common_utils', () => ({
  formatDate: (d) => String(d),
  normalizeDate: (d) => String(d),
  calculateTopicProgressForRange: () => [],
  getTodayDateString: () => '2026-01-01',
}));

jest.mock('../../../utils/studentName', () => ({
  getStudentDisplayName: (s) => s.displayName || s.id,
  getStudentShortId: (s) => s.id.slice(0, 4),
}));

jest.mock('../../ui/ConfirmationModal', () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock('../../../hooks/useConfirmation', () => ({
  __esModule: true,
  default: () => ({ confirmationProps: {}, confirm: jest.fn() }),
}));

jest.mock('../GoalsModal', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: function MockGoalsModal({ isOpen, studentCount, initialGrade }) {
      if (!isOpen) return null;
      return React.createElement(
        'div',
        { 'data-testid': 'goals-modal' },
        `Goals modal (${studentCount}) grade=${initialGrade}`
      );
    },
  };
});

jest.mock('../StudentFocusModal', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: function MockStudentFocusModal({ isOpen, student }) {
      if (!isOpen || !student) return null;
      return React.createElement(
        'div',
        { 'data-testid': 'student-focus-modal' },
        `Focus for ${student.id} class=${student.classId || 'none'}`
      );
    },
  };
});

jest.mock('../../ui/ModalWrapper', () => {
  const React = require('react');
  return function MockModalWrapper({ isOpen, children }) {
    if (!isOpen) return null;
    return React.createElement('div', { role: 'dialog' }, children);
  };
});

const StudentsSection = require('../../portal/sections/StudentsSection').default;

const baseStudent = {
  id: 'student-1',
  displayName: 'Ada',
  email: 'ada@example.com',
  grade: 'G3',
  className: 'Room 101',
  classId: 'class-1',
  totalQuestions: 25,
  questionsToday: 3,
  accuracy: 88.7,
  coins: 100,
  latestActivity: '2026-01-01',
  needsNameReview: false,
  dailyGoalsByGrade: { G3: {} },
};

const renderSection = (students = [baseStudent]) =>
  render(
    React.createElement(StudentsSection, {
      students,
      loading: false,
      error: null,
      onRefresh: jest.fn(),
      appId: 'test-app',
    })
  );

describe('StudentsSection — Focus integration', () => {
  beforeEach(() => {
    mockGetDoc.mockResolvedValue({ exists: () => false, data: () => ({}) });
  });

  test('renders a Focus action button for each student row', () => {
    renderSection();
    expect(screen.getByRole('button', { name: /set focus subtopics/i })).toBeInTheDocument();
  });

  test('Focus button stays enabled when student is not in a class', () => {
    renderSection([{ ...baseStudent, classId: null, className: 'Unassigned' }]);
    expect(screen.getByRole('button', { name: /set focus subtopics/i })).toBeEnabled();
  });

  test('clicking the Focus action opens the StudentFocusModal with the right student', async () => {
    renderSection();
    fireEvent.click(screen.getByRole('button', { name: /set focus subtopics/i }));
    expect(await screen.findByTestId('student-focus-modal')).toHaveTextContent('Focus for student-1 class=class-1');
  });

  test('Set Goals opens GoalsModal with selected-student count', () => {
    renderSection();
    fireEvent.click(screen.getAllByRole('checkbox')[0]);
    fireEvent.click(screen.getByTitle('Set Goals'));
    expect(screen.getByTestId('goals-modal')).toHaveTextContent('Goals modal (1) grade=G3');
  });

  test('Set Goals remains disabled until at least one student is selected', async () => {
    renderSection();
    const setGoalsButton = screen.getByRole('button', { name: /set goals/i });
    expect(setGoalsButton).toBeDisabled();

    fireEvent.click(screen.getAllByRole('checkbox')[0]);
    await waitFor(() => expect(setGoalsButton).toBeEnabled());
  });

  test('clicking focus for unassigned student still opens modal with classId none', () => {
    renderSection([{ ...baseStudent, classId: null, className: 'Unassigned' }]);
    fireEvent.click(screen.getByRole('button', { name: /set focus subtopics/i }));
    expect(screen.getByTestId('student-focus-modal')).toHaveTextContent('Focus for student-1 class=none');
  });
});

export {};
