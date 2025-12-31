import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import EditQuestionModal from 'src/components/EditQuestionModal';
import { QUESTION_TYPES } from 'src/constants/topics';

describe('EditQuestionModal', () => {
  test('auto-detects and includes inputTypes when saving a fill-in-the-blanks question', async () => {
    const onSave = jest.fn().mockResolvedValue();
    const onCancel = jest.fn();

    const question = {
      id: 'test-q-1',
      question: 'Divide. a. __ b. __',
      questionType: QUESTION_TYPES.FILL_IN_THE_BLANKS,
      topic: 'Base Ten',
      grade: 'G4',
      // No inputTypes initially
    };

    render(<EditQuestionModal question={question} onSave={onSave} onCancel={onCancel} />);

    // Enter correct answers separated by ';;' (include a comma in one to test numeric detection)
    const correctAnswerInput = screen.getByPlaceholderText('e.g., answer1 ;; answer2 ;; answer3');
    fireEvent.change(correctAnswerInput, { target: { value: '63 ;; 2,141' } });

    // Click Save Changes
    const saveButton = screen.getByRole('button', { name: /Save Changes/i });
    fireEvent.click(saveButton);

    // Wait for onSave to be called
    await waitFor(() => expect(onSave).toHaveBeenCalled());

    // Inspect the saved question object
    const savedArg = onSave.mock.calls[0][0];
    expect(savedArg).toBeDefined();
    expect(savedArg.questionType).toBe(QUESTION_TYPES.FILL_IN_THE_BLANKS);
    expect(Array.isArray(savedArg.inputTypes)).toBe(true);
    expect(savedArg.inputTypes.length).toBe(2);
    // Both answers should be detected as numeric
    expect(savedArg.inputTypes[0]).toBe('numeric');
    expect(savedArg.inputTypes[1]).toBe('numeric');
  });
});
