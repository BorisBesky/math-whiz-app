import React, { Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import MainApp from './MainApp';
import LoginPage from './components/LoginPage';
import { USER_ROLES } from './utils/userRoles';

// Lazy-loaded routes — only fetched when the user navigates to them
const StudentLogin = React.lazy(() => import('./components/StudentLogin'));
const TeacherLogin = React.lazy(() => import('./components/TeacherLogin'));
const AdminLogin = React.lazy(() => import('./components/AdminLogin'));
const PortalApp = React.lazy(() => import('./components/PortalApp'));
const JoinClass = React.lazy(() => import('./components/JoinClass'));
const AboutPage = React.lazy(() => import('./components/AboutPage'));

const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
    <div className="flex flex-col items-center gap-4">
      <div className="w-12 h-12 border-4 border-brand-blue/30 border-t-brand-blue rounded-full animate-spin" />
      <p className="font-display text-lg text-gray-500">Loading...</p>
    </div>
  </div>
);

const App = () => {
  return (
    <AuthProvider>
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          {/* Public routes - accessible to everyone */}
          {/* Login/Signup page */}
          <Route path="/login" element={<LoginPage />} />
          {/* Public join route for students with invite code */}
          <Route path="/join" element={<JoinClass />} />
          {/* About page */}
          <Route path="/about" element={<AboutPage />} />

          {/* Authentication routes */}
          <Route path="/student-login" element={<StudentLogin />} />
          <Route path="/teacher-login" element={<TeacherLogin />} />
          <Route path="/admin-login" element={<AdminLogin />} />

          {/* Protected routes - role-based access */}
          <Route
            path="/portal/*"
            element={
              <ProtectedRoute allowedRoles={[USER_ROLES.TEACHER, USER_ROLES.ADMIN]}>
                <PortalApp portalBase="/portal" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher/*"
            element={
              <ProtectedRoute allowedRoles={[USER_ROLES.TEACHER, USER_ROLES.ADMIN]}>
                <PortalApp portalBase="/teacher" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/*"
            element={
              <ProtectedRoute allowedRoles={[USER_ROLES.ADMIN]}>
                <PortalApp portalBase="/admin" />
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
      </Suspense>
    </AuthProvider>
  );
};

export default App;
