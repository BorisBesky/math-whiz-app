import React, { useMemo, useState } from 'react';
import { Users, GraduationCap, Plus } from 'lucide-react';
import { USER_ROLES } from '../../../utils/userRoles';
import CreateClassForm from '../../CreateClassForm';
import ClassDetailPanel from './ClassDetailPanel';

const ClassesSection = ({
  classes,
  classCounts,
  loading,
  error,
  userRole,
  onCreateClass,
  students = [],
  onAssignStudent,
  onRemoveStudent,
  onRefreshStudents,
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
  const canCreateClass = userRole === USER_ROLES.TEACHER && typeof onCreateClass === 'function';
  const selectedClass = selectedClassId ? classes.find((cls) => cls.id === selectedClassId) : null;

  return (
    <div className="p-6 space-y-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <h3 className="text-lg font-semibold text-gray-900">Classes</h3>
        <div className="flex items-center space-x-3">
          <p className="text-sm text-gray-500">Manage rosters and monitor class progress</p>
          {canCreateClass && (
            <button
              type="button"
              onClick={() => {
                setActionError(null);
                setShowCreateForm(true);
              }}
              className="inline-flex items-center space-x-2 px-3 py-2 rounded-md bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              <span>New Class</span>
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3 text-sm text-red-800">
          {error}
        </div>
      )}

      {actionError && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 text-sm text-yellow-800">
          {actionError}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center space-x-2 text-gray-500">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-400"></div>
          <span>Loading classes...</span>
        </div>
      ) : sortedClasses.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-gray-300 rounded-lg text-gray-500">
          {canCreateClass
            ? 'No classes yet. Use the "New Class" button to get started.'
            : 'No classes yet. Classes you create or manage will appear here.'}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {sortedClasses.map((classItem) => (
            <div key={classItem.id} className="border border-gray-200 rounded-lg p-4 bg-white space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-500">{classItem.gradeLevel || classItem.grade || 'Grade N/A'}</p>
                  <h4 className="text-lg font-semibold text-gray-900">{classItem.name}</h4>
                </div>
                <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-blue-50 text-blue-700">
                  <Users className="h-3 w-3 mr-1" />
                  {classCounts[classItem.id] || 0} students
                </span>
              </div>
              {userRole === USER_ROLES.ADMIN && (
                <p className="text-xs text-gray-500 flex items-center space-x-1">
                  <GraduationCap className="h-3 w-3" />
                  <span>{classItem.teacherName || classItem.teacherEmail || classItem.teacherId || 'Assigned teacher'}</span>
                </p>
              )}
              {classItem.subject && (
                <p className="text-sm text-gray-600">Subject: {classItem.subject}</p>
              )}
              {classItem.description && (
                <p className="text-xs text-gray-500">{classItem.description}</p>
              )}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedClassId(classItem.id)}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  View details
                </button>
              </div>
            </div>
          ))}
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
              setActionError(err?.message || 'Failed to create class. Please try again.');
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
        />
      )}
    </div>
  );
};

export default ClassesSection;
