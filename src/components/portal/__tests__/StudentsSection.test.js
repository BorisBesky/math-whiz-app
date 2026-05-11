const React = require('react');
const { render, screen, fireEvent } = require('@testing-library/react');

jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(() => ({})),
  doc: jest.fn(() => ({})),
  writeBatch: jest.fn(() => ({ update: jest.fn(), delete: jest.fn(), commit: jest.fn() })),
}));

jest.mock('../../../utils/common_utils', () => ({
  formatDate: (d) => String(d),
  normalizeDate: (d) => String(d),
  getTopicsForGrade: (g) =>
    g === 'G3' ? ['Multiplication', 'Division'] : ['Geometry'],
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

// Mock the StudentFocusModal so we can assert it's mounted with the right student
jest.mock('../StudentFocusModal', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: function MockStudentFocusModal({ isOpen, student }) {
      if (!isOpen || !student) return null;
      return React.createElement(
        'div',
        { 'data-testid': 'student-focus-modal' },
        `Focus for ${student.id}`
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
  test('renders a Focus action button for each student row', () => {
    renderSection();
    expect(
      screen.getByRole('button', { name: /Set focus subtopics for Ada/i })
    ).toBeInTheDocument();
  });

  test('Focus button is disabled when student is not in a class', () => {
    renderSection([{ ...baseStudent, classId: null, className: 'Unassigned' }]);
    expect(
      screen.getByRole('button', { name: /Set focus subtopics for Ada/i })
    ).toBeDisabled();
  });

  test('clicking the Focus action opens the StudentFocusModal with the right student', () => {
    renderSection();
    fireEvent.click(
      screen.getByRole('button', { name: /Set focus subtopics for Ada/i })
    );
    expect(screen.getByTestId('student-focus-modal')).toHaveTextContent(
      'Focus for student-1'
    );
  });

  test('Set Goals modal has the redesigned header and adjustment controls', () => {
    renderSection();
    fireEvent.click(screen.getByRole('button', { name: /Set Daily Goals/i }));

    expect(screen.getByText('Daily Practice Goals')).toBeInTheDocument();
    expect(
      screen.getByRole('tab', { name: /3rd Grade/i, selected: true })
    ).toBeInTheDocument();
    // Increment/decrement controls per topic
    expect(
      screen.getAllByRole('button', { name: /Increase goal for Multiplication/i })
    ).toHaveLength(1);
    expect(
      screen.getAllByRole('button', { name: /Decrease goal for Multiplication/i })
    ).toHaveLength(1);
  });

  test('adjustGoal +/- buttons modify the topic goal value', () => {
    renderSection();
    fireEvent.click(screen.getByRole('button', { name: /Set Daily Goals/i }));

    const multiplicationInput = screen.getByLabelText('Goal for Multiplication');
    expect(multiplicationInput.value).toBe('4');

    fireEvent.click(
      screen.getByRole('button', { name: /Increase goal for Multiplication/i })
    );
    expect(multiplicationInput.value).toBe('5');

    fireEvent.click(
      screen.getByRole('button', { name: /Decrease goal for Multiplication/i })
    );
    fireEvent.click(
      screen.getByRole('button', { name: /Decrease goal for Multiplication/i })
    );
    expect(multiplicationInput.value).toBe('3');
  });

  test('goal input can be cleared while typing and snaps back to 0 on blur', () => {
    renderSection();
    fireEvent.click(screen.getByRole('button', { name: /Set Daily Goals/i }));

    const multiplicationInput = screen.getByLabelText('Goal for Multiplication');
    fireEvent.change(multiplicationInput, { target: { value: '' } });
    expect(multiplicationInput.value).toBe('');
    fireEvent.blur(multiplicationInput);
    expect(multiplicationInput.value).toBe('0');
  });
});

export {};
