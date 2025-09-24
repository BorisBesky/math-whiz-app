import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { USER_ROLES } from '../utils/userRoles';

// Component to protect routes based on user role
const ProtectedRoute = ({ children, allowedRoles = [], fallbackPath = '/unauthorized' }) => {
  const { user, userRole, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If no user is authenticated, redirect to appropriate login
  if (!user) {
    // Determine which login to redirect to based on allowed roles
    if (allowedRoles.includes(USER_ROLES.ADMIN)) {
      return <Navigate to="/admin-login" state={{ from: location }} replace />;
    } else if (allowedRoles.includes(USER_ROLES.TEACHER)) {
      return <Navigate to="/teacher-login" state={{ from: location }} replace />;
    } else if (allowedRoles.includes(USER_ROLES.STUDENT)) {
      return <Navigate to="/student-login" state={{ from: location }} replace />;
    }
    return <Navigate to="/" replace />;
  }

  // Check if user has one of the allowed roles
  if (!allowedRoles.includes(userRole)) {
    // Redirect to appropriate page based on user's actual role
    switch (userRole) {
      case USER_ROLES.STUDENT:
        return <Navigate to="/" replace />;
      case USER_ROLES.TEACHER:
        return <Navigate to="/teacher" replace />;
      case USER_ROLES.ADMIN:
        return <Navigate to="/admin" replace />;
      default:
        return <Navigate to={fallbackPath} replace />;
    }
  }

  return children;
};

// Higher-order component for role-based access
export const withRoleAccess = (Component, requiredRole) => {
  return (props) => (
    <ProtectedRoute requiredRole={requiredRole}>
      <Component {...props} />
    </ProtectedRoute>
  );
};

// Specific route protection components
export const StudentRoute = ({ children }) => (
  <ProtectedRoute requiredRole={USER_ROLES.STUDENT}>
    {children}
  </ProtectedRoute>
);

export const TeacherRoute = ({ children }) => (
  <ProtectedRoute requiredRole={USER_ROLES.TEACHER}>
    {children}
  </ProtectedRoute>
);

export const AdminRoute = ({ children }) => (
  <ProtectedRoute requiredRole={USER_ROLES.ADMIN}>
    {children}
  </ProtectedRoute>
);

export default ProtectedRoute;
