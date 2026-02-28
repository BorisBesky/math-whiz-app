import React, { useState } from "react";
import { Plus, Trash2, RefreshCw, UserCheck } from "lucide-react";
import ConfirmationModal from "../../ui/ConfirmationModal";
import useConfirmation from "../../../hooks/useConfirmation";

const TeacherManagementSection = ({
  teachers,
  loading,
  error,
  onCreate,
  onDelete,
  onRefresh,
}) => {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "" });
  const [formError, setFormError] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [selectedTeachers, setSelectedTeachers] = useState([]);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const { confirmationProps, confirm } = useConfirmation();

  const handleSelectAll = (event) => {
    if (event.target.checked) {
      setSelectedTeachers(teachers.map((t) => t.id));
    } else {
      setSelectedTeachers([]);
    }
  };

  const handleSelectTeacher = (teacherId) => {
    setSelectedTeachers((prev) =>
      prev.includes(teacherId)
        ? prev.filter((id) => id !== teacherId)
        : [...prev, teacherId]
    );
  };

  const handleBulkDelete = async () => {
    const ok = await confirm({
      title: 'Remove Teachers',
      message: `Are you sure you want to remove ${selectedTeachers.length} selected teachers?`,
      variant: 'danger',
      confirmLabel: 'Remove',
    });
    if (!ok) return;

    setIsBulkDeleting(true);
    try {
      const deletePromises = selectedTeachers.map((id) => {
        const teacher = teachers.find((t) => t.id === id);
        return teacher ? onDelete(teacher) : Promise.resolve();
      });

      await Promise.all(deletePromises);
      setSelectedTeachers([]);
    } catch (err) {
      alert("Some deletions failed. Please refresh and try again.");
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!formData.name.trim() || !formData.email.trim()) {
      setFormError("Name and email are required");
      return;
    }

    try {
      setFormError(null);
      await onCreate({
        name: formData.name.trim(),
        email: formData.email.trim(),
      });
      setFormData({ name: "", email: "" });
      setShowForm(false);
    } catch (err) {
      setFormError(err.message || "Failed to create teacher");
    }
  };

  const handleDelete = async (teacher) => {
    const ok = await confirm({
      title: 'Remove Teacher',
      message: `Remove teacher ${teacher.name || teacher.email}?`,
      variant: 'danger',
      confirmLabel: 'Remove',
    });
    if (!ok) return;

    try {
      setPendingDelete(teacher.id);
      await onDelete(teacher);
    } catch (err) {
      alert(err.message || "Failed to delete teacher");
    } finally {
      setPendingDelete(null);
    }
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Teacher Management
          </h3>
          <p className="text-sm text-gray-500">
            Invite or remove teacher accounts
          </p>
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
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide">
                Teacher Name
              </label>
              <input
                type="text"
                className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                value={formData.name}
                onChange={(event) =>
                  setFormData({ ...formData, name: event.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide">
                Email
              </label>
              <input
                type="email"
                className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                value={formData.email}
                onChange={(event) =>
                  setFormData({ ...formData, email: event.target.value })
                }
              />
            </div>
            {formError && <p className="text-sm text-red-600">{formError}</p>}
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
        {selectedTeachers.length > 0 && (
          <div className="bg-blue-50 px-4 py-2 border-b border-blue-100 flex items-center justify-between">
            <span className="text-sm text-blue-700 font-medium">
              {selectedTeachers.length} selected
            </span>
            <button
              onClick={handleBulkDelete}
              disabled={isBulkDeleting}
              className="text-sm text-red-600 font-medium hover:text-red-800 flex items-center"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              {isBulkDeleting ? "Deleting..." : "Delete Selected"}
            </button>
          </div>
        )}
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 w-10">
                <input
                  type="checkbox"
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  checked={
                    teachers.length > 0 &&
                    selectedTeachers.length === teachers.length
                  }
                  onChange={handleSelectAll}
                  disabled={loading || teachers.length === 0}
                />
              </th>
              <th className="px-4 py-2 text-left font-semibold text-gray-600">
                Teacher
              </th>
              <th className="px-4 py-2 text-left font-semibold text-gray-600">
                Email
              </th>
              <th className="px-4 py-2 text-left font-semibold text-gray-600">
                UID
              </th>
              <th className="px-4 py-2 text-right font-semibold text-gray-600">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-400"></div>
                    <span>Loading teachers...</span>
                  </div>
                </td>
              </tr>
            ) : teachers.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                  No teachers found.
                </td>
              </tr>
            ) : (
              teachers.map((teacher) => (
                <tr key={teacher.id} className="bg-white">
                  <td className="px-4 py-2">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      checked={selectedTeachers.includes(teacher.id)}
                      onChange={() => handleSelectTeacher(teacher.id)}
                    />
                  </td>
                  <td className="px-4 py-2 flex items-center space-x-2">
                    <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                      <UserCheck className="h-4 w-4 text-blue-700" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {teacher.name || teacher.displayName || "Teacher"}
                      </p>
                      {teacher.role && (
                        <p className="text-xs text-gray-500">{teacher.role}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-2 text-gray-600">{teacher.email}</td>
                  <td className="px-4 py-2 text-gray-600">
                    {teacher.uid || teacher.id}
                  </td>
                  <td className="px-4 py-2 text-right">
                    <button
                      type="button"
                      onClick={() => handleDelete(teacher)}
                      className="inline-flex items-center text-red-600 hover:text-red-800"
                      disabled={pendingDelete === teacher.id}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      {pendingDelete === teacher.id ? "Removing..." : "Remove"}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <ConfirmationModal {...confirmationProps} />
    </div>
  );
};

export default TeacherManagementSection;
