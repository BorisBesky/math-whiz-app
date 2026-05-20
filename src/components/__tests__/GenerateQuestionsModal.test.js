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

  describe('Number of Questions input', () => {
    const renderModal = () =>
      render(
        React.createElement(GenerateQuestionsModal, {
          isOpen: true,
          onClose: jest.fn(),
          onGenerated: jest.fn(),
        })
      );

    test('renders with default value of 10', () => {
      renderModal();
      const input = screen.getByLabelText('Number of questions');
      expect(input.value).toBe('10');
    });

    test('allows the user to clear the field while typing', () => {
      renderModal();
      const input = screen.getByLabelText('Number of questions');
      fireEvent.change(input, { target: { value: '' } });
      expect(input.value).toBe('');
    });

    test('blurring an empty field restores the default of 10', () => {
      renderModal();
      const input = screen.getByLabelText('Number of questions');
      fireEvent.change(input, { target: { value: '' } });
      fireEvent.blur(input);
      expect(input.value).toBe('10');
    });

    test('blurring with 0 restores the default of 10', () => {
      renderModal();
      const input = screen.getByLabelText('Number of questions');
      fireEvent.change(input, { target: { value: '0' } });
      fireEvent.blur(input);
      expect(input.value).toBe('10');
    });

    test('clamps values above the maximum (15)', () => {
      renderModal();
      const input = screen.getByLabelText('Number of questions');
      fireEvent.change(input, { target: { value: '999' } });
      expect(input.value).toBe('15');
    });

    test('reset button restores the default and is disabled when already at default', () => {
      renderModal();
      const input = screen.getByLabelText('Number of questions');
      const resetButton = screen.getByRole('button', { name: /reset number of questions to 10/i });

      expect(resetButton).toBeDisabled();

      fireEvent.change(input, { target: { value: '7' } });
      expect(input.value).toBe('7');
      expect(resetButton).not.toBeDisabled();

      fireEvent.click(resetButton);
      expect(input.value).toBe('10');
      expect(resetButton).toBeDisabled();
    });

    test('user can change the value to 5 and submit; payload reflects the entered value', async () => {
      const onGenerated = jest.fn();
      render(
        React.createElement(GenerateQuestionsModal, {
          isOpen: true,
          onClose: jest.fn(),
          onGenerated,
        })
      );

      const selects = screen.getAllByRole('combobox');
      fireEvent.change(selects[1], { target: { value: VALID_TOPICS_BY_GRADE[GRADES.G3][0] } });

      const input = screen.getByLabelText('Number of questions');
      fireEvent.change(input, { target: { value: '' } });
      fireEvent.change(input, { target: { value: '5' } });
      expect(input.value).toBe('5');

      fireEvent.click(screen.getByRole('button', { name: 'Generate' }));
      await waitFor(() => expect(global.fetch).toHaveBeenCalled());
      const [, options] = global.fetch.mock.calls[0];
      const payload = JSON.parse(options.body);
      expect(payload.count).toBe(5);
    });
  });
});
