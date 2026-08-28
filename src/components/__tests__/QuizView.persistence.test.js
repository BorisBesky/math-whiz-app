import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import QuizView from '../QuizView';

const makeProps = (overrides = {}) => ({
  currentQuiz: [{
    question: 'What is 2 + 2?',
    questionType: 'multiple-choice',
    options: ['3', '4'],
    correctAnswer: '4',
  }],
  currentQuestionIndex: 0,
  currentTopic: 'Addition',
  userAnswer: '4',
  numericInput: '',
  feedback: { type: 'success', message: 'Correct!' },
  isAnswered: true,
  answerSaveStatus: 'saved',
  showHint: false,
  drawingImageBase64: null,
  isValidatingDrawing: false,
  drawingFeedback: null,
  writeInAnswer: '',
  fillInAnswers: [],
  fillInResults: [],
  quizContainerRef: { current: null },
  pauseQuiz: jest.fn(),
  navigateApp: jest.fn(),
  handleAnswer: jest.fn(),
  checkAnswer: jest.fn(),
  nextQuestion: jest.fn(),
  retryQuestionAttempt: jest.fn(),
  handleExplainConcept: jest.fn(),
  handleNumericChange: jest.fn(),
  handleDrawingChange: jest.fn(),
  handleWriteInChange: jest.fn(),
  setFillInAnswers: jest.fn(),
  setShowHint: jest.fn(),
  setUserAnswer: jest.fn(),
  formatMathText: (value) => value,
  ...overrides,
});

describe('QuizView answer persistence controls', () => {
  test('blocks the next question while the answer write is pending', () => {
    const props = makeProps({ answerSaveStatus: 'saving' });
    render(<QuizView {...props} />);

    const savingButton = screen.getByRole('button', { name: /saving answer/i });
    expect(savingButton).toBeDisabled();
    fireEvent.click(savingButton);
    expect(props.nextQuestion).not.toHaveBeenCalled();
  });

  test('offers a retry instead of advancing when the write fails', () => {
    const props = makeProps({ answerSaveStatus: 'error' });
    render(<QuizView {...props} />);

    fireEvent.click(screen.getByRole('button', { name: /retry save/i }));
    expect(props.retryQuestionAttempt).toHaveBeenCalledTimes(1);
    expect(props.nextQuestion).not.toHaveBeenCalled();
  });

  test('allows the next question after the write is acknowledged', () => {
    const props = makeProps();
    render(<QuizView {...props} />);

    fireEvent.click(screen.getByRole('button', { name: /next question/i }));
    expect(props.nextQuestion).toHaveBeenCalledTimes(1);
  });
});
