import React, { useEffect, useMemo, useState } from 'react';
import { Send } from 'lucide-react';

const getRelationshipLabel = (relationship, senderRole) => (
  `${senderRole === 'student' ? relationship.teacherName : relationship.studentName} · ${relationship.className}`
);

const MessageComposer = ({
  relationships = [],
  sender,
  recipientRole,
  defaultRelationship = null,
  selectedRelationshipKey,
  onSelectedRelationshipKeyChange,
  onSend,
  disabled = false,
}) => {
  const [selectedKey, setSelectedKey] = useState(defaultRelationship?.enrollmentId || '');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState(null);

  // classStudents has deterministic IDs, so each enrollmentId already represents a
  // unique (class, student, teacher) row — a single Map dedupe is sufficient.
  const relationshipOptions = useMemo(() => {
    const byEnrollment = new Map();
    relationships.forEach((relationship) => {
      const key = relationship?.enrollmentId;
      if (!key || byEnrollment.has(key)) return;
      byEnrollment.set(key, {
        ...relationship,
        key,
        label: getRelationshipLabel(relationship, sender.role),
      });
    });
    return Array.from(byEnrollment.values());
  }, [relationships, sender.role]);

  useEffect(() => {
    if (selectedRelationshipKey !== undefined) {
      setSelectedKey(selectedRelationshipKey);
    }
  }, [selectedRelationshipKey]);

  const activeSelectedKey = selectedRelationshipKey !== undefined ? selectedRelationshipKey : selectedKey;
  const activeRelationship = defaultRelationship
    || relationshipOptions.find((relationship) => relationship.key === activeSelectedKey)
    || null;

  const handleRelationshipChange = (event) => {
    const nextKey = event.target.value;
    setSelectedKey(nextKey);
    onSelectedRelationshipKeyChange?.(nextKey);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!activeRelationship || !body.trim() || sending || disabled) return;

    setSending(true);
    setStatus(null);

    try {
      const isTeacherSender = sender.role === 'teacher' || sender.role === 'admin';
      await onSend({
        enrollmentId: activeRelationship.enrollmentId,
        className: activeRelationship.className,
        sender,
        recipient: {
          id: isTeacherSender ? activeRelationship.studentId : activeRelationship.teacherId,
          role: recipientRole,
          name: isTeacherSender ? activeRelationship.studentName : activeRelationship.teacherName,
        },
        body,
      });
      setBody('');
      setStatus({ type: 'success', message: 'Message sent.' });
    } catch (err) {
      setStatus({ type: 'error', message: err?.message || 'Failed to send message.' });
    } finally {
      setSending(false);
    }
  };

  const hasRelationships = relationshipOptions.length > 0 || defaultRelationship;

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 space-y-3">
      <div className="flex flex-col md:flex-row md:items-center gap-3">
        <div className="flex-1">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Send to
          </label>
          {defaultRelationship ? (
            <div className="mt-1 rounded-lg bg-blue-50 border border-blue-100 px-3 py-2 text-sm text-blue-900">
              {sender.role === 'student' ? defaultRelationship.teacherName : defaultRelationship.studentName}
              <span className="text-blue-600"> · {defaultRelationship.className}</span>
            </div>
          ) : (
            <select
              value={activeSelectedKey}
              onChange={handleRelationshipChange}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={!hasRelationships || disabled || sending}
            >
              <option value="">Choose a recipient...</option>
              {relationshipOptions.map((relationship) => (
                <option key={relationship.key} value={relationship.key}>
                  {relationship.label}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      <textarea
        value={body}
        onChange={(event) => setBody(event.target.value)}
        maxLength={2000}
        rows={4}
        placeholder={hasRelationships ? 'Write a note, feedback, or question...' : 'No valid class relationship is available for messaging.'}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
        disabled={!hasRelationships || disabled || sending}
      />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <p className="text-xs text-gray-400">{body.length}/2000</p>
        <button
          type="submit"
          disabled={!hasRelationships || !body.trim() || disabled || sending}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send className="h-4 w-4" />
          {sending ? 'Sending...' : 'Send message'}
        </button>
      </div>

      {status && (
        <div className={`rounded-md px-3 py-2 text-sm ${
          status.type === 'error'
            ? 'bg-red-50 text-red-800 border border-red-100'
            : 'bg-green-50 text-green-800 border border-green-100'
        }`}>
          {status.message}
        </div>
      )}
    </form>
  );
};

export default MessageComposer;
