# Routes

Config-based routing (react-router-dom v7) in `src/App.js`.

| Path | Component | Layout | Notes |
|---|---|---|---|
| `/login` | `src/components/LoginPage.js` | standalone | role chooser |
| `/join` | `src/components/JoinClass.js` | standalone | student join via invite code |
| `/about`, `/about/:slug` | `AboutLayout` / `AboutOverview` / `AboutSeoPage` | AboutLayout | marketing |
| `/student-login` | `StudentLogin.js` | standalone | |
| `/teacher-login` | `TeacherLogin.js` | standalone | |
| `/admin-login` | `AdminLogin.js` | standalone | |
| `/portal/*`, `/teacher/*` | `PortalApp.js` (teacher+admin) | `portal/PortalLayout.js` | sections: Overview, Students, Classes, Question Bank, Messages, Account (+admin: Teachers, Images, Settings) |
| `/admin/*` | `PortalApp.js` (admin only) | PortalLayout | |
| `/app/*`, `/*` | `src/MainApp.js` | `AppHeader` | student app: topic selection, quiz, dashboard, store, profile |

Portal sections live in `src/components/portal/sections/*` and are selected by `PortalApp` via the sidebar (`activeSectionId`).
- Overview: 4 stat cards + Recent Activity list + "Could Use Support" list.
- Students: SectionCard with header (Refresh, Export CSV), selection bar (Set goals / Delete), sortable table with avatar, class & grade pills, accuracy, Today, StudentRowActions; pagination.
- Classes: class cards grid; clicking opens ClassDetailPanel (modal) with chips, QuestionPoolHealthBanner, Teachers list, Roster (Refresh, Invite Students), selection bar, roster table with StudentRowActions.

```jsx
import React, { Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './components/LoginPage';
import PortalApp from './components/PortalApp';
import { USER_ROLES } from './utils/userRoles';

// Lazy-loaded routes — only fetched when the user navigates to them
const MainApp = React.lazy(() => import('./MainApp'));
const StudentLogin = React.lazy(() => import('./components/StudentLogin'));
const TeacherLogin = React.lazy(() => import('./components/TeacherLogin'));
const AdminLogin = React.lazy(() => import('./components/AdminLogin'));
const JoinClass = React.lazy(() => import('./components/JoinClass'));
const AboutLayout = React.lazy(() => import('./components/about/AboutLayout'));
const AboutOverview = React.lazy(() => import('./components/about/AboutOverview'));
const AboutSeoPage = React.lazy(() => import('./components/about/AboutSeoPage'));

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
          {/* About pages — overview + SEO content tabs */}
          <Route path="/about" element={<AboutLayout />}>
            <Route index element={<AboutOverview />} />
            <Route path=":slug" element={<AboutSeoPage />} />
          </Route>

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

```
