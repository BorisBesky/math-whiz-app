import React, { useEffect, useState } from 'react';
import { Target, Loader2, AlertCircle } from 'lucide-react';
import ModalWrapper from '../ui/ModalWrapper';
import { getTopicsForGrade } from '../../utils/common_utils';

const DEFAULT_TARGET = 4;

const clampNonNegative = (raw) => {
  const parsed = parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed < 0) return 0;
  return parsed;
};

const buildInitialTargets = (grade, existingTargets) => {
  const topics = getTopicsForGrade(grade);
  const next = {};
  topics.forEach((topic) => {
    const existing = existingTargets ? existingTargets[topic] : undefined;
    next[topic] = existing === undefined || existing === null ? String(DEFAULT_TARGET) : String(existing);
  });
  return next;
};

const GoalsModal = ({
  isOpen,
  onClose,
  initialGrade = 'G3',
  initialTargets,
  studentCount = 1,
  onSave,
}) => {
  const [grade, setGrade] = useState(initialGrade);
  const [targets, setTargets] = useState(() => buildInitialTargets(initialGrade, initialTargets));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setGrade(initialGrade);
      setTargets(buildInitialTargets(initialGrade, initialTargets));
      setError(null);
    }
  }, [isOpen, initialGrade, initialTargets]);

  const handleGradeChange = (nextGrade) => {
    const topics = getTopicsForGrade(nextGrade);
    const next = { ...targets };
    topics.forEach((topic) => {
      if (next[topic] === undefined) next[topic] = String(DEFAULT_TARGET);
    });
    setGrade(nextGrade);
    setTargets(next);
  };

  const handleTargetChange = (topic, raw) => {
    setTargets((prev) => ({ ...prev, [topic]: raw }));
  };

  const handleTargetBlur = (topic) => {
    setTargets((prev) => {
      const raw = prev[topic];
      const parsed = parseInt(raw, 10);
      const next = !Number.isFinite(parsed) || parsed < 0 ? '0' : String(parsed);
      if (next === raw) return prev;
      return { ...prev, [topic]: next };
    });
  };

  const handleApplyAll = (raw) => {
    const value = clampNonNegative(raw);
    const topics = getTopicsForGrade(grade);
    setTargets((prev) => {
      const next = { ...prev };
      topics.forEach((topic) => {
        next[topic] = String(value);
      });
      return next;
    });
  };

  const handleSave = async () => {
    if (!onSave) {
      onClose();
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const topics = getTopicsForGrade(grade);
      const numericTargets = {};
      topics.forEach((topic) => {
        numericTargets[topic] = clampNonNegative(targets[topic]);
      });
      await onSave({ grade, targets: numericTargets });
      onClose();
    } catch (err) {
      console.error('Error saving goals:', err);
      setError(err.message || 'Failed to save goals.');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  const topics = getTopicsForGrade(grade);
  const totalDaily = topics.reduce((sum, t) => sum + clampNonNegative(targets[t]), 0);

  return (
    <ModalWrapper isOpen={isOpen} onClose={onClose} title="" size="lg" hideCloseButton>
      <div className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-6 py-5 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="bg-white/20 rounded-full p-2">
            <Target className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Set daily goals</h2>
            <p className="text-sm text-blue-100">
              Choose how many questions per topic{' '}
              <strong>
                {studentCount} student{studentCount === 1 ? '' : 's'}
              </strong>{' '}
              should answer each day.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-white/80 hover:text-white text-2xl leading-none"
          aria-label="Close"
        >
          ×
        </button>
      </div>

      <div className="px-6 py-5 space-y-5">
        {error && (
          <div className="flex items-start gap-3 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">
              Grade
            </label>
            <select
              value={grade}
              onChange={(e) => handleGradeChange(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="G3">Grade 3</option>
              <option value="G4">Grade 4</option>
            </select>
          </div>
          <div className="flex items-end gap-2">
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">
                Apply to all topics
              </label>
              <div className="flex items-stretch border border-gray-300 rounded-md overflow-hidden">
                <input
                  type="number"
                  min="0"
                  defaultValue={DEFAULT_TARGET}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleApplyAll(e.currentTarget.value);
                    }
                  }}
                  className="w-20 px-3 py-2 text-sm focus:outline-none"
                  aria-label="Apply same goal to all topics"
                />
                <button
                  type="button"
                  onClick={(e) => {
                    const input = e.currentTarget.previousSibling;
                    handleApplyAll(input.value);
                  }}
                  className="px-3 bg-gray-100 text-sm font-medium text-gray-700 hover:bg-gray-200 border-l border-gray-300"
                >
                  Apply
                </button>
              </div>
            </div>
            <div className="hidden sm:block ml-2 text-xs text-gray-500 pb-2">
              Daily total:{' '}
              <span className="font-semibold text-gray-800">
                {totalDaily} question{totalDaily === 1 ? '' : 's'}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {topics.map((topic) => (
            <div
              key={topic}
              className="flex items-center justify-between border border-gray-200 rounded-lg px-4 py-3 hover:border-blue-300 transition-colors bg-white"
            >
              <span className="text-sm font-medium text-gray-800 mr-3 truncate" title={topic}>
                {topic}
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  value={targets[topic] ?? ''}
                  onChange={(e) => handleTargetChange(topic, e.target.value)}
                  onBlur={() => handleTargetBlur(topic)}
                  className="w-20 border border-gray-300 rounded-md px-2 py-1 text-sm text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-xs text-gray-500">/ day</span>
              </div>
            </div>
          ))}
        </div>

        <div className="sm:hidden text-xs text-gray-500">
          Daily total: <span className="font-semibold text-gray-800">{totalDaily}</span>
        </div>
      </div>

      <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          disabled={saving}
          className="px-4 py-2 rounded-md border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center px-4 py-2 rounded-md bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
          {saving ? 'Saving…' : 'Save goals'}
        </button>
      </div>
    </ModalWrapper>
  );
};

export default GoalsModal;
