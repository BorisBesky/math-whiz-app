// Tests for the "Number of Questions" input reset behavior in GenerateQuestionsModal.
// Bug: previously the onChange handler clamped every keystroke (e.g. parseInt('') || 1),
// so the user could never clear the field — typing after backspacing yielded weird
// values like "10" being unable to be reset to a smaller number.
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

const findCountInput = () => screen.getByRole('spinbutton');

describe('GenerateQuestionsModal - count input reset behavior', () => {
  beforeEach(() => {
    getAuth.mockReturnValue({
      currentUser: { getIdToken: jest.fn().mockResolvedValue('mock-token') },
    });

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ questions: [] }),
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('user can clear the count field and type a new value', () => {
    render(
      React.createElement(GenerateQuestionsModal, {
        isOpen: true,
        onClose: jest.fn(),
        onGenerated: jest.fn(),
      })
    );

    const input = findCountInput();
    expect(input).toBeTruthy();
    expect(input.value).toBe('10');

    // Simulate user clearing the field — the value should be allowed to be empty.
    fireEvent.change(input, { target: { value: '' } });
    expect(input.value).toBe('');

    // User types "5" — should be 5, NOT "15" or "10".
    fireEvent.change(input, { target: { value: '5' } });
    expect(input.value).toBe('5');
  });

  test('blur on empty input snaps back to default (10)', () => {
    render(
      React.createElement(GenerateQuestionsModal, {
        isOpen: true,
        onClose: jest.fn(),
        onGenerated: jest.fn(),
      })
    );

    const input = findCountInput();

    fireEvent.change(input, { target: { value: '' } });
    fireEvent.blur(input);

    expect(input.value).toBe('10');
  });

  test('blur clamps values above the maximum down to MAX_QUESTIONS', () => {
    render(
      React.createElement(GenerateQuestionsModal, {
        isOpen: true,
        onClose: jest.fn(),
        onGenerated: jest.fn(),
      })
    );

    const input = findCountInput();

    fireEvent.change(input, { target: { value: '999' } });
    fireEvent.blur(input);

    // 999 must clamp to MAX_QUESTIONS (15) on blur.
    expect(input.value).toBe('15');
  });

  test('generation payload uses the user-edited count, not the default', async () => {
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

    const input = findCountInput();
    fireEvent.change(input, { target: { value: '' } });
    fireEvent.change(input, { target: { value: '4' } });

    fireEvent.click(screen.getByRole('button', { name: 'Generate' }));

    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
    const [, options] = global.fetch.mock.calls[0];
    const payload = JSON.parse(options.body);

    expect(payload.count).toBe(4);
    expect(payload.questionTypes).toContain(QUESTION_TYPES.MULTIPLE_CHOICE);
  });

  test('Reset button restores the count to the default (10)', () => {
    render(
      React.createElement(GenerateQuestionsModal, {
        isOpen: true,
        onClose: jest.fn(),
        onGenerated: jest.fn(),
      })
    );

    const input = findCountInput();
    expect(input.value).toBe('10');

    fireEvent.change(input, { target: { value: '7' } });
    expect(input.value).toBe('7');

    fireEvent.click(screen.getByRole('button', { name: /reset number of questions to 10/i }));
    expect(input.value).toBe('10');
  });

  test('Reset button is disabled when count is already at the default', () => {
    render(
      React.createElement(GenerateQuestionsModal, {
        isOpen: true,
        onClose: jest.fn(),
        onGenerated: jest.fn(),
      })
    );

    const resetBtn = screen.getByRole('button', { name: /reset number of questions to 10/i });
    expect(resetBtn).toBeDisabled();

    const input = findCountInput();
    fireEvent.change(input, { target: { value: '5' } });
    expect(resetBtn).not.toBeDisabled();
  });

  test('header shows the friendly title and subtitle copy', () => {
    render(
      React.createElement(GenerateQuestionsModal, {
        isOpen: true,
        onClose: jest.fn(),
        onGenerated: jest.fn(),
      })
    );

    expect(
      screen.getByText(/generate questions with ai/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/create new practice questions/i)
    ).toBeInTheDocument();
  });
});
