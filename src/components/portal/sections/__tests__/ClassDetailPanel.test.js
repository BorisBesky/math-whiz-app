import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';

// Variables captured by closure so factories can reference them after hoisting
let mockGetDoc;
let mockUpdateDoc;
let mockGetIdToken;

jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(() => ({})),
  doc: jest.fn(() => ({})),
  getDoc: (...args) => mockGetDoc(...args),
  updateDoc: (...args) => mockUpdateDoc(...args),
  arrayUnion: jest.fn((v) => ({ __arrayUnion: v })),
  arrayRemove: jest.fn((v) => ({ __arrayRemove: v })),
  // Extras imported by internalMessages (not directly used in ClassDetailPanel)
  addDoc: jest.fn(),
  collection: jest.fn(),
  getDocs: jest.fn(),
  query: jest.fn(),
  serverTimestamp: jest.fn(() => 'SERVER_TIME'),
  where: jest.fn(),
}));

jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(() => ({
    currentUser: { getIdToken: (...args) => mockGetIdToken(...args) },
  })),
}));

// Utility mocks
jest.mock('../../../../utils/common_utils', () => ({
  getAppId: () => 'app-test',
  formatDate: (d) => (d ? String(d) : 'N/A'),
}));

jest.mock('../../../../utils/studentName', () => ({
  getStudentDisplayName: (s) => s?.name || s?.displayName || s?.id || 'Unknown',
  getStudentShortId: (s) => (s?.id || '').slice(0, 6),
}));

jest.mock('../../../../services/internalMessages', () => ({
  getEnrollmentId: (classId, studentId) => `${classId}__${studentId}`,
  sendInternalMessage: jest.fn().mockResolvedValue(undefined),
  getRelationshipKey: jest.fn((rel) => (rel ? `${rel.enrollmentId}::${rel.teacherId}` : '')),
}));

// Suppress portal rendering — render child modals inline
jest.mock('react-dom', () => ({
  ...jest.requireActual('react-dom'),
  createPortal: (node) => node,
}));

jest.mock('../../../ui/ModalWrapper', () => {
  const React = require('react');
  return function MockModalWrapper({ isOpen, children, title }) {
    if (!isOpen) return null;
    return React.createElement('div', { 'data-testid': 'modal-wrapper', 'data-title': title }, children);
  };
});

jest.mock('../../SubtopicsFocusModal', () => {
  const React = require('react');
  return function MockSubtopicsFocusModal({ isOpen }) {
    if (!isOpen) return null;
    return React.createElement('div', { 'data-testid': 'subtopics-modal' });
  };
});

jest.mock('../../../messaging/MessageComposer', () => {
  const React = require('react');
  return function MockMessageComposer() {
    return React.createElement('div', { 'data-testid': 'message-composer' });
  };
});

const ClassDetailPanel = require('../ClassDetailPanel').default;

const makeClass = (overrides = {}) => ({
  id: 'class-1',
  name: 'Room 12',
  subject: 'Math',
  teacherId: 'teacher-1',
  teacherIds: ['teacher-1'],
  teacherEmail: 'baker@school.com',
  teacherName: 'Ms. Baker',
  createdAt: null,
  ...overrides,
});

const makeStudent = (overrides = {}) => ({
  id: 'student-1',
  name: 'Ada',
  classId: 'class-1',
  grade: 'G3',
  totalQuestions: 50,
  accuracy: 85,
  email: 'ada@school.com',
  ...overrides,
});

const defaultProps = {
  classItem: makeClass(),
  students: [makeStudent()],
  onClose: jest.fn(),
  onAssignStudent: jest.fn().mockResolvedValue(undefined),
  onRemoveStudent: jest.fn().mockResolvedValue(undefined),
  onRefresh: jest.fn().mockResolvedValue(undefined),
  userRole: 'teacher',
  userId: 'teacher-1',
  teachers: [{ uid: 'teacher-1', displayName: 'Ms. Baker', email: 'baker@school.com' }],
};

describe('ClassDetailPanel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Initialize the mutable references
    mockGetDoc = jest.fn().mockResolvedValue({ exists: () => false, data: () => ({}) });
    mockUpdateDoc = jest.fn().mockResolvedValue(undefined);
    mockGetIdToken = jest.fn().mockResolvedValue('token-abc');

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ joinCode: 'ABC123', joinUrl: 'https://example.com/join/ABC123', expiresAt: '' }),
    });
  });

  afterEach(() => {
    delete global.fetch;
  });

  it('renders the class name in the panel header', () => {
    render(<ClassDetailPanel {...defaultProps} />);
    expect(screen.getByText('Room 12')).toBeInTheDocument();
  });

  it('renders enrolled students in the roster', () => {
    render(<ClassDetailPanel {...defaultProps} />);
    expect(screen.getByText('Ada')).toBeInTheDocument();
  });

  it('does not show students from other classes', () => {
    const otherStudent = makeStudent({ id: 'student-2', name: 'Grace', classId: 'class-2' });
    render(<ClassDetailPanel {...defaultProps} students={[makeStudent(), otherStudent]} />);
    expect(screen.queryByText('Grace')).not.toBeInTheDocument();
  });

  it('shows the class subject, student count, and teachers section', () => {
    render(<ClassDetailPanel {...defaultProps} />);
    expect(screen.getByText('Math')).toBeInTheDocument();
    expect(screen.getByText(/1 student/)).toBeInTheDocument();
    expect(screen.getByText(/Teachers/i)).toBeInTheDocument();
  });

  it('calls onClose when the close header button is clicked', () => {
    const onClose = jest.fn();
    render(<ClassDetailPanel {...defaultProps} onClose={onClose} />);
    fireEvent.click(screen.getByRole('button', { name: /close/i }));
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onClose when Escape is pressed with no sub-modals open', () => {
    const onClose = jest.fn();
    render(<ClassDetailPanel {...defaultProps} onClose={onClose} />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });

  it('locks body scroll on mount and restores on unmount', () => {
    const { unmount } = render(<ClassDetailPanel {...defaultProps} />);
    expect(document.body.style.overflow).toBe('hidden');
    unmount();
    expect(document.body.style.overflow).toBe('');
  });

  it('shows the Invite Students button for a teacher on the class', () => {
    render(<ClassDetailPanel {...defaultProps} userRole="teacher" userId="teacher-1" />);
    expect(screen.getByRole('button', { name: /invite students/i })).toBeInTheDocument();
  });

  it('shows the Message button for a teacher on the class', () => {
    render(<ClassDetailPanel {...defaultProps} userRole="teacher" userId="teacher-1" />);
    expect(screen.getByRole('button', { name: /message/i })).toBeInTheDocument();
  });

  it('does not show Message button when user is not on the class', () => {
    render(<ClassDetailPanel {...defaultProps} userId="other-teacher" />);
    expect(screen.queryByRole('button', { name: /^message$/i })).not.toBeInTheDocument();
  });

  it('shows the admin-only Assign Student dropdown', () => {
    render(<ClassDetailPanel {...defaultProps} userRole="admin" />);
    expect(screen.getByText(/assign student/i)).toBeInTheDocument();
  });

  it('does not show Assign Student dropdown for a regular teacher', () => {
    render(<ClassDetailPanel {...defaultProps} userRole="teacher" />);
    expect(screen.queryByText(/assign student/i)).not.toBeInTheDocument();
  });

  it('opens the invite modal when Invite Students is clicked', async () => {
    render(<ClassDetailPanel {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: /invite students/i }));
    expect(await screen.findByTestId('modal-wrapper')).toBeInTheDocument();
  });

  it('opens the message composer modal when Message is clicked', () => {
    render(<ClassDetailPanel {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: /message/i }));
    expect(screen.getByTestId('message-composer')).toBeInTheDocument();
  });

  it('shows an empty-state message when no students are enrolled', () => {
    render(
      <ClassDetailPanel
        {...defaultProps}
        students={[makeStudent({ classId: 'class-other' })]}
      />
    );
    expect(screen.getByText(/no students have been added/i)).toBeInTheDocument();
  });

  it('calls onRemoveStudent with correct args when Remove is clicked', async () => {
    const onRemoveStudent = jest.fn().mockResolvedValue(undefined);
    render(<ClassDetailPanel {...defaultProps} onRemoveStudent={onRemoveStudent} />);
    fireEvent.click(screen.getByRole('button', { name: /remove/i }));
    await waitFor(() => {
      expect(onRemoveStudent).toHaveBeenCalledWith(
        expect.objectContaining({ studentId: 'student-1', classId: 'class-1' })
      );
    });
  });

  it('returns null when classItem is not provided', () => {
    const { container } = render(<ClassDetailPanel {...defaultProps} classItem={null} />);
    expect(container.firstChild).toBeNull();
  });

  it('shows teacher name in the teachers list', () => {
    render(<ClassDetailPanel {...defaultProps} />);
    expect(screen.getByText('Ms. Baker')).toBeInTheDocument();
  });

  it('admin can remove a teacher when class has more than one teacher', () => {
    const twoTeacherClass = makeClass({ teacherIds: ['teacher-1', 'teacher-2'] });
    const teachers = [
      { uid: 'teacher-1', displayName: 'Ms. Baker', email: 'baker@school.com' },
      { uid: 'teacher-2', displayName: 'Mr. Smith', email: 'smith@school.com' },
    ];
    render(
      <ClassDetailPanel
        {...defaultProps}
        classItem={twoTeacherClass}
        userRole="admin"
        teachers={teachers}
      />
    );
    // Both teachers are rendered
    expect(screen.getByText('Mr. Smith')).toBeInTheDocument();
    // Each teacher gets a Remove button (admin, multiple teachers)
    const teacherRemoveButtons = screen.getAllByRole('button', { name: /^remove$/i });
    expect(teacherRemoveButtons.length).toBeGreaterThanOrEqual(2);
  });
});
