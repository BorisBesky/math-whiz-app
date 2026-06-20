import React from 'react';
import { render, screen } from '@testing-library/react';

jest.mock('../../utils/common_utils', () => ({
  getAppId: jest.fn(() => 'app-test'),
}));

jest.mock('../../hooks/useInternalMessages', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    messages: [],
    loading: false,
    error: null,
    sendMessage: jest.fn(),
    markRead: jest.fn(),
    unreadCount: 0,
  })),
  useStudentTeacherRelationships: jest.fn(() => ({
    relationships: [],
    loading: false,
    error: null,
  })),
}));

jest.mock('../messaging/InternalInbox', () => {
  const React = require('react');
  return function MockInternalInbox(props) {
    return (
      <div data-testid="internal-inbox">
        <span data-testid="inbox-role">{props.currentUserRole}</span>
        <span data-testid="inbox-title">{props.title}</span>
        <span data-testid="recipient-role">{props.recipientRole}</span>
        <span data-testid="current-user-name">{props.currentUserName}</span>
        <span data-testid="inbox-loading">{String(props.loading)}</span>
        {props.error && <span data-testid="inbox-error">{props.error}</span>}
      </div>
    );
  };
});

const useInternalMessages = require('../../hooks/useInternalMessages').default;
const { useStudentTeacherRelationships } = require('../../hooks/useInternalMessages');
const StudentInbox = require('../messaging/StudentInbox').default;

const baseUser = { uid: 'student-1', displayName: 'Ada', email: 'ada@school.com' };
const baseUserData = { displayName: 'Ada Lovelace' };

describe('StudentInbox', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useInternalMessages.mockReturnValue({
      messages: [],
      loading: false,
      error: null,
      sendMessage: jest.fn(),
      markRead: jest.fn(),
      unreadCount: 0,
    });
    useStudentTeacherRelationships.mockReturnValue({
      relationships: [],
      loading: false,
      error: null,
    });
  });

  it('renders InternalInbox with student role', () => {
    render(<StudentInbox user={baseUser} userData={baseUserData} />);
    expect(screen.getByTestId('internal-inbox')).toBeInTheDocument();
    expect(screen.getByTestId('inbox-role').textContent).toBe('student');
  });

  it('leaves room above the inbox for the fixed app header', () => {
    render(<StudentInbox user={baseUser} userData={baseUserData} />);
    expect(screen.getByTestId('internal-inbox').parentElement).toHaveClass('mt-16');
  });

  it('sets recipientRole to teacher', () => {
    render(<StudentInbox user={baseUser} userData={baseUserData} />);
    expect(screen.getByTestId('recipient-role').textContent).toBe('teacher');
  });

  it('prefers userData.displayName for currentUserName', () => {
    render(<StudentInbox user={baseUser} userData={baseUserData} />);
    expect(screen.getByTestId('current-user-name').textContent).toBe('Ada Lovelace');
  });

  it('falls back to user.displayName when userData has no displayName', () => {
    render(<StudentInbox user={baseUser} userData={{}} />);
    expect(screen.getByTestId('current-user-name').textContent).toBe('Ada');
  });

  it('falls back to user.email when displayName is absent', () => {
    render(<StudentInbox user={{ uid: 'student-1', email: 'ada@school.com' }} userData={{}} />);
    expect(screen.getByTestId('current-user-name').textContent).toBe('ada@school.com');
  });

  it('passes loading=true while messages are loading', () => {
    useInternalMessages.mockReturnValue({
      messages: [],
      loading: true,
      error: null,
      sendMessage: jest.fn(),
      markRead: jest.fn(),
    });
    render(<StudentInbox user={baseUser} userData={baseUserData} />);
    expect(screen.getByTestId('inbox-loading').textContent).toBe('true');
  });

  it('passes loading=true while relationships are loading', () => {
    useStudentTeacherRelationships.mockReturnValue({
      relationships: [],
      loading: true,
      error: null,
    });
    render(<StudentInbox user={baseUser} userData={baseUserData} />);
    expect(screen.getByTestId('inbox-loading').textContent).toBe('true');
  });

  it('forwards error to InternalInbox', () => {
    useInternalMessages.mockReturnValue({
      messages: [],
      loading: false,
      error: 'Permission denied',
      sendMessage: jest.fn(),
      markRead: jest.fn(),
    });
    render(<StudentInbox user={baseUser} userData={baseUserData} />);
    expect(screen.getByTestId('inbox-error').textContent).toBe('Permission denied');
  });

  it('calls useStudentTeacherRelationships with the student uid', () => {
    render(<StudentInbox user={baseUser} userData={baseUserData} />);
    expect(useStudentTeacherRelationships).toHaveBeenCalledWith(
      expect.objectContaining({ studentId: 'student-1' })
    );
  });

  it('calls useInternalMessages with enabled=false when user is null', () => {
    render(<StudentInbox user={null} userData={null} />);
    expect(useInternalMessages).toHaveBeenCalledWith(
      expect.objectContaining({ enabled: false })
    );
  });
});
