import React from 'react';
import InternalInbox from '../../messaging/InternalInbox';
import useInternalMessages, { useTeacherStudentRelationships } from '../../../hooks/useInternalMessages';
import { USER_ROLES } from '../../../utils/userRoles';

const MessagesSection = ({ appId, user, userRole, classes = [] }) => {
  const userId = user?.uid || null;
  const isAdmin = userRole === USER_ROLES.ADMIN;
  const {
    messages,
    loading,
    error,
    sendMessage,
    markRead,
  } = useInternalMessages({ appId, userId, enabled: Boolean(userId) });

  const {
    relationships,
    loading: relationshipsLoading,
    error: relationshipsError,
  } = useTeacherStudentRelationships({
    appId,
    classes,
    teacherId: isAdmin ? null : userId,
    includeAllTeachers: isAdmin,
    enabled: Boolean(userId),
  });

  return (
    <div className="p-6">
      <InternalInbox
        title="Student Messages"
        description="Send feedback to students and reply to student questions. Messages are internal only; no email is sent."
        currentUserId={userId}
        currentUserName={user?.displayName || user?.email || 'Teacher'}
        currentUserRole={isAdmin ? 'admin' : 'teacher'}
        messages={messages}
        relationships={relationships}
        loading={loading || relationshipsLoading}
        error={error || relationshipsError}
        onSend={sendMessage}
        onMarkRead={markRead}
        recipientRole="student"
      />
    </div>
  );
};

export default MessagesSection;
