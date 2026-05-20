import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Target, CheckCircle2, Circle, AlertCircle, Loader2, ChevronRight } from 'lucide-react';
import { getFirestore, doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { getTopicsForGrade, getAppId } from '../../utils/common_utils';
import { getSubtopicsForTopic } from '../../utils/subtopicUtils';
import { getStudentDisplayName } from '../../utils/studentName';
import ModalWrapper from '../ui/ModalWrapper';

/**
 * Shared modal for managing a student's focus subtopics for a class enrollment.
 *
 * Props:
 *   isOpen      - bool
 *   onClose     - () => void
 *   student     - { id, grade, classId?, className? }
 *   classId     - optional override; falls back to student.classId
 *   onSaved     - optional callback after a successful save (receives updatedRestrictions)
 *   appId       - optional override for testing; falls back to getAppId()
 */
const StudentFocusModal = ({ isOpen, onClose, student, classId: classIdProp, onSaved, appId: appIdProp }) => {
  const db = getFirestore();
  const appId = appIdProp || getAppId();
  const classId = classIdProp || student?.classId || null;

  const [grade, setGrade] = useState(student?.grade || 'G3');
  const [topic, setTopic] = useState('');
  const [restrictions, setRestrictions] = useState({});
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const topicsForGrade = useMemo(() => getTopicsForGrade(grade), [grade]);

  // Load current focus restrictions when the modal opens
  useEffect(() => {
    if (!isOpen || !student || !classId) return;

    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      setSuccess(null);
      try {
        const enrollmentRef = doc(db, 'artifacts', appId, 'classStudents', `${classId}__${student.id}`);
        const snap = await getDoc(enrollmentRef);
        if (cancelled) return;

        const current = snap.exists() ? (snap.data().allowedSubtopicsByTopic || {}) : {};
        const initialGrade = student.grade || 'G3';
        const initialTopics = getTopicsForGrade(initialGrade);
        const initialTopic = initialTopics[0] || '';

        setRestrictions(current);
        setGrade(initialGrade);
        setTopic(initialTopic);
        setSelected(initialTopic ? (current[initialTopic] || []) : []);
      } catch (err) {
        if (!cancelled) {
          console.error('Failed to load focus restrictions:', err);
          setError('Could not load current focus settings. Try again.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [isOpen, student, classId, db, appId]);

  // When grade changes, reset topic to first topic of that grade
  const handleGradeChange = (newGrade) => {
    setGrade(newGrade);
    const topics = getTopicsForGrade(newGrade);
    const nextTopic = topics[0] || '';
    setTopic(nextTopic);
    setSelected(nextTopic ? (restrictions[nextTopic] || []) : []);
  };

  const handleTopicChange = (newTopic) => {
    // Persist current selection into local restrictions before switching topic
    setRestrictions((prev) => ({ ...prev, [topic]: selected }));
    setTopic(newTopic);
    setSelected(restrictions[newTopic] || []);
  };

  const toggleSubtopic = (sub) => {
    setSelected((prev) => (prev.includes(sub) ? prev.filter((s) => s !== sub) : [...prev, sub]));
  };

  const subtopics = useMemo(() => (topic ? getSubtopicsForTopic(topic, grade) : []), [topic, grade]);

  const selectAll = () => setSelected(subtopics);
  const clearAll = () => setSelected([]);

  const handleSave = useCallback(async () => {
    if (!student || !classId || !topic) return;
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const enrollmentRef = doc(db, 'artifacts', appId, 'classStudents', `${classId}__${student.id}`);

      // Merge in-memory restrictions and the current topic's selection
      const merged = { ...restrictions, [topic]: selected };

      // Strip topics that have no restrictions (empty = allow all)
      Object.keys(merged).forEach((t) => {
        if (!Array.isArray(merged[t]) || merged[t].length === 0) delete merged[t];
      });

      const snap = await getDoc(enrollmentRef);
      if (snap.exists()) {
        await updateDoc(enrollmentRef, { allowedSubtopicsByTopic: merged });
      } else {
        await setDoc(enrollmentRef, {
          classId,
          studentId: student.id,
          allowedSubtopicsByTopic: merged,
        });
      }

      setRestrictions(merged);
      setSuccess('Focus areas saved.');
      if (typeof onSaved === 'function') onSaved(merged);
    } catch (err) {
      console.error('Failed to save focus restrictions:', err);
      setError('Could not save focus settings. Try again.');
    } finally {
      setSaving(false);
    }
  }, [student, classId, topic, selected, restrictions, db, appId, onSaved]);

  if (!isOpen || !student) return null;

  const totalRestricted = Object.keys({ ...restrictions, [topic]: selected }).filter(
    (t) => (t === topic ? selected.length : (restrictions[t] || []).length) > 0
  ).length;

  return (
    <ModalWrapper isOpen={isOpen} onClose={onClose} hideCloseButton size="lg">
      {/* Header */}
      <div className="px-6 py-5 bg-gradient-to-r from-brand-purple to-brand-pink text-white rounded-t-lg">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <div className="bg-white/20 rounded-full p-2 flex-shrink-0">
              <Target className="h-6 w-6" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-display">Focus Areas</h2>
              <p className="text-sm text-white/90 mt-0.5">
                {getStudentDisplayName(student)}
                {student.className && (
                  <span className="text-white/70"> • {student.className}</span>
                )}
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
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-900 rounded-button p-4 flex items-start space-x-2">
            <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
            <p className="text-sm">
              This student isn't assigned to a class yet. Add them to a class to set focus areas.
            </p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 rounded-button p-3 flex items-start space-x-2">
            <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        )}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-800 rounded-button p-3 flex items-start space-x-2">
            <CheckCircle2 className="h-5 w-5 mt-0.5 flex-shrink-0" />
            <p className="text-sm">{success}</p>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-10 text-gray-500">
            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
            Loading focus settings...
          </div>
        ) : (
          <>
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
              {/* Topic list */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Topic</label>
                <div className="space-y-1 border border-gray-200 rounded-button p-1 bg-white">
                  {topicsForGrade.map((t) => {
                    const restrictedCount = (t === topic ? selected.length : (restrictions[t] || []).length);
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
                      onClick={selectAll}
                      disabled={subtopics.length === 0}
                      className="text-brand-blue hover:underline disabled:opacity-40 disabled:no-underline"
                    >
                      Select all
                    </button>
                    <span className="text-gray-300">|</span>
                    <button
                      type="button"
                      onClick={clearAll}
                      disabled={selected.length === 0}
                      className="text-gray-500 hover:underline disabled:opacity-40 disabled:no-underline"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                <div className="border border-gray-200 rounded-button bg-gray-50/60 max-h-72 overflow-y-auto p-2">
                  {subtopics.length === 0 ? (
                    <p className="text-sm text-gray-500 italic p-3">
                      This topic doesn't have subtopics yet.
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {subtopics.map((sub) => {
                        const checked = selected.includes(sub);
                        return (
                          <label
                            key={sub}
                            className={`flex items-center space-x-2 px-3 py-2 rounded-button cursor-pointer transition border ${
                              checked
                                ? 'bg-white border-brand-purple/40 shadow-card'
                                : 'bg-white border-transparent hover:border-gray-200'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleSubtopic(sub)}
                              className="sr-only"
                            />
                            {checked ? (
                              <CheckCircle2 className="h-5 w-5 text-brand-purple flex-shrink-0" />
                            ) : (
                              <Circle className="h-5 w-5 text-gray-300 flex-shrink-0" />
                            )}
                            <span className="text-sm text-gray-800">{sub}</span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>

                <p className="mt-2 text-xs text-gray-500">
                  {selected.length === 0
                    ? 'No subtopics selected — student can practice all subtopics for this topic.'
                    : `${selected.length} subtopic${selected.length === 1 ? '' : 's'} focused for this topic.`}
                  {totalRestricted > 0 && (
                    <span className="ml-1 text-gray-400">
                      ({totalRestricted} topic{totalRestricted === 1 ? '' : 's'} restricted overall)
                    </span>
                  )}
                </p>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end space-x-2 rounded-b-lg">
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
          disabled={saving || loading || !classId || !topic}
          className="px-4 py-2 rounded-button bg-brand-purple text-white text-sm font-semibold hover:bg-purple-700 disabled:opacity-50 inline-flex items-center"
        >
          {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {saving ? 'Saving…' : 'Save Focus'}
        </button>
      </div>
    </ModalWrapper>
  );
};

export default StudentFocusModal;
