# Layouts

## PortalLayout — teacher/admin portal shell: left sidebar (solid blue-600 logo tile, section nav with blue active state, collapse), sticky top header (section title, user, outline 12px Sign out button), main slate-50 content area

### `src/components/portal/PortalLayout.js`

```jsx
import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, LogOut, Sparkles } from 'lucide-react';
import { Avatar } from './PortalUI';

const PortalLayout = ({ sections, activeSectionId, onSectionChange, user, roleLabel, onLogout, children }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const activeSection = sections.find((section) => section.id === activeSectionId);
  const ActiveIcon = activeSection?.icon;
  const userName = user?.displayName || user?.email || 'Signed in user';

  return (
    <div className="min-h-screen flex bg-slate-50 text-gray-900">
      <aside
        className={`hidden md:flex md:flex-col sticky top-0 h-screen flex-shrink-0 bg-white border-r border-gray-200 transition-all duration-200 ${sidebarCollapsed ? 'w-20' : 'w-64'}`}
      >
        <div className={`px-4 py-5 border-b border-gray-100 ${sidebarCollapsed ? 'text-center' : ''}`}>
          <div className={`flex items-center ${sidebarCollapsed ? 'flex-col gap-3' : 'justify-between gap-3'}`}>
            <div className={`flex items-center ${sidebarCollapsed ? '' : 'gap-3 min-w-0'}`}>
              <span className="inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-glow-blue">
                <Sparkles className="h-5 w-5" aria-hidden="true" />
              </span>
              {!sidebarCollapsed && (
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold text-blue-600 uppercase tracking-wider">Math Whiz Portal</p>
                  <h1 className="text-lg font-bold leading-tight">Workspace</h1>
                  {roleLabel && (
                    <p className="text-xs text-gray-500">{roleLabel}</p>
                  )}
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => setSidebarCollapsed((collapsed) => !collapsed)}
              className="inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-900"
              aria-label={sidebarCollapsed ? 'Expand portal sidebar' : 'Collapse portal sidebar'}
              aria-expanded={!sidebarCollapsed}
            >
              {sidebarCollapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto" aria-label="Portal sections">
          {sections.map((section) => {
            const isActive = section.id === activeSectionId;
            const Icon = section.icon;
            return (
              <button
                key={section.id}
                type="button"
                onClick={() => onSectionChange(section.id)}
                aria-current={isActive ? 'page' : undefined}
                title={sidebarCollapsed ? section.label : undefined}
                className={`relative w-full flex items-center rounded-lg text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${sidebarCollapsed ? 'justify-center px-2 py-3' : 'gap-3 px-3 py-2.5 text-left'} ${isActive
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
              >
                {isActive && !sidebarCollapsed && (
                  <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r bg-blue-600" aria-hidden="true" />
                )}
                {Icon && <Icon className={`h-4 w-4 flex-shrink-0 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />}
                {!sidebarCollapsed && <span className="truncate">{section.label}</span>}
                {sidebarCollapsed && <span className="sr-only">{section.label}</span>}
              </button>
            );
          })}
        </nav>
      </aside>

      <div className="flex-1 flex flex-col min-h-screen min-w-0">
        <header className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-gray-200">
          <div className="px-4 md:px-8 py-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-3 min-w-0">
              {ActiveIcon && (
                <span className="hidden sm:inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <ActiveIcon className="h-5 w-5" aria-hidden="true" />
                </span>
              )}
              <div className="min-w-0">
                <h2 className="text-xl font-semibold text-gray-900 leading-tight">{activeSection?.label}</h2>
                {activeSection?.description && (
                  <p className="mt-0.5 text-sm text-gray-500">{activeSection.description}</p>
                )}
              </div>
            </div>
            <div className="flex items-center justify-between gap-3 md:justify-end">
              {user && (
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar name={userName} seed={user.email || userName} size="sm" />
                  <div className="min-w-0 text-left md:text-right">
                    <p className="text-sm font-medium text-gray-900 truncate">{userName}</p>
                    {user.email && <p className="text-xs text-gray-500 truncate">{user.email}</p>}
                  </div>
                </div>
              )}
              <button
                type="button"
                onClick={onLogout}
                className="inline-flex flex-shrink-0 items-center gap-2 px-3 py-2 border border-gray-300 rounded-button text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1"
              >
                <LogOut className="h-4 w-4" />
                <span>Sign out</span>
              </button>
            </div>
          </div>
          {sections.length > 1 && (
            <div className="md:hidden px-4 pb-3">
              <label htmlFor="portal-section-select" className="sr-only">Section</label>
              <select
                id="portal-section-select"
                className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-800 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={activeSectionId}
                onChange={(event) => onSectionChange(event.target.value)}
              >
                {sections.map((section) => (
                  <option key={section.id} value={section.id}>{section.label}</option>
                ))}
              </select>
            </div>
          )}
        </header>
        <main className="flex-1 bg-slate-50 px-4 py-6 md:px-8 md:py-8">
          <div className="mx-auto w-full max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default PortalLayout;
```

## AppHeader — student app header (MainApp)

### `src/components/AppHeader.js`

```jsx
import React, { useEffect, useState } from "react";
import {
  BarChart2,
  BookOpen,
  Coins,
  HelpCircle,
  Home,
  Info,
  LogOut,
  MessageCircle,
  Shield,
  Save,
  Store,
  User,
  WifiOff,
} from "lucide-react";
import { USER_ROLES } from "../utils/userRoles";
import { APP_STATES } from "../constants/topics";
import { getAppId } from "../utils/common_utils";
import { useUnreadMessageCount } from "../hooks/useInternalMessages";

const AppHeader = ({
  authUser,
  userData,
  userRole,
  navigateApp,
  handleUserClick,
  handleLogout,
  isGuest = false,
  onSaveProgress,
  quizState,
  startTutorial,
  returnToTopics,
  dashboardTutorial,
  storeTutorial,
  mainAppTutorial,
}) => {
  const iconBtn = "p-2 rounded-xl hover:bg-white/80 hover:shadow-sm active:scale-95 transition-all duration-200";
  const appId = getAppId();
  const [isOnline, setIsOnline] = useState(
    typeof navigator === 'undefined' ? true : navigator.onLine
  );
  const unreadMessageCount = useUnreadMessageCount({
    appId,
    userId: authUser?.uid,
    enabled: Boolean(authUser?.uid),
  });

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <div className="fixed top-3 left-3 right-3 flex items-center gap-1.5 bg-white/70 backdrop-blur-md px-3 py-2 rounded-2xl shadow-card border border-white/50 z-10 overflow-x-auto" data-tutorial-id="navigation-menu">
      {/* Login options when no user is authenticated */}
      {!authUser && (
        <div className="flex items-center gap-1.5">
          <a href="/student-login" className="px-3 py-1.5 bg-green-100 hover:bg-green-200 rounded-button text-xs font-bold text-green-700 transition" title="Student Login">Student</a>
          <a href="/teacher-login" className="px-3 py-1.5 bg-blue-100 hover:bg-blue-200 rounded-button text-xs font-bold text-blue-700 transition" title="Teacher Login">Teacher</a>
          <a href="/admin-login" className="px-3 py-1.5 bg-purple-100 hover:bg-purple-200 rounded-button text-xs font-bold text-purple-700 transition" title="Admin Login">Admin</a>
        </div>
      )}

      {/* User info */}
      {authUser && (
        <div
          className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-gray-100 bg-gray-50 px-2.5 py-1.5 text-gray-700 transition hover:bg-gray-100"
          onClick={handleUserClick}
          title="Student profile and class settings"
          data-tutorial-id="settings-menu"
        >
          <User size={14} />
          <span className="text-xs font-bold">
            {isGuest ? 'Guest' : (userData?.displayName || authUser.displayName || authUser.email?.split('@')[0])}
          </span>
          {isGuest ? (
            <span className="whitespace-nowrap text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700">not saved</span>
          ) : userRole && (
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
              userRole === USER_ROLES.ADMIN ? 'bg-purple-100 text-purple-700' :
              userRole === USER_ROLES.TEACHER ? 'bg-blue-100 text-blue-700' :
              'bg-green-100 text-green-700'
            }`}>
              {userRole}
            </span>
          )}
        </div>
      )}

      {isGuest && onSaveProgress && (
        <button
          type="button"
          onClick={onSaveProgress}
          className="flex flex-shrink-0 items-center gap-1 rounded-xl bg-blue-600 px-2.5 py-1.5 text-xs font-bold text-white shadow-sm transition hover:bg-blue-700"
          title="Create an account to keep your progress"
          data-testid="guest-save-progress"
        >
          <Save size={14} aria-hidden="true" />
          <span className="whitespace-nowrap">Save progress</span>
        </button>
      )}

      {/* Divider */}
      <div className="w-px h-6 bg-gray-200 mx-0.5" />

      {/* Coins */}
      <div className="flex items-center gap-1 text-amber-600 font-display font-bold text-sm px-1.5">
        <Coins size={18} />
        <span>{userData?.coins || 0}</span>
      </div>

      {!isOnline && (
        <>
          <div className="w-px h-6 bg-gray-200 mx-0.5" />
          <div
            className="flex items-center gap-1 rounded-xl border border-amber-200 bg-amber-50 px-2 py-1 text-xs font-bold text-amber-700"
            title="Offline"
          >
            <WifiOff size={14} />
            <span>Offline</span>
          </div>
        </>
      )}

      {/* Divider */}
      <div className="w-px h-6 bg-gray-200 mx-0.5" />

      {/* Nav buttons */}
      <button onClick={() => navigateApp('/store')} className={iconBtn} title="Store" data-tutorial-id="store-button">
        <Store size={20} className="text-brand-purple" />
      </button>
      <button onClick={() => navigateApp('/dashboard')} className={iconBtn} title="Dashboard" data-tutorial-id="dashboard-button">
        <BarChart2 size={20} className="text-brand-blue" />
      </button>
      {authUser && (
        <button onClick={() => navigateApp('/messages')} className={`${iconBtn} relative`} title="Messages">
          <MessageCircle size={20} className="text-blue-500" />
          {unreadMessageCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold leading-4 text-center">
              {unreadMessageCount > 9 ? '9+' : unreadMessageCount}
            </span>
          )}
        </button>
      )}

      {userRole && [USER_ROLES.TEACHER, USER_ROLES.ADMIN].includes(userRole) && (
        <a href="/teacher" className={iconBtn} title="Teacher Dashboard">
          <BookOpen size={20} className="text-indigo-500" />
        </a>
      )}
      {userRole === USER_ROLES.ADMIN && (
        <a href="/admin" className={iconBtn} title="Admin Portal">
          <Shield size={20} className="text-brand-purple" />
        </a>
      )}

      <a href="/about" className={iconBtn} title="About Math Whiz">
        <Info size={20} className="text-brand-sky" />
      </a>
      <button
        onClick={() => {
          switch (quizState) {
            case APP_STATES.DASHBOARD:
              startTutorial('dashboard', dashboardTutorial);
              break;
            case APP_STATES.STORE:
              startTutorial('store', storeTutorial);
              break;
            default:
              startTutorial('mainApp', mainAppTutorial);
              break;
          }
        }}
        className={iconBtn}
        title="Show Tutorial"
      >
        <HelpCircle size={20} className="text-brand-mint" />
      </button>
      <button onClick={returnToTopics} className={iconBtn} title="Home" data-tutorial-id="return-to-topics-button">
        <Home size={20} className="text-brand-mint" />
      </button>

      {authUser && (
        <button onClick={handleLogout} className="p-2 rounded-xl hover:bg-red-50 active:scale-95 transition-all duration-200" title={authUser.isAnonymous ? "Switch User" : "Logout"} data-tutorial-id="logout-button">
          <LogOut size={20} className="text-red-400" />
        </button>
      )}
    </div>
  );
};

export default AppHeader;
```

## ProtectedRoute — role gate with loading screen

### `src/components/ProtectedRoute.js`

```jsx
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
    // If multiple roles are allowed, prefer the unified login page
    if (allowedRoles.length > 1) {
      return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Determine which login to redirect to when exactly one role is allowed
    if (allowedRoles.includes(USER_ROLES.ADMIN)) {
      return <Navigate to="/admin-login" state={{ from: location }} replace />;
    }
    if (allowedRoles.includes(USER_ROLES.TEACHER)) {
      return <Navigate to="/teacher-login" state={{ from: location }} replace />;
    }
    if (allowedRoles.includes(USER_ROLES.STUDENT)) {
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
```

