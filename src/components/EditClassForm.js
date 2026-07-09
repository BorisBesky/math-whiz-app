import React, { useState } from 'react';
import ModalWrapper from './ui/ModalWrapper';
import { getAllGrades } from '../content/registry';

const EditClassForm = ({ classData, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    name: classData.name || '',
    description: classData.description || '',
    gradeLevel: classData.gradeLevel || '',
    questionBankProbability: classData.questionBankProbability !== undefined ? classData.questionBankProbability : 0.7,
    questionMasteryThreshold: classData.questionMasteryThreshold !== undefined ? classData.questionMasteryThreshold : 3,
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const gradeLevels = getAllGrades().map((grade) => grade.key);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) {
      newErrors.name = 'Class name is required';
    }
    if (!formData.gradeLevel.trim()) {
      newErrors.gradeLevel = 'Grade level is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);
    try {
      await onSubmit({ ...formData, updatedAt: new Date() });
    } catch (error) {
      console.error('Error updating class:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleProbabilityChange = (e) => {
    setFormData((prev) => ({ ...prev, questionBankProbability: parseFloat(e.target.value) }));
  };

  const handleThresholdChange = (e) => {
    const value = Math.max(1, Math.min(20, parseInt(e.target.value, 10) || 1));
    setFormData((prev) => ({ ...prev, questionMasteryThreshold: value }));
  };

  return (
    <ModalWrapper isOpen={true} onClose={onCancel} title="Edit Class" size="sm">
      <div className="p-6">
        <p className="text-sm text-gray-600 mb-4">
          Update the class details below.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="edit-name" className="block text-sm font-medium text-gray-700 mb-1">
              Class Name *
            </label>
            <input
              type="text"
              id="edit-name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-button focus:outline-none focus:ring-2 focus:ring-brand-purple ${
                errors.name ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="e.g., Algebra 1 - Period 3"
            />
            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
          </div>

          <div>
            <label htmlFor="edit-gradeLevel" className="block text-sm font-medium text-gray-700 mb-1">
              Grade Level *
            </label>
            <select
              id="edit-gradeLevel"
              name="gradeLevel"
              value={formData.gradeLevel}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-button focus:outline-none focus:ring-2 focus:ring-brand-purple ${
                errors.gradeLevel ? 'border-red-300' : 'border-gray-300'
              }`}
            >
              <option value="">Select grade level</option>
              {gradeLevels.map((grade) => (
                <option key={grade} value={grade}>{grade}</option>
              ))}
            </select>
            {errors.gradeLevel && <p className="mt-1 text-sm text-red-600">{errors.gradeLevel}</p>}
          </div>

          <div>
            <label htmlFor="edit-questionBankProbability" className="block text-sm font-medium text-gray-700 mb-1">
              Question Bank Priority
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                id="edit-questionBankProbability"
                min="0"
                max="1"
                step="0.1"
                value={formData.questionBankProbability}
                onChange={handleProbabilityChange}
                className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <span className="font-semibold text-blue-600 bg-blue-100 px-3 py-1 rounded-full w-16 text-center text-sm">
                {Math.round(formData.questionBankProbability * 100)}%
              </span>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              {formData.questionBankProbability === 0
                ? 'Only generated questions (no uploaded questions)'
                : formData.questionBankProbability === 1
                ? 'Only uploaded questions (no generated questions)'
                : `${Math.round(formData.questionBankProbability * 100)}% uploaded, ${Math.round((1 - formData.questionBankProbability) * 100)}% generated`}
            </p>
          </div>

          <div>
            <label htmlFor="edit-questionMasteryThreshold" className="block text-sm font-medium text-gray-700 mb-1">
              Question Mastery Threshold
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                id="edit-questionMasteryThreshold"
                min="1"
                max="20"
                value={formData.questionMasteryThreshold}
                onChange={handleThresholdChange}
                className="w-20 px-3 py-2 border border-gray-300 rounded-button focus:outline-none focus:ring-2 focus:ring-brand-purple text-center"
              />
              <span className="text-sm text-gray-600">correct answers to retire a question type</span>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              After a student answers a tagged question type correctly this many times, it won't appear again.
            </p>
          </div>

          <div>
            <label htmlFor="edit-description" className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              id="edit-description"
              name="description"
              rows={3}
              value={formData.description}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-button focus:outline-none focus:ring-2 focus:ring-brand-purple"
              placeholder="Brief description of the class..."
            />
          </div>

          <div className="flex space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-button hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand-purple"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-brand-purple border border-transparent rounded-button hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-brand-purple disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Updating...' : 'Update Class'}
            </button>
          </div>
        </form>
      </div>
    </ModalWrapper>
  );
};

export default EditClassForm;
