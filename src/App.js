import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import MainApp from './MainApp';
import StudentLogin from './components/StudentLogin';
import TeacherLogin from './components/TeacherLogin';
import AdminLogin from './components/AdminLogin';
import LoginPage from './components/LoginPage';
import { USER_ROLES } from './utils/userRoles';
import JoinClass from './components/JoinClass';
import PortalApp from './components/PortalApp';

const App = () => {
  return (
    <AuthProvider>
      <Routes>
        {/* Public routes - accessible to everyone */}
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
          path="/portal"
          element={
            <ProtectedRoute allowedRoles={[USER_ROLES.TEACHER, USER_ROLES.ADMIN]}>
              <PortalApp />
            </ProtectedRoute>
          }
        />
        <Route 
          path="/teacher" 
          element={
            <ProtectedRoute allowedRoles={[USER_ROLES.TEACHER, USER_ROLES.ADMIN]}>
              <PortalApp initialSection="overview" />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin" 
          element={
            <ProtectedRoute allowedRoles={[USER_ROLES.ADMIN]}>
              <PortalApp initialSection="overview" />
            </ProtectedRoute>
          } 
        />
        
        {/* Main app is accessible to all authenticated users */}
        <Route 
          path="/app/*" 
          element={
            <ProtectedRoute allowedRoles={[USER_ROLES.STUDENT, USER_ROLES.TEACHER, USER_ROLES.ADMIN]}>
              <MainApp />
            </ProtectedRoute>
          } 
        />
        
        {/* Wildcard route - must be last to avoid intercepting specific routes */}
        {/* MainApp owns its internal navigation via routes under / */}
        <Route path="/*" element={<MainApp />} />
      </Routes>
    </AuthProvider>
  );
};

export default App;
