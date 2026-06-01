const React = require('react');
const { render, screen, fireEvent, waitFor } = require('@testing-library/react');

const mockGetDoc = jest.fn();
const mockGetIdToken = jest.fn();

jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(() => ({})),
  doc: jest.fn(() => ({})),
  getDoc: (...args) => mockGetDoc(...args),
  writeBatch: jest.fn(() => ({ update: jest.fn(), delete: jest.fn(), commit: jest.fn() })),
}));

jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(() => ({
    currentUser: { getIdToken: (...args) => mockGetIdToken(...args) },
  })),
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
const { getAuth } = require('firebase/auth');

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
  answeredQuestions: [
    {
      date: '2026-01-01',
      topic: 'Multiplication',
      subtopic: 'basic multiplication',
      question: 'What is 3 x 4?',
      isCorrect: false,
      userAnswer: '10',
      correctAnswer: '12',
      timeTaken: 8,
    },
  ],
};

const renderSection = (students = [baseStudent], overrides = {}) =>
  render(
    React.createElement(StudentsSection, {
      students,
      loading: false,
      error: null,
      onRefresh: overrides.onRefresh || jest.fn(),
      appId: 'test-app',
    })
  );

describe('StudentsSection — Focus integration', () => {
  beforeEach(() => {
    mockGetDoc.mockResolvedValue({ exists: () => false, data: () => ({}) });
    mockGetIdToken.mockResolvedValue('token-abc');
    getAuth.mockReturnValue({
      currentUser: { getIdToken: (...args) => mockGetIdToken(...args) },
    });
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        status: 'ok',
        mode: 'suggest',
        applied: false,
        summary: 'Focus on basic multiplication.',
        recommendations: [
          {
            grade: 'G3',
            topic: 'Multiplication',
            subtopic: 'basic multiplication',
            reason: 'Accuracy is below mastery.',
            confidence: 'high',
            metrics: { attempts: 2, accuracy: 50, averageTime: 8 },
          },
        ],
        notEnoughData: [],
        metrics: { questionsAnalyzed: 2, startDate: '2026-01-01', endDate: '2026-01-01' },
      }),
    });
  });

  afterEach(() => {
    delete global.fetch;
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

  test('AI Focus button appears in the student detail view', () => {
    renderSection();
    fireEvent.click(screen.getByTitle('View details'));
    expect(screen.getByRole('button', { name: /ai focus/i })).toBeInTheDocument();
  });

  test('sends the selected date range to the AI focus function', async () => {
    const { container } = renderSection();
    fireEvent.click(screen.getByTitle('View details'));

    const [startInput, endInput] = container.querySelectorAll('input[type="date"]');
    fireEvent.change(startInput, { target: { value: '2026-01-10' } });
    fireEvent.change(endInput, { target: { value: '2026-01-12' } });
    fireEvent.click(screen.getByRole('button', { name: /ai focus/i }));

    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
    const [, request] = global.fetch.mock.calls[0];
    expect(JSON.parse(request.body)).toMatchObject({
      studentId: 'student-1',
      classId: 'class-1',
      startDate: '2026-01-10',
      endDate: '2026-01-12',
      mode: 'suggest',
    });
  });

  test('suggest mode renders recommendations without applying focus areas', async () => {
    renderSection();
    fireEvent.click(screen.getByTitle('View details'));
    fireEvent.click(screen.getByRole('button', { name: /ai focus/i }));

    expect(await screen.findByText('Focus on basic multiplication.')).toBeInTheDocument();
    expect(screen.getByText('basic multiplication')).toBeInTheDocument();
    const [, request] = global.fetch.mock.calls[0];
    expect(JSON.parse(request.body).mode).toBe('suggest');
    expect(screen.queryByText('Applied')).not.toBeInTheDocument();
  });

  test('apply mode shows applied success and refreshes', async () => {
    const onRefresh = jest.fn();
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        status: 'ok',
        mode: 'apply',
        applied: true,
        summary: 'Focus areas were applied.',
        recommendations: [],
        notEnoughData: [],
        metrics: { questionsAnalyzed: 1, startDate: '2026-01-01', endDate: '2026-01-01' },
      }),
    });

    renderSection([baseStudent], { onRefresh });
    fireEvent.click(screen.getByTitle('View details'));
    fireEvent.click(screen.getByRole('button', { name: /analyze \+ apply/i }));
    fireEvent.click(screen.getByRole('button', { name: /ai focus/i }));

    expect(await screen.findByText('Applied')).toBeInTheDocument();
    expect(onRefresh).toHaveBeenCalled();
    const [, request] = global.fetch.mock.calls[0];
    expect(JSON.parse(request.body).mode).toBe('apply');
  });

  test('shows loading and error states for AI focus analysis', async () => {
    let resolveFetch;
    global.fetch.mockReturnValueOnce(new Promise((resolve) => {
      resolveFetch = resolve;
    }));

    renderSection();
    fireEvent.click(screen.getByTitle('View details'));
    fireEvent.click(screen.getByRole('button', { name: /ai focus/i }));

    expect(screen.getByText(/analyzing performance/i)).toBeInTheDocument();

    resolveFetch({
      ok: false,
      status: 500,
      json: async () => ({ error: 'AI unavailable' }),
    });

    expect(await screen.findByText('AI unavailable')).toBeInTheDocument();
  });
});

export {};
