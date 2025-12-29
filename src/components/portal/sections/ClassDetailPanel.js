import React, { useMemo, useState, useEffect } from 'react';
import { X, Users, Calendar, BookOpen, Plus, UserMinus, RefreshCw, Target, AlertCircle } from 'lucide-react';
import { formatDate } from '../../../utils/common_utils';
import { getFirestore, doc, getDoc, updateDoc } from 'firebase/firestore';
import { TOPICS } from '../../../constants/topics';
import { getSubtopicsForTopic } from '../../../utils/subtopicUtils';

const ClassDetailPanel = ({
  classItem,
  students,
  onClose,
  onAssignStudent,
  onRemoveStudent,
  onRefresh,
}) => {
  const classId = classItem?.id;
  const appId = typeof window !== 'undefined' && window.__app_id ? window.__app_id : 'default-app-id';
  const db = getFirestore();
  
  const [enrollments, setEnrollments] = useState({});
  const [loadingEnrollments, setLoadingEnrollments] = useState(false);
  const [enrollmentError, setEnrollmentError] = useState(null);
  const [failedStudentIds, setFailedStudentIds] = useState(new Set());
  const [enrollmentReloadTrigger, setEnrollmentReloadTrigger] = useState(0);
  const [showSubtopicsModal, setShowSubtopicsModal] = useState(false);
  const [selectedStudentForSubtopics, setSelectedStudentForSubtopics] = useState(null);
  const [subtopicGrade, setSubtopicGrade] = useState('G3');
  const [subtopicTopic, setSubtopicTopic] = useState('');
  const [selectedSubtopics, setSelectedSubtopics] = useState([]);
  const [savingSubtopics, setSavingSubtopics] = useState(false);

  const roster = useMemo(() => {
    if (!classId) {
      return [];
    }
    return students.filter((student) => student.classId === classId);
  }, [students, classId]);

  const availableStudents = useMemo(() => {
    if (!classId) {
      return [];
    }
    return students.filter((student) => student.classId !== classId);
  }, [students, classId]);

  // Memoize roster IDs to prevent unnecessary re-fetches
  const rosterIds = useMemo(() => {
    return roster.map(s => s.id).sort().join(',');
  }, [roster]);

  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [status, setStatus] = useState(null);
  const [assigning, setAssigning] = useState(false);
  const [removingId, setRemovingId] = useState(null);
  const canManageStudents = typeof onAssignStudent === 'function' && typeof onRemoveStudent === 'function';

  // Load enrollment data with allowedSubtopicsByTopic
  useEffect(() => {
    if (!classId || roster.length === 0) {
      setEnrollments({});
      setEnrollmentError(null);
      setFailedStudentIds(new Set());
      return;
    }

    const loadEnrollments = async () => {
      setLoadingEnrollments(true);
      setEnrollmentError(null);
      setFailedStudentIds(new Set());
      
      try {
        const enrollmentData = {};
        const failedIds = new Set();
        
        await Promise.all(
          roster.map(async (student) => {
            const enrollmentId = `${classId}__${student.id}`;
            const enrollmentRef = doc(db, 'artifacts', appId, 'classStudents', enrollmentId);
            try {
              const enrollmentSnap = await getDoc(enrollmentRef);
              if (enrollmentSnap.exists()) {
                const data = enrollmentSnap.data();
                enrollmentData[student.id] = {
                  allowedSubtopicsByTopic: data.allowedSubtopicsByTopic || {},
                };
              } else {
                enrollmentData[student.id] = {
                  allowedSubtopicsByTopic: {},
                };
              }
            } catch (err) {
              console.error(`Error loading enrollment for student ${student.id}:`, err);
              failedIds.add(student.id);
              // Still set empty data so UI doesn't break
              enrollmentData[student.id] = {
                allowedSubtopicsByTopic: {},
              };
            }
          })
        );
        
        setEnrollments(enrollmentData);
        setFailedStudentIds(failedIds);
        
        // Set error if any students failed to load
        if (failedIds.size > 0) {
          const failedCount = failedIds.size;
          const totalCount = roster.length;
          setEnrollmentError(
            `Failed to load enrollment data for ${failedCount} of ${totalCount} student${failedCount > 1 ? 's' : ''}. ` +
            `Focus settings may not work correctly for affected students.`
          );
        }
      } catch (error) {
        console.error('Error loading enrollments:', error);
        setEnrollmentError(
          `Failed to load enrollment data. Focus buttons may not work correctly. ` +
          `Error: ${error.message || 'Unknown error'}`
        );
        // Set empty enrollments to prevent UI crashes
        setEnrollments({});
      } finally {
        setLoadingEnrollments(false);
      }
    };

    loadEnrollments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classId, rosterIds, db, appId, enrollmentReloadTrigger]);
  // Note: Using rosterIds instead of roster to prevent unnecessary refetches when students array is recreated

  const getTopicsForGrade = (grade) => {
    return grade === 'G3'
      ? [TOPICS.MULTIPLICATION, TOPICS.DIVISION, TOPICS.FRACTIONS, TOPICS.MEASUREMENT_DATA]
      : [TOPICS.OPERATIONS_ALGEBRAIC_THINKING, TOPICS.BASE_TEN, TOPICS.FRACTIONS_4TH, TOPICS.MEASUREMENT_DATA_4TH, TOPICS.GEOMETRY, TOPICS.BINARY_ADDITION];
  };

  const handleRetryEnrollments = () => {
    // Trigger reload by incrementing the reload trigger
    setEnrollmentReloadTrigger(prev => prev + 1);
  };

  const handleOpenSubtopicsModal = (student) => {
    const grade = student.grade || 'G3';
    const topics = getTopicsForGrade(grade);
    const enrollment = enrollments[student.id];
    const currentRestrictions = enrollment?.allowedSubtopicsByTopic || {};
    
    setSelectedStudentForSubtopics(student);
    setSubtopicGrade(grade);
    setSubtopicTopic(topics[0] || '');
    setSelectedSubtopics(currentRestrictions[topics[0]] || []);
    setShowSubtopicsModal(true);
  };

  const handleSubtopicTopicChange = (topicName) => {
    setSubtopicTopic(topicName);
    const enrollment = enrollments[selectedStudentForSubtopics.id];
    const currentRestrictions = enrollment?.allowedSubtopicsByTopic || {};
    setSelectedSubtopics(currentRestrictions[topicName] || []);
  };

  const handleSubtopicToggle = (subtopic) => {
    setSelectedSubtopics((prev) => {
      if (prev.includes(subtopic)) {
        return prev.filter((s) => s !== subtopic);
      } else {
        return [...prev, subtopic];
      }
    });
  };

  const handleSaveSubtopics = async () => {
    if (!selectedStudentForSubtopics || !subtopicTopic) return;

    setSavingSubtopics(true);
    try {
      const enrollmentId = `${classId}__${selectedStudentForSubtopics.id}`;
      const enrollmentRef = doc(db, 'artifacts', appId, 'classStudents', enrollmentId);
      
      // Get current restrictions
      const enrollmentSnap = await getDoc(enrollmentRef);
      const currentData = enrollmentSnap.exists() ? enrollmentSnap.data() : {};
      const currentRestrictions = currentData.allowedSubtopicsByTopic || {};

      // Update restrictions for this topic
      const updatedRestrictions = {
        ...currentRestrictions,
        [subtopicTopic]: selectedSubtopics,
      };

      // Remove topic entry if no subtopics selected (allow all)
      if (selectedSubtopics.length === 0) {
        delete updatedRestrictions[subtopicTopic];
      }

      // Update enrollment document
      await updateDoc(enrollmentRef, {
        allowedSubtopicsByTopic: updatedRestrictions,
      });

      // Update local state
      setEnrollments((prev) => ({
        ...prev,
        [selectedStudentForSubtopics.id]: {
          allowedSubtopicsByTopic: updatedRestrictions,
        },
      }));

      setShowSubtopicsModal(false);
      setStatus({ type: 'success', message: 'Subtopics updated successfully.' });
    } catch (error) {
      console.error('Error saving subtopics:', error);
      setStatus({ type: 'error', message: 'Failed to save subtopics.' });
    } finally {
      setSavingSubtopics(false);
    }
  };

  if (!classItem) {
    return null;
  }

  const handleAssign = async () => {
    if (!selectedStudentId) {
      return;
    }
    const student = students.find((s) => s.id === selectedStudentId);
    if (!student) {
      return;
    }
    setAssigning(true);
    setStatus(null);
    try {
      await onAssignStudent({
        studentId: student.id,
        classId: classItem.id,
        studentName: student.displayName,
        studentEmail: student.email,
        currentClassId: student.classId,
      });
      setSelectedStudentId('');
      setStatus({ type: 'success', message: `${student.displayName || 'Student'} assigned successfully.` });
      if (onRefresh) {
        await onRefresh();
      }
    } catch (err) {
      setStatus({ type: 'error', message: err.message || 'Failed to assign student.' });
    } finally {
      setAssigning(false);
    }
  };

  const handleRemove = async (student) => {
    if (!student) return;
    setRemovingId(student.id);
    setStatus(null);
    try {
      await onRemoveStudent({ studentId: student.id, classId: classItem.id });
      setStatus({ type: 'success', message: `${student.displayName || 'Student'} removed from class.` });
      if (onRefresh) {
        await onRefresh();
      }
    } catch (err) {
      setStatus({ type: 'error', message: err.message || 'Failed to remove student.' });
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 z-40 flex items-center justify-center px-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-500">Class Detail</p>
            <h3 className="text-xl font-semibold text-gray-900">{classItem.name}</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 rounded-full p-2"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-6 py-4 border-b border-gray-100 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
          <div className="flex items-center space-x-2">
            <BookOpen className="h-4 w-4 text-blue-600" />
            <span>{classItem.subject || 'Math'}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Users className="h-4 w-4 text-blue-600" />
            <span>{roster.length} student{roster.length === 1 ? '' : 's'}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-blue-600" />
            <span>Created {formatDate(classItem.createdAt)}</span>
          </div>
        </div>

        {classItem.description && (
          <div className="px-6 py-4 text-sm text-gray-700 border-b border-gray-100">
            {classItem.description}
          </div>
        )}

        <div className="px-6 py-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h4 className="text-lg font-semibold text-gray-900">Roster</h4>
              <p className="text-sm text-gray-500">Students enrolled in this class</p>
            </div>
            {canManageStudents && (
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={onRefresh}
                  className="inline-flex items-center px-3 py-2 text-xs font-medium text-gray-600 border border-gray-200 rounded-md hover:bg-gray-50"
                >
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Refresh
                </button>
              </div>
            )}
          </div>

          {canManageStudents && (
            <div className="mb-4 border border-gray-200 rounded-md p-4 bg-gray-50">
              <div className="flex flex-col md:flex-row md:items-center md:space-x-3 space-y-3 md:space-y-0">
                <div className="flex-1">
                  <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    Assign Student
                  </label>
                  <select
                    className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    value={selectedStudentId}
                    onChange={(event) => setSelectedStudentId(event.target.value)}
                  >
                    <option value="">Select student</option>
                    {availableStudents.map((student) => (
                      <option key={student.id} value={student.id}>
                        {student.displayName || student.email || 'Unnamed Student'}
                        {student.classId ? ` • ${student.className || 'Assigned'}` : ' • Unassigned'}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  type="button"
                  onClick={handleAssign}
                  disabled={!selectedStudentId || assigning}
                  className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium disabled:opacity-50"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {assigning ? 'Assigning...' : 'Assign to class'}
                </button>
              </div>
            </div>
          )}

          {status && (
            <div
              className={`mb-4 text-sm rounded-md px-4 py-2 ${status.type === 'error'
                ? 'bg-red-50 text-red-800 border border-red-200'
                : 'bg-green-50 text-green-800 border border-green-200'
              }`}
            >
              {status.message}
            </div>
          )}

          {enrollmentError && (
            <div className="mb-4 text-sm rounded-md px-4 py-3 bg-yellow-50 text-yellow-800 border border-yellow-200 flex items-start justify-between">
              <div className="flex items-start flex-1">
                <AlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-medium mb-1">Enrollment Data Loading Issue</p>
                  <p>{enrollmentError}</p>
                </div>
              </div>
              <button
                onClick={handleRetryEnrollments}
                disabled={loadingEnrollments}
                className="ml-4 px-3 py-1 text-sm font-medium text-yellow-800 bg-yellow-100 hover:bg-yellow-200 rounded-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                <RefreshCw className={`h-4 w-4 mr-1 ${loadingEnrollments ? 'animate-spin' : ''}`} />
                Retry
              </button>
            </div>
          )}

          {loadingEnrollments && !enrollmentError && (
            <div className="mb-4 text-sm rounded-md px-4 py-2 bg-blue-50 text-blue-800 border border-blue-200 flex items-center">
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Loading enrollment data...
            </div>
          )}

          {roster.length === 0 ? (
            <div className="border border-dashed border-gray-300 rounded-md p-6 text-center text-gray-500">
              No students have been added to this class yet.
            </div>
          ) : (
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left font-semibold text-gray-600">Student</th>
                    <th className="px-4 py-2 text-left font-semibold text-gray-600">Grade</th>
                    <th className="px-4 py-2 text-left font-semibold text-gray-600">Questions</th>
                    <th className="px-4 py-2 text-left font-semibold text-gray-600">Accuracy</th>
                    {canManageStudents && (
                      <th className="px-4 py-2 text-right font-semibold text-gray-600">Actions</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {roster.map((student) => (
                    <tr key={student.id} className="bg-white">
                      <td className="px-4 py-2">
                        <div>
                          <p className="font-medium text-gray-900">{student.displayName || 'Student'}</p>
                          {student.email && (
                            <p className="text-xs text-gray-500">{student.email}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-2 text-gray-600">{student.grade}</td>
                      <td className="px-4 py-2 text-gray-600">{student.totalQuestions}</td>
                      <td className="px-4 py-2 text-gray-600">{student.accuracy}%</td>
                      {canManageStudents && (
                        <td className="px-4 py-2 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              type="button"
                              onClick={() => handleOpenSubtopicsModal(student)}
                              disabled={failedStudentIds.has(student.id) || loadingEnrollments}
                              className={`inline-flex items-center text-xs font-medium ${
                                failedStudentIds.has(student.id) || loadingEnrollments
                                  ? 'text-gray-400 cursor-not-allowed opacity-50'
                                  : 'text-purple-600 hover:text-purple-800'
                              }`}
                              title={
                                failedStudentIds.has(student.id)
                                  ? 'Enrollment data failed to load. Click Retry above to reload.'
                                  : loadingEnrollments
                                  ? 'Loading enrollment data...'
                                  : 'Set Focus Subtopics'
                              }
                            >
                              <Target className="h-4 w-4 mr-1" />
                              Focus
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemove(student)}
                              className="inline-flex items-center text-red-600 hover:text-red-800 text-xs font-medium"
                              disabled={removingId === student.id}
                            >
                              <UserMinus className="h-4 w-4 mr-1" />
                              {removingId === student.id ? 'Removing...' : 'Remove'}
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Subtopics Modal */}
      {showSubtopicsModal && selectedStudentForSubtopics && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Set Focus Subtopics</h3>
                <p className="text-sm text-gray-600">
                  {selectedStudentForSubtopics.displayName || selectedStudentForSubtopics.email || 'Student'}
                </p>
              </div>
              <button
                onClick={() => setShowSubtopicsModal(false)}
                className="text-gray-400 hover:text-gray-600 rounded-full p-2"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="px-6 py-4 overflow-y-auto flex-1">
              <div className="mb-4 flex items-center space-x-4">
                <div>
                  <label className="text-sm text-gray-700 font-medium">Grade:</label>
                  <select
                    value={subtopicGrade}
                    onChange={(e) => {
                      const newGrade = e.target.value;
                      setSubtopicGrade(newGrade);
                      const topics = getTopicsForGrade(newGrade);
                      setSubtopicTopic(topics[0] || '');
                      const enrollment = enrollments[selectedStudentForSubtopics.id];
                      const currentRestrictions = enrollment?.allowedSubtopicsByTopic || {};
                      setSelectedSubtopics(currentRestrictions[topics[0]] || []);
                    }}
                    className="mt-1 border rounded px-3 py-2 text-sm"
                  >
                    <option value="G3">G3</option>
                    <option value="G4">G4</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label className="text-sm text-gray-700 font-medium">Topic:</label>
                  <select
                    value={subtopicTopic}
                    onChange={(e) => handleSubtopicTopicChange(e.target.value)}
                    className="mt-1 w-full border rounded px-3 py-2 text-sm"
                  >
                    {getTopicsForGrade(subtopicGrade).map((topic) => (
                      <option key={topic} value={topic}>
                        {topic}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {subtopicTopic && (
                <div>
                  <label className="text-sm text-gray-700 font-medium mb-2 block">
                    Select specific subtopics to focus on (leave empty to include all subtopics):
                  </label>
                  <div className="border rounded-lg p-4 max-h-64 overflow-y-auto">
                    {(() => {
                      const subtopics = getSubtopicsForTopic(subtopicTopic, subtopicGrade);
                      if (subtopics.length === 0) {
                        return (
                          <p className="text-sm text-gray-500 italic">
                            This topic does not have subtopics defined.
                          </p>
                        );
                      }
                      return (
                        <div className="space-y-2">
                          {subtopics.map((subtopic) => (
                            <label
                              key={subtopic}
                              className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-2 rounded"
                            >
                              <input
                                type="checkbox"
                                checked={selectedSubtopics.includes(subtopic)}
                                onChange={() => handleSubtopicToggle(subtopic)}
                                className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                              />
                              <span className="text-sm text-gray-700">{subtopic}</span>
                            </label>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                  {selectedSubtopics.length > 0 && (
                    <p className="mt-2 text-xs text-gray-500">
                      {selectedSubtopics.length} subtopic{selectedSubtopics.length !== 1 ? 's' : ''} selected
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-2">
              <button
                onClick={() => setShowSubtopicsModal(false)}
                className="px-4 py-2 rounded border hover:bg-gray-50 text-sm font-medium"
                disabled={savingSubtopics}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSubtopics}
                disabled={savingSubtopics}
                className="px-4 py-2 rounded bg-purple-600 text-white hover:bg-purple-700 text-sm font-medium disabled:opacity-50"
              >
                {savingSubtopics ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassDetailPanel;
