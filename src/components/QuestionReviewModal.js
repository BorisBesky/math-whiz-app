import React, { useState, useEffect } from 'react';
import { X, Save, Trash2, X as XIcon, Image as ImageIcon, Loader2 } from 'lucide-react';
import { getFirestore, collection, addDoc, doc, setDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { TOPICS } from '../constants/topics';
import { clearCachedClassQuestions } from '../utils/questionCache';

const QuestionReviewModal = ({ questions, fileName, classId, appId, onSave, onCancel, source = 'pdf-upload' }) => {
  // Initialize questions with default questionType if missing
  const initializeQuestions = (qs) => {
    return qs.map(q => ({
      ...q,
      questionType: q.questionType || 'multiple-choice',
      options: q.questionType === 'multiple-choice' ? (q.options || []) : []
    }));
  };

  const [editedQuestions, setEditedQuestions] = useState(() => initializeQuestions(questions));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [selectedQuestions, setSelectedQuestions] = useState(new Set(questions.map((_, i) => i)));

  // Update editedQuestions when questions prop changes
  useEffect(() => {
    const initialized = initializeQuestions(questions);
    setEditedQuestions(initialized);
    setSelectedQuestions(new Set(questions.map((_, i) => i)));
  }, [questions]);

  const gradeOptions = ['G3', 'G4'];
  const questionTypeOptions = [
    { value: 'multiple-choice', label: 'Multiple Choice' },
    { value: 'numeric', label: 'Numeric Answer' },
    { value: 'drawing', label: 'Drawing (Interactive)' }
  ];
  const topicOptions = [
    TOPICS.MULTIPLICATION,
    TOPICS.DIVISION,
    TOPICS.FRACTIONS,
    TOPICS.MEASUREMENT_DATA,
    TOPICS.OPERATIONS_ALGEBRAIC_THINKING,
    TOPICS.BASE_TEN,
    TOPICS.FRACTIONS_4TH,
    TOPICS.MEASUREMENT_DATA_4TH,
    TOPICS.GEOMETRY,
    TOPICS.BINARY_ADDITION
  ];

  const handleQuestionChange = (index, field, value) => {
    const updated = [...editedQuestions];
    updated[index] = {
      ...updated[index],
      [field]: value
    };
    setEditedQuestions(updated);
  };

  const handleOptionsChange = (index, optionIndex, value) => {
    const updated = [...editedQuestions];
    const options = [...(updated[index].options || [])];
    options[optionIndex] = value;
    updated[index] = {
      ...updated[index],
      options
    };
    setEditedQuestions(updated);
  };

  const addOption = (index) => {
    const updated = [...editedQuestions];
    const options = [...(updated[index].options || []), ''];
    updated[index] = {
      ...updated[index],
      options
    };
    setEditedQuestions(updated);
  };

  const removeOption = (index, optionIndex) => {
    const updated = [...editedQuestions];
    const options = updated[index].options.filter((_, i) => i !== optionIndex);
    updated[index] = {
      ...updated[index],
      options
    };
    setEditedQuestions(updated);
  };

  const toggleQuestionSelection = (index) => {
    const newSelected = new Set(selectedQuestions);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedQuestions(newSelected);
  };

  const selectAll = () => {
    if (selectedQuestions.size === editedQuestions.length) {
      setSelectedQuestions(new Set());
    } else {
      setSelectedQuestions(new Set(editedQuestions.map((_, i) => i)));
    }
  };

  const deleteSelected = () => {
    const updated = editedQuestions.filter((_, i) => !selectedQuestions.has(i));
    setEditedQuestions(updated);
    setSelectedQuestions(new Set());
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);

    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) {
        throw new Error('User not authenticated');
      }

      const db = getFirestore();
      const questionsToSave = editedQuestions.filter((_, i) => selectedQuestions.has(i));

      if (questionsToSave.length === 0) {
        setError('Please select at least one question to save');
        setSaving(false);
        return;
      }

      // Validate questions
      for (const q of questionsToSave) {
        if (!q.question || !q.topic || !q.grade) {
          throw new Error('All questions must have question text, topic, and grade');
        }
        
        // Validate question type
        const questionType = q.questionType || 'multiple-choice';
        if (!['multiple-choice', 'numeric', 'drawing'].includes(questionType)) {
          throw new Error(`Invalid question type "${questionType}". Must be one of: multiple-choice, numeric, drawing`);
        }
        
        // Validate correctAnswer based on question type
        if (questionType !== 'drawing' && !q.correctAnswer) {
          throw new Error(`Question type "${questionType}" requires a correct answer`);
        }
        
        // Validate options for multiple-choice questions
        if (questionType === 'multiple-choice' && (!q.options || q.options.length === 0)) {
          throw new Error('Multiple choice questions must have at least one option');
        }
        
        if (!topicOptions.includes(q.topic)) {
          throw new Error(`Invalid topic "${q.topic}". Please select a valid topic from the dropdown.`);
        }
        if (!gradeOptions.includes(q.grade)) {
          throw new Error(`Invalid grade "${q.grade}". Please select a valid grade from the dropdown.`);
        }
      }

      // First, save all questions to teacher's global question bank
      const savedQuestionIds = [];
      for (const question of questionsToSave) {
        const questionBankRef = collection(db, 'artifacts', appId, 'users', user.uid, 'questionBank');
        const savedDoc = await addDoc(questionBankRef, {
          ...question,
          createdAt: new Date(),
          createdBy: user.uid,
          source: source,
          pdfSource: fileName || '',
          assignedClasses: classId ? [classId] : []
        });
        savedQuestionIds.push({ id: savedDoc.id, question });
      }

      // If classId provided, create reference documents in the class questions subcollection
      if (classId) {
        const classRefPromises = [];
        for (const { id: questionId, question } of savedQuestionIds) {
          const classQuestionRef = doc(db, 'artifacts', appId, 'classes', classId, 'questions', questionId);
          classRefPromises.push(
            setDoc(classQuestionRef, {
              // Reference information
              questionBankRef: `artifacts/${appId}/users/${user.uid}/questionBank/${questionId}`,
              teacherId: user.uid,
              assignedAt: new Date(),
              
              // Essential question data (for querying and display)
              topic: question.topic,
              grade: question.grade,
              question: question.question,
              questionType: question.questionType || 'multiple-choice',
              correctAnswer: question.correctAnswer,
              options: question.options || [],
              hint: question.hint || '',
              standard: question.standard || '',
              concept: question.concept || '',
              images: question.images || [],
              source: source,
              pdfSource: fileName || '',
              createdAt: new Date(),
              createdBy: user.uid
            })
          );
        }
        await Promise.all(classRefPromises);
        
        // Clear cache for affected class/topic/grade combinations
        const affectedCombinations = new Set();
        questionsToSave.forEach(question => {
          if (question.topic && question.grade) {
            affectedCombinations.add(`${question.topic}_${question.grade}`);
          }
        });
        
        affectedCombinations.forEach(combo => {
          const [topic, grade] = combo.split('_');
          clearCachedClassQuestions(classId, topic, grade, appId);
        });
      }

      if (onSave) {
        onSave();
      }
    } catch (err) {
      console.error('Save error:', err);
      setError(err.message || 'Failed to save questions');
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-full max-w-6xl shadow-lg rounded-md bg-white my-10">
        <div className="mt-3">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                Review {source === 'imported' ? 'Imported' : 'Extracted'} Questions
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {fileName && `${fileName} • `}{editedQuestions.length} question(s) {source === 'imported' ? 'imported' : 'extracted'}
              </p>
            </div>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600"
              disabled={saving}
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Batch Actions */}
          <div className="mb-4 flex items-center justify-between bg-gray-50 p-3 rounded-md">
            <div className="flex items-center space-x-4">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedQuestions.size === editedQuestions.length && editedQuestions.length > 0}
                  onChange={selectAll}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="text-sm text-gray-700">Select All</span>
              </label>
              <span className="text-sm text-gray-600">
                {selectedQuestions.size} of {editedQuestions.length} selected
              </span>
              {selectedQuestions.size > 0 && (
                <button
                  onClick={deleteSelected}
                  className="text-sm text-red-600 hover:text-red-800 flex items-center"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete Selected
                </button>
              )}
            </div>
          </div>

          {/* Questions List */}
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {editedQuestions.map((question, index) => (
              <div
                key={index}
                className={`border rounded-lg p-4 ${
                  selectedQuestions.has(index) ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={selectedQuestions.has(index)}
                      onChange={() => toggleQuestionSelection(index)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Question {index + 1}
                    </span>
                    {question.questionType && (
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        question.questionType === 'drawing' ? 'bg-purple-100 text-purple-800' :
                        question.questionType === 'numeric' ? 'bg-green-100 text-green-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {question.questionType === 'drawing' ? '✏️ Drawing' :
                         question.questionType === 'numeric' ? '🔢 Numeric' : '📝 Multiple Choice'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Question Text */}
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Question *
                  </label>
                  <textarea
                    value={question.question || ''}
                    onChange={(e) => handleQuestionChange(index, 'question', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    rows={3}
                    placeholder="Enter question text..."
                  />
                  {question.images && question.images.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {question.images.map((img, imgIdx) => (
                        <div key={imgIdx} className="flex items-center space-x-2 text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
                          <ImageIcon className="h-3 w-3" />
                          <span>{img.type}: {img.description || 'Image'}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Question Type, Topic and Grade */}
                <div className="grid grid-cols-3 gap-4 mb-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Question Type
                    </label>
                    <select
                      value={question.questionType || 'multiple-choice'}
                      onChange={(e) => {
                        const newType = e.target.value;
                        handleQuestionChange(index, 'questionType', newType);
                        // Clear options if switching away from multiple-choice
                        if (newType !== 'multiple-choice') {
                          handleQuestionChange(index, 'options', []);
                        }
                        // Clear correctAnswer if switching to drawing
                        if (newType === 'drawing') {
                          handleQuestionChange(index, 'correctAnswer', '');
                        }
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    >
                      {questionTypeOptions.map(type => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                    {question.questionType === 'drawing' && (
                      <p className="mt-1 text-xs text-gray-500">
                        Drawing questions allow students to sketch answers. AI validates automatically.
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Topic *
                    </label>
                    <select
                      value={question.topic || ''}
                      onChange={(e) => handleQuestionChange(index, 'topic', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    >
                      <option value="">Select topic</option>
                      {topicOptions.map(topic => (
                        <option key={topic} value={topic}>{topic}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Grade *
                    </label>
                    <select
                      value={question.grade || ''}
                      onChange={(e) => handleQuestionChange(index, 'grade', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    >
                      <option value="">Select grade</option>
                      {gradeOptions.map(grade => (
                        <option key={grade} value={grade}>{grade}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Options - Only show for multiple-choice questions */}
                {question.questionType === 'multiple-choice' && (
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Multiple Choice Options *
                    </label>
                    {question.options && question.options.map((option, optIndex) => (
                      <div key={optIndex} className="flex items-center space-x-2 mb-2">
                        <input
                          type="text"
                          value={option}
                          onChange={(e) => handleOptionsChange(index, optIndex, e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                          placeholder={`Option ${optIndex + 1}`}
                        />
                        <button
                          onClick={() => removeOption(index, optIndex)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <XIcon className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => addOption(index)}
                      className="text-sm text-blue-600 hover:text-blue-800 mt-2"
                    >
                      + Add Option
                    </button>
                  </div>
                )}

                {/* Correct Answer - Only show for non-drawing questions */}
                {question.questionType !== 'drawing' && (
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Correct Answer *
                      {question.questionType === 'numeric' && (
                        <span className="text-xs text-gray-500 ml-2">(Numeric value only, no units)</span>
                      )}
                    </label>
                    <input
                      type="text"
                      value={question.correctAnswer || ''}
                      onChange={(e) => handleQuestionChange(index, 'correctAnswer', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      placeholder={question.questionType === 'numeric' ? 'Enter numeric answer (e.g., 5.3, -1.2)' : 'Enter correct answer'}
                    />
                  </div>
                )}

                {/* Hint */}
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Hint
                  </label>
                  <textarea
                    value={question.hint || ''}
                    onChange={(e) => handleQuestionChange(index, 'hint', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    rows={2}
                    placeholder="Optional hint or explanation..."
                  />
                </div>

                {/* Standard and Concept */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Standard
                    </label>
                    <input
                      type="text"
                      value={question.standard || ''}
                      onChange={(e) => handleQuestionChange(index, 'standard', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      placeholder="e.g., 3.OA.C.7"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Concept
                    </label>
                    <input
                      type="text"
                      value={question.concept || ''}
                      onChange={(e) => handleQuestionChange(index, 'concept', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      placeholder="e.g., Multiplication"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4 mt-4 border-t">
            <button
              type="button"
              onClick={onCancel}
              disabled={saving}
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || selectedQuestions.size === 0}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {saving ? (
                <>
                  <Loader2 className="animate-spin h-4 w-4 mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save {selectedQuestions.size} Question(s)
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuestionReviewModal;

