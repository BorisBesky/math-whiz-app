import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import InternalInbox from '../messaging/InternalInbox';

const teacherStudentRelationships = [
  {
    enrollmentId: 'class-1__student-1',
    classId: 'class-1',
    className: 'Room 12',
    studentId: 'student-1',
    studentName: 'Ada',
    teacherId: 'teacher-1',
    teacherName: 'Ms. Baker',
  },
  {
    enrollmentId: 'class-2__student-2',
    classId: 'class-2',
    className: 'Room 20',
    studentId: 'student-2',
    studentName: 'Grace',
    teacherId: 'teacher-1',
    teacherName: 'Ms. Baker',
  },
];

describe('InternalInbox', () => {
  it('renders one option per enrollmentId, even with duplicate input rows', () => {
    render(
      <InternalInbox
        currentUserId="teacher-1"
        currentUserName="Ms. Baker"
        currentUserRole="teacher"
        relationships={[
          teacherStudentRelationships[0],
          { ...teacherStudentRelationships[0] },
          teacherStudentRelationships[1],
        ]}
        recipientRole="student"
        onSend={jest.fn()}
        onMarkRead={jest.fn()}
      />
    );

    expect(screen.getAllByRole('option', { name: 'Ada · Room 12' })).toHaveLength(1);
    expect(screen.getAllByRole('option', { name: 'Grace · Room 20' })).toHaveLength(1);
  });

  it('selects the sender relationship and marks an unread message read when a teacher opens it', () => {
    const onMarkRead = jest.fn();

    render(
      <InternalInbox
        currentUserId="teacher-1"
        currentUserName="Ms. Baker"
        currentUserRole="teacher"
        relationships={teacherStudentRelationships}
        recipientRole="student"
        onSend={jest.fn()}
        onMarkRead={onMarkRead}
        messages={[
          {
            id: 'message-1',
            body: 'Can I get help with fractions?',
            enrollmentId: 'class-2__student-2',
            className: 'Room 20',
            senderId: 'student-2',
            senderName: 'Grace',
            recipientId: 'teacher-1',
            recipientName: 'Ms. Baker',
            readBy: ['student-2'],
          },
        ]}
      />
    );

    expect(screen.getByRole('combobox')).toHaveValue('');

    fireEvent.click(screen.getByText('Can I get help with fractions?'));

    expect(screen.getByRole('combobox')).toHaveValue('class-2__student-2::teacher-1');
    expect(onMarkRead).toHaveBeenCalledWith('message-1');
  });

  it('selects a teacher as the reply recipient for student inbox messages', async () => {
    const onSend = jest.fn().mockResolvedValue(undefined);

    render(
      <InternalInbox
        currentUserId="student-1"
        currentUserName="Ada"
        currentUserRole="student"
        relationships={[teacherStudentRelationships[0]]}
        recipientRole="teacher"
        onSend={onSend}
        onMarkRead={jest.fn()}
        messages={[
          {
            id: 'message-2',
            body: 'Please revise problem 3.',
            enrollmentId: 'class-1__student-1',
            className: 'Room 12',
            senderId: 'teacher-1',
            senderName: 'Ms. Baker',
            recipientId: 'student-1',
            recipientName: 'Ada',
            readBy: ['teacher-1'],
          },
        ]}
      />
    );

    fireEvent.click(screen.getByText('Please revise problem 3.'));

    await waitFor(() => {
      expect(screen.getByRole('combobox')).toHaveValue('class-1__student-1::teacher-1');
    });

    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'I fixed it.' } });
    fireEvent.click(screen.getByRole('button', { name: /send message/i }));

    await waitFor(() => expect(onSend).toHaveBeenCalled());
    const sentArgs = onSend.mock.calls[0][0];
    expect(sentArgs.enrollmentId).toBe('class-1__student-1');
    expect(sentArgs.recipient).toMatchObject({
      id: 'teacher-1',
      role: 'teacher',
      name: 'Ms. Baker',
    });
  });

  it('falls back to legacy {classId, studentId} fields when message lacks enrollmentId', () => {
    render(
      <InternalInbox
        currentUserId="teacher-1"
        currentUserName="Ms. Baker"
        currentUserRole="teacher"
        relationships={teacherStudentRelationships}
        recipientRole="student"
        onSend={jest.fn()}
        onMarkRead={jest.fn()}
        messages={[
          {
            id: 'legacy-1',
            body: 'Older message',
            classId: 'class-1',
            studentId: 'student-1',
            senderId: 'student-1',
            senderName: 'Ada',
            recipientId: 'teacher-1',
            readBy: ['student-1'],
          },
        ]}
      />
    );

    fireEvent.click(screen.getByText('Older message'));
    expect(screen.getByRole('combobox')).toHaveValue('class-1__student-1::teacher-1');
  });
});
