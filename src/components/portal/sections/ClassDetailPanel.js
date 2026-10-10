import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Users, Calendar, BookOpen, Plus, UserMinus, RefreshCw, Target, AlertCircle, GraduationCap, Link2, Copy, RefreshCcw, CheckCircle, MessageCircle, Edit3 } from 'lucide-react';
import { formatDate, getAppId } from '../../../utils/common_utils';
import { getFirestore, doc, getDoc, getDocs, query, collection, where } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getTeacherIds } from '../../../utils/classHelpers';
import { USER_ROLES } from '../../../utils/userRoles';
import { getStudentDisplayName, getStudentShortId } from '../../../utils/studentName';
import ModalWrapper from '../../ui/ModalWrapper';
import SubtopicsFocusModal from '../SubtopicsFocusModal';
import MessageComposer from '../../messaging/MessageComposer';
import { getEnrollmentId, sendInternalMessage } from '../../../services/internalMessages';
import { fetchClassQuestionPoolHealth } from '../../../services/questionPoolHealth';
import QuestionPoolHealthBanner from '../QuestionPoolHealthBanner';
import EditClassForm from '../../EditClassForm';
import { Avatar, EmptyState, ModalHeader, PortalButton } from '../PortalUI';
import { MODAL } from '../../../theme/accent';
import StudentRowActions from '../StudentRowActions';
import GoalsModal from '../GoalsModal';
import ConfirmationModal from '../../ui/ConfirmationModal';
import useConfirmation from '../../../hooks/useConfirmation';
import useStudentGoals from '../../../hooks/useStudentGoals';

const ClassDetailPanel = ({
  classItem,
  students,
  onClose,
  onAssignStudent,
  onRemoveStudent,
  onRefresh,
  onViewStudent,
  userRole,
  userId,
  teachers = [],
  onEditClass,
  showEditForm,
  setShowEditForm,
}) => {
  const classId = classItem?.id;
  const appId = getAppId();
  const db = getFirestore();
  
  const [enrollments, setEnrollments] = useState({});
  const [loadingEnrollments, setLoadingEnrollments] = useState(false);
  const [enrollmentError, setEnrollmentError] = useState(null);
  const [failedStudentIds, setFailedStudentIds] = useState(new Set());
  const [enrollmentReloadTrigger, setEnrollmentReloadTrigger] = useState(0);
  const [showSubtopicsModal, setShowSubtopicsModal] = useState(false);
  const [selectedStudentForSubtopics, setSelectedStudentForSubtopics] = useState(null);
  const [selectedStudentForMessage, setSelectedStudentForMessage] = useState(null);

  // Invite state
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [invite, setInvite] = useState({ joinCode: '', joinUrl: '', expiresAt: '' });
  const [copiedField, setCopiedField] = useState(null);

  const roster = useMemo(() => {
    if (!classId) {
      return [];
    }
    return students.filter((student) => {
      const studentClassIds = Array.isArray(student.classIds)
        ? student.classIds
        : student.classId
          ? [student.classId]
          : [];
      return studentClassIds.includes(classId);
    });
  }, [students, classId]);

  const availableStudents = useMemo(() => {
    if (!classId) {
      return [];
    }
    return students.filter((student) => {
      const studentClassIds = Array.isArray(student.classIds)
        ? student.classIds
        : student.classId
          ? [student.classId]
          : [];
      return !studentClassIds.includes(classId);
    });
  }, [students, classId]);

  // Memoize roster IDs to prevent unnecessary re-fetches
  const rosterIds = useMemo(() => {
    return roster.map(s => s.id).sort().join(',');
  }, [roster]);

  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [status, setStatus] = useState(null);
  const [assigning, setAssigning] = useState(false);
  const [removingId, setRemovingId] = useState(null);
  const [selectedRosterIds, setSelectedRosterIds] = useState(() => new Set());
  const [bulkRemoving, setBulkRemoving] = useState(false);
  const { confirmationProps, confirm } = useConfirmation();
  const { goalsModalProps, isGoalsOpen, openGoalsForStudent, openGoalsForStudents } = useStudentGoals({
    appId,
    onSaved: onRefresh,
  });

  // Drop selections for students who are no longer on the roster.
  useEffect(() => {
    setSelectedRosterIds((prev) => {
      if (prev.size === 0) return prev;
      const ids = new Set(rosterIds ? rosterIds.split(',') : []);
      const next = new Set([...prev].filter((id) => ids.has(id)));
      return next.size === prev.size ? prev : next;
    });
  }, [rosterIds]);
  const canManageStudents = typeof onAssignStudent === 'function' && typeof onRemoveStudent === 'function';

  // Teacher management state
  const [selectedTeacherToAdd, setSelectedTeacherToAdd] = useState('');
  const [addingTeacher, setAddingTeacher] = useState(false);
  const [removingTeacherId, setRemovingTeacherId] = useState(null);
  const [classTeacherProfiles, setClassTeacherProfiles] = useState([]);
  const [poolHealthFlags, setPoolHealthFlags] = useState([]);

  // Surface "students are repeating questions" advisories for this class. Best-effort:
  // a failure here must never block the panel, so errors are swallowed (logged only).
  useEffect(() => {
    if (!classId) {
      setPoolHealthFlags([]);
      return undefined;
    }
    let cancelled = false;
    fetchClassQuestionPoolHealth({ appId, classId })
      .then((result) => { if (!cancelled) setPoolHealthFlags(result.flags); })
      .catch((err) => {
        console.warn('[ClassDetailPanel] question pool health unavailable', err?.message || err);
        if (!cancelled) setPoolHealthFlags([]);
      });
    return () => { cancelled = true; };
  }, [appId, classId]);
  const isAdmin = userRole === USER_ROLES.ADMIN;
  const isTeacherOnClass = userId && classItem && getTeacherIds(classItem).includes(userId);
  const canManageTeachers = isAdmin || isTeacherOnClass;
  const canEditClass = (isAdmin || isTeacherOnClass) && typeof onEditClass === 'function' && typeof setShowEditForm === 'function';

  const currentTeacherIds = useMemo(() => (classItem ? getTeacherIds(classItem) : []), [classItem]);

  const mergedTeacherProfiles = useMemo(() => {
    const byId = new Map();
    [...teachers, ...classTeacherProfiles].forEach((teacher) => {
      const teacherId = teacher?.uid || teacher?.id;
      if (teacherId && !byId.has(teacherId)) {
        byId.set(teacherId, teacher);
      }
    });
    return byId;
  }, [teachers, classTeacherProfiles]);

  useEffect(() => {
    if (!classId || currentTeacherIds.length === 0) {
      return undefined;
    }

    const hasAllTeacherProfiles = currentTeacherIds.every((tid) => mergedTeacherProfiles.has(tid));
    if (hasAllTeacherProfiles) {
      return undefined;
    }

    let isMounted = true;

    const loadClassTeachers = async () => {
      try {
        const auth = getAuth();
        const token = await auth.currentUser?.getIdToken();
        if (!token) return;

        const response = await fetch('/.netlify/functions/get-class-teachers', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ appId, classId }),
        });

        if (!response.ok) {
          return;
        }

        const data = await response.json();
        if (isMounted) {
          const nextProfiles = Array.isArray(data.teachers) ? data.teachers : [];
          setClassTeacherProfiles((previousProfiles) => {
            const previousKey = previousProfiles.map((teacher) => teacher?.uid || teacher?.id || '').join('|');
            const nextKey = nextProfiles.map((teacher) => teacher?.uid || teacher?.id || '').join('|');
            return previousKey === nextKey ? previousProfiles : nextProfiles;
          });
        }
      } catch (err) {
        console.error('[ClassDetailPanel] Failed to load class teachers', err);
      }
    };

    loadClassTeachers();

    return () => {
      isMounted = false;
    };
  }, [appId, classId, currentTeacherIds, mergedTeacherProfiles]);

  const currentTeachersResolved = useMemo(() => {
    if (!classItem) return [];
    return currentTeacherIds.map((tid) => {
      const matched = mergedTeacherProfiles.get(tid);
      const isPrimaryTeacher = tid === classItem.teacherId;
      return matched
        ? { uid: tid, displayName: matched.displayName || matched.name, email: matched.email }
        : {
          uid: tid,
          displayName: null,
          email: isPrimaryTeacher ? classItem.teacherEmail || null : null,
        };
    });
  }, [currentTeacherIds, mergedTeacherProfiles, classItem]);

  const availableTeachersToAdd = useMemo(() => {
    return teachers.filter((t) => {
      const tUid = t.uid || t.id;
      return !currentTeacherIds.includes(tUid);
    });
  }, [teachers, currentTeacherIds]);

  // Teacher membership is changed server-side: a class's teacherIds is the authorization
  // key for reading enrolled students' profiles, and that array must be propagated onto
  // every enrolled student's profile.teacherIds (which a client cannot write). The
  // manage-class-teacher function does both atomically; a direct updateDoc here would
  // leave students unreadable by the new teacher (the internal Messages tab would break).
  const callManageTeacher = async (action, teacherUid) => {
    const auth = getAuth();
    const token = await auth.currentUser?.getIdToken();
    if (!token) throw new Error('Authentication required.');
    const response = await fetch('/.netlify/functions/manage-class-teacher', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ action, appId, classId, teacherId: teacherUid }),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(result.error || `Failed to ${action} teacher.`);
    }
    return result;
  };

  const handleAddTeacher = async () => {
    if (!selectedTeacherToAdd) return;
    setAddingTeacher(true);
    setStatus(null);
    try {
      await callManageTeacher('add', selectedTeacherToAdd);
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
      await callManageTeacher('remove', teacherUid);
      setStatus({ type: 'success', message: 'Teacher removed from class.' });
    } catch (err) {
      console.error('Error removing teacher:', err);
      setStatus({ type: 'error', message: err.message || 'Failed to remove teacher.' });
    } finally {
      setRemovingTeacherId(null);
    }
  };

  const getMessageRelationship = (student) => ({
    enrollmentId: getEnrollmentId(classId, student.id),
    classId,
    className: classItem.name || 'Class',
    studentId: student.id,
    studentName: getStudentDisplayName(student),
    teacherId: userId || currentTeacherIds[0],
    teacherName: classItem.teacherName || classItem.teacherEmail || 'Teacher',
  });

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
        // Replace N parallel getDoc calls with a single classId-scoped query:
        // one RPC returns every enrollment doc for the class instead of
        // opening a separate fetch per student (100 students = 100 requests
        // every time the panel opened). Fall back to per-student getDoc on
        // permission errors so a rules edge case can't wipe the whole panel.
        const rosterIds = new Set(roster.map((student) => student.id));
        const enrollmentData = {};
        roster.forEach((student) => {
          enrollmentData[student.id] = { allowedSubtopicsByTopic: {} };
        });
        const failedIds = new Set();

        try {
          const enrollmentsQuery = query(
            collection(db, 'artifacts', appId, 'classStudents'),
            where('classId', '==', classId)
          );
          const snapshot = await getDocs(enrollmentsQuery);
          snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            if (data && data.studentId && rosterIds.has(data.studentId)) {
              enrollmentData[data.studentId] = {
                allowedSubtopicsByTopic: data.allowedSubtopicsByTopic || {},
              };
            }
          });
        } catch (bulkError) {
          console.warn(
            '[ClassDetailPanel] Bulk enrollment query failed; falling back to per-student reads.',
            bulkError
          );
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
                }
              } catch (err) {
                console.error(`Error loading enrollment for student ${student.id}:`, err);
                failedIds.add(student.id);
              }
            })
          );
        }

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

  const handleRetryEnrollments = () => {
    // Trigger reload by incrementing the reload trigger
    setEnrollmentReloadTrigger(prev => prev + 1);
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

  const handleOpenSubtopicsModal = (student) => {
    setSelectedStudentForSubtopics(student);
    setShowSubtopicsModal(true);
  };

  const handleSubtopicsSaved = (updatedAllowed) => {
    if (!selectedStudentForSubtopics) return;
    setEnrollments((prev) => ({
      ...prev,
      [selectedStudentForSubtopics.id]: {
        allowedSubtopicsByTopic: updatedAllowed,
      },
    }));
    setStatus({ type: 'success', message: 'Subtopics updated successfully.' });
  };

  // Lock body scroll while panel is open (matches ModalWrapper behaviour)
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  // Escape key to close
  const handleEscapeKey = useCallback((e) => {
    if (e.key === 'Escape') {
      if (isGoalsOpen || confirmationProps.isOpen || selectedStudentForMessage) {
        // A nested modal owns Escape; it closes itself.
        return;
      }
      if (showSubtopicsModal) {
        setShowSubtopicsModal(false);
      } else if (showInviteModal) {
        setShowInviteModal(false);
      } else {
        onClose();
      }
    }
  }, [onClose, showSubtopicsModal, showInviteModal, isGoalsOpen, confirmationProps.isOpen, selectedStudentForMessage]);

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

  const toggleRosterSelection = (studentId) => {
    setSelectedRosterIds((prev) => {
      const next = new Set(prev);
      if (next.has(studentId)) next.delete(studentId);
      else next.add(studentId);
      return next;
    });
  };

  const allRosterSelected = roster.length > 0 && roster.every((student) => selectedRosterIds.has(student.id));
  const toggleSelectAllRoster = () => {
    setSelectedRosterIds(allRosterSelected ? new Set() : new Set(roster.map((student) => student.id)));
  };

  const handleBulkRemove = async () => {
    const targets = roster.filter((student) => selectedRosterIds.has(student.id));
    if (targets.length === 0 || !canManageStudents) return;
    const ok = await confirm({
      title: 'Remove from class',
      message: `Remove ${targets.length} student${targets.length === 1 ? '' : 's'} from ${classItem.name}? Their accounts and progress are kept.`,
      variant: 'danger',
      confirmLabel: 'Remove',
    });
    if (!ok) return;
    setBulkRemoving(true);
    setStatus(null);
    const failed = [];
    for (const student of targets) {
      try {
        // Sequential on purpose: each call is a separate enrollment write.
        // eslint-disable-next-line no-await-in-loop
        await onRemoveStudent({ studentId: student.id, classId: classItem.id });
      } catch (err) {
        failed.push(getStudentDisplayName(student));
      }
    }
    setSelectedRosterIds(new Set());
    setStatus(failed.length > 0
      ? { type: 'error', message: `Could not remove: ${failed.join(', ')}` }
      : { type: 'success', message: `Removed ${targets.length} student${targets.length === 1 ? '' : 's'} from class.` });
    if (onRefresh) await onRefresh();
    setBulkRemoving(false);
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
    <div
      className={`fixed inset-0 ${MODAL.overlay} z-40 flex items-center justify-center p-4 sm:p-6`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="class-detail-title"
    >
      <div className={`${MODAL.panel} max-w-3xl w-full max-h-[90vh] supports-[height:100dvh]:max-h-[90dvh] flex flex-col overflow-hidden`}>
        <ModalHeader
          eyebrow="Class Detail"
          title={classItem.name}
          titleId="class-detail-title"
          titleProps={{ title: classItem.name }}
          onClose={onClose}
          actions={canEditClass && (
            <PortalButton
              variant="secondary"
              icon={Edit3}
              onClick={() => setShowEditForm(true)}
              aria-label="Edit Class"
              className="whitespace-nowrap"
            >
              <span className="hidden sm:inline">Edit Class</span>
            </PortalButton>
          )}
        />

        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
        <div className="px-6 py-3 border-b border-gray-100 flex flex-wrap gap-2 text-sm text-gray-700">
          <div className="inline-flex items-center gap-2 rounded-full bg-gray-50 px-3 py-1 ring-1 ring-inset ring-gray-200">
            <BookOpen className="h-4 w-4 text-blue-600" aria-hidden="true" />
            <span>{classItem.subject || 'Math'}</span>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full bg-gray-50 px-3 py-1 ring-1 ring-inset ring-gray-200">
            <Users className="h-4 w-4 text-blue-600" aria-hidden="true" />
            <span>{roster.length} student{roster.length === 1 ? '' : 's'}</span>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full bg-gray-50 px-3 py-1 ring-1 ring-inset ring-gray-200">
            <Calendar className="h-4 w-4 text-blue-600" aria-hidden="true" />
            <span>Created {formatDate(classItem.createdAt)}</span>
          </div>
        </div>

        {classItem.description && (
          <div className="px-6 py-4 text-sm text-gray-700 border-b border-gray-100">
            {classItem.description}
          </div>
        )}

        {poolHealthFlags.length > 0 && (
          <div className="px-6 pt-4">
            <QuestionPoolHealthBanner flags={poolHealthFlags} />
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

          <div
            className="space-y-2 max-h-48 overflow-y-auto overscroll-contain pr-1"
            data-testid="class-teachers-list"
          >
            {currentTeachersResolved.map((teacher) => (
              <div key={teacher.uid} className="flex items-center justify-between gap-3 bg-gray-50 rounded-lg px-3 py-2">
                <div className="flex items-center gap-3 min-w-0 text-sm">
                  <Avatar name={teacher.displayName || teacher.email || 'Teacher'} seed={teacher.uid} size="sm" />
                  <div className="min-w-0 truncate">
                  <span className="font-medium text-gray-900">
                    {teacher.displayName || teacher.email || 'Teacher'}
                  </span>
                  {teacher.displayName && teacher.email && (
                    <span className="text-gray-500 ml-2">{teacher.email}</span>
                  )}
                  {classItem.createdBy === teacher.uid && (
                    <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">Owner</span>
                  )}
                  </div>
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
              <PortalButton
                variant="secondary"
                icon={Plus}
                onClick={handleAddTeacher}
                disabled={!selectedTeacherToAdd || addingTeacher}
              >
                {addingTeacher ? 'Adding...' : 'Add'}
              </PortalButton>
            </div>
          )}
        </div>

        <div className="px-4 py-4 sm:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
            <div>
              <h4 className="text-lg font-semibold text-gray-900">Roster</h4>
              <p className="text-sm text-gray-500">Students enrolled in this class</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {canManageStudents && (
                <PortalButton variant="secondary" icon={RefreshCw} onClick={onRefresh}>
                  Refresh
                </PortalButton>
              )}
              {/* Teacher (or admin): invite students via code/link */}
              {(isTeacherOnClass || isAdmin) && (
                <PortalButton variant="primary" icon={Link2} onClick={handleOpenInviteModal}>
                  Invite Students
                </PortalButton>
              )}
            </div>
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
                    {availableStudents.map((student) => {
                      const studentClassIds = Array.isArray(student.classIds)
                        ? student.classIds
                        : student.classId
                          ? [student.classId]
                          : [];
                      const hasClass = studentClassIds.length > 0;
                      return (
                        <option key={student.id} value={student.id}>
                          {getStudentDisplayName(student)}
                          {hasClass ? ` • ${student.className || 'Assigned'}` : ' • Unassigned'}
                        </option>
                      );
                    })}
                  </select>
                </div>
                <PortalButton
                  variant="secondary"
                  size="lg"
                  icon={Plus}
                  onClick={handleAssign}
                  disabled={!selectedStudentId || assigning}
                  className="whitespace-nowrap"
                >
                  {assigning ? 'Assigning...' : 'Assign to class'}
                </PortalButton>
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
                className="ml-4 px-3 py-1 text-sm font-medium text-yellow-800 bg-yellow-100 hover:bg-yellow-200 rounded-button transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
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
            <EmptyState
              icon={Users}
              title="No students have been added to this class yet."
              description={(isTeacherOnClass || isAdmin) ? 'Use "Invite Students" to share a join link or code.' : undefined}
            />
          ) : (
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div
                className={`flex flex-wrap items-center justify-between gap-2 px-3 py-2 sm:px-4 border-b text-sm transition-colors ${
                  selectedRosterIds.size > 0 ? 'bg-blue-50 border-blue-100' : 'bg-gray-50/70 border-gray-100'
                }`}
              >
                <span className={selectedRosterIds.size > 0 ? 'font-medium text-blue-800' : 'text-gray-500'}>
                  {selectedRosterIds.size > 0
                    ? `${selectedRosterIds.size} selected`
                    : 'Select students to set goals or remove in bulk'}
                </span>
                <div className="flex items-center gap-2">
                  <PortalButton
                    icon={Target}
                    onClick={() => openGoalsForStudents(selectedRosterIds)}
                    disabled={selectedRosterIds.size === 0}
                    title="Set Goals"
                    className="py-1.5"
                  >
                    <span>Set goals</span>
                  </PortalButton>
                  {canManageStudents && (
                    <PortalButton
                      variant="danger"
                      icon={UserMinus}
                      onClick={handleBulkRemove}
                      disabled={selectedRosterIds.size === 0 || bulkRemoving}
                      title="Remove selected from class"
                      aria-label="Remove selected from class"
                      className="py-1.5"
                    >
                      <span className="hidden sm:inline">{bulkRemoving ? 'Removing...' : 'Remove'}</span>
                    </PortalButton>
                  )}
                </div>
              </div>
              <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-white border-b border-gray-200 text-xs uppercase tracking-wide">
                  <tr>
                    <th scope="col" className="w-9 pl-3 pr-1 py-2.5 text-left sm:w-12 sm:px-4">
                      <input
                        type="checkbox"
                        checked={allRosterSelected}
                        onChange={toggleSelectAllRoster}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        aria-label="Select all students in this class"
                      />
                    </th>
                    <th scope="col" className="px-2 py-2.5 text-left font-semibold text-gray-600 sm:px-4">Student</th>
                    <th scope="col" className="hidden sm:table-cell px-4 py-2.5 text-right font-semibold text-gray-600">Questions</th>
                    <th scope="col" className="px-2 py-2.5 text-right font-semibold text-gray-600 sm:px-4">Accuracy</th>
                    <th scope="col" className="relative px-2 py-2.5 text-right font-semibold text-gray-600 sm:px-4">
                      <span className="sr-only sm:not-sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {roster.map((student) => {
                    const displayName = getStudentDisplayName(student);
                    const focusDisabled = failedStudentIds.has(student.id) || loadingEnrollments;
                    const isSelected = selectedRosterIds.has(student.id);
                    const isRemoving = removingId === student.id;
                    return (
                      <tr key={student.id} className={`align-middle transition-colors ${isSelected ? 'bg-blue-50/60' : 'hover:bg-gray-50'}`}>
                        <td className="w-9 pl-3 pr-1 py-2.5 sm:w-12 sm:px-4">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleRosterSelection(student.id)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            aria-label={`Select ${displayName}`}
                          />
                        </td>
                        <td className="px-2 py-2.5 max-w-[9rem] sm:px-4 sm:max-w-[14rem]">
                          <div className="flex items-center gap-3 min-w-0">
                            <Avatar name={displayName} seed={student.id} size="sm" />
                            <div className="min-w-0">
                              {onViewStudent ? (
                                <button
                                  type="button"
                                  onClick={() => onViewStudent(student)}
                                  className="block max-w-full truncate text-left font-medium text-gray-900 hover:text-blue-700 focus:outline-none focus-visible:underline"
                                >
                                  {displayName}
                                </button>
                              ) : (
                                <p className="font-medium text-gray-900 truncate">{displayName}</p>
                              )}
                              <p className="text-xs text-gray-400 truncate">
                                {student.grade} · ID: {getStudentShortId(student)}
                              </p>
                              {student.email && (
                                <p className="text-xs text-gray-500 truncate" title={student.email}>{student.email}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="hidden sm:table-cell px-4 py-2.5 text-right text-gray-600 tabular-nums">{student.totalQuestions}</td>
                        <td className="px-2 py-2.5 text-right text-gray-600 tabular-nums sm:px-4">{student.accuracy}%</td>
                        <td className="px-2 py-2 sm:px-4">
                          <StudentRowActions
                            displayName={displayName}
                            onViewDetails={onViewStudent ? () => onViewStudent(student) : undefined}
                            onSetGoals={() => openGoalsForStudent(student)}
                            onSetFocus={canManageStudents ? () => handleOpenSubtopicsModal(student) : undefined}
                            focusDisabled={focusDisabled}
                            focusTitle={
                              failedStudentIds.has(student.id)
                                ? 'Enrollment data failed to load. Click Retry above to reload.'
                                : loadingEnrollments
                                ? 'Loading enrollment data...'
                                : 'Set focus subtopics'
                            }
                            extraActions={[
                              isTeacherOnClass && {
                                key: 'message',
                                label: `Message ${displayName}`,
                                menuLabel: 'Message student',
                                title: 'Message student',
                                icon: MessageCircle,
                                tone: 'blue',
                                separated: true,
                                onClick: () => setSelectedStudentForMessage(student),
                              },
                              canManageStudents && {
                                key: 'remove',
                                label: isRemoving ? `Removing ${displayName}...` : `Remove ${displayName} from class`,
                                menuLabel: isRemoving ? 'Removing...' : 'Remove from class',
                                title: 'Remove from class',
                                icon: isRemoving ? RefreshCw : UserMinus,
                                tone: 'red',
                                separated: !isTeacherOnClass,
                                onClick: () => handleRemove(student),
                                disabled: isRemoving,
                                className: isRemoving ? '[&>svg]:animate-spin' : '',
                              },
                            ]}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              </div>
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
            <PortalButton variant="primary" size="lg" onClick={() => setShowInviteModal(false)}>
              Done
            </PortalButton>
          </div>
        </ModalWrapper>
      )}

      {selectedStudentForMessage && renderModalInPortal(
        <ModalWrapper
          isOpen={!!selectedStudentForMessage}
          onClose={() => setSelectedStudentForMessage(null)}
          title={`Message ${getStudentDisplayName(selectedStudentForMessage)}`}
          size="md"
        >
          <div className="px-6 py-5">
            <MessageComposer
              defaultRelationship={getMessageRelationship(selectedStudentForMessage)}
              sender={{
                id: userId,
                role: 'teacher',
                name: classItem.teacherName || classItem.teacherEmail || 'Teacher',
              }}
              recipientRole="student"
              onSend={(messageInput) => sendInternalMessage({ db, appId, ...messageInput })}
            />
          </div>
        </ModalWrapper>
      )}

      {/* Subtopics Modal (shared component) */}
      {showSubtopicsModal && selectedStudentForSubtopics && renderModalInPortal(
        <SubtopicsFocusModal
          isOpen={showSubtopicsModal}
          onClose={() => setShowSubtopicsModal(false)}
          student={selectedStudentForSubtopics}
          classId={classId}
          initialAllowedSubtopicsByTopic={
            enrollments[selectedStudentForSubtopics.id]?.allowedSubtopicsByTopic || {}
          }
          onSaved={handleSubtopicsSaved}
        />
      )}

      {isGoalsOpen && renderModalInPortal(<GoalsModal {...goalsModalProps} />)}
      {renderModalInPortal(<ConfirmationModal {...confirmationProps} />)}

      {showEditForm && canEditClass && (
        <EditClassForm
          classData={classItem}
          onSubmit={onEditClass}
          onCancel={() => setShowEditForm(false)}
        />
      )}
    </div>
  );
};

export default ClassDetailPanel;
