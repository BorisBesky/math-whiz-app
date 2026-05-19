import React, { useState, useRef, useCallback } from 'react';
import { Sparkles, Loader2, AlertCircle, RotateCcw } from 'lucide-react';
import ModalWrapper from './ui/ModalWrapper';
import { getAuth } from 'firebase/auth';
import { GRADES, VALID_TOPICS_BY_GRADE, QUESTION_TYPES } from '../constants/topics';

const BATCH_SIZE = 25;
const MAX_QUESTIONS = 15;
const DEFAULT_COUNT = '10';
const MAX_ADDITIONAL_INSTRUCTIONS_LENGTH = 500;

const GENERATABLE_TYPES = [
  { value: QUESTION_TYPES.MULTIPLE_CHOICE, label: 'Multiple Choice' },
  { value: QUESTION_TYPES.NUMERIC, label: 'Numeric' },
  { value: QUESTION_TYPES.FILL_IN_THE_BLANKS, label: 'Fill in the Blanks' },
];

const GenerateQuestionsModal = ({ isOpen, onClose, onGenerated }) => {
  const [grade, setGrade] = useState(GRADES.G3);
  const [topic, setTopic] = useState('');
  const [questionTypes, setQuestionTypes] = useState([QUESTION_TYPES.MULTIPLE_CHOICE]);
  const [count, setCount] = useState(DEFAULT_COUNT);
  const [additionalInstructions, setAdditionalInstructions] = useState('');
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState({ completed: 0, total: 0 });
  const [error, setError] = useState(null);
  const cancelledRef = useRef(false);

  const availableTopics = VALID_TOPICS_BY_GRADE[grade] || [];

  const handleGradeChange = (newGrade) => {
    setGrade(newGrade);
    setTopic('');
  };

  const handleTypeToggle = (type) => {
    setQuestionTypes((prev) => {
      if (prev.includes(type)) {
        if (prev.length === 1) return prev; // must keep at least one
        return prev.filter((t) => t !== type);
      }
      return [...prev, type];
    });
  };

  const handleGenerate = useCallback(async () => {
    if (!topic) {
      setError('Please select a topic');
      return;
    }
    if (questionTypes.length === 0) {
      setError('Please select at least one question type');
      return;
    }

    setGenerating(true);
    setError(null);
    cancelledRef.current = false;

    const allQuestions = [];
    const parsedCount = parseInt(count, 10);
    const totalCount = Math.min(Math.max(Number.isFinite(parsedCount) ? parsedCount : 1, 1), MAX_QUESTIONS);
    const totalBatches = Math.ceil(totalCount / BATCH_SIZE);

    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) {
        throw new Error('You must be logged in');
      }
      const token = await user.getIdToken();

      for (let batch = 0; batch < totalBatches; batch++) {
        if (cancelledRef.current) break;

        const batchCount = Math.min(BATCH_SIZE, totalCount - allQuestions.length);
        setProgress({ completed: allQuestions.length, total: totalCount });

        const response = await fetch('/.netlify/functions/gemini-generate-questions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            grade,
            topic,
            questionTypes,
            count: batchCount,
            additionalInstructions: additionalInstructions.trim(),
            appId: 'default-app-id',
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `Generation failed (${response.status})`);
        }

        const result = await response.json();
        allQuestions.push(...result.questions);
      }

      if (cancelledRef.current && allQuestions.length === 0) {
        setGenerating(false);
        return;
      }

      setProgress({ completed: allQuestions.length, total: totalCount });
      setGenerating(false);
      onGenerated(allQuestions);
    } catch (err) {
      console.error('Generation error:', err);
      setError(err.message || 'Failed to generate questions');
      // If we have partial results, offer them
      if (allQuestions.length > 0) {
        setError(`${err.message}. ${allQuestions.length} question(s) were generated before the error.`);
      }
      setGenerating(false);
    }
  }, [grade, topic, questionTypes, count, additionalInstructions, onGenerated]);

  const handleCancel = () => {
    if (generating) {
      cancelledRef.current = true;
    } else {
      onClose();
    }
  };

  return (
    <ModalWrapper isOpen={isOpen} onClose={handleCancel} title="" size="sm" hideCloseButton>
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-5 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="bg-white/20 rounded-full p-2">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Generate questions with AI</h2>
            <p className="text-sm text-purple-100">
              Create new practice questions for any topic in seconds.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleCancel}
          className="text-white/80 hover:text-white text-2xl leading-none"
          aria-label="Close"
        >
          ×
        </button>
      </div>
      <div className="p-6">
        {/* Error */}
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-3 flex items-start space-x-2">
            <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Form */}
        <div className="space-y-4">
          {/* Grade */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Grade
            </label>
            <select
              value={grade}
              onChange={(e) => handleGradeChange(e.target.value)}
              disabled={generating}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            >
              <option value={GRADES.G3}>3rd Grade</option>
              <option value={GRADES.G4}>4th Grade</option>
            </select>
          </div>

          {/* Topic */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Topic
            </label>
            <select
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              disabled={generating}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            >
              <option value="">Select a topic...</option>
              {availableTopics.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          {/* Question Types */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Question Types
            </label>
            <div className="space-y-2">
              {GENERATABLE_TYPES.map(({ value, label }) => (
                <label key={value} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={questionTypes.includes(value)}
                    onChange={() => handleTypeToggle(value)}
                    disabled={generating}
                    className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                  <span className="text-sm text-gray-700">{label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Count */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Number of Questions
            </label>
            <div className="flex items-stretch gap-2">
              <input
                type="number"
                value={count}
                onChange={(e) => setCount(e.target.value)}
                onBlur={() => {
                  const parsed = parseInt(count, 10);
                  if (!Number.isFinite(parsed) || parsed < 1) {
                    setCount('1');
                  } else if (parsed > MAX_QUESTIONS) {
                    setCount(String(MAX_QUESTIONS));
                  } else {
                    setCount(String(parsed));
                  }
                }}
                disabled={generating}
                min={1}
                max={MAX_QUESTIONS}
                className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
              <button
                type="button"
                onClick={() => setCount(DEFAULT_COUNT)}
                disabled={generating || count === DEFAULT_COUNT}
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                title={`Reset to default (${DEFAULT_COUNT})`}
                aria-label="Reset to default"
              >
                <RotateCcw className="h-4 w-4 mr-1" />
                Reset
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">Maximum {MAX_QUESTIONS} questions per generation (default: {DEFAULT_COUNT}).</p>
          </div>

          {/* Additional Instructions */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Additional Instructions (Optional)
            </label>
            <textarea
              value={additionalInstructions}
              onChange={(e) => setAdditionalInstructions(e.target.value.slice(0, MAX_ADDITIONAL_INSTRUCTIONS_LENGTH))}
              disabled={generating}
              rows={3}
              maxLength={MAX_ADDITIONAL_INSTRUCTIONS_LENGTH}
              placeholder="Example: Focus on word problems with money and keep numbers under 100."
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Add specific preferences like context, vocabulary, or difficulty emphasis ({additionalInstructions.length}/{MAX_ADDITIONAL_INSTRUCTIONS_LENGTH}).
            </p>
          </div>
        </div>

        {/* Progress */}
        {generating && (
          <div className="mt-4">
            <div className="flex items-center space-x-2 mb-2">
              <Loader2 className="h-4 w-4 text-purple-600 animate-spin" />
              <span className="text-sm text-gray-700">
                Generating questions... ({progress.completed} of {progress.total})
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${progress.total > 0 ? (progress.completed / progress.total) * 100 : 0}%`,
                }}
              />
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="mt-6 flex justify-end space-x-3">
          <button
            onClick={handleCancel}
            className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            {generating ? 'Cancel' : 'Close'}
          </button>
          <button
            onClick={handleGenerate}
            disabled={generating || !topic || questionTypes.length === 0}
            className="px-4 py-2 text-sm text-white bg-purple-600 rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            <Sparkles className="h-4 w-4" />
            <span>{generating ? 'Generating...' : 'Generate'}</span>
          </button>
        </div>
      </div>
    </ModalWrapper>
  );
};

export default GenerateQuestionsModal;
