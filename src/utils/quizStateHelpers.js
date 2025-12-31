// Helper functions for quiz state management

export function resetTransientQuizState({
  setFeedback,
  setIsAnswered,
  setUserAnswer,
  setWriteInAnswer,
  setFillInAnswers,
  setFillInResults,
  setDrawingFeedback,
  setShowHint,
}) {
  if (typeof setFeedback === 'function') setFeedback(null);
  if (typeof setIsAnswered === 'function') setIsAnswered(false);
  if (typeof setUserAnswer === 'function') setUserAnswer(null);
  if (typeof setWriteInAnswer === 'function') setWriteInAnswer('');
  if (typeof setFillInAnswers === 'function') setFillInAnswers([]);
  if (typeof setFillInResults === 'function') setFillInResults([]);
  if (typeof setDrawingFeedback === 'function') setDrawingFeedback(null);
  if (typeof setShowHint === 'function') setShowHint(false);
}
