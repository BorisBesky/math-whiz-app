import React from 'react';
import AccountDataPanel from '../../account/AccountDataPanel';

/** "My Account" portal section for teachers and admins. */
const AccountSection = ({ user, appId, isAdmin }) => (
  <div className="space-y-6">
    <AccountDataPanel user={user} appId={appId} role="teacher" isAdmin={isAdmin} />
  </div>
);

export default AccountSection;
