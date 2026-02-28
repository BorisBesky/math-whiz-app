const React = require('react');
const { render, screen, fireEvent, waitFor } = require('@testing-library/react');
const { VALID_TOPICS_BY_GRADE, GRADES, QUESTION_TYPES } = require('../../constants/topics');

jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(() => ({
    currentUser: {
      getIdToken: jest.fn().mockResolvedValue('mock-token'),
    },
  })),
}));

jest.mock('../ui/ModalWrapper', () => {
  const React = require('react');
  return function MockModalWrapper({ isOpen, children, title }) {
    if (!isOpen) return null;
    return React.createElement('div', null, [
      React.createElement('h1', { key: 'title' }, title),
      React.createElement('div', { key: 'content' }, children),
    ]);
  };
});

const { getAuth } = require('firebase/auth');
const GenerateQuestionsModal = require('../GenerateQuestionsModal').default;

describe('GenerateQuestionsModal', () => {
  beforeEach(() => {
    getAuth.mockReturnValue({
      currentUser: {
        getIdToken: jest.fn().mockResolvedValue('mock-token'),
      },
    });

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        questions: [
          {
            question: 'What is 2 + 2?',
            topic: 'multiplication',
            grade: 'G3',
            questionType: QUESTION_TYPES.MULTIPLE_CHOICE,
            correctAnswer: '4',
            options: ['3', '4', '5', '6'],
            inputTypes: [],
            hint: 'Add two and two',
            standard: '3.OA.A.1',
            concept: 'Addition',
          },
        ],
      }),
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('sends trimmed additionalInstructions in generation payload', async () => {
    const onGenerated = jest.fn();

    render(
      React.createElement(GenerateQuestionsModal, {
        isOpen: true,
        onClose: jest.fn(),
        onGenerated,
      })
    );

    const selects = screen.getAllByRole('combobox');
    const topicSelect = selects[1];
    fireEvent.change(topicSelect, { target: { value: VALID_TOPICS_BY_GRADE[GRADES.G3][0] } });

    const detailsInput = screen.getByRole('textbox');
    fireEvent.change(detailsInput, {
      target: { value: '   focus on real-world word problems with money   ' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Generate' }));

    await waitFor(() => expect(global.fetch).toHaveBeenCalled());

    const [, options] = global.fetch.mock.calls[0];
    const payload = JSON.parse(options.body);

    expect(payload.additionalInstructions).toBe('focus on real-world word problems with money');
    expect(payload.topic).toBe(VALID_TOPICS_BY_GRADE[GRADES.G3][0]);

    await waitFor(() => expect(onGenerated).toHaveBeenCalled());
  });

  test('caps additional instructions input at 500 characters', () => {
    render(
      React.createElement(GenerateQuestionsModal, {
        isOpen: true,
        onClose: jest.fn(),
        onGenerated: jest.fn(),
      })
    );

    const detailsInput = screen.getByRole('textbox');
    const longText = 'a'.repeat(750);

    fireEvent.change(detailsInput, { target: { value: longText } });

    expect(detailsInput.value.length).toBe(500);
    expect(screen.getByText('Add specific preferences like context, vocabulary, or difficulty emphasis (500/500).')).toBeInTheDocument();
  });
});
