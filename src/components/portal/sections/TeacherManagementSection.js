import React, { useState } from 'react';
import { Plus, Trash2, RefreshCw, UserCheck } from 'lucide-react';

const TeacherManagementSection = ({
  teachers,
  loading,
  error,
  onCreate,
  onDelete,
  onRefresh,
}) => {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '' });
  const [formError, setFormError] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!formData.name.trim() || !formData.email.trim()) {
      setFormError('Name and email are required');
      return;
    }

    try {
      setFormError(null);
      await onCreate({ name: formData.name.trim(), email: formData.email.trim() });
      setFormData({ name: '', email: '' });
      setShowForm(false);
    } catch (err) {
      setFormError(err.message || 'Failed to create teacher');
    }
  };

  const handleDelete = async (teacher) => {
    if (!window.confirm(`Remove teacher ${teacher.name || teacher.email}?`)) {
      return;
    }

    try {
      setPendingDelete(teacher.id);
      await onDelete(teacher);
    } catch (err) {
      alert(err.message || 'Failed to delete teacher');
    } finally {
      setPendingDelete(null);
    }
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Teacher Management</h3>
          <p className="text-sm text-gray-500">Invite or remove teacher accounts</p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={onRefresh}
            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </button>
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="inline-flex items-center px-3 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Teacher
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3 text-sm text-red-800">
          {error}
        </div>
      )}

      {showForm && (
        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide">Teacher Name</label>
              <input
                type="text"
                className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                value={formData.name}
                onChange={(event) => setFormData({ ...formData, name: event.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide">Email</label>
              <input
                type="email"
                className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                value={formData.email}
                onChange={(event) => setFormData({ ...formData, email: event.target.value })}
              />
            </div>
            {formError && (
              <p className="text-sm text-red-600">{formError}</p>
            )}
            <div className="flex items-center space-x-3">
              <button
                type="submit"
                className="inline-flex items-center px-3 py-2 bg-blue-600 text-white rounded-md text-sm font-medium"
              >
                Create Teacher
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setFormError(null);
                }}
                className="text-sm text-gray-500"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left font-semibold text-gray-600">Teacher</th>
              <th className="px-4 py-2 text-left font-semibold text-gray-600">Email</th>
              <th className="px-4 py-2 text-left font-semibold text-gray-600">UID</th>
              <th className="px-4 py-2 text-right font-semibold text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-400"></div>
                    <span>Loading teachers...</span>
                  </div>
                </td>
              </tr>
            ) : teachers.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                  No teachers found.
                </td>
              </tr>
            ) : (
              teachers.map((teacher) => (
                <tr key={teacher.id} className="bg-white">
                  <td className="px-4 py-2 flex items-center space-x-2">
                    <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                      <UserCheck className="h-4 w-4 text-blue-700" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{teacher.name || teacher.displayName || 'Teacher'}</p>
                      {teacher.role && (
                        <p className="text-xs text-gray-500">{teacher.role}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-2 text-gray-600">{teacher.email}</td>
                  <td className="px-4 py-2 text-gray-600">{teacher.uid || teacher.id}</td>
                  <td className="px-4 py-2 text-right">
                    <button
                      type="button"
                      onClick={() => handleDelete(teacher)}
                      className="inline-flex items-center text-red-600 hover:text-red-800"
                      disabled={pendingDelete === teacher.id}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      {pendingDelete === teacher.id ? 'Removing...' : 'Remove'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TeacherManagementSection;
