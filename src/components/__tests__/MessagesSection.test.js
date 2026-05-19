import React from 'react';
import { render, screen } from '@testing-library/react';

// Mock the hooks before importing the component
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
  useTeacherStudentRelationships: jest.fn(() => ({
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
        <span data-testid="inbox-loading">{String(props.loading)}</span>
        {props.error && <span data-testid="inbox-error">{props.error}</span>}
      </div>
    );
  };
});

const useInternalMessages = require('../../hooks/useInternalMessages').default;
const { useTeacherStudentRelationships } = require('../../hooks/useInternalMessages');

const MessagesSection = require('../messaging/../../components/portal/sections/MessagesSection').default;

const baseUser = { uid: 'teacher-1', displayName: 'Ms. Baker', email: 'baker@school.com' };
const baseClasses = [{ id: 'class-1', name: 'Room 12', teacherIds: ['teacher-1'] }];

describe('MessagesSection', () => {
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
    useTeacherStudentRelationships.mockReturnValue({
      relationships: [],
      loading: false,
      error: null,
    });
  });

  it('renders InternalInbox for a teacher', () => {
    render(
      <MessagesSection
        appId="app-1"
        user={baseUser}
        userRole="teacher"
        classes={baseClasses}
      />
    );
    expect(screen.getByTestId('internal-inbox')).toBeInTheDocument();
    expect(screen.getByTestId('inbox-role').textContent).toBe('teacher');
    expect(screen.getByTestId('recipient-role').textContent).toBe('student');
  });

  it('renders InternalInbox with admin role', () => {
    render(
      <MessagesSection
        appId="app-1"
        user={baseUser}
        userRole="admin"
        classes={baseClasses}
      />
    );
    expect(screen.getByTestId('inbox-role').textContent).toBe('admin');
  });

  it('passes loading=true while hooks are still loading', () => {
    useInternalMessages.mockReturnValue({
      messages: [],
      loading: true,
      error: null,
      sendMessage: jest.fn(),
      markRead: jest.fn(),
    });
    useTeacherStudentRelationships.mockReturnValue({
      relationships: [],
      loading: false,
      error: null,
    });

    render(
      <MessagesSection
        appId="app-1"
        user={baseUser}
        userRole="teacher"
        classes={baseClasses}
      />
    );
    expect(screen.getByTestId('inbox-loading').textContent).toBe('true');
  });

  it('passes loading=true when relationships are loading', () => {
    useInternalMessages.mockReturnValue({
      messages: [],
      loading: false,
      error: null,
      sendMessage: jest.fn(),
      markRead: jest.fn(),
    });
    useTeacherStudentRelationships.mockReturnValue({
      relationships: [],
      loading: true,
      error: null,
    });

    render(
      <MessagesSection
        appId="app-1"
        user={baseUser}
        userRole="teacher"
        classes={baseClasses}
      />
    );
    expect(screen.getByTestId('inbox-loading').textContent).toBe('true');
  });

  it('forwards a relationships error to InternalInbox', () => {
    useTeacherStudentRelationships.mockReturnValue({
      relationships: [],
      loading: false,
      error: 'Failed to load relationships',
    });

    render(
      <MessagesSection
        appId="app-1"
        user={baseUser}
        userRole="teacher"
        classes={baseClasses}
      />
    );
    expect(screen.getByTestId('inbox-error').textContent).toBe('Failed to load relationships');
  });

  it('forwards a messages error to InternalInbox', () => {
    useInternalMessages.mockReturnValue({
      messages: [],
      loading: false,
      error: 'Failed to load messages',
      sendMessage: jest.fn(),
      markRead: jest.fn(),
    });

    render(
      <MessagesSection
        appId="app-1"
        user={baseUser}
        userRole="teacher"
        classes={baseClasses}
      />
    );
    expect(screen.getByTestId('inbox-error').textContent).toBe('Failed to load messages');
  });

  it('passes the user uid as currentUserId', () => {
    const { useTeacherStudentRelationships: mockRelHook } = require('../../hooks/useInternalMessages');
    render(
      <MessagesSection
        appId="app-1"
        user={baseUser}
        userRole="teacher"
        classes={baseClasses}
      />
    );
    // useInternalMessages should be called with the user's uid
    expect(useInternalMessages).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'teacher-1' })
    );
  });

  it('uses null teacherId for admin (include all teachers)', () => {
    render(
      <MessagesSection
        appId="app-1"
        user={baseUser}
        userRole="admin"
        classes={baseClasses}
      />
    );
    expect(useTeacherStudentRelationships).toHaveBeenCalledWith(
      expect.objectContaining({ teacherId: null, includeAllTeachers: true })
    );
  });

  it('renders without error when user is null', () => {
    render(
      <MessagesSection
        appId="app-1"
        user={null}
        userRole="teacher"
        classes={[]}
      />
    );
    expect(screen.getByTestId('internal-inbox')).toBeInTheDocument();
  });
});
