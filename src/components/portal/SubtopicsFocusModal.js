import React, { useEffect, useState, useMemo } from 'react';
import { Target, AlertCircle, Loader2, ChevronRight } from 'lucide-react';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';
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

      // setDoc with merge so we don't fail when the enrollment doc is missing
      // (legacy data) and we don't clobber other fields on existing docs.
      await setDoc(enrollmentRef, { allowedSubtopicsByTopic: updated }, { merge: true });

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
    <ModalWrapper isOpen={isOpen} onClose={onClose} title="" size="lg" hideCloseButton>
      {/* Header */}
      <div className="px-6 py-5 bg-gradient-to-r from-brand-purple to-brand-pink text-white rounded-t-lg">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <div className="bg-white/20 rounded-full p-2 flex-shrink-0">
              <Target className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-lg font-semibold font-display">Focus subtopics</h2>
              <p className="text-sm text-white/80 mt-0.5">
                Tailor what {studentName} practices.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white/80 hover:text-white hover:bg-white/10 rounded-full p-1 transition"
            aria-label="Close"
          >
            <span className="text-2xl leading-none">&times;</span>
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="px-6 py-5 space-y-5">
        {!classId && (
          <div className="flex items-start gap-3 rounded-button border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>
              {studentName} is not assigned to a class yet, so focus settings can't be saved.
              Assign them to a class first.
            </span>
          </div>
        )}

        {error && (
          <div className="flex items-start gap-3 rounded-button border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Grade selector pills */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Grade</label>
          <div className="inline-flex rounded-button border border-gray-200 bg-gray-50 p-1" role="tablist">
            {['G3', 'G4'].map((g) => (
              <button
                key={g}
                type="button"
                role="tab"
                aria-selected={grade === g}
                onClick={() => handleGradeChange(g)}
                className={`px-4 py-1.5 text-sm font-medium rounded-button transition ${
                  grade === g
                    ? 'bg-white shadow-card text-brand-purple'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {g === 'G3' ? '3rd Grade' : '4th Grade'}
              </button>
            ))}
          </div>
        </div>

        {/* Topic + Subtopic selector */}
        <div className="grid grid-cols-1 md:grid-cols-[200px,1fr] gap-4">
          {/* Topic sidebar list */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Topic</label>
            <div className="space-y-1 border border-gray-200 rounded-button p-1 bg-white">
              {getTopicsForGrade(grade).map((t) => {
                const restrictedCount = t === topic
                  ? selectedSubtopics.length
                  : (allowedByTopic[t] || []).length;
                const isActive = t === topic;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => handleTopicChange(t)}
                    className={`w-full flex items-center justify-between text-left px-3 py-2 rounded-button text-sm transition ${
                      isActive
                        ? 'bg-brand-purple/10 text-brand-purple font-semibold'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <span className="truncate" title={t}>{t}</span>
                    <span className="flex items-center space-x-1 flex-shrink-0">
                      {restrictedCount > 0 && (
                        <span className="text-xs bg-brand-purple text-white rounded-full px-2 py-0.5">
                          {restrictedCount}
                        </span>
                      )}
                      {isActive && <ChevronRight className="h-4 w-4" />}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Subtopic checklist */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500">
                Subtopics
              </label>
              <div className="flex items-center space-x-2 text-xs">
                <button
                  type="button"
                  onClick={handleSelectAll}
                  disabled={subtopics.length === 0}
                  className="text-brand-blue hover:underline disabled:opacity-40 disabled:no-underline"
                >
                  Select all
                </button>
                <span className="text-gray-300">|</span>
                <button
                  type="button"
                  onClick={handleClearAll}
                  disabled={selectedSubtopics.length === 0}
                  className="text-gray-500 hover:underline disabled:opacity-40 disabled:no-underline"
                >
                  Clear
                </button>
              </div>
            </div>

            <div className="border border-gray-200 rounded-button bg-gray-50/60 max-h-64 overflow-y-auto p-2">
              {subtopics.length === 0 ? (
                <p className="text-sm text-gray-500 italic p-3">
                  This topic doesn't have subtopics yet.
                </p>
              ) : (
                <ul className="divide-y divide-gray-200">
                  {subtopics.map((sub) => {
                    const checked = selectedSubtopics.includes(sub);
                    return (
                      <li key={sub}>
                        <label className="flex items-center space-x-3 px-3 py-2 hover:bg-white cursor-pointer rounded-button">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => handleToggle(sub)}
                            className="h-4 w-4 text-brand-purple focus:ring-brand-purple border-gray-300 rounded"
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
              {focusedTopicCount > 0 && (
                <span className="ml-1 text-gray-400">
                  ({focusedTopicCount} topic{focusedTopicCount === 1 ? '' : 's'} restricted overall)
                </span>
              )}
            </p>
          </div>
        </div>
      </div>

      <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          disabled={saving}
          className="px-4 py-2 rounded-button border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || !classId}
          className="inline-flex items-center px-4 py-2 rounded-button bg-brand-purple text-white text-sm font-medium hover:bg-purple-700 disabled:opacity-50"
        >
          {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
          {saving ? 'Saving…' : 'Save focus'}
        </button>
      </div>
    </ModalWrapper>
  );
};

export default SubtopicsFocusModal;
