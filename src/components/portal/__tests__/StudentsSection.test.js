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

const makeAiRecommendation = (overrides = {}) => ({
  id: 'ai-focus-1',
  status: 'draft',
  saved: true,
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
  focusMap: { Multiplication: ['basic multiplication'] },
  notEnoughData: [],
  metrics: { questionsAnalyzed: 2, startDate: '2026-01-01', endDate: '2026-01-01' },
  ...overrides,
});

const okResponse = (body) => Promise.resolve({
  ok: true,
  json: async () => body,
});

const fetchBodyForMode = (mode) => {
  const call = global.fetch.mock.calls.find(([, request]) => {
    const body = JSON.parse(request.body);
    return body.mode === mode;
  });
  return call ? JSON.parse(call[1].body) : null;
};

describe('StudentsSection - Focus integration', () => {
  beforeEach(() => {
    mockGetDoc.mockResolvedValue({ exists: () => false, data: () => ({}) });
    mockGetIdToken.mockResolvedValue('token-abc');
    getAuth.mockReturnValue({
      currentUser: { getIdToken: (...args) => mockGetIdToken(...args) },
    });
    global.fetch = jest.fn((url, request) => {
      const body = JSON.parse(request.body);
      if (body.mode === 'get') {
        return okResponse({ status: 'ok', mode: 'get', savedRecommendation: null });
      }
      if (body.mode === 'suggest') {
        const recommendation = makeAiRecommendation();
        return okResponse({
          status: 'ok',
          mode: 'suggest',
          applied: false,
          ...recommendation,
          savedRecommendation: recommendation,
        });
      }
      if (body.mode === 'update') {
        const recommendation = makeAiRecommendation({ focusMap: body.focusMap });
        return okResponse({ status: 'ok', mode: 'update', savedRecommendation: recommendation });
      }
      if (body.mode === 'apply') {
        const recommendation = makeAiRecommendation({
          status: 'applied',
          applied: true,
          focusMap: body.focusMap,
        });
        return okResponse({
          status: 'ok',
          mode: 'apply',
          applied: true,
          savedRecommendation: recommendation,
        });
      }
      if (body.mode === 'delete') {
        return okResponse({ status: 'ok', mode: 'delete', deleted: true, savedRecommendation: null });
      }
      return okResponse({});
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

    await waitFor(() => expect(fetchBodyForMode('suggest')).toBeTruthy());
    expect(fetchBodyForMode('suggest')).toMatchObject({
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
    expect(screen.getAllByText('basic multiplication').length).toBeGreaterThan(0);
    expect(fetchBodyForMode('suggest').mode).toBe('suggest');
    expect(screen.queryByText('Applied')).not.toBeInTheDocument();
  });

  test('teacher can apply reviewed AI recommendations and refreshes', async () => {
    const onRefresh = jest.fn();

    renderSection([baseStudent], { onRefresh });
    fireEvent.click(screen.getByTitle('View details'));
    fireEvent.click(screen.getByRole('button', { name: /ai focus/i }));
    expect(await screen.findByRole('button', { name: /apply recommendations/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /apply recommendations/i }));

    expect(await screen.findByText('Applied')).toBeInTheDocument();
    expect(onRefresh).toHaveBeenCalled();
    expect(fetchBodyForMode('apply')).toMatchObject({
      mode: 'apply',
      focusMap: { Multiplication: ['basic multiplication'] },
    });
  });

  test('loads a saved recommendation draft for teacher review', async () => {
    global.fetch.mockImplementation((url, request) => {
      const body = JSON.parse(request.body);
      if (body.mode === 'get') {
        return okResponse({
          status: 'ok',
          mode: 'get',
          savedRecommendation: makeAiRecommendation(),
        });
      }
      return okResponse({});
    });

    renderSection();
    fireEvent.click(screen.getByTitle('View details'));

    expect(await screen.findByText('Saved')).toBeInTheDocument();
    expect(screen.getByText('Reviewed focus areas')).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: /basic multiplication/i })).toBeChecked();
  });

  test('teacher can adjust and save recommendation focus areas', async () => {
    renderSection();
    fireEvent.click(screen.getByTitle('View details'));
    fireEvent.click(screen.getByRole('button', { name: /ai focus/i }));

    const checkbox = await screen.findByRole('checkbox', { name: /skip counting/i });
    fireEvent.click(checkbox);
    fireEvent.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() => expect(fetchBodyForMode('update')).toBeTruthy());
    expect(fetchBodyForMode('update').focusMap).toEqual({
      Multiplication: ['basic multiplication', 'skip counting'],
    });
  });

  test('teacher can delete a saved recommendation draft', async () => {
    renderSection();
    fireEvent.click(screen.getByTitle('View details'));
    fireEvent.click(screen.getByRole('button', { name: /ai focus/i }));

    expect(await screen.findByRole('button', { name: /delete recommendation/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /delete recommendation/i }));

    await waitFor(() => expect(fetchBodyForMode('delete')).toBeTruthy());
    expect(screen.queryByText('AI Focus Recommendations')).not.toBeInTheDocument();
  });

  test('shows loading and error states for AI focus analysis', async () => {
    let resolveFetch;
    global.fetch.mockImplementation((url, request) => {
      const body = JSON.parse(request.body);
      if (body.mode === 'get') {
        return okResponse({ status: 'ok', mode: 'get', savedRecommendation: null });
      }
      if (body.mode === 'suggest') {
        return new Promise((resolve) => {
          resolveFetch = resolve;
        });
      }
      return okResponse({});
    });

    renderSection();
    fireEvent.click(screen.getByTitle('View details'));
    fireEvent.click(screen.getByRole('button', { name: /ai focus/i }));

    expect(screen.getByText(/analyzing performance/i)).toBeInTheDocument();
    await waitFor(() => expect(resolveFetch).toEqual(expect.any(Function)));

    resolveFetch({
      ok: false,
      status: 500,
      json: async () => ({ error: 'AI unavailable' }),
    });

    expect(await screen.findByText('AI unavailable')).toBeInTheDocument();
  });
});

export {};
