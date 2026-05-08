// Tests for the new friendly GoalsModal component used in the teacher portal.
// Covers:
//   - Rendering with title, grade, and per-topic inputs
//   - "Apply to all topics" bulk-apply
//   - Number input behavior (allow clearing, clamp on blur)
//   - Save callback receives normalized integer targets
const React = require('react');
const { render, screen, fireEvent, waitFor, within } = require('@testing-library/react');

jest.mock('../../ui/ModalWrapper', () => {
  const React = require('react');
  return function MockModalWrapper({ isOpen, children }) {
    if (!isOpen) return null;
    return React.createElement('div', { 'data-testid': 'modal' }, children);
  };
});

const GoalsModal = require('../GoalsModal').default;

const G3_TOPICS = ['Multiplication', 'Division', 'Fractions', 'Measurement & Data'];

const renderModal = (overrides = {}) => {
  const props = {
    isOpen: true,
    onClose: jest.fn(),
    initialGrade: 'G3',
    initialTargets: {},
    studentCount: 1,
    onSave: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  };
  return { props, ...render(React.createElement(GoalsModal, props)) };
};

describe('GoalsModal', () => {
  test('renders one numeric input per Grade 3 topic with default target of 4', () => {
    renderModal();

    G3_TOPICS.forEach((topic) => {
      expect(screen.getByText(topic)).toBeInTheDocument();
    });

    // The per-topic inputs default to "4".
    // Filter out the "Apply to all topics" input by aria-label.
    const perTopicInputs = screen
      .getAllByRole('spinbutton')
      .filter((el) => el.value === '4' && el.getAttribute('aria-label') !== 'Apply same goal to all topics');
    expect(perTopicInputs.length).toBe(G3_TOPICS.length);
  });

  test('clearing a per-topic input is allowed during typing and snaps to 0 on blur', () => {
    renderModal({ initialTargets: { Multiplication: 7 } });

    const inputs = screen.getAllByRole('spinbutton');
    // Find the input whose displayed value is 7 — the one we set above.
    const seven = inputs.find((el) => el.value === '7');
    expect(seven).toBeTruthy();

    fireEvent.change(seven, { target: { value: '' } });
    expect(seven.value).toBe('');

    fireEvent.blur(seven);
    expect(seven.value).toBe('0');
  });

  test('"Apply" sets every topic to the chosen value', () => {
    renderModal();

    const applyAllInput = screen.getByLabelText('Apply same goal to all topics');
    fireEvent.change(applyAllInput, { target: { value: '6' } });
    fireEvent.click(screen.getByRole('button', { name: 'Apply' }));

    // All per-topic inputs should now read 6.
    const sixes = screen.getAllByRole('spinbutton').filter((el) => el.value === '6');
    expect(sixes.length).toBeGreaterThanOrEqual(G3_TOPICS.length);
  });

  test('Save calls onSave with parsed integer targets and selected grade', async () => {
    const onSave = jest.fn().mockResolvedValue(undefined);
    const onClose = jest.fn();
    renderModal({ onSave, onClose });

    fireEvent.click(screen.getByRole('button', { name: /save goals/i }));

    await waitFor(() => expect(onSave).toHaveBeenCalled());
    const arg = onSave.mock.calls[0][0];
    expect(arg.grade).toBe('G3');
    G3_TOPICS.forEach((topic) => {
      expect(arg.targets[topic]).toBe(4);
    });
    Object.values(arg.targets).forEach((v) => expect(typeof v).toBe('number'));
    expect(onClose).toHaveBeenCalled();
  });

  test('switching to G4 reveals G4 topics', () => {
    renderModal();
    const gradeSelect = screen.getAllByRole('combobox')[0];
    fireEvent.change(gradeSelect, { target: { value: 'G4' } });

    expect(screen.getByText('Operations & Algebraic Thinking')).toBeInTheDocument();
    expect(screen.getByText('Base Ten')).toBeInTheDocument();
  });

  test('shows the supplied student count in the header', () => {
    renderModal({ studentCount: 5 });
    const modal = screen.getByTestId('modal');
    expect(within(modal).getByText(/5 students/i)).toBeInTheDocument();
  });

  test('singular "1 student" for a single student', () => {
    renderModal({ studentCount: 1 });
    const modal = screen.getByTestId('modal');
    expect(within(modal).getByText(/1 student\b/i)).toBeInTheDocument();
  });
});
