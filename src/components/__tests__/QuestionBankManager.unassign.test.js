const React = require('react');
const { render, screen, fireEvent, waitFor } = require('@testing-library/react');

const mockDeleteDoc = jest.fn(() => Promise.resolve());
const mockUpdateDoc = jest.fn(() => Promise.resolve());
const mockDoc = jest.fn((...parts) => ({ path: parts.join('/') }));

jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(() => ({})),
  collection: jest.fn(),
  onSnapshot: jest.fn(),
  updateDoc: (...args) => mockUpdateDoc(...args),
  doc: (...args) => mockDoc(...args),
  deleteDoc: (...args) => mockDeleteDoc(...args),
  setDoc: jest.fn(() => Promise.resolve()),
  deleteField: jest.fn(() => '__delete_field__'),
}));

jest.mock('katex/contrib/auto-render', () => jest.fn(), { virtual: true });

jest.mock('../EditQuestionModal', () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock('../QuestionReviewModal', () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock('../GenerateQuestionsModal', () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock('../ui/ConfirmationModal', () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock('../../hooks/useConfirmation', () => ({
  __esModule: true,
  default: () => ({
    confirmationProps: {},
    confirm: jest.fn().mockResolvedValue(true),
  }),
}));

jest.mock('../../utils/questionCache', () => ({
  clearCachedClassQuestions: jest.fn(),
}));

const QuestionBankManager = require('../QuestionBankManager').default;

describe('QuestionBankManager bulk unassign', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('shows unassign button and unassigns selected questions from selected class', async () => {
    const question = {
      id: 'q1',
      question: 'What is 5 + 7?',
      topic: 'Base Ten',
      grade: 'G4',
      source: 'Worksheet A',
      questionType: 'multiple-choice',
      correctAnswer: '12',
      assignedClasses: ['class1'],
      createdAt: { toDate: () => new Date('2026-01-01') },
    };

    render(
      React.createElement(QuestionBankManager, {
        classes: [{ id: 'class1', name: 'Class A' }],
        appId: 'default-app-id',
        userId: 'teacher-1',
        questions: [question],
        sharedQuestions: [],
      })
    );

    await waitFor(() => expect(screen.getByText('Question Management')).toBeInTheDocument());

    fireEvent.click(screen.getByLabelText('Select All'));

    await waitFor(() => expect(screen.getByText('1 question(s) selected')).toBeInTheDocument());
    expect(screen.getByRole('button', { name: 'Un-assign from Class' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Un-assign from Class' }));

    await waitFor(() => expect(screen.getByText('Un-assign Questions from Class')).toBeInTheDocument());

    const classSelect = screen.getAllByRole('combobox').find((el) =>
      Array.from(el.options).some((opt) => opt.value === 'class1')
    );
    fireEvent.change(classSelect, { target: { value: 'class1' } });

    fireEvent.click(screen.getByRole('button', { name: 'Un-assign' }));

    await waitFor(() => expect(mockDeleteDoc).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(mockUpdateDoc).toHaveBeenCalledTimes(1));

    expect(mockDoc).toHaveBeenCalledWith(undefined, 'artifacts', 'default-app-id', 'classes', 'class1', 'questions', 'q1');
    expect(mockDoc).toHaveBeenCalledWith(undefined, 'artifacts', 'default-app-id', 'users', 'teacher-1', 'questionBank', 'q1');

    await waitFor(() => {
      expect(screen.getByText('Successfully un-assigned 1 question from Class A.')).toBeInTheDocument();
    });
  });
});
