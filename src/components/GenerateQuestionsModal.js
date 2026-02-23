import React, { useState, useRef, useCallback } from 'react';
import { Sparkles, X, Loader2, AlertCircle } from 'lucide-react';
import { getAuth } from 'firebase/auth';
import { GRADES, VALID_TOPICS_BY_GRADE, QUESTION_TYPES } from '../constants/topics';

const BATCH_SIZE = 25;
const MAX_QUESTIONS = 100;

const GENERATABLE_TYPES = [
  { value: QUESTION_TYPES.MULTIPLE_CHOICE, label: 'Multiple Choice' },
  { value: QUESTION_TYPES.NUMERIC, label: 'Numeric' },
  { value: QUESTION_TYPES.FILL_IN_THE_BLANKS, label: 'Fill in the Blanks' },
];

const GenerateQuestionsModal = ({ isOpen, onClose, onGenerated }) => {
  const [grade, setGrade] = useState(GRADES.G3);
  const [topic, setTopic] = useState('');
  const [questionTypes, setQuestionTypes] = useState([QUESTION_TYPES.MULTIPLE_CHOICE]);
  const [count, setCount] = useState(10);
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
    const totalCount = Math.min(Math.max(count, 1), MAX_QUESTIONS);
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
  }, [grade, topic, questionTypes, count, onGenerated]);

  const handleCancel = () => {
    if (generating) {
      cancelledRef.current = true;
    } else {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-6 border w-full max-w-lg shadow-lg rounded-md bg-white my-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <Sparkles className="h-5 w-5 text-purple-600" />
            <h3 className="text-lg font-medium text-gray-900">
              Generate Questions with AI
            </h3>
          </div>
          <button
            onClick={handleCancel}
            className="text-gray-400 hover:text-gray-600"
            disabled={generating}
          >
            <X className="h-6 w-6" />
          </button>
        </div>

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
            <input
              type="number"
              value={count}
              onChange={(e) => setCount(Math.min(Math.max(parseInt(e.target.value) || 1, 1), MAX_QUESTIONS))}
              disabled={generating}
              min={1}
              max={MAX_QUESTIONS}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            />
            <p className="text-xs text-gray-500 mt-1">Maximum {MAX_QUESTIONS} questions per generation</p>
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
    </div>
  );
};

export default GenerateQuestionsModal;
