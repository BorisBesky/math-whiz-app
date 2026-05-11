import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, Users, Calendar, BookOpen, Plus, UserMinus, RefreshCw, Target, GraduationCap, Link2, Copy, RefreshCcw, CheckCircle } from 'lucide-react';
import { formatDate, getAppId } from '../../../utils/common_utils';
import { getFirestore, doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getTeacherIds } from '../../../utils/classHelpers';
import { USER_ROLES } from '../../../utils/userRoles';
import { getStudentDisplayName, getStudentShortId } from '../../../utils/studentName';
import ModalWrapper from '../../ui/ModalWrapper';
import StudentFocusModal from '../StudentFocusModal';

const ClassDetailPanel = ({
  classItem,
  students,
  onClose,
  onAssignStudent,
  onRemoveStudent,
  onRefresh,
  userRole,
  userId,
  teachers = [],
}) => {
  const classId = classItem?.id;
  const appId = getAppId();
  const db = getFirestore();

  const [showFocusModal, setShowFocusModal] = useState(false);
  const [focusStudent, setFocusStudent] = useState(null);

  // Invite state
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [invite, setInvite] = useState({ joinCode: '', joinUrl: '', expiresAt: '' });
  const [copiedField, setCopiedField] = useState(null);

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

  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [status, setStatus] = useState(null);
  const [assigning, setAssigning] = useState(false);
  const [removingId, setRemovingId] = useState(null);
  const canManageStudents = typeof onAssignStudent === 'function' && typeof onRemoveStudent === 'function';

  // Teacher management state
  const [selectedTeacherToAdd, setSelectedTeacherToAdd] = useState('');
  const [addingTeacher, setAddingTeacher] = useState(false);
  const [removingTeacherId, setRemovingTeacherId] = useState(null);
  const isAdmin = userRole === USER_ROLES.ADMIN;
  const isTeacherOnClass = userId && getTeacherIds(classItem).includes(userId);
  const canManageTeachers = isAdmin || isTeacherOnClass;

  const currentTeacherIds = useMemo(() => getTeacherIds(classItem), [classItem]);

  const currentTeachersResolved = useMemo(() => {
    return currentTeacherIds.map((tid) => {
      const matched = teachers.find((t) => t.uid === tid || t.id === tid);
      return matched
        ? { uid: tid, displayName: matched.displayName || matched.name, email: matched.email }
        : { uid: tid, displayName: null, email: classItem.teacherEmail || null };
    });
  }, [currentTeacherIds, teachers, classItem.teacherEmail]);

  const availableTeachersToAdd = useMemo(() => {
    return teachers.filter((t) => {
      const tUid = t.uid || t.id;
      return !currentTeacherIds.includes(tUid);
    });
  }, [teachers, currentTeacherIds]);

  const handleAddTeacher = async () => {
    if (!selectedTeacherToAdd) return;
    setAddingTeacher(true);
    setStatus(null);
    try {
      const classRef = doc(db, 'artifacts', appId, 'classes', classId);
      await updateDoc(classRef, {
        teacherIds: arrayUnion(selectedTeacherToAdd),
      });
      setSelectedTeacherToAdd('');
      setStatus({ type: 'success', message: 'Teacher added to class.' });
    } catch (err) {
      console.error('Error adding teacher:', err);
      setStatus({ type: 'error', message: err.message || 'Failed to add teacher.' });
    } finally {
      setAddingTeacher(false);
    }
  };

  const handleRemoveTeacher = async (teacherUid) => {
    if (currentTeacherIds.length <= 1) {
      setStatus({ type: 'error', message: 'Cannot remove the last teacher from a class.' });
      return;
    }
    setRemovingTeacherId(teacherUid);
    setStatus(null);
    try {
      const classRef = doc(db, 'artifacts', appId, 'classes', classId);
      await updateDoc(classRef, {
        teacherIds: arrayRemove(teacherUid),
      });
      setStatus({ type: 'success', message: 'Teacher removed from class.' });
    } catch (err) {
      console.error('Error removing teacher:', err);
      setStatus({ type: 'error', message: err.message || 'Failed to remove teacher.' });
    } finally {
      setRemovingTeacherId(null);
    }
  };

  const fetchInvite = useCallback(async (rotate = false) => {
    setInviteLoading(true);
    try {
      const auth = getAuth();
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch('/.netlify/functions/join-class', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: 'request-link',
          classId,
          appId,
          rotate,
        }),
      });
      if (!res.ok) throw new Error('Failed to get invite link');
      const data = await res.json();
      setInvite({ joinCode: data.joinCode, joinUrl: data.joinUrl, expiresAt: data.expiresAt });
    } catch (e) {
      console.error('Error fetching invite:', e);
      setStatus({ type: 'error', message: 'Could not generate invite link.' });
    } finally {
      setInviteLoading(false);
    }
  }, [classId, appId]);

  const handleCopy = async (text, field) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (e) {
      console.error('Copy failed:', e);
    }
  };

  const handleOpenInviteModal = () => {
    setShowInviteModal(true);
    fetchInvite(false);
  };

  const handleOpenFocusModal = (student) => {
    setFocusStudent(student);
    setShowFocusModal(true);
  };

  const handleCloseFocusModal = () => {
    setShowFocusModal(false);
    setFocusStudent(null);
  };

  // Escape key to close
  const handleEscapeKey = useCallback((e) => {
    if (e.key === 'Escape') {
      if (showFocusModal) {
        handleCloseFocusModal();
      } else if (showInviteModal) {
        setShowInviteModal(false);
      } else {
        onClose();
      }
    }
  }, [onClose, showFocusModal, showInviteModal]);

  useEffect(() => {
    document.addEventListener('keydown', handleEscapeKey);
    return () => document.removeEventListener('keydown', handleEscapeKey);
  }, [handleEscapeKey]);

  if (!classItem) {
    return null;
  }

  const renderModalInPortal = (modal) => {
    if (typeof document === 'undefined') {
      return null;
    }
    return createPortal(modal, document.body);
  };

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
        studentName: getStudentDisplayName(student),
        studentEmail: student.email,
        currentClassId: student.classId,
      });
      setSelectedStudentId('');
      setStatus({ type: 'success', message: `${getStudentDisplayName(student)} assigned successfully.` });
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
      setStatus({ type: 'success', message: `${getStudentDisplayName(student)} removed from class.` });
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
    <div className="fixed inset-0 bg-slate-900/45 backdrop-blur-[1px] z-40 flex items-center justify-center p-4 sm:p-6" role="dialog" aria-modal="true">
      <div className="bg-white rounded-xl border border-gray-200 shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 flex-shrink-0">
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

        <div className="flex-1 overflow-y-auto">
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

        {/* Teachers Section */}
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h4 className="text-sm font-semibold text-gray-900 flex items-center">
                <GraduationCap className="h-4 w-4 mr-2 text-blue-600" />
                Teachers
              </h4>
            </div>
          </div>

          <div className="space-y-2">
            {currentTeachersResolved.map((teacher) => (
              <div key={teacher.uid} className="flex items-center justify-between bg-gray-50 rounded-md px-3 py-2">
                <div className="text-sm">
                  <span className="font-medium text-gray-900">
                    {teacher.displayName || teacher.email || teacher.uid}
                  </span>
                  {teacher.displayName && teacher.email && (
                    <span className="text-gray-500 ml-2">{teacher.email}</span>
                  )}
                  {classItem.createdBy === teacher.uid && (
                    <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">Owner</span>
                  )}
                </div>
                {isAdmin && currentTeacherIds.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveTeacher(teacher.uid)}
                    disabled={removingTeacherId === teacher.uid}
                    className="text-xs text-red-500 hover:text-red-700 font-medium disabled:opacity-50"
                  >
                    {removingTeacherId === teacher.uid ? 'Removing...' : 'Remove'}
                  </button>
                )}
              </div>
            ))}
          </div>

          {canManageTeachers && availableTeachersToAdd.length > 0 && (
            <div className="mt-3 flex items-center space-x-2">
              <select
                className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm"
                value={selectedTeacherToAdd}
                onChange={(e) => setSelectedTeacherToAdd(e.target.value)}
              >
                <option value="">Add a teacher...</option>
                {availableTeachersToAdd.map((t) => (
                  <option key={t.uid || t.id} value={t.uid || t.id}>
                    {t.displayName || t.name || t.email || t.uid || t.id}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleAddTeacher}
                disabled={!selectedTeacherToAdd || addingTeacher}
                className="inline-flex items-center px-3 py-2 bg-blue-600 text-white rounded-md text-sm font-medium disabled:opacity-50"
              >
                <Plus className="h-4 w-4 mr-1" />
                {addingTeacher ? 'Adding...' : 'Add'}
              </button>
            </div>
          )}
        </div>

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

          {/* Admin: direct student assignment */}
          {isAdmin && canManageStudents && (
            <div className="mb-4 border border-gray-200 rounded-md p-4 bg-gray-50">
              <div className="flex flex-col md:flex-row md:items-end md:space-x-3 space-y-3 md:space-y-0">
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
                          {getStudentDisplayName(student)}
                        {student.classId ? ` • ${student.className || 'Assigned'}` : ' • Unassigned'}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  type="button"
                  onClick={handleAssign}
                  disabled={!selectedStudentId || assigning}
                  className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium disabled:opacity-50 whitespace-nowrap"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {assigning ? 'Assigning...' : 'Assign to class'}
                </button>
              </div>
            </div>
          )}

          {/* Teacher (or admin): invite students via code/link */}
          {(isTeacherOnClass || isAdmin) && (
            <div className="mb-4">
              <button
                type="button"
                onClick={handleOpenInviteModal}
                className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 transition-colors"
              >
                <Link2 className="h-4 w-4 mr-2" />
                Invite Students
              </button>
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
                          <p className="font-medium text-gray-900">{getStudentDisplayName(student)}</p>
                          <p className="text-xs text-gray-400">ID: {getStudentShortId(student)}</p>
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
                              onClick={() => handleOpenFocusModal(student)}
                              className="inline-flex items-center text-xs font-medium text-purple-600 hover:text-purple-800"
                              title="Set Focus Subtopics"
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
      </div>

      {/* Invite Students Modal */}
      {showInviteModal && renderModalInPortal(
        <ModalWrapper
          isOpen={showInviteModal}
          onClose={() => setShowInviteModal(false)}
          title="Invite Students"
          size="sm"
        >
          <div className="px-6 py-5 space-y-4">
            <p className="text-sm text-gray-600">
              Share a link or code so students are added to <span className="font-medium">{classItem.name}</span> automatically.
            </p>

            {/* Join Link */}
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Join Link</label>
              <div className="mt-1 flex">
                <input
                  className="flex-1 border border-gray-300 rounded-l-md px-3 py-2 text-sm bg-gray-50 text-gray-700"
                  readOnly
                  value={invite.joinUrl || (inviteLoading ? 'Generating...' : '')}
                />
                <button
                  onClick={() => invite.joinUrl && handleCopy(invite.joinUrl, 'link')}
                  disabled={!invite.joinUrl}
                  className="inline-flex items-center px-3 py-2 border border-l-0 border-gray-300 rounded-r-md bg-white hover:bg-gray-50 text-gray-600 disabled:opacity-50 transition-colors"
                  title="Copy link"
                >
                  {copiedField === 'link' ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Join Code */}
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Join Code</label>
              <div className="mt-1 flex items-center justify-between border border-gray-300 rounded-md px-3 py-2 bg-gray-50">
                <span className="font-mono text-lg tracking-wider text-gray-900">
                  {invite.joinCode || (inviteLoading ? '...' : '')}
                </span>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => invite.joinCode && handleCopy(invite.joinCode, 'code')}
                    disabled={!invite.joinCode}
                    className="text-gray-500 hover:text-gray-700 disabled:opacity-50"
                    title="Copy code"
                  >
                    {copiedField === 'code' ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </button>
                  <button
                    onClick={() => fetchInvite(true)}
                    disabled={inviteLoading}
                    className="inline-flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-800 disabled:opacity-50"
                    title="Generate a new code"
                  >
                    <RefreshCcw className={`h-4 w-4 ${inviteLoading ? 'animate-spin' : ''}`} />
                    <span>Rotate</span>
                  </button>
                </div>
              </div>
              {invite.expiresAt && (
                <p className="mt-1 text-xs text-gray-500">
                  Expires: {new Date(invite.expiresAt).toLocaleString()}
                </p>
              )}
            </div>
          </div>

          <div className="px-6 py-4 border-t border-gray-200 flex justify-end bg-gray-50">
            <button
              onClick={() => setShowInviteModal(false)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              Done
            </button>
          </div>
        </ModalWrapper>
      )}

      {/* Focus Modal */}
      {showFocusModal && focusStudent && renderModalInPortal(
        <StudentFocusModal
          isOpen={showFocusModal}
          onClose={handleCloseFocusModal}
          student={focusStudent}
          classId={classId}
          appId={appId}
          onSaved={() => setStatus({ type: 'success', message: 'Focus areas updated.' })}
        />
      )}
    </div>
  );
};

export default ClassDetailPanel;
