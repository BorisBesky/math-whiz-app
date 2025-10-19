import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { TutorialProvider } from './contexts/TutorialContext';
import ProtectedRoute from './components/ProtectedRoute';
import MainApp from './MainApp';
import AdminPage from './components/AdminPage';
import TeacherDashboard from './components/TeacherDashboard';
import StudentLogin from './components/StudentLogin';
import TeacherLogin from './components/TeacherLogin';
import AdminLogin from './components/AdminLogin';
import LoginPage from './components/LoginPage';
import { USER_ROLES } from './utils/userRoles';
import JoinClass from './components/JoinClass';

const App = () => {
  return (
    <AuthProvider>
      <Routes>
        {/* Public routes - accessible to everyone */}
        <Route path="/" element={<MainApp />} />
        
        {/* Login/Signup page */}
        <Route path="/login" element={<LoginPage />} />
  {/* Public join route for students with invite code */}
  <Route path="/join" element={<JoinClass />} />
        
        {/* Authentication routes */}
        <Route path="/student-login" element={<StudentLogin />} />
        <Route path="/teacher-login" element={<TeacherLogin />} />
        <Route path="/admin-login" element={<AdminLogin />} />
        
        {/* Protected routes - role-based access */}
        <Route 
          path="/admin" 
          element={
            <ProtectedRoute allowedRoles={[USER_ROLES.ADMIN]}>
              <AdminPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/teacher" 
          element={
            <ProtectedRoute allowedRoles={[USER_ROLES.TEACHER, USER_ROLES.ADMIN]}>
              <TutorialProvider>
                <TeacherDashboard />
              </TutorialProvider>
            </ProtectedRoute>
          } 
        />
        
        {/* Main app is accessible to all authenticated users */}
        <Route 
          path="/app" 
          element={
            <ProtectedRoute allowedRoles={[USER_ROLES.STUDENT, USER_ROLES.TEACHER, USER_ROLES.ADMIN]}>
              <MainApp />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </AuthProvider>
  );
};

export default App;
