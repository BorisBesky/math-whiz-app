import React, { useState } from 'react';
import { Upload } from 'lucide-react';
import QuestionBankManager from '../../QuestionBankManager';
import AdminQuestionBankManager from '../../AdminQuestionBankManager';
import UploadQuestionsPDF from '../../UploadQuestionsPDF';
import { USER_ROLES } from '../../../utils/userRoles';

const QuestionBankSection = ({ userRole, classes = [], appId, userId }) => {
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const handleQuestionsSaved = () => {
    setShowUploadModal(false);
    // Trigger reload of question bank manager
    setReloadKey(prev => prev + 1);
  };

  if (userRole === USER_ROLES.ADMIN) {
    return (
      <div className="bg-white">
        {/* Upload Questions Section */}
        <div className="border border-gray-200 rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Question Bank</h3>
              <p className="text-sm text-gray-600">Upload PDF files to extract quiz questions</p>
            </div>
            <button
              onClick={() => setShowUploadModal(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <Upload className="h-4 w-4" />
              <span>Upload Questions</span>
            </button>
          </div>
        </div>

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
    <div className="bg-white">
      {/* Upload Questions Section */}
      <div className="border border-gray-200 rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Question Bank</h3>
            <p className="text-sm text-gray-600">Upload PDF files to extract quiz questions</p>
          </div>
          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <Upload className="h-4 w-4" />
            <span>Upload Questions</span>
          </button>
        </div>
      </div>

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
