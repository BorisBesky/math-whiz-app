import React, { useState } from 'react';
import { Upload, FileUp } from 'lucide-react';
import QuestionBankManager from '../../QuestionBankManager';
import AdminQuestionBankManager from '../../AdminQuestionBankManager';
import UploadQuestionsPDF from '../../UploadQuestionsPDF';
import { USER_ROLES } from '../../../utils/userRoles';
import { PortalButton, SectionCard, SectionHeader } from '../PortalUI';

const QuestionBankSection = ({ userRole, classes = [], appId, userId }) => {
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const handleQuestionsSaved = () => {
    setShowUploadModal(false);
    // Trigger reload of question bank manager
    setReloadKey(prev => prev + 1);
  };

  const uploadHeader = (
    <SectionCard className="p-5">
      <SectionHeader
        icon={FileUp}
        title="Question Bank"
        description="Upload PDF files to extract quiz questions"
        actions={(
          <PortalButton variant="primary" icon={Upload} onClick={() => setShowUploadModal(true)}>
            Upload Questions
          </PortalButton>
        )}
      />
    </SectionCard>
  );

  if (userRole === USER_ROLES.ADMIN) {
    return (
      <div className="space-y-6">
        {/* Upload Questions Section */}
        {uploadHeader}

        <AdminQuestionBankManager key={reloadKey} classes={classes} appId={appId} />

        {showUploadModal && (
          <UploadQuestionsPDF
            classId={null}
            appId={appId}
            onClose={() => setShowUploadModal(false)}
            onQuestionsSaved={handleQuestionsSaved}
          />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Upload Questions Section */}
      {uploadHeader}

      <QuestionBankManager
        key={reloadKey}
        classes={classes}
        appId={appId}
        userId={userId}
      />

      {showUploadModal && (
        <UploadQuestionsPDF
          classId={null}
          appId={appId}
          onClose={() => setShowUploadModal(false)}
          onQuestionsSaved={handleQuestionsSaved}
        />
      )}
    </div>
  );
};

export default QuestionBankSection;
