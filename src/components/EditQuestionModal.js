import React, { useState, useEffect } from 'react';
import { X, Save, Trash2, Plus, Image as ImageIcon, Loader2 } from 'lucide-react';
import { TOPICS } from '../constants/topics';

const EditQuestionModal = ({ question, onSave, onCancel }) => {
    const [editedQuestion, setEditedQuestion] = useState({ ...question });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);

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

    useEffect(() => {
        setEditedQuestion({ ...question });
    }, [question]);

    const handleChange = (field, value) => {
        setEditedQuestion(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleOptionChange = (index, value) => {
        const newOptions = [...(editedQuestion.options || [])];
        newOptions[index] = value;
        setEditedQuestion(prev => ({
            ...prev,
            options: newOptions
        }));
    };

    const addOption = () => {
        setEditedQuestion(prev => ({
            ...prev,
            options: [...(prev.options || []), '']
        }));
    };

    const removeOption = (index) => {
        const newOptions = (editedQuestion.options || []).filter((_, i) => i !== index);
        setEditedQuestion(prev => ({
            ...prev,
            options: newOptions
        }));
    };

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onloadend = () => {
            const base64String = reader.result;
            setEditedQuestion(prev => ({
                ...prev,
                images: [...(prev.images || []), { type: 'uploaded', data: base64String, description: file.name }]
            }));
        };
        reader.readAsDataURL(file);
    };

    const removeImage = (index) => {
        const newImages = (editedQuestion.images || []).filter((_, i) => i !== index);
        setEditedQuestion(prev => ({
            ...prev,
            images: newImages
        }));
    };

    const handleSave = async () => {
        setSaving(true);
        setError(null);

        try {
            const isDrawingQuestion = editedQuestion.questionType === 'drawing';
            
            if (!editedQuestion.question || !editedQuestion.topic || !editedQuestion.grade) {
                throw new Error('Question text, topic, and grade are required');
            }
            
            // For non-drawing questions, correctAnswer is required
            if (!isDrawingQuestion && !editedQuestion.correctAnswer) {
                throw new Error('Correct answer is required for non-drawing questions');
            }

            await onSave(editedQuestion);
        } catch (err) {
            console.error('Save error:', err);
            setError(err.message || 'Failed to save question');
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
            <div className="relative p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900">Edit Question</h3>
                    <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
                        <X className="h-6 w-6" />
                    </button>
                </div>

                {error && (
                    <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-4">
                        <p className="text-sm text-red-800">{error}</p>
                    </div>
                )}

                <div className="space-y-4">
                    {/* Question Text */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Question *</label>
                        <textarea
                            value={editedQuestion.question || ''}
                            onChange={(e) => handleChange('question', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            rows={3}
                        />
                    </div>

                    {/* Images */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Images</label>
                        <div className="flex flex-wrap gap-2 mb-2">
                            {(editedQuestion.images || []).map((img, index) => (
                                <div key={index} className="relative group">
                                    <img
                                        src={img.data || img.url}
                                        alt={img.description || 'Question image'}
                                        className="h-20 w-20 object-cover rounded border border-gray-200"
                                    />
                                    <button
                                        onClick={() => removeImage(index)}
                                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                </div>
                            ))}
                            <label className="h-20 w-20 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors">
                                <ImageIcon className="h-6 w-6 text-gray-400" />
                                <span className="text-xs text-gray-500 mt-1">Add Image</span>
                                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                            </label>
                        </div>
                    </div>

                    {/* Topic and Grade */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Topic *</label>
                            <select
                                value={editedQuestion.topic || ''}
                                onChange={(e) => handleChange('topic', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            >
                                <option value="">Select topic</option>
                                {topicOptions.map(topic => (
                                    <option key={topic} value={topic}>{topic}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Grade *</label>
                            <select
                                value={editedQuestion.grade || ''}
                                onChange={(e) => handleChange('grade', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            >
                                <option value="">Select grade</option>
                                {gradeOptions.map(grade => (
                                    <option key={grade} value={grade}>{grade}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Question Type */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Question Type</label>
                        <select
                            value={editedQuestion.questionType || 'multiple-choice'}
                            onChange={(e) => handleChange('questionType', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        >
                            {questionTypeOptions.map(type => (
                                <option key={type.value} value={type.value}>{type.label}</option>
                            ))}
                        </select>
                        {editedQuestion.questionType === 'drawing' && (
                            <p className="mt-2 text-xs text-gray-500">
                                Drawing questions allow students to sketch their answers (e.g., "Draw an obtuse triangle"). 
                                AI will validate their drawings automatically.
                            </p>
                        )}
                    </div>

                    {/* Options - Only show for multiple-choice questions */}
                    {editedQuestion.questionType !== 'drawing' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Options {editedQuestion.questionType === 'multiple-choice' && '(for multiple choice)'}
                            </label>
                        {(editedQuestion.options || []).map((option, index) => (
                            <div key={index} className="flex items-center space-x-2 mb-2">
                                <input
                                    type="text"
                                    value={option}
                                    onChange={(e) => handleOptionChange(index, e.target.value)}
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                    placeholder={`Option ${index + 1}`}
                                />
                                <button onClick={() => removeOption(index)} className="text-red-600 hover:text-red-800">
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                        ))}
                        <button onClick={addOption} className="text-sm text-blue-600 hover:text-blue-800 flex items-center">
                            <Plus className="h-4 w-4 mr-1" /> Add Option
                        </button>
                    </div>
                    )}

                    {/* Correct Answer - Only show for non-drawing questions */}
                    {editedQuestion.questionType !== 'drawing' && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Correct Answer *</label>
                        <input
                            type="text"
                            value={editedQuestion.correctAnswer || ''}
                            onChange={(e) => handleChange('correctAnswer', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        />
                    </div>
                    )}

                    {/* Hint */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Hint</label>
                        <textarea
                            value={editedQuestion.hint || ''}
                            onChange={(e) => handleChange('hint', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            rows={2}
                        />
                    </div>

                    {/* Standard and Concept */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Standard</label>
                            <input
                                type="text"
                                value={editedQuestion.standard || ''}
                                onChange={(e) => handleChange('standard', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Concept</label>
                            <input
                                type="text"
                                value={editedQuestion.concept || ''}
                                onChange={(e) => handleChange('concept', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            />
                        </div>
                    </div>
                </div>

                <div className="flex space-x-3 pt-4 mt-4 border-t">
                    <button
                        onClick={onCancel}
                        disabled={saving}
                        className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 flex items-center justify-center"
                    >
                        {saving ? (
                            <>
                                <Loader2 className="animate-spin h-4 w-4 mr-2" /> Saving...
                            </>
                        ) : (
                            <>
                                <Save className="h-4 w-4 mr-2" /> Save Changes
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EditQuestionModal;
