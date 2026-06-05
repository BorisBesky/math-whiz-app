const React = require('react');
const { render, screen, fireEvent, waitFor } = require('@testing-library/react');

const mockSetDoc = jest.fn();
const mockUpdateDoc = jest.fn(() => Promise.resolve());
const mockDoc = jest.fn((...parts) => ({ path: parts.join('/') }));

jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(() => ({})),
  collection: jest.fn(),
  onSnapshot: jest.fn(),
  updateDoc: (...args) => mockUpdateDoc(...args),
  doc: (...args) => mockDoc(...args),
  deleteDoc: jest.fn(() => Promise.resolve()),
  setDoc: (...args) => mockSetDoc(...args),
  deleteField: jest.fn(() => '__delete_field__'),
}));

jest.mock('katex/contrib/auto-render', () => jest.fn(), { virtual: true });
jest.mock('../EditQuestionModal', () => ({ __esModule: true, default: () => null }));
jest.mock('../QuestionReviewModal', () => ({ __esModule: true, default: () => null }));
jest.mock('../GenerateQuestionsModal', () => ({ __esModule: true, default: () => null }));
jest.mock('../ui/ConfirmationModal', () => ({ __esModule: true, default: () => null }));
jest.mock('../../hooks/useConfirmation', () => ({
  __esModule: true,
  default: () => ({ confirmationProps: {}, confirm: jest.fn().mockResolvedValue(true) }),
}));
jest.mock('../../utils/questionCache', () => ({ clearCachedClassQuestions: jest.fn() }));

const QuestionBankManager = require('../QuestionBankManager').default;

const firestoreLikeSetDoc = (ref, data) => {
  const hasUndefined = data ? Object.entries(data).some(([, value]) => value === undefined) : false;
  if (hasUndefined) {
    return Promise.reject(new Error('Function setDoc() called with invalid data. Unsupported field value: undefined'));
  }
  return Promise.resolve();
};

describe('QuestionBankManager assign to class', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDoc.mockImplementation((...parts) => ({ path: parts.join('/') }));
    mockSetDoc.mockImplementation(firestoreLikeSetDoc);
  });

  const renderWithQuestion = (question) => render(
    React.createElement(QuestionBankManager, {
      classes: [{ id: 'class1', name: 'Class A' }],
      appId: 'default-app-id',
      userId: 'teacher-1',
      questions: [question],
      sharedQuestions: [],
    })
  );

  const assignSelectedQuestion = async (isShared = false) => {
    if (isShared) {
      fireEvent.click(screen.getByText('Select All on Page'));
    } else {
      fireEvent.click(screen.getByLabelText('Select All'));
    }
    // Select the first Assign to Class button (the bulk one)
    const assignButtons = screen.getAllByRole('button', { name: 'Assign to Class' });
    fireEvent.click(assignButtons[0]);
    const classSelect = screen.getAllByRole('combobox').find((el) =>
      Array.from(el.options).some((opt) => opt.value === 'class1')
    );
    fireEvent.change(classSelect, { target: { value: 'class1' } });
    fireEvent.click(screen.getByRole('button', { name: 'Assign' }));
  };

  test('assigns write-in questions without writing undefined answer fields', async () => {
    renderWithQuestion({
      id: 'q-write-in',
      question: 'Explain your reasoning.',
      topic: 'Multiplication',
      grade: 'G3',
      source: 'Worksheet A',
      questionType: 'write-in',
      createdAt: { toDate: () => new Date('2026-01-01') },
    });

    expect(await screen.findByText('Question Management')).toBeInTheDocument();
    await assignSelectedQuestion();

    await waitFor(() => {
      expect(screen.getByText('Successfully assigned 1 question to Class A.')).toBeInTheDocument();
    });
    expect(mockSetDoc).toHaveBeenCalled();
    const payload = mockSetDoc.mock.calls[0][1];
    expect(payload.correctAnswer).toBeUndefined();
    expect(payload.options).toBeUndefined();
  });

  test('teacher assigns shared question without writing to sharedQuestionBank', async () => {
    render(
      React.createElement(QuestionBankManager, {
        classes: [{ id: 'class1', name: 'Class A' }],
        appId: 'default-app-id',
        userId: 'teacher-1',
        questions: [{
          id: 'q-shared',
          question: 'What is 2 x 2?',
          topic: 'Multiplication',
          grade: 'G3',
          source: 'sharedQuestionBank',
          collection: 'sharedQuestionBank',
          questionType: 'multiple-choice',
          correctAnswer: '4',
          options: ['2', '3', '4', '5'],
          createdAt: { toDate: () => new Date('2026-01-01') },
        }],
        sharedQuestions: [],
        isAdmin: false,
      })
    );

    expect(await screen.findByText('Question Management')).toBeInTheDocument();
    await assignSelectedQuestion(false); // Rendered in standard list, so isShared = false for selection UI

    await waitFor(() => {
      expect(screen.getByText('Successfully assigned 1 question to Class A.')).toBeInTheDocument();
    });

    // Verify class reference document is created under classes subcollection
    expect(mockSetDoc).toHaveBeenCalled();
    const classWriteCall = mockSetDoc.mock.calls.find(call => call[0]?.path && call[0].path.includes('classes/class1/questions/q-shared'));
    expect(classWriteCall).toBeDefined();
    expect(classWriteCall[1].questionBankRef).toBe('artifacts/default-app-id/sharedQuestionBank/q-shared');
    expect(classWriteCall[1].isSharedQuestion).toBe(true);

    // Verify the teacher view does not update sharedQuestionBank tracking.
    expect(mockUpdateDoc).not.toHaveBeenCalled();
    expect(mockSetDoc.mock.calls.find(call => call[0]?.path && call[0].path.includes('sharedQuestionBank/q-shared'))).toBeUndefined();
  });

  test('admin assigns shared question and updates sharedQuestionBank tracking', async () => {
    render(
      React.createElement(QuestionBankManager, {
        classes: [{ id: 'class1', name: 'Class A' }],
        appId: 'default-app-id',
        userId: 'admin-1',
        questions: [],
        sharedQuestions: [{
          id: 'q-shared',
          question: 'What is 2 x 2?',
          topic: 'Multiplication',
          grade: 'G3',
          source: 'sharedQuestionBank',
          collection: 'sharedQuestionBank',
          questionType: 'multiple-choice',
          correctAnswer: '4',
          options: ['2', '3', '4', '5'],
          createdAt: { toDate: () => new Date('2026-01-01') },
        }],
        isAdmin: true,
        showViewModeTabs: true,
      })
    );

    expect(await screen.findByText('Question Management')).toBeInTheDocument();
    await assignSelectedQuestion(true); // Rendered in shared list, so isShared = true for selection UI

    await waitFor(() => {
      expect(screen.getByText('Successfully assigned 1 question to Class A.')).toBeInTheDocument();
    });

    // Verify merge setDoc updates tracking in sharedQuestionBank without failing on a stale doc.
    const trackingCall = mockSetDoc.mock.calls.find(call => call[0].path.includes('sharedQuestionBank/q-shared'));
    expect(trackingCall).toBeDefined();
    expect(trackingCall[1].assignedClasses).toContain('class1');
    expect(trackingCall[2]).toEqual({ merge: true });
  });
});
