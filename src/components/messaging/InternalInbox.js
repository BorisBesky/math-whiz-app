import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle, Inbox, MessageCircle } from 'lucide-react';
import { isMessageUnreadForUser } from '../../services/internalMessages';
import MessageComposer from './MessageComposer';

const getRelationshipKey = (relationship) => (
  relationship ? `${relationship.classId}:${relationship.studentId}:${relationship.teacherId}` : ''
);

const getMessageRelationshipKey = (message) => (
  message ? `${message.classId}:${message.studentId}:${message.teacherId}` : ''
);

const formatMessageDate = (createdAt) => {
  if (!createdAt) return 'Just now';
  const date = typeof createdAt.toDate === 'function'
    ? createdAt.toDate()
    : new Date(createdAt.seconds ? createdAt.seconds * 1000 : createdAt);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
};

const InternalInbox = ({
  title = 'Messages',
  description = 'Internal messages stay inside Math Whiz.',
  currentUserId,
  currentUserName,
  currentUserRole,
  messages = [],
  relationships = [],
  loading = false,
  error = null,
  onSend,
  onMarkRead,
  defaultRelationship = null,
  recipientRole,
}) => {
  const [filter, setFilter] = useState('all');
  const [selectedRelationshipKey, setSelectedRelationshipKey] = useState(getRelationshipKey(defaultRelationship));
  const sender = useMemo(() => ({
    id: currentUserId,
    role: currentUserRole,
    name: currentUserName,
  }), [currentUserId, currentUserName, currentUserRole]);

  useEffect(() => {
    setSelectedRelationshipKey(getRelationshipKey(defaultRelationship));
  }, [defaultRelationship]);

  const visibleMessages = useMemo(() => (
    filter === 'unread'
      ? messages.filter((message) => isMessageUnreadForUser(message, currentUserId))
      : messages
  ), [currentUserId, filter, messages]);

  const unreadCount = messages.filter((message) => isMessageUnreadForUser(message, currentUserId)).length;
  const relationshipKeys = useMemo(() => new Set(relationships.map(getRelationshipKey)), [relationships]);

  const handleMessageClick = (message) => {
    const messageRelationshipKey = getMessageRelationshipKey(message);
    const hasRelationship = defaultRelationship
      ? messageRelationshipKey === getRelationshipKey(defaultRelationship)
      : relationshipKeys.has(messageRelationshipKey);

    if (hasRelationship) {
      setSelectedRelationshipKey(messageRelationshipKey);
    }

    if (isMessageUnreadForUser(message, currentUserId)) {
      onMarkRead?.(message.id);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
        <div>
          <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-blue-600" />
            {title}
          </h3>
          <p className="text-sm text-gray-500 mt-1">{description}</p>
        </div>
        <div className="inline-flex rounded-lg border border-gray-200 bg-white p-1 text-sm">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-md ${filter === 'all' ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-gray-600'}`}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => setFilter('unread')}
            className={`px-3 py-1.5 rounded-md ${filter === 'unread' ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-gray-600'}`}
          >
            Unread {unreadCount > 0 ? `(${unreadCount})` : ''}
          </button>
        </div>
      </div>

      <MessageComposer
        relationships={relationships}
        sender={sender}
        recipientRole={recipientRole}
        defaultRelationship={defaultRelationship}
        selectedRelationshipKey={selectedRelationshipKey}
        onSelectedRelationshipKeyChange={setSelectedRelationshipKey}
        onSend={onSend}
        disabled={loading || !currentUserId}
      />

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="border-b border-gray-100 px-4 py-3 flex items-center justify-between">
          <p className="text-sm font-semibold text-gray-800">Conversation history</p>
          {loading && <span className="text-xs text-gray-500">Loading...</span>}
        </div>

        {visibleMessages.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-500">
            <Inbox className="h-10 w-10 mx-auto mb-3 text-gray-300" />
            <p className="font-medium">No messages yet</p>
            <p className="text-sm">Messages between students and their teacher will appear here.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {visibleMessages.map((message) => {
              const isMine = message.senderId === currentUserId;
              const isUnread = isMessageUnreadForUser(message, currentUserId);

              return (
                <button
                  key={message.id}
                  type="button"
                  onClick={() => handleMessageClick(message)}
                  className={`block w-full px-4 py-4 text-left cursor-pointer hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 ${isUnread ? 'bg-blue-50/60' : 'bg-white'}`}
                >
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {isMine ? 'You' : (message.senderName || 'Sender')}
                        <span className="font-normal text-gray-400"> to </span>
                        {isMine ? (message.recipientName || 'Recipient') : 'you'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {message.className || 'Class'} · {formatMessageDate(message.createdAt)}
                      </p>
                    </div>
                    {isUnread && (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-blue-700">
                        <CheckCircle className="h-3.5 w-3.5" />
                        Open to mark read
                      </span>
                    )}
                  </div>
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-gray-700">{message.body}</p>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default InternalInbox;
