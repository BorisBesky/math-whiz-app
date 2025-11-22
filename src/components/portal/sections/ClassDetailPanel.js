import React, { useMemo, useState } from 'react';
import { X, Users, Calendar, BookOpen, Plus, UserMinus, RefreshCw } from 'lucide-react';
import { formatDate } from '../../../utils/common_utils';

const ClassDetailPanel = ({
  classItem,
  students,
  onClose,
  onAssignStudent,
  onRemoveStudent,
  onRefresh,
}) => {
  const classId = classItem?.id;

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
                          <button
                            type="button"
                            onClick={() => handleRemove(student)}
                            className="inline-flex items-center text-red-600 hover:text-red-800 text-xs font-medium"
                            disabled={removingId === student.id}
                          >
                            <UserMinus className="h-4 w-4 mr-1" />
                            {removingId === student.id ? 'Removing...' : 'Remove'}
                          </button>
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
  );
};

export default ClassDetailPanel;
