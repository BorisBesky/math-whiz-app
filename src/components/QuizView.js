import React from 'react';
import {
  Pause,
  ChevronsRight,
  HelpCircle,
  Sparkles,
  PenTool,
} from 'lucide-react';
import DrawingCanvas from './DrawingCanvas';
import WriteInInput from './WriteInInput';
import NumberPad from './NumberPad';
import PlaceValueTable from './PlaceValueTable';
import {
  isNumericQuestion,
  normalizeNumericAnswer,
  isAIEvaluatedQuestion,
  isFillInTheBlanksQuestion,
  parseBlanks,
  splitQuestionByBlanks,
  parseCorrectAnswers,
  validateBlankAnswerCount,
} from '../utils/answer-helpers';
import { encodeTopicForPath } from '../utils/firebaseHelpers';
import { QUESTION_TYPES } from '../constants/shared-constants';

const QuizView = ({
  currentQuiz,
  currentQuestionIndex,
  currentTopic,
  userAnswer,
  numericInput,
  feedback,
  isAnswered,
  showHint,
  drawingImageBase64,
  isValidatingDrawing,
  drawingFeedback,
  writeInAnswer,
  fillInAnswers,
  fillInResults,
  quizContainerRef,
  pauseQuiz,
  navigateApp,
  handleAnswer,
  checkAnswer,
  nextQuestion,
  handleExplainConcept,
  handleNumericChange,
  handleDrawingChange,
  handleWriteInChange,
  setFillInAnswers,
  setShowHint,
  setUserAnswer,
  formatMathText,
}) => {
  if (currentQuiz.length === 0) {
    return null;
  }
  const currentQuestion = currentQuiz[currentQuestionIndex];
  const progressPercentage =
    ((currentQuestionIndex + 1) / currentQuiz.length) * 100;

  // Filter images by type
  const allQuestionImages = (currentQuestion.images || []).filter(img => !img.type || img.type === 'question' || img.type === 'uploaded');
  const hintImages = (currentQuestion.images || []).filter(img => img.type === 'hint');
  const answerImages = (currentQuestion.images || []).filter(img => img.type === 'answer');

  // Determine if we should use an image as background for drawing
  let drawingBackgroundImage = null;
  let displayQuestionImages = allQuestionImages;

  if (currentQuestion.questionType === 'drawing' && allQuestionImages.length > 0) {
      // Use the first question image as background
      drawingBackgroundImage = allQuestionImages[0].data || allQuestionImages[0].url;
      // Remove it from the display list so it doesn't show up twice
      displayQuestionImages = allQuestionImages.slice(1);
  }

  return (
    <>
      <div
        ref={quizContainerRef}
        className="w-full max-w-3xl mx-auto bg-white/80 backdrop-blur-md p-6 sm:p-8 rounded-card shadow-card border border-white/60 mt-16 flex flex-col animate-fade-in"
        style={{ minHeight: 600 }}
        data-tutorial-id="question-interface"
      >
        {/* Quiz header */}
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-xl md:text-2xl font-display font-bold text-gray-800">
            {currentTopic}
          </h2>
          <button
            onClick={async () => {
              await pauseQuiz();
              navigateApp('/');
            }}
            className="flex items-center gap-1.5 text-gray-400 font-semibold py-1.5 px-3 rounded-button text-sm hover:bg-gray-100 hover:text-gray-600 active:scale-95 transition-all"
          >
            <Pause size={16} /> Pause
          </button>
        </div>
        {/* Progress bar */}
        <div className="w-full bg-gray-100 rounded-full h-2 mb-5 overflow-hidden">
          <div
            className="h-full rounded-full progress-bar-animated"
            style={{
              width: `${progressPercentage}%`,
              background: `linear-gradient(90deg, #48d1a5 0%, #3a7bd5 ${Math.min(progressPercentage + 20, 100)}%, #8b5cf6 100%)`,
            }}
          />
        </div>
        {/* Question counter */}
        <p className="text-xs text-gray-400 font-medium mb-4">
          Question {currentQuestionIndex + 1} of {currentQuiz.length}
        </p>
        {!isFillInTheBlanksQuestion(currentQuestion) && (
          <p
            key={`${currentQuestionIndex}-${isAnswered}`}
            className="text-lg md:text-xl text-gray-800 mb-6 min-h-[56px]"
          >
            {formatMathText(currentQuestion.question)}
          </p>
        )}

        {/* Question Images */}
        {displayQuestionImages.length > 0 && (
          <div className="flex flex-wrap gap-4 mb-6 justify-center">
            {displayQuestionImages.map((img, idx) => (
              <div key={idx} className="flex flex-col items-center">
                <img
                  src={img.data || img.url}
                  alt={img.description || 'Question Image'}
                  className="max-w-full h-auto max-h-60 rounded-lg shadow-md border border-gray-200"
                />
                {img.description && <p className="text-xs text-gray-500 mt-1">{img.description}</p>}
              </div>
            ))}
          </div>
        )}

        {/* Conditionally render drawing canvas, write-in input, drawing+text, number pad, or multiple choice */}
        {currentQuestion.questionType === 'drawing' ? (
          <div className="mb-6">
            {!isAnswered ? (
              <DrawingCanvas
                onChange={handleDrawingChange}
                width={600}
                height={400}
                backgroundImage={drawingBackgroundImage}
              />
            ) : (
              <div className="mt-4">
                {drawingFeedback && (
                  <div className={`p-4 rounded-lg border-2 ${
                    feedback?.type === 'success'
                      ? 'bg-green-50 border-green-500 text-green-800'
                      : 'bg-red-50 border-red-500 text-red-800'
                  }`}>
                    <p className="font-semibold mb-2">AI Feedback:</p>
                    <p>{drawingFeedback}</p>
                  </div>
                )}
                {drawingImageBase64 && (
                  <div className="mt-4 text-center">
                    <p className="text-sm text-gray-600 mb-2">Your drawing:</p>
                    <img
                      src={drawingImageBase64}
                      alt="Your drawing"
                      className="max-w-full h-auto border border-gray-300 rounded-lg mx-auto"
                      style={{ maxHeight: '300px' }}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        ) : currentQuestion.questionType === 'write-in' ? (
          <div className="mb-6">
            {!isAnswered ? (
              <WriteInInput
                value={writeInAnswer}
                onChange={handleWriteInChange}
                maxLength={240}
                placeholder="Type your answer here..."
                disabled={isAnswered}
              />
            ) : (
              <div className="mt-4">
                {drawingFeedback && (
                  <div className={`p-4 rounded-lg border-2 ${
                    feedback?.type === 'success'
                      ? 'bg-green-50 border-green-500 text-green-800'
                      : 'bg-red-50 border-red-500 text-red-800'
                  }`}>
                    <p className="font-semibold mb-2">AI Feedback:</p>
                    <p>{drawingFeedback}</p>
                  </div>
                )}
                {writeInAnswer && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-sm text-gray-600 mb-1">Your answer:</p>
                    <p className="text-gray-800">{writeInAnswer}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : currentQuestion.questionType === 'drawing-with-text' ? (
          <div className="mb-6 space-y-4">
            {!isAnswered ? (
              <>
                <DrawingCanvas
                  onChange={handleDrawingChange}
                  width={600}
                  height={350}
                  backgroundImage={drawingBackgroundImage}
                />
                <WriteInInput
                  value={writeInAnswer}
                  onChange={handleWriteInChange}
                  maxLength={240}
                  placeholder="Explain your work or add details here..."
                  disabled={isAnswered}
                />
              </>
            ) : (
              <div className="mt-4">
                {drawingFeedback && (
                  <div className={`p-4 rounded-lg border-2 ${
                    feedback?.type === 'success'
                      ? 'bg-green-50 border-green-500 text-green-800'
                      : 'bg-red-50 border-red-500 text-red-800'
                  }`}>
                    <p className="font-semibold mb-2">AI Feedback:</p>
                    <p>{drawingFeedback}</p>
                  </div>
                )}
                {drawingImageBase64 && (
                  <div className="mt-4 text-center">
                    <p className="text-sm text-gray-600 mb-2">Your drawing:</p>
                    <img
                      src={drawingImageBase64}
                      alt="Your drawing"
                      className="max-w-full h-auto border border-gray-300 rounded-lg mx-auto"
                      style={{ maxHeight: '250px' }}
                    />
                  </div>
                )}
                {writeInAnswer && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-sm text-gray-600 mb-1">Your explanation:</p>
                    <p className="text-gray-800">{writeInAnswer}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : isFillInTheBlanksQuestion(currentQuestion) ? (
          <div className="mb-6">
            {(() => {
              // Parse the question to find blanks and split into segments
              const blanks = parseBlanks(currentQuestion.question);
              const correctAnswers = parseCorrectAnswers(currentQuestion.correctAnswer);
              const segments = splitQuestionByBlanks(currentQuestion.question, blanks);

              // Validate blank count matches answer count
              if (!validateBlankAnswerCount(blanks, correctAnswers)) {
                return (
                  <div className="p-4 bg-red-50 border border-red-300 rounded-lg">
                    <p className="text-red-800 font-semibold">
                      Error: Number of blanks ({blanks.length}) doesn't match number of answers ({correctAnswers.length})
                    </p>
                  </div>
                );
              }

              // Get input types if specified in question
              const inputTypes = currentQuestion.inputTypes || [];

              // If the question has tableData, render the PlaceValueTable component
              if (currentQuestion.tableData) {
                return (
                  <PlaceValueTable
                    tableData={currentQuestion.tableData}
                    fillInAnswers={fillInAnswers}
                    fillInResults={fillInResults}
                    correctAnswers={correctAnswers}
                    isAnswered={isAnswered}
                    onAnswerChange={setFillInAnswers}
                  />
                );
              }

              return (
                <div className="space-y-4">
                  {/* Render question with inline input fields */}
                  <div className="text-lg md:text-xl leading-relaxed flex flex-wrap items-center gap-2">
                    {segments.map((segment, idx) => {
                      if (typeof segment === 'string') {
                        // Text segment
                        return (
                          <span key={idx} className="inline">
                            {formatMathText(segment)}
                          </span>
                        );
                      } else {
                        // Blank input field
                        const blankIndex = segment.blankIndex;
                        const inputType = inputTypes[blankIndex] || 'mixed';
                        const value = fillInAnswers[blankIndex] || '';
                        const isCorrect = fillInResults[blankIndex];

                        // Determine input styling based on answer state
                        let inputClass = 'inline-block px-3 py-1 border-2 rounded text-center font-medium transition-all';

                        if (isAnswered) {
                          // Show color-coded feedback after answer
                          if (isCorrect) {
                            inputClass += ' border-green-500 bg-green-50 text-green-800';
                          } else {
                            inputClass += ' border-red-500 bg-red-50 text-red-800';
                          }
                        } else if (value) {
                          // User has typed something
                          inputClass += ' border-blue-500 bg-blue-50 text-gray-800';
                        } else {
                          // Empty field
                          inputClass += ' border-gray-300 bg-white text-gray-800';
                        }

                        // Calculate width based on expected answer length (min 4rem, max 12rem)
                        const expectedLength = correctAnswers[blankIndex]?.length || 5;
                        const width = Math.min(Math.max(expectedLength, 4), 12);

                        return (
                          <input
                            key={idx}
                            type="text"
                            value={value}
                            onChange={(e) => {
                              const newAnswers = [...fillInAnswers];
                              newAnswers[blankIndex] = e.target.value;
                              setFillInAnswers(newAnswers);
                            }}
                            disabled={isAnswered}
                            className={inputClass}
                            style={{ width: `${width}rem` }}
                            placeholder={`?`}
                            autoComplete="off"
                            inputMode={inputType === 'numeric' ? 'decimal' : 'text'}
                          />
                        );
                      }
                    })}
                  </div>

                  {/* Show correct answers after submission if there were errors */}
                  {isAnswered && !fillInResults.every(r => r === true) && (
                    <div className="mt-4 p-4 bg-blue-50 border border-blue-300 rounded-lg">
                      <p className="font-semibold text-blue-800 mb-2">Correct answers:</p>
                      <div className="space-y-1">
                        {correctAnswers.map((answer, idx) => {
                          const isCorrect = fillInResults[idx];
                          return (
                            <div key={idx} className="flex items-center gap-2">
                              <span className={`font-medium ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                                Answer {idx + 1}:
                              </span>
                              <span className="text-gray-800 font-semibold">
                                {formatMathText(answer)}
                              </span>
                              {!isCorrect && fillInAnswers[idx] && (
                                <span className="text-sm text-gray-600">
                                  (You wrote: <span className="italic">{fillInAnswers[idx]}</span>)
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        ) : isNumericQuestion(currentQuestion) && currentQuestion.questionType !== QUESTION_TYPES.MULTIPLE_CHOICE ? (
          <div className="mb-6">
            {!isAnswered && (
              <NumberPad
                value={numericInput}
                onChange={handleNumericChange}
                disabled={isAnswered}
              />
            )}
            {isAnswered && (
              <div className="mt-4 text-center">
                <p className="text-lg font-semibold">
                  Your answer was: <span className={
                    normalizeNumericAnswer(userAnswer) === normalizeNumericAnswer(currentQuestion.correctAnswer)
                      ? "text-green-600"
                      : "text-red-600"
                  }>{formatMathText(userAnswer)}</span>
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className={`grid gap-3 mb-6 items-stretch ${currentQuestion.optionImages ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-1 sm:grid-cols-2"}`}>
            {(currentQuestion.options || []).map((option, index) => {
              const isSelected = userAnswer === option;
              const isCorrect = option === currentQuestion.correctAnswer;
              let buttonClass =
                "bg-white border-2 border-gray-200 hover:border-brand-blue hover:bg-blue-50/50 hover:shadow-sm";
              if (isAnswered) {
                if (isCorrect)
                  buttonClass =
                    "bg-green-50 border-2 border-green-400 text-green-800 shadow-glow-green";
                else if (isSelected && !isCorrect)
                  buttonClass =
                    "bg-red-50 border-2 border-red-400 text-red-800 animate-shake";
                else
                  buttonClass =
                    "bg-gray-50 border-2 border-gray-200 text-gray-400";
              } else if (isSelected) {
                buttonClass = "bg-blue-50 border-2 border-brand-blue shadow-glow-blue";
              }
              const hasImage = currentQuestion.optionImages && currentQuestion.optionImages[option];
              return (
                <button
                  key={`${index}-${isAnswered}`}
                  onClick={() => handleAnswer(option)}
                  onDoubleClick={() => {
                    if (!isAnswered) {
                      handleAnswer(option);
                      setTimeout(() => checkAnswer(), 0);
                    }
                  }}
                  disabled={isAnswered}
                  className={`w-full ${hasImage ? 'p-2' : 'p-4'} rounded-card ${hasImage ? 'text-center' : 'text-left'} text-lg font-medium transition-all duration-200 h-auto whitespace-normal break-words overflow-visible active:scale-[0.98] ${buttonClass}`}
                >
                  <span className="text-xs font-bold text-gray-300 mr-2">{String.fromCharCode(65 + index)}.</span>
                  {hasImage ? (
                    <div className="flex flex-col items-center w-full">
                      <img
                        src={currentQuestion.optionImages[option]}
                        alt={option}
                        className="w-24 h-24 object-contain mb-1 rounded"
                        draggable={false}
                      />
                      <span className="text-xs text-gray-600 text-center leading-tight">
                        {option}
                      </span>
                    </div>
                  ) : (
                    formatMathText(option)
                  )}
                </button>
              );
            })}
          </div>
        )}
        {showHint && !isAnswered && (
          <div
            onClick={() => setShowHint(false)}
            className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-800 p-4 mb-4 rounded-r-lg cursor-pointer hover:bg-yellow-200 transition-colors"
          >
            <p>
              <span className="font-bold">Hint:</span> {currentQuestion.hint}
            </p>
            {/* Hint Images */}
            {hintImages.length > 0 && (
              <div className="flex flex-wrap gap-4 mt-3 justify-center">
                {hintImages.map((img, idx) => (
                  <div key={idx} className="flex flex-col items-center">
                    <img
                      src={img.data || img.url}
                      alt={img.description || 'Hint Image'}
                      className="max-w-full h-auto max-h-40 rounded shadow-sm border border-yellow-200"
                    />
                    {img.description && <p className="text-xs text-yellow-700 mt-1">{img.description}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Answer Images - Show only when answered */}
        {isAnswered && answerImages.length > 0 && (
           <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="font-semibold text-blue-800 mb-2">Answer Explanation:</p>
              <div className="flex flex-wrap gap-4 justify-center">
                  {answerImages.map((img, idx) => (
                      <div key={idx} className="flex flex-col items-center">
                          <img
                              src={img.data || img.url}
                              alt={img.description || 'Answer Image'}
                              className="max-w-full h-auto max-h-60 rounded shadow-md border border-blue-200"
                          />
                          {img.description && <p className="text-xs text-blue-600 mt-1">{img.description}</p>}
                      </div>
                  ))}
              </div>
           </div>
        )}

        {/* Bottom layout: two rows, responsive */}
        <div className="mt-auto w-full">
          {/* First row: Explain Concept | Sketch | Show/Hide Hint */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-2">
            <button
              onClick={handleExplainConcept}
              className="w-full flex items-center justify-center gap-2 text-purple-600 font-semibold py-1.5 px-3 rounded-lg hover:bg-purple-100 transition text-sm"
              data-tutorial-id="ai-tutor-button"
            >
              <Sparkles size={18} /> Learn About This
            </button>
            <button
              onClick={() => navigateApp(`/quiz/${encodeTopicForPath(currentTopic)}/sketch`)}
              disabled={currentQuestion.questionType === 'drawing' || currentQuestion.questionType === 'drawing-with-text'}
              className="w-full flex items-center justify-center gap-2 text-orange-600 font-semibold py-1.5 px-3 rounded-lg hover:bg-orange-100 transition disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              <PenTool size={18} /> Sketch
            </button>
            <button
              onClick={() => setShowHint(!showHint)}
              disabled={isAnswered}
              className="w-full flex items-center justify-center gap-2 text-blue-600 font-semibold py-1.5 px-3 rounded-lg hover:bg-blue-100 transition disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              <HelpCircle size={18} />
              {showHint ? "Hide Hint" : "Show Hint"}
            </button>
          </div>
          {/* Second row: Response Field | Check/Next Button */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {/* Response Field: show feedback, selected answer, or prompt to select */}
            <div
              className={`flex items-center justify-center w-full min-h-[40px] rounded-button border px-3 text-sm font-bold transition-all duration-300 ${
                feedback
                  ? feedback.type === "success"
                    ? "bg-green-50 border-green-300 text-green-700 animate-bounce-in"
                    : "bg-red-50 border-red-300 text-red-700 animate-shake"
                  : "bg-gray-50 border-gray-200 text-gray-500"
              }`}
            >
              {feedback ? (
                feedback.message
              ) : isFillInTheBlanksQuestion(currentQuestion) ? (
                <span>
                  {(() => {
                    const blanks = parseBlanks(currentQuestion.question);
                    const filledCount = fillInAnswers.filter(ans => ans && ans.trim() !== '').length;
                    if (filledCount === 0) {
                      return <span className="italic text-gray-400">Fill in all {blanks.length} blank{blanks.length > 1 ? 's' : ''}</span>;
                    } else if (filledCount < blanks.length) {
                      return <span className="text-yellow-700">{filledCount}/{blanks.length} blanks filled</span>;
                    } else {
                      return <span className="text-green-700">✓ All {blanks.length} blanks filled</span>;
                    }
                  })()}
                </span>
              ) : userAnswer !== null && userAnswer !== '' ? (
                <span>
                  {isNumericQuestion(currentQuestion) && currentQuestion.questionType !== QUESTION_TYPES.MULTIPLE_CHOICE ? 'Your answer' : 'Selected'}:{" "}
                  <span className="font-bold">
                    {formatMathText(userAnswer)}
                  </span>
                </span>
              ) : isAIEvaluatedQuestion(currentQuestion) ? (
                <span className="italic text-gray-400">
                  {currentQuestion.questionType === 'drawing' ? 'Draw your answer' :
                   currentQuestion.questionType === 'write-in' ? (writeInAnswer ? 'Answer ready' : 'Type your answer') :
                   currentQuestion.questionType === 'drawing-with-text' ?
                     (drawingImageBase64 && writeInAnswer ? 'Ready to submit' :
                      drawingImageBase64 ? 'Add your explanation' :
                      writeInAnswer ? 'Draw your answer' : 'Draw and explain') : ''}
                </span>
              ) : (
                <span className="italic text-gray-400">
                  {isNumericQuestion(currentQuestion) && currentQuestion.questionType !== QUESTION_TYPES.MULTIPLE_CHOICE ? 'Enter a number' :
                  currentQuestion.questionType === QUESTION_TYPES.MULTIPLE_CHOICE ? 'Select an answer' : ''}
                </span>
              )}
            </div>
            <div className="flex items-center justify-center w-full">
              {isAnswered ? (
                <button
                  onClick={nextQuestion}
                  className="w-full bg-brand-blue text-white font-display font-bold py-2 px-6 rounded-button hover:opacity-90 active:scale-95 transition-all duration-200 flex items-center justify-center gap-2 text-sm min-h-[40px] shadow-sm"
                >
                  Next Question <ChevronsRight size={18} />
                </button>
              ) : (
                <button
                  onClick={checkAnswer}
                  disabled={
                    isValidatingDrawing ||
                    (currentQuestion.questionType === 'drawing'
                      ? !drawingImageBase64
                      : currentQuestion.questionType === 'write-in'
                        ? !writeInAnswer.trim()
                        : currentQuestion.questionType === 'drawing-with-text'
                          ? (!drawingImageBase64 || !writeInAnswer.trim())
                          : isFillInTheBlanksQuestion(currentQuestion)
                            ? (() => {
                                const blanks = parseBlanks(currentQuestion.question);
                                return fillInAnswers.length !== blanks.length ||
                                       fillInAnswers.some(ans => !ans || ans.trim() === '');
                              })()
                            : (userAnswer === null || userAnswer === ''))
                  }
                  className="w-full bg-brand-mint text-white font-display font-bold py-2 px-6 rounded-button hover:opacity-90 active:scale-95 transition-all duration-200 disabled:bg-gray-300 disabled:cursor-not-allowed text-sm min-h-[40px] flex items-center justify-center gap-2 shadow-sm"
                >
                  {isValidatingDrawing && (
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  )}
                  <span>{isValidatingDrawing ? 'Checking answer...' : 'Check Answer'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
        <div className="text-center mt-4">
          <p className="text-xs text-gray-400">
            CA Standard: {currentQuestion.standard}
          </p>
        </div>
      </div>
    </>
  );
};

export default QuizView;
