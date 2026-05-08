import React, { useEffect, useState, useMemo } from 'react';
import { Target, Sparkles, AlertCircle, Loader2 } from 'lucide-react';
import { getFirestore, doc, getDoc, updateDoc } from 'firebase/firestore';
import ModalWrapper from '../ui/ModalWrapper';
import { getTopicsForGrade, getAppId } from '../../utils/common_utils';
import { getSubtopicsForTopic } from '../../utils/subtopicUtils';
import { getStudentDisplayName } from '../../utils/studentName';

const SubtopicsFocusModal = ({
  isOpen,
  onClose,
  student,
  classId,
  initialAllowedSubtopicsByTopic,
  onSaved,
}) => {
  const appId = getAppId();
  const db = getFirestore();

  const initialGrade = student?.grade || student?.selectedGrade || 'G3';
  const initialTopics = useMemo(() => getTopicsForGrade(initialGrade), [initialGrade]);

  const [grade, setGrade] = useState(initialGrade);
  const [topic, setTopic] = useState(initialTopics[0] || '');
  const [allowedByTopic, setAllowedByTopic] = useState(initialAllowedSubtopicsByTopic || {});
  const [selectedSubtopics, setSelectedSubtopics] = useState(
    (initialAllowedSubtopicsByTopic && initialAllowedSubtopicsByTopic[initialTopics[0]]) || []
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isOpen) return;
    const startGrade = student?.grade || student?.selectedGrade || 'G3';
    const startTopics = getTopicsForGrade(startGrade);
    const startTopic = startTopics[0] || '';
    setGrade(startGrade);
    setTopic(startTopic);
    setAllowedByTopic(initialAllowedSubtopicsByTopic || {});
    setSelectedSubtopics(
      (initialAllowedSubtopicsByTopic && initialAllowedSubtopicsByTopic[startTopic]) || []
    );
    setError(null);
  }, [isOpen, student, initialAllowedSubtopicsByTopic]);

  const subtopics = useMemo(() => {
    if (!topic) return [];
    const result = getSubtopicsForTopic(topic, grade);
    return Array.isArray(result) ? result : [];
  }, [topic, grade]);

  const handleGradeChange = (nextGrade) => {
    const nextTopics = getTopicsForGrade(nextGrade);
    const nextTopic = nextTopics[0] || '';
    setGrade(nextGrade);
    setTopic(nextTopic);
    setSelectedSubtopics(allowedByTopic[nextTopic] || []);
  };

  const handleTopicChange = (nextTopic) => {
    setTopic(nextTopic);
    setSelectedSubtopics(allowedByTopic[nextTopic] || []);
  };

  const handleToggle = (sub) => {
    setSelectedSubtopics((prev) =>
      prev.includes(sub) ? prev.filter((s) => s !== sub) : [...prev, sub]
    );
  };

  const handleSelectAll = () => {
    setSelectedSubtopics(subtopics);
  };

  const handleClearAll = () => {
    setSelectedSubtopics([]);
  };

  const handleSave = async () => {
    if (!classId) {
      setError('This student is not enrolled in a class. Assign the student to a class first.');
      return;
    }
    if (!student?.id || !topic) return;

    setSaving(true);
    setError(null);

    try {
      const enrollmentId = `${classId}__${student.id}`;
      const enrollmentRef = doc(db, 'artifacts', appId, 'classStudents', enrollmentId);
      const snap = await getDoc(enrollmentRef);
      const current = snap.exists() ? (snap.data().allowedSubtopicsByTopic || {}) : {};

      const updated = { ...current, [topic]: selectedSubtopics };
      if (selectedSubtopics.length === 0) {
        delete updated[topic];
      }

      await updateDoc(enrollmentRef, {
        allowedSubtopicsByTopic: updated,
      });

      setAllowedByTopic(updated);
      if (onSaved) onSaved(updated);
      onClose();
    } catch (err) {
      console.error('Error saving subtopic focus:', err);
      setError(err.message || 'Failed to save focus subtopics.');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  const studentName = student ? getStudentDisplayName(student) : 'Student';
  const focusedTopicCount = Object.keys(allowedByTopic).filter(
    (k) => Array.isArray(allowedByTopic[k]) && allowedByTopic[k].length > 0
  ).length;

  return (
    <ModalWrapper isOpen={isOpen} onClose={onClose} title="" size="md" hideCloseButton>
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-5 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="bg-white/20 rounded-full p-2">
            <Target className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Focus subtopics</h2>
            <p className="text-sm text-purple-100">
              Tailor what {studentName} practices.
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
        {!classId && (
          <div className="flex items-start gap-3 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>
              {studentName} is not assigned to a class yet, so focus settings can't be saved.
              Assign them to a class first.
            </span>
          </div>
        )}

        {error && (
          <div className="flex items-start gap-3 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="rounded-lg bg-purple-50 border border-purple-100 px-4 py-3 text-xs text-purple-900 flex items-start gap-2">
          <Sparkles className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <span>
            Pick the subtopics this student should practice. Leave a topic empty to include every subtopic.
            {focusedTopicCount > 0 && (
              <> Currently focused on <strong>{focusedTopicCount}</strong> topic
                {focusedTopicCount === 1 ? '' : 's'}.</>
            )}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Grade</label>
            <select
              value={grade}
              onChange={(e) => handleGradeChange(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="G3">Grade 3</option>
              <option value="G4">Grade 4</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Topic</label>
            <select
              value={topic}
              onChange={(e) => handleTopicChange(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              {getTopicsForGrade(grade).map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-700">
              Subtopics
              {selectedSubtopics.length > 0 && (
                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                  {selectedSubtopics.length} selected
                </span>
              )}
            </label>
            {subtopics.length > 0 && (
              <div className="flex items-center space-x-2 text-xs">
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="text-purple-700 hover:text-purple-900 font-medium"
                >
                  Select all
                </button>
                <span className="text-gray-300">|</span>
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="text-gray-600 hover:text-gray-800 font-medium"
                >
                  Clear
                </button>
              </div>
            )}
          </div>

          <div className="rounded-lg border border-gray-200 bg-gray-50 max-h-64 overflow-y-auto">
            {subtopics.length === 0 ? (
              <p className="text-sm text-gray-500 italic px-4 py-6 text-center">
                This topic does not define subtopics.
              </p>
            ) : (
              <ul className="divide-y divide-gray-200">
                {subtopics.map((sub) => {
                  const checked = selectedSubtopics.includes(sub);
                  return (
                    <li key={sub}>
                      <label className="flex items-center space-x-3 px-4 py-2 hover:bg-white cursor-pointer">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => handleToggle(sub)}
                          className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                        />
                        <span className="text-sm text-gray-800">{sub}</span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <p className="mt-2 text-xs text-gray-500">
            {selectedSubtopics.length === 0
              ? 'Empty selection means all subtopics are allowed for this topic.'
              : `Only the ${selectedSubtopics.length} selected subtopic${
                  selectedSubtopics.length === 1 ? '' : 's'
                } will be served to this student for ${topic}.`}
          </p>
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
          disabled={saving || !classId}
          className="inline-flex items-center px-4 py-2 rounded-md bg-purple-600 text-white text-sm font-medium hover:bg-purple-700 disabled:opacity-50"
        >
          {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
          {saving ? 'Saving…' : 'Save focus'}
        </button>
      </div>
    </ModalWrapper>
  );
};

export default SubtopicsFocusModal;
