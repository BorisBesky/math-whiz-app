import React, { useMemo } from 'react';
import InternalInbox from '../../messaging/InternalInbox';
import useInternalMessages from '../../../hooks/useInternalMessages';
import { getTeacherStudentRelationships } from '../../../services/internalMessages';
import { USER_ROLES } from '../../../utils/userRoles';

const MessagesSection = ({ appId, user, userRole, classes = [], students = [] }) => {
  const userId = user?.uid || null;
  const {
    messages,
    loading,
    error,
    sendMessage,
    markRead,
  } = useInternalMessages({ appId, userId, enabled: Boolean(userId) });

  const relationships = useMemo(() => (
    getTeacherStudentRelationships({
      classes,
      students,
      teacherId: userRole === USER_ROLES.ADMIN ? null : userId,
      includeAllTeachers: userRole === USER_ROLES.ADMIN,
    })
  ), [classes, students, userId, userRole]);

  return (
    <div className="p-6">
      <InternalInbox
        title="Student Messages"
        description="Send feedback to students and reply to student questions. Messages are internal only; no email is sent."
        currentUserId={userId}
        currentUserName={user?.displayName || user?.email || 'Teacher'}
        currentUserRole={userRole === USER_ROLES.ADMIN ? 'admin' : 'teacher'}
        messages={messages}
        relationships={relationships}
        loading={loading}
        error={error}
        onSend={sendMessage}
        onMarkRead={markRead}
        recipientRole="student"
      />
    </div>
  );
};

export default MessagesSection;
