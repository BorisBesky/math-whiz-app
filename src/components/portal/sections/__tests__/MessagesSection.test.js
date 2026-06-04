import React from 'react';
import { render, screen } from '@testing-library/react';

// Mock the hooks before importing the component
const mockSendMessage = jest.fn();
const mockMarkRead = jest.fn();

jest.mock('../../../../hooks/useInternalMessages', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    messages: [],
    loading: false,
    error: null,
    sendMessage: mockSendMessage,
    markRead: mockMarkRead,
  })),
  useTeacherStudentRelationships: jest.fn(() => ({
    relationships: [],
    loading: false,
    error: null,
  })),
}));

jest.mock('../../../messaging/InternalInbox', () => {
  const React = require('react');
  return function MockInternalInbox(props) {
    return React.createElement('div', { 'data-testid': 'internal-inbox' },
      React.createElement('span', { 'data-testid': 'inbox-title' }, props.title),
      React.createElement('span', { 'data-testid': 'inbox-role' }, props.currentUserRole),
      React.createElement('span', { 'data-testid': 'inbox-loading' }, String(props.loading)),
      props.error && React.createElement('span', { 'data-testid': 'inbox-error' }, props.error),
    );
  };
});

const useInternalMessages = require('../../../../hooks/useInternalMessages');
const MessagesSection = require('../MessagesSection').default;

const baseUser = { uid: 'teacher-1', displayName: 'Ms. Baker', email: 'baker@school.com' };

const renderSection = (overrides = {}) =>
  render(
    React.createElement(MessagesSection, {
      appId: 'test-app',
      user: baseUser,
      userRole: 'teacher',
      classes: [],
      ...overrides,
    })
  );

describe('MessagesSection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useInternalMessages.default.mockReturnValue({
      messages: [],
      loading: false,
      error: null,
      sendMessage: mockSendMessage,
      markRead: mockMarkRead,
    });
    useInternalMessages.useTeacherStudentRelationships.mockReturnValue({
      relationships: [],
      loading: false,
      error: null,
    });
  });

  test('renders InternalInbox with the correct title', () => {
    renderSection();
    expect(screen.getByTestId('internal-inbox')).toBeInTheDocument();
    expect(screen.getByTestId('inbox-title')).toHaveTextContent('Student Messages');
  });

  test('passes "teacher" role for a teacher user', () => {
    renderSection({ userRole: 'teacher' });
    expect(screen.getByTestId('inbox-role')).toHaveTextContent('teacher');
  });

  test('passes "admin" role for an admin user', () => {
    renderSection({ userRole: 'admin' });
    expect(screen.getByTestId('inbox-role')).toHaveTextContent('admin');
  });

  test('shows loading state when messages are loading', () => {
    useInternalMessages.default.mockReturnValue({
      messages: [],
      loading: true,
      error: null,
      sendMessage: mockSendMessage,
      markRead: mockMarkRead,
    });
    renderSection();
    expect(screen.getByTestId('inbox-loading')).toHaveTextContent('true');
  });

  test('shows loading state when relationships are loading', () => {
    useInternalMessages.useTeacherStudentRelationships.mockReturnValue({
      relationships: [],
      loading: true,
      error: null,
    });
    renderSection();
    expect(screen.getByTestId('inbox-loading')).toHaveTextContent('true');
  });

  test('passes message error to InternalInbox', () => {
    useInternalMessages.default.mockReturnValue({
      messages: [],
      loading: false,
      error: 'Failed to load messages',
      sendMessage: mockSendMessage,
      markRead: mockMarkRead,
    });
    renderSection();
    expect(screen.getByTestId('inbox-error')).toHaveTextContent('Failed to load messages');
  });

  test('passes relationships error to InternalInbox', () => {
    useInternalMessages.useTeacherStudentRelationships.mockReturnValue({
      relationships: [],
      loading: false,
      error: 'Failed to load relationships',
    });
    renderSection();
    expect(screen.getByTestId('inbox-error')).toHaveTextContent('Failed to load relationships');
  });

  test('initializes hooks with enabled=false when user uid is missing', () => {
    renderSection({ user: { displayName: 'Ghost' } }); // no uid
    expect(useInternalMessages.default).toHaveBeenCalledWith(
      expect.objectContaining({ enabled: false })
    );
  });

  test('initializes useInternalMessages with the correct appId and userId', () => {
    renderSection();
    expect(useInternalMessages.default).toHaveBeenCalledWith(
      expect.objectContaining({ appId: 'test-app', userId: 'teacher-1' })
    );
  });

  test('admin role passes includeAllTeachers=true to useTeacherStudentRelationships', () => {
    renderSection({ userRole: 'admin' });
    expect(useInternalMessages.useTeacherStudentRelationships).toHaveBeenCalledWith(
      expect.objectContaining({ includeAllTeachers: true })
    );
  });

  test('teacher role does not pass includeAllTeachers=true', () => {
    renderSection({ userRole: 'teacher' });
    expect(useInternalMessages.useTeacherStudentRelationships).toHaveBeenCalledWith(
      expect.objectContaining({ includeAllTeachers: false })
    );
  });
});
