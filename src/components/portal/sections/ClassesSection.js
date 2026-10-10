import React, { useMemo, useState } from 'react';
import { Users, GraduationCap, Plus, Trash2, Layers, BookOpen, ChevronRight } from 'lucide-react';
import { USER_ROLES } from '../../../utils/userRoles';
import CreateClassForm from '../../CreateClassForm';
import ClassDetailPanel from './ClassDetailPanel';
import ConfirmationModal from '../../ui/ConfirmationModal';
import useConfirmation from '../../../hooks/useConfirmation';
import {
  Alert, EmptyState, IconButton, LoadingRow, PortalButton, SectionCard, SectionHeader,
} from '../PortalUI';

const ClassesSection = ({
  classes,
  classCounts,
  loading,
  error,
  userRole,
  userId,
  teachers = [],
  onCreateClass,
  onUpdateClass,
  onDeleteClass,
  students = [],
  onAssignStudent,
  onRemoveStudent,
  onRefreshStudents,
  onViewStudent,
}) => {
  const sortedClasses = useMemo(() => {
    return [...classes].sort((a, b) => {
      const aName = a.name?.toLowerCase() || '';
      const bName = b.name?.toLowerCase() || '';
      return aName.localeCompare(bName);
    });
  }, [classes]);

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [actionError, setActionError] = useState(null);
  const [selectedClassId, setSelectedClassId] = useState(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const { confirmationProps, confirm } = useConfirmation();
  const canCreateClass = userRole === USER_ROLES.TEACHER && typeof onCreateClass === 'function';
  const selectedClass = selectedClassId ? classes.find((cls) => cls.id === selectedClassId) : null;

  const handleDeleteClass = async (classId) => {
    const ok = await confirm({
      title: 'Delete Class',
      message: 'Are you sure you want to delete this class? This action cannot be undone.',
      variant: 'danger',
      confirmLabel: 'Delete',
    });
    if (!ok) return;
    try {
      await onDeleteClass(classId);
    } catch (err) {
      setActionError(err?.message || 'Failed to delete class');
    }
  };

  const handleUpdateClass = async (updatedData) => {
    if (!selectedClass || typeof onUpdateClass !== 'function') {
      return;
    }

    try {
      setActionError(null);
      await onUpdateClass(selectedClass.id, updatedData);
      setShowEditForm(false);
    } catch (err) {
      setActionError(err?.message || 'Failed to update class');
      throw err;
    }
  };

  return (
    <div className="space-y-5">
      <SectionHeader
        title={userRole === USER_ROLES.ADMIN ? 'All classes' : 'Your classes'}
        description={canCreateClass
          ? 'Create classes, invite students, and manage rosters'
          : 'Browse classes and manage their rosters'}
        actions={canCreateClass && (
          <PortalButton
            variant="primary"
            icon={Plus}
            onClick={() => {
              setActionError(null);
              setShowCreateForm(true);
            }}
          >
            New Class
          </PortalButton>
        )}
      />

      {error && <Alert>{error}</Alert>}

      {actionError && <Alert tone="warning">{actionError}</Alert>}

      {loading ? (
        <SectionCard>
          <LoadingRow label="Loading classes..." />
        </SectionCard>
      ) : sortedClasses.length === 0 ? (
        <EmptyState
          icon={Layers}
          title={canCreateClass
            ? 'No classes yet. Use the "New Class" button to get started.'
            : 'No classes yet. Classes you create or manage will appear here.'}
          description="Each class gets its own invite code so students can join in seconds."
          className="bg-white"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {sortedClasses.map((classItem) => {
            const teacherLabel = classItem.teacherEmails?.join(', ') || classItem.teacherName || classItem.teacherEmail || classItem.teacherId || 'Assigned teacher';
            return (
              <SectionCard
                key={classItem.id}
                as="div"
                className="group flex flex-col transition-shadow hover:shadow-card-hover"
              >
                <div className="flex-1 p-5 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <span className="inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                        <BookOpen className="h-5 w-5" aria-hidden="true" />
                      </span>
                      <div className="min-w-0">
                        <h4 className="text-base font-semibold text-gray-900 truncate" title={classItem.name}>{classItem.name}</h4>
                        <p className="text-xs font-medium text-gray-500">{classItem.gradeLevel || classItem.grade || 'Grade N/A'}</p>
                      </div>
                    </div>
                    <span className="inline-flex flex-shrink-0 items-center whitespace-nowrap px-2 py-1 text-xs font-medium rounded-full bg-blue-50 text-blue-700 tabular-nums">
                      <Users className="h-3 w-3 mr-1" aria-hidden="true" />
                      {classCounts[classItem.id] || 0} students
                    </span>
                  </div>
                  {userRole === USER_ROLES.ADMIN && (
                    <p className="text-xs text-gray-500 flex items-center gap-1.5 min-w-0">
                      <GraduationCap className="h-3.5 w-3.5 flex-shrink-0" aria-hidden="true" />
                      <span className="truncate" title={teacherLabel}>{teacherLabel}</span>
                    </p>
                  )}
                  {classItem.subject && (
                    <p className="text-sm text-gray-600">Subject: {classItem.subject}</p>
                  )}
                  {classItem.description && (
                    <p className="text-xs text-gray-500 line-clamp-2">{classItem.description}</p>
                  )}
                </div>
                <div className="flex items-center justify-between gap-2 border-t border-gray-100 px-5 py-3">
                  <button
                    type="button"
                    onClick={() => setSelectedClassId(classItem.id)}
                    className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-800"
                  >
                    View details
                    <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                  </button>
                  {(userRole === USER_ROLES.ADMIN || userRole === USER_ROLES.TEACHER) && typeof onDeleteClass === 'function' && (
                    <IconButton
                      icon={Trash2}
                      label="Delete Class"
                      tone="red"
                      onClick={() => handleDeleteClass(classItem.id)}
                    />
                  )}
                </div>
              </SectionCard>
            );
          })}
        </div>
      )}

      {canCreateClass && showCreateForm && (
        <CreateClassForm
          onSubmit={async (formData) => {
            try {
              await onCreateClass(formData);
              setShowCreateForm(false);
              setActionError(null);
            } catch (err) {
              console.error('Failed to create class:', err);
              // Re-throw so CreateClassForm can display the error inside the modal
              throw err;
            }
          }}
          onCancel={() => {
            setShowCreateForm(false);
            setActionError(null);
          }}
        />
      )}

      {selectedClass && (
        <ClassDetailPanel
          classItem={selectedClass}
          students={students}
          onClose={() => setSelectedClassId(null)}
          onAssignStudent={onAssignStudent}
          onRemoveStudent={onRemoveStudent}
          onRefresh={onRefreshStudents}
          onViewStudent={typeof onViewStudent === 'function'
            ? (student) => {
              setSelectedClassId(null);
              onViewStudent(student.id);
            }
            : undefined}
          userRole={userRole}
          userId={userId}
          teachers={teachers}
          onEditClass={typeof onUpdateClass === 'function' ? handleUpdateClass : undefined}
          showEditForm={showEditForm}
          setShowEditForm={setShowEditForm}
        />
      )}

      <ConfirmationModal {...confirmationProps} />
    </div>
  );
};

export default ClassesSection;
