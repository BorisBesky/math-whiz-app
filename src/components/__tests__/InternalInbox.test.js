import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import InternalInbox from '../messaging/InternalInbox';

const teacherStudentRelationships = [
  {
    classId: 'class-1',
    className: 'Room 12',
    studentId: 'student-1',
    studentName: 'Ada',
    teacherId: 'teacher-1',
    teacherName: 'Ms. Baker',
  },
  {
    classId: 'class-2',
    className: 'Room 20',
    studentId: 'student-2',
    studentName: 'Grace',
    teacherId: 'teacher-1',
    teacherName: 'Ms. Baker',
  },
];

describe('InternalInbox', () => {
  it('deduplicates repeated recipient relationships in the send-to dropdown', () => {
    render(
      <InternalInbox
        currentUserId="teacher-1"
        currentUserName="Ms. Baker"
        currentUserRole="teacher"
        relationships={[
          teacherStudentRelationships[0],
          { ...teacherStudentRelationships[0] },
          {
            ...teacherStudentRelationships[0],
            classId: 'duplicate-class-id',
            studentId: 'duplicate-student-id',
          },
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

  it('deduplicates recipients when labels match after trimming/normalizing whitespace', () => {
    render(
      <InternalInbox
        currentUserId="teacher-1"
        currentUserName="Ms. Baker"
        currentUserRole="teacher"
        relationships={[
          teacherStudentRelationships[0],
          { ...teacherStudentRelationships[0], studentName: 'Ada ' },
        ]}
        recipientRole="student"
        onSend={jest.fn()}
        onMarkRead={jest.fn()}
      />
    );

    expect(screen.getAllByRole('option', { name: 'Ada · Room 12' })).toHaveLength(1);
  });

  it('deduplicates recipients when invisible formatting differs between duplicate rows', () => {
    render(
      <InternalInbox
        currentUserId="teacher-1"
        currentUserName="Ms. Baker"
        currentUserRole="teacher"
        relationships={[
          teacherStudentRelationships[0],
          { ...teacherStudentRelationships[0], studentName: 'Ada\u200b' },
        ]}
        recipientRole="student"
        onSend={jest.fn()}
        onMarkRead={jest.fn()}
      />
    );

    expect(screen.getAllByRole('option', { name: 'Ada · Room 12' })).toHaveLength(1);
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
            classId: 'class-2',
            className: 'Room 20',
            studentId: 'student-2',
            studentName: 'Grace',
            teacherId: 'teacher-1',
            teacherName: 'Ms. Baker',
            senderId: 'student-2',
            senderName: 'Grace',
            recipientId: 'teacher-1',
            readBy: ['student-2'],
          },
        ]}
      />
    );

    expect(screen.getByRole('combobox')).toHaveValue('');

    fireEvent.click(screen.getByText('Can I get help with fractions?'));

    expect(screen.getByRole('combobox')).toHaveValue('class-2:student-2:teacher-1');
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
            classId: 'class-1',
            className: 'Room 12',
            studentId: 'student-1',
            studentName: 'Ada',
            teacherId: 'teacher-1',
            teacherName: 'Ms. Baker',
            senderId: 'teacher-1',
            senderName: 'Ms. Baker',
            recipientId: 'student-1',
            readBy: ['teacher-1'],
          },
        ]}
      />
    );

    fireEvent.click(screen.getByText('Please revise problem 3.'));
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'I fixed it.' } });
    fireEvent.click(screen.getByRole('button', { name: /send message/i }));

    await waitFor(() => expect(onSend).toHaveBeenCalled());
    expect(onSend.mock.calls[0][0].recipient).toMatchObject({
      id: 'teacher-1',
      role: 'teacher',
      name: 'Ms. Baker',
    });
  });
});
