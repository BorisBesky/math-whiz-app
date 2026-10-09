import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

const mockRefreshStudents = jest.fn();
const mockRefreshTeachers = jest.fn(() => Promise.resolve());
const mockStudentsMount = jest.fn();
const mockOpenedStudent = jest.fn();
let mockUserRole = 'teacher';

// react-router-dom v7 is ESM-only and can't be loaded by this Jest setup (see
// other skipped router tests), so provide a minimal in-memory stand-in for the
// two hooks PortalApp uses.
jest.mock('react-router-dom', () => {
  const ReactActual = jest.requireActual('react');
  const listeners = new Set();
  let currentPath = '/';
  return {
    __setPath: (path) => { currentPath = path; },
    useLocation: () => {
      const [, force] = ReactActual.useReducer((x) => x + 1, 0);
      ReactActual.useEffect(() => {
        listeners.add(force);
        return () => listeners.delete(force);
      }, []);
      const [pathname, search = ''] = currentPath.split('?');
      return { pathname, search: search ? `?${search}` : '' };
    },
    useNavigate: () => ReactActual.useCallback((to) => {
      currentPath = to;
      listeners.forEach((notify) => notify());
    }, []),
  };
}, { virtual: true });

jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { uid: 'u1', email: 't@example.com', displayName: 'Teacher T' },
    userRole: mockUserRole,
    loading: false,
    logout: jest.fn(),
  }),
}));

jest.mock('../../utils/common_utils', () => ({ getAppId: () => 'test-app' }));
jest.mock('../../hooks/useInternalMessages', () => ({ useUnreadMessageCount: () => 0 }));
jest.mock('../../hooks/usePortalClasses', () => () => ({
  classes: [], loading: false, error: null, createClass: jest.fn(), updateClass: jest.fn(), deleteClass: jest.fn(),
}));
jest.mock('../../hooks/usePortalStudents', () => () => ({
  students: [],
  stats: { totalStudents: 0, activeToday: 0, totalQuestions: 0, averageAccuracy: 0 },
  classCounts: {},
  loading: false,
  error: null,
  refresh: mockRefreshStudents,
}));
jest.mock('../../hooks/useClassAssignments', () => () => ({
  assignStudentToClass: jest.fn(), removeStudentFromClass: jest.fn(),
}));
jest.mock('../../hooks/usePortalTeachers', () => () => ({
  teachers: [], loading: false, error: null, createTeacher: jest.fn(), deleteTeacher: jest.fn(), refresh: mockRefreshTeachers,
}));

jest.mock('../portal/sections/OverviewSection', () => () => <div data-testid="overview-section">Overview body</div>);
jest.mock('../portal/sections/StudentsSection', () => {
  const ReactActual = jest.requireActual('react');
  return function MockStudentsSection({ initialStudentId, onInitialStudentHandled }) {
    const [drilledIn, setDrilledIn] = ReactActual.useState(false);
    ReactActual.useEffect(() => { mockStudentsMount(); }, []);
    ReactActual.useEffect(() => {
      if (initialStudentId) {
        mockOpenedStudent(initialStudentId);
        setDrilledIn(true);
        onInitialStudentHandled?.();
      }
    }, [initialStudentId, onInitialStudentHandled]);
    return drilledIn
      ? <div data-testid="student-detail">Student detail</div>
      : <button type="button" onClick={() => setDrilledIn(true)}>Open student</button>;
  };
});
jest.mock('../portal/sections/ClassesSection', () => ({ onViewStudent }) => (
  <button type="button" onClick={() => onViewStudent('stu-42')}>Roster view details</button>
));
jest.mock('../portal/sections/QuestionBankSection', () => () => <div data-testid="qb-section" />);
jest.mock('../portal/sections/TeacherManagementSection', () => () => <div data-testid="teachers-section" />);
jest.mock('../portal/sections/ImagesSection', () => () => <div data-testid="images-section" />);
jest.mock('../portal/sections/MessagesSection', () => () => <div data-testid="messages-section" />);

// eslint-disable-next-line import/first
import PortalApp from '../PortalApp';
// eslint-disable-next-line import/first
import { __setPath } from 'react-router-dom';

const renderPortal = (path = '/teacher/overview') => {
  __setPath(path);
  return render(<PortalApp portalBase="/teacher" />);
};

const clickNav = (name) => {
  // Sidebar nav buttons are the ones carrying the plain section label.
  fireEvent.click(screen.getAllByRole('button', { name })[0]);
};

describe('PortalApp tab selection', () => {
  beforeEach(() => {
    mockUserRole = 'teacher';
    mockRefreshStudents.mockClear();
    mockRefreshTeachers.mockClear();
    mockStudentsMount.mockClear();
  });

  it('does not double-fetch on initial load', () => {
    renderPortal();
    expect(screen.getByTestId('overview-section')).toBeInTheDocument();
    expect(mockRefreshStudents).not.toHaveBeenCalled();
  });

  it('refreshes roster data each time a different tab is entered', () => {
    renderPortal();
    clickNav('Students');
    expect(mockRefreshStudents).toHaveBeenCalledTimes(1);
    clickNav('Overview');
    expect(mockRefreshStudents).toHaveBeenCalledTimes(2);
    clickNav('Students');
    expect(mockRefreshStudents).toHaveBeenCalledTimes(3);
  });

  it('re-selecting the active tab resets its drill-down view and refreshes data', () => {
    renderPortal('/teacher/students');
    expect(mockStudentsMount).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: 'Open student' }));
    expect(screen.getByTestId('student-detail')).toBeInTheDocument();

    clickNav('Students');

    expect(screen.queryByTestId('student-detail')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Open student' })).toBeInTheDocument();
    expect(mockStudentsMount).toHaveBeenCalledTimes(2);
    expect(mockRefreshStudents).toHaveBeenCalledTimes(1);
  });

  it('also refreshes the teacher roster for admins', () => {
    mockUserRole = 'admin';
    renderPortal('/teacher/overview');
    clickNav('Teachers');
    expect(mockRefreshStudents).toHaveBeenCalledTimes(1);
    expect(mockRefreshTeachers).toHaveBeenCalledTimes(1);
  });

  it('View details from a class roster opens that student on the Students tab', () => {
    renderPortal('/teacher/classes');
    fireEvent.click(screen.getByRole('button', { name: 'Roster view details' }));
    expect(mockOpenedStudent).toHaveBeenCalledWith('stu-42');
    expect(screen.getByTestId('student-detail')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Students', current: 'page' })).toBeInTheDocument();
  });
});
