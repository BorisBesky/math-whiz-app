import React, { useCallback, useEffect, useMemo } from 'react';
import { BookOpen, Layers, Users as UsersIcon, LayoutDashboard, UserCog, Image } from 'lucide-react';
import PortalLayout from './portal/PortalLayout';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { USER_ROLES } from '../utils/userRoles';
import usePortalClasses from '../hooks/usePortalClasses';
import usePortalStudents from '../hooks/usePortalStudents';
import useClassAssignments from '../hooks/useClassAssignments';
import usePortalTeachers from '../hooks/usePortalTeachers';
import OverviewSection from './portal/sections/OverviewSection';
import StudentsSection from './portal/sections/StudentsSection';
import ClassesSection from './portal/sections/ClassesSection';
import QuestionBankSection from './portal/sections/QuestionBankSection';
import TeacherManagementSection from './portal/sections/TeacherManagementSection';
import ImagesSection from './portal/sections/ImagesSection';
import { getAppId } from '../utils/common_utils';

const PortalApp = ({ portalBase = '/teacher' }) => {
  const { user, userRole, loading, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const appId = getAppId();
  const userId = user?.uid || null;
  const userEmail = user?.email || null;

  const {
    classes,
    loading: classesLoading,
    error: classesError,
    createClass,
    deleteClass,
  } = usePortalClasses({ appId, userRole, userId, userEmail });

  const {
    students,
    stats,
    classCounts,
    loading: studentsLoading,
    error: studentsError,
    refresh: refreshStudents,
  } = usePortalStudents({ appId, classes });

  const { assignStudentToClass, removeStudentFromClass } = useClassAssignments({ appId });
  const {
    teachers,
    loading: teachersLoading,
    error: teachersError,
    createTeacher,
    deleteTeacher,
    refresh: refreshTeachers,
  } = usePortalTeachers({ appId, enabled: userRole === USER_ROLES.ADMIN });

  const sections = useMemo(() => {
    if (!userRole) {
      return [];
    }

    const sharedSections = [
      {
        id: 'overview',
        label: 'Overview',
        description: 'Key metrics across your roster',
        icon: LayoutDashboard,
        render: () => (
          <OverviewSection
            stats={stats}
            students={students}
            loadingStudents={studentsLoading}
            loadingClasses={classesLoading}
            studentError={studentsError}
            classError={classesError}
          />
        ),
      },
      {
        id: 'students',
        label: 'Students',
        description: 'Track student performance and activity',
        icon: UsersIcon,
        render: () => (
          <StudentsSection
            students={students}
            loading={studentsLoading}
            error={studentsError}
            onRefresh={refreshStudents}
            appId={appId}
          />
        ),
      },
      {
        id: 'classes',
        label: 'Classes',
        description: 'Manage classes, enrollment, and rosters',
        icon: Layers,
        render: () => (
          <ClassesSection
            classes={classes}
            classCounts={classCounts}
            loading={classesLoading}
            error={classesError}
            userRole={userRole}
            userId={userId}
            teachers={teachers}
            onCreateClass={userRole === USER_ROLES.TEACHER ? createClass : undefined}
            onDeleteClass={(userRole === USER_ROLES.ADMIN || userRole === USER_ROLES.TEACHER) ? deleteClass : undefined}
            students={students}
            onAssignStudent={assignStudentToClass}
            onRemoveStudent={removeStudentFromClass}
            onRefreshStudents={refreshStudents}
          />
        ),
      },
      {
        id: 'question-bank',
        label: 'Question Bank',
        description: 'Author, review, and assign questions',
        icon: BookOpen,
        render: () => (
          <QuestionBankSection
            userRole={userRole}
            classes={classes}
            appId={appId}
            userId={userId}
          />
        ),
      },
    ];

    if (userRole === USER_ROLES.TEACHER) {
      return sharedSections;
    }

    if (userRole === USER_ROLES.ADMIN) {
      return [
        ...sharedSections,
        {
          id: 'teachers',
          label: 'Teachers',
          description: 'Manage teacher roster and invitations',
          icon: UserCog,
          render: () => (
            <TeacherManagementSection
              teachers={teachers}
              loading={teachersLoading}
              error={teachersError}
              onCreate={createTeacher}
              onDelete={deleteTeacher}
              onRefresh={refreshTeachers}
            />
          ),
        },
        {
          id: 'images',
          label: 'Store Images',
          description: 'Manage background images for rewards store',
          icon: Image,
          render: () => (
            <ImagesSection />
          ),
        },
      ];
    }

    return sharedSections;
  }, [
    appId,
    assignStudentToClass,
    classes,
    classesError,
    classesLoading,
    classCounts,
    createClass,
    deleteClass,
    refreshStudents,
    removeStudentFromClass,
    teachers,
    teachersError,
    teachersLoading,
    stats,
    students,
    studentsError,
    studentsLoading,
    createTeacher,
    deleteTeacher,
    refreshTeachers,
    userId,
    userRole,
  ]);

  // Derive active section from URL pathname
  const activeSectionId = useMemo(() => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    // e.g., /teacher/classes -> ['teacher', 'classes'] -> sectionSlug = 'classes'
    const sectionSlug = pathSegments[1];
    const matched = sections.find((s) => s.id === sectionSlug);
    return matched ? matched.id : 'overview';
  }, [location.pathname, sections]);

  // Redirect bare portal path to /overview
  useEffect(() => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    if (pathSegments.length <= 1 && sections.length > 0) {
      navigate(`${portalBase}/overview`, { replace: true });
    }
  }, [location.pathname, portalBase, navigate, sections.length]);

  // Navigate to section via URL
  const handleSectionChange = useCallback((sectionId) => {
    navigate(`${portalBase}/${sectionId}`);
  }, [navigate, portalBase]);

  if (loading || !userRole) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white shadow rounded-lg px-6 py-4 text-center">
          <p className="text-sm text-gray-600">Loading portal...</p>
        </div>
      </div>
    );
  }

  if (sections.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white shadow rounded-lg px-6 py-4 text-center">
          <p className="text-sm text-gray-600">You do not have access to this portal.</p>
        </div>
      </div>
    );
  }

  const activeSection = sections.find((section) => section.id === activeSectionId) || sections[0];

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Error during logout:', error);
      // Best-effort navigation
      try { navigate('/login'); } catch (_) {}
    }
  };

  return (
    <PortalLayout
      sections={sections}
      activeSectionId={activeSection.id}
      onSectionChange={handleSectionChange}
      user={user}
      roleLabel={userRole === USER_ROLES.ADMIN ? 'Administrator' : 'Teacher'}
      onLogout={handleLogout}
    >
      {activeSection.render()}
    </PortalLayout>
  );
};

export default PortalApp;
