import React from 'react';
import QuestionBankManager from '../../QuestionBankManager';
import AdminQuestionBankManager from '../../AdminQuestionBankManager';
import { USER_ROLES } from '../../../utils/userRoles';

const QuestionBankSection = ({ userRole, classes = [], appId, userId }) => {
  if (userRole === USER_ROLES.ADMIN) {
    return (
      <div className="bg-white">
        <AdminQuestionBankManager classes={classes} appId={appId} />
      </div>
    );
  }

  return (
    <div className="bg-white">
      <QuestionBankManager
        classes={classes}
        appId={appId}
        userId={userId}
      />
    </div>
  );
};

export default QuestionBankSection;
