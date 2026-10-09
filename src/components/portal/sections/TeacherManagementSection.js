import React, { useState } from "react";
import { Plus, Trash2, RefreshCw, UserCheck } from "lucide-react";
import ConfirmationModal from "../../ui/ConfirmationModal";
import useConfirmation from "../../../hooks/useConfirmation";
import {
  Alert, Avatar, EmptyState, IconButton, LoadingRow, PortalButton, RowActions, SectionCard, SectionHeader,
} from "../PortalUI";

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
    <div className="space-y-4">
      {error && <Alert>{error}</Alert>}

      {showForm && (
        <SectionCard className="p-5">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <h4 className="text-base font-semibold text-gray-900">Add a teacher</h4>
              <p className="text-sm text-gray-500">They will be able to sign in to the teacher portal with this email.</p>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="new-teacher-name" className="block text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  Teacher Name
                </label>
                <input
                  id="new-teacher-name"
                  type="text"
                  className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.name}
                  onChange={(event) =>
                    setFormData({ ...formData, name: event.target.value })
                  }
                />
              </div>
              <div>
                <label htmlFor="new-teacher-email" className="block text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  Email
                </label>
                <input
                  id="new-teacher-email"
                  type="email"
                  className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.email}
                  onChange={(event) =>
                    setFormData({ ...formData, email: event.target.value })
                  }
                />
              </div>
            </div>
            {formError && <p className="text-sm text-red-600">{formError}</p>}
            <div className="flex items-center gap-2">
              <PortalButton type="submit" variant="primary">
                Create Teacher
              </PortalButton>
              <PortalButton
                variant="ghost"
                onClick={() => {
                  setShowForm(false);
                  setFormError(null);
                }}
              >
                Cancel
              </PortalButton>
            </div>
          </form>
        </SectionCard>
      )}

      <SectionCard className="overflow-hidden">
        <div className="px-4 py-4 sm:px-5 border-b border-gray-100">
          <SectionHeader
            title="Teacher Management"
            description="Invite or remove teacher accounts"
            actions={(
              <>
                <PortalButton icon={RefreshCw} onClick={onRefresh}>
                  Refresh
                </PortalButton>
                <PortalButton variant="primary" icon={Plus} onClick={() => setShowForm(true)}>
                  New Teacher
                </PortalButton>
              </>
            )}
          />
        </div>

        {selectedTeachers.length > 0 && (
          <div className="bg-blue-50 px-4 py-2 sm:px-5 border-b border-blue-100 flex items-center justify-between">
            <span className="text-sm text-blue-800 font-medium">
              {selectedTeachers.length} selected
            </span>
            <PortalButton
              variant="danger"
              icon={Trash2}
              onClick={handleBulkDelete}
              disabled={isBulkDeleting}
              className="py-1.5"
            >
              {isBulkDeleting ? "Deleting..." : "Delete Selected"}
            </PortalButton>
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-wide">
              <tr>
                <th scope="col" className="w-12 px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    checked={
                      teachers.length > 0 &&
                      selectedTeachers.length === teachers.length
                    }
                    onChange={handleSelectAll}
                    disabled={loading || teachers.length === 0}
                    aria-label="Select all teachers"
                  />
                </th>
                <th scope="col" className="px-4 py-3 text-left font-semibold text-gray-600">
                  Teacher
                </th>
                <th scope="col" className="hidden md:table-cell px-4 py-3 text-left font-semibold text-gray-600">
                  Email
                </th>
                <th scope="col" className="hidden lg:table-cell px-4 py-3 text-left font-semibold text-gray-600">
                  UID
                </th>
                <th scope="col" className="relative px-4 py-3 text-right font-semibold text-gray-600">
                  <span className="sr-only sm:not-sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4">
                    <LoadingRow label="Loading teachers..." />
                  </td>
                </tr>
              ) : teachers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-4 sm:p-5">
                    <EmptyState
                      icon={UserCheck}
                      title="No teachers found."
                      description='Use "New Teacher" to add the first teacher account.'
                    />
                  </td>
                </tr>
              ) : (
                teachers.map((teacher) => {
                  const teacherName = teacher.name || teacher.displayName || "Teacher";
                  const isSelected = selectedTeachers.includes(teacher.id);
                  return (
                    <tr key={teacher.id} className={`align-middle ${isSelected ? 'bg-blue-50/60' : 'hover:bg-gray-50'}`}>
                      <td className="w-12 px-4 py-3">
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          checked={isSelected}
                          onChange={() => handleSelectTeacher(teacher.id)}
                          aria-label={`Select ${teacherName}`}
                        />
                      </td>
                      <td className="px-4 py-3 max-w-[16rem]">
                        <div className="flex items-center gap-3 min-w-0">
                          <Avatar name={teacherName} seed={teacher.uid || teacher.id} size="sm" />
                          <div className="min-w-0">
                            <p className="font-medium text-gray-900 truncate">{teacherName}</p>
                            <p className="text-xs text-gray-500 truncate md:hidden">{teacher.email}</p>
                            {teacher.role && (
                              <p className="hidden md:block text-xs text-gray-500 capitalize">{teacher.role}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="hidden md:table-cell px-4 py-3 text-gray-600 max-w-[16rem] truncate">{teacher.email}</td>
                      <td className="hidden lg:table-cell px-4 py-3">
                        <code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-600">
                          {teacher.uid || teacher.id}
                        </code>
                      </td>
                      <td className="px-2 py-2 sm:px-4">
                        <RowActions>
                          <IconButton
                            icon={pendingDelete === teacher.id ? RefreshCw : Trash2}
                            label={pendingDelete === teacher.id ? `Removing ${teacherName}...` : `Remove ${teacherName}`}
                            tone="red"
                            onClick={() => handleDelete(teacher)}
                            disabled={pendingDelete === teacher.id}
                            className={pendingDelete === teacher.id ? '[&>svg]:animate-spin' : ''}
                          />
                        </RowActions>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </SectionCard>

      <ConfirmationModal {...confirmationProps} />
    </div>
  );
};

export default TeacherManagementSection;
