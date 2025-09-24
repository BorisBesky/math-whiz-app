// User role constants
export const USER_ROLES = {
  STUDENT: 'student',
  TEACHER: 'teacher',
  ADMIN: 'admin'
};

// Route access controls
export const ROUTE_ACCESS = {
  '/': [USER_ROLES.STUDENT],
  '/teacher': [USER_ROLES.TEACHER],
  '/admin': [USER_ROLES.ADMIN]
};

// Check if user has access to a specific route
export const hasRouteAccess = (userRole, route) => {
  const allowedRoles = ROUTE_ACCESS[route];
  return allowedRoles ? allowedRoles.includes(userRole) : false;
};

// Get user role from user object
export const getUserRole = (user) => {
  if (!user) return null;
  
  // Check custom claims first (for Firebase Auth)
  if (user.customClaims) {
    return user.customClaims.role;
  }
  
  // Check user metadata
  if (user.role) {
    return user.role;
  }
  
  // Default to student for anonymous users
  if (user.isAnonymous) {
    return USER_ROLES.STUDENT;
  }
  
  // Default to student for authenticated users without role
  return USER_ROLES.STUDENT;
};

// Check if user can access main functionality (math quizzes)
export const canAccessMainApp = (userRole) => {
  return userRole === USER_ROLES.STUDENT;
};

// Check if user can access teacher portal
export const canAccessTeacherPortal = (userRole) => {
  return userRole === USER_ROLES.TEACHER;
};

// Check if user can access admin portal
export const canAccessAdminPortal = (userRole) => {
  return userRole === USER_ROLES.ADMIN;
};

// Get redirect path based on user role
export const getRedirectPath = (userRole) => {
  switch (userRole) {
    case USER_ROLES.STUDENT:
      return '/';
    case USER_ROLES.TEACHER:
      return '/teacher';
    case USER_ROLES.ADMIN:
      return '/admin';
    default:
      return '/';
  }
};

// Validate user role
export const isValidRole = (role) => {
  return Object.values(USER_ROLES).includes(role);
};
