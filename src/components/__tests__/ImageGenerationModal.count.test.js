// Tests for the "Number of Images" input reset behavior in ImageGenerationModal.
// Same class of bug as GenerateQuestionsModal: the user could not clear the field
// because the onChange handler clamped on every keystroke.
const React = require('react');
const { render, fireEvent, screen } = require('@testing-library/react');

jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { getIdToken: jest.fn().mockResolvedValue('mock-token') },
  }),
}));

const ImageGenerationModal = require('../ImageGenerationModal').default;

const findCountInput = () => screen.getByRole('spinbutton');

describe('ImageGenerationModal - count input reset behavior', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('user can clear the count field and type a different value', () => {
    render(
      React.createElement(ImageGenerationModal, {
        isOpen: true,
        onClose: jest.fn(),
        onSuccess: jest.fn(),
      })
    );

    const input = findCountInput();
    expect(input).toBeTruthy();
    expect(input.value).toBe('3');

    fireEvent.change(input, { target: { value: '' } });
    expect(input.value).toBe('');

    fireEvent.change(input, { target: { value: '7' } });
    expect(input.value).toBe('7');
  });

  test('blurring an empty input snaps to 1, not back to the default 3', () => {
    render(
      React.createElement(ImageGenerationModal, {
        isOpen: true,
        onClose: jest.fn(),
        onSuccess: jest.fn(),
      })
    );

    const input = findCountInput();
    fireEvent.change(input, { target: { value: '' } });
    fireEvent.blur(input);
    expect(input.value).toBe('1');
  });

  test('blur clamps an above-max value down to 10', () => {
    render(
      React.createElement(ImageGenerationModal, {
        isOpen: true,
        onClose: jest.fn(),
        onSuccess: jest.fn(),
      })
    );

    const input = findCountInput();
    fireEvent.change(input, { target: { value: '500' } });
    fireEvent.blur(input);
    expect(input.value).toBe('10');
  });

  test('Generate Descriptions button is disabled when count is empty (and re-enables after typing valid value)', () => {
    render(
      React.createElement(ImageGenerationModal, {
        isOpen: true,
        onClose: jest.fn(),
        onSuccess: jest.fn(),
      })
    );

    // Fill required theme fields so only count gates the button.
    const themeInput = screen.getByPlaceholderText(/safari, space, ocean, fantasy/i);
    fireEvent.change(themeInput, { target: { value: 'Safari' } });
    const themeDescription = screen.getByPlaceholderText(/safari animals/i);
    fireEvent.change(themeDescription, { target: { value: 'Test description' } });

    const next = screen.getByRole('button', { name: /generate descriptions/i });
    expect(next).not.toBeDisabled();

    const input = findCountInput();
    fireEvent.change(input, { target: { value: '' } });
    expect(next).toBeDisabled();

    fireEvent.change(input, { target: { value: '4' } });
    expect(next).not.toBeDisabled();
  });
});
