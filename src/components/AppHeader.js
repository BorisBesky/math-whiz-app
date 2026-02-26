import React from "react";
import {
  BarChart2,
  BookOpen,
  Coins,
  HelpCircle,
  Home,
  Info,
  LogOut,
  Shield,
  Store,
  User,
} from "lucide-react";
import { USER_ROLES } from "../utils/userRoles";
import { APP_STATES } from "../constants/topics";

const AppHeader = ({
  authUser,
  userData,
  userRole,
  navigateApp,
  handleUserClick,
  handleLogout,
  quizState,
  startTutorial,
  returnToTopics,
  dashboardTutorial,
  storeTutorial,
  mainAppTutorial,
}) => {
  const iconBtn = "p-2 rounded-xl hover:bg-white/80 hover:shadow-sm active:scale-95 transition-all duration-200";
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
          className={`flex items-center gap-1.5 text-gray-700 bg-gray-50 px-2.5 py-1.5 rounded-xl border border-gray-100 ${authUser.isAnonymous ? 'cursor-pointer hover:bg-gray-100 transition' : ''}`}
          onClick={handleUserClick}
          title={authUser.isAnonymous ? "Click to create an account and save your progress!" : (authUser.displayName || authUser.email)}
          data-tutorial-id="settings-menu"
        >
          <User size={14} />
          <span className="text-xs font-bold">
            {authUser.displayName || (authUser.isAnonymous ? 'Guest' : authUser.email?.split('@')[0])}
          </span>
          {userRole && (
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

      {/* Divider */}
      <div className="w-px h-6 bg-gray-200 mx-0.5" />

      {/* Coins */}
      <div className="flex items-center gap-1 text-amber-600 font-display font-bold text-sm px-1.5">
        <Coins size={18} />
        <span>{userData?.coins || 0}</span>
      </div>

      {/* Divider */}
      <div className="w-px h-6 bg-gray-200 mx-0.5" />

      {/* Nav buttons */}
      <button onClick={() => navigateApp('/store')} className={iconBtn} title="Store" data-tutorial-id="store-button">
        <Store size={20} className="text-brand-purple" />
      </button>
      <button onClick={() => navigateApp('/dashboard')} className={iconBtn} title="Dashboard" data-tutorial-id="dashboard-button">
        <BarChart2 size={20} className="text-brand-blue" />
      </button>

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
