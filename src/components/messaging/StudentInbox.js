import React from 'react';
import InternalInbox from './InternalInbox';
import useInternalMessages, { useStudentTeacherRelationships } from '../../hooks/useInternalMessages';
import { getAppId } from '../../utils/common_utils';

const StudentInbox = ({ user, userData }) => {
  const appId = getAppId();
  const userId = user?.uid || null;
  const {
    relationships,
    loading: relationshipsLoading,
    error: relationshipsError,
  } = useStudentTeacherRelationships({ appId, studentId: userId, enabled: Boolean(userId) });
  const {
    messages,
    loading,
    error,
    sendMessage,
    markRead,
  } = useInternalMessages({ appId, userId, enabled: Boolean(userId) });

  return (
    <div className="mt-16 w-full max-w-4xl mx-auto">
      <InternalInbox
        title="Inbox"
        description="Ask your teacher a question or read feedback. These messages stay inside Math Whiz."
        currentUserId={userId}
        currentUserName={userData?.displayName || user?.displayName || user?.email || 'Student'}
        currentUserRole="student"
        messages={messages}
        relationships={relationships}
        loading={loading || relationshipsLoading}
        error={error || relationshipsError}
        onSend={sendMessage}
        onMarkRead={markRead}
        recipientRole="teacher"
      />
    </div>
  );
};

export default StudentInbox;
