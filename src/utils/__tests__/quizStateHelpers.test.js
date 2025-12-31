import { resetTransientQuizState } from '../quizStateHelpers';

test('resetTransientQuizState calls all provided setters with cleared values', () => {
  const setFeedback = jest.fn();
  const setIsAnswered = jest.fn();
  const setUserAnswer = jest.fn();
  const setWriteInAnswer = jest.fn();
  const setFillInAnswers = jest.fn();
  const setFillInResults = jest.fn();
  const setDrawingFeedback = jest.fn();
  const setShowHint = jest.fn();

  resetTransientQuizState({
    setFeedback,
    setIsAnswered,
    setUserAnswer,
    setWriteInAnswer,
    setFillInAnswers,
    setFillInResults,
    setDrawingFeedback,
    setShowHint,
  });

  expect(setFeedback).toHaveBeenCalledWith(null);
  expect(setIsAnswered).toHaveBeenCalledWith(false);
  expect(setUserAnswer).toHaveBeenCalledWith(null);
  expect(setWriteInAnswer).toHaveBeenCalledWith('');
  expect(setFillInAnswers).toHaveBeenCalledWith([]);
  expect(setFillInResults).toHaveBeenCalledWith([]);
  expect(setDrawingFeedback).toHaveBeenCalledWith(null);
  expect(setShowHint).toHaveBeenCalledWith(false);
});
