import React, { useState } from 'react';
import { useAuth } from '../src/contexts/AuthContext';
import { USER_ROLES } from '../src/utils/userRoles';

const TestUserSetup = () => {
  const { registerWithEmail, user, userRole } = useAuth();
  const [feedback, setFeedback] = useState('');

  const createTestUser = async (email, password, role, displayName) => {
    try {
      setFeedback(`Creating ${role}: ${email}...`);
      await registerWithEmail(email, password, role, { displayName });
      setFeedback(`✅ Created ${role}: ${email}`);
    } catch (error) {
      setFeedback(`❌ Error creating ${email}: ${error.message}`);
    }
  };

  const testUsers = [
    { email: 'teacher@test.com', password: 'teacher123', role: USER_ROLES.TEACHER, displayName: 'Test Teacher' },
    { email: 'admin@test.com', password: 'admin123', role: USER_ROLES.ADMIN, displayName: 'Test Admin' },
    { email: 'student@test.com', password: 'student123', role: USER_ROLES.STUDENT, displayName: 'Test Student' }
  ];

  return (
    <div className="fixed bottom-4 right-4 bg-white border border-gray-300 rounded-lg p-4 shadow-lg z-50">
      <h3 className="font-bold text-lg mb-2">Test User Setup</h3>
      <div className="mb-4">
        <p className="text-sm">Current User: {user?.email || 'None'}</p>
        <p className="text-sm">Current Role: {userRole || 'None'}</p>
      </div>
      
      <div className="space-y-2">
        {testUsers.map((testUser) => (
          <button
            key={testUser.email}
            onClick={() => createTestUser(testUser.email, testUser.password, testUser.role, testUser.displayName)}
            className="block w-full text-left px-3 py-2 bg-blue-100 hover:bg-blue-200 rounded text-sm"
          >
            Create {testUser.role}: {testUser.email}
          </button>
        ))}
      </div>
      
      {feedback && (
        <div className="mt-3 p-2 bg-gray-100 rounded text-sm">
          {feedback}
        </div>
      )}
      
      <div className="mt-4 text-xs text-gray-600">
        <p>Test Credentials:</p>
        <p>Teacher: teacher@test.com / teacher123</p>
        <p>Admin: admin@test.com / admin123</p>
        <p>Student: student@test.com / student123</p>
      </div>
    </div>
  );
};

export default TestUserSetup;
