import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

jest.mock('../../../../hooks/useConfirmation', () => ({
  __esModule: true,
  default: () => ({ confirmationProps: {}, confirm: jest.fn().mockResolvedValue(true) }),
}));

jest.mock('../../../ui/ConfirmationModal', () => ({
  __esModule: true,
  default: () => null,
}));

// Prevent ClassDetailPanel from opening a full panel in these tests
jest.mock('../ClassDetailPanel', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: function MockClassDetailPanel({ classItem, onClose, onEditClass, showEditForm, setShowEditForm }) {
      return React.createElement(
        'div',
        { 'data-testid': 'class-detail-panel' },
        React.createElement('span', null, classItem?.name),
        React.createElement('button', { onClick: onClose }, 'Close'),
        typeof onEditClass === 'function' &&
          React.createElement(
            'button',
            { onClick: () => setShowEditForm(true) },
            'Open Edit Form'
          ),
        showEditForm &&
          React.createElement(
            'button',
            {
              onClick: async () => {
                try {
                  await onEditClass({ name: 'Updated', gradeLevel: 'G4' });
                } catch (_) {
                  // allow ClassesSection to display actionError via setActionError
                }
              },
            },
            'Submit Edit'
          ),
      );
    },
  };
});

jest.mock('../../../CreateClassForm', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: function MockCreateClassForm({ onSubmit, onCancel }) {
      return React.createElement(
        'div',
        { 'data-testid': 'create-class-form' },
        React.createElement('button', { onClick: () => onSubmit({ name: 'New Class', gradeLevel: 'G3' }) }, 'Create'),
        React.createElement('button', { onClick: onCancel }, 'Cancel'),
      );
    },
  };
});

const ClassesSection = require('../ClassesSection').default;

const makeClass = (overrides = {}) => ({
  id: 'class-1',
  name: 'Room 12',
  subject: 'Math',
  gradeLevel: 'G3',
  teacherIds: ['teacher-1'],
  teacherEmail: 'baker@school.com',
  ...overrides,
});

const defaultProps = {
  classes: [makeClass()],
  classCounts: { 'class-1': 3 },
  loading: false,
  error: null,
  userRole: 'teacher',
  userId: 'teacher-1',
  teachers: [{ uid: 'teacher-1', displayName: 'Ms. Baker', email: 'baker@school.com' }],
  onCreateClass: jest.fn().mockResolvedValue(undefined),
  onUpdateClass: jest.fn().mockResolvedValue(undefined),
  onDeleteClass: jest.fn().mockResolvedValue(undefined),
  students: [],
  onAssignStudent: jest.fn(),
  onRemoveStudent: jest.fn(),
  onRefreshStudents: jest.fn(),
};

describe('ClassesSection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders a class card with name and student count', () => {
    render(<ClassesSection {...defaultProps} />);
    expect(screen.getByText('Room 12')).toBeInTheDocument();
    expect(screen.getByText(/3 students/i)).toBeInTheDocument();
  });

  it('shows the loading spinner when loading is true', () => {
    render(<ClassesSection {...defaultProps} loading={true} classes={[]} />);
    expect(screen.getByText(/loading classes/i)).toBeInTheDocument();
  });

  it('shows the empty state message for a teacher with no classes', () => {
    render(<ClassesSection {...defaultProps} classes={[]} />);
    expect(screen.getByText(/no classes yet/i)).toBeInTheDocument();
  });

  it('shows the New Class button for teachers', () => {
    render(<ClassesSection {...defaultProps} />);
    expect(screen.getByRole('button', { name: /new class/i })).toBeInTheDocument();
  });

  it('does not show the New Class button when onCreateClass is not provided', () => {
    render(<ClassesSection {...defaultProps} onCreateClass={undefined} />);
    expect(screen.queryByRole('button', { name: /new class/i })).not.toBeInTheDocument();
  });

  it('renders the error message when error prop is set', () => {
    render(<ClassesSection {...defaultProps} error="Failed to load" />);
    expect(screen.getByText('Failed to load')).toBeInTheDocument();
  });

  it('opens the create class form when New Class is clicked', () => {
    render(<ClassesSection {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: /new class/i }));
    expect(screen.getByTestId('create-class-form')).toBeInTheDocument();
  });

  it('closes the create class form after successful submission', async () => {
    render(<ClassesSection {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: /new class/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Create' }));
    await waitFor(() => expect(screen.queryByTestId('create-class-form')).not.toBeInTheDocument());
  });

  it('hides the create form when Cancel is clicked', () => {
    render(<ClassesSection {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: /new class/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByTestId('create-class-form')).not.toBeInTheDocument();
  });

  it('opens the ClassDetailPanel when "View details" is clicked', () => {
    render(<ClassesSection {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: /view details/i }));
    expect(screen.getByTestId('class-detail-panel')).toBeInTheDocument();
    expect(screen.getAllByText('Room 12').length).toBeGreaterThanOrEqual(1);
  });

  it('closes the ClassDetailPanel when onClose is called', () => {
    render(<ClassesSection {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: /view details/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(screen.queryByTestId('class-detail-panel')).not.toBeInTheDocument();
  });

  it('passes onEditClass handler to ClassDetailPanel when onUpdateClass is provided', () => {
    render(<ClassesSection {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: /view details/i }));
    expect(screen.getByRole('button', { name: 'Open Edit Form' })).toBeInTheDocument();
  });

  it('does not pass onEditClass when onUpdateClass is not provided', () => {
    render(<ClassesSection {...defaultProps} onUpdateClass={undefined} />);
    fireEvent.click(screen.getByRole('button', { name: /view details/i }));
    expect(screen.queryByRole('button', { name: 'Open Edit Form' })).not.toBeInTheDocument();
  });

  it('calls onUpdateClass when edit is submitted from the detail panel', async () => {
    const onUpdateClass = jest.fn().mockResolvedValue(undefined);
    render(<ClassesSection {...defaultProps} onUpdateClass={onUpdateClass} />);
    fireEvent.click(screen.getByRole('button', { name: /view details/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Open Edit Form' }));
    fireEvent.click(screen.getByRole('button', { name: 'Submit Edit' }));
    await waitFor(() => expect(onUpdateClass).toHaveBeenCalledWith('class-1', { name: 'Updated', gradeLevel: 'G4' }));
  });

  it('shows an action error when onUpdateClass throws', async () => {
    const onUpdateClass = jest.fn().mockRejectedValue(new Error('Update failed'));
    render(<ClassesSection {...defaultProps} onUpdateClass={onUpdateClass} />);
    fireEvent.click(screen.getByRole('button', { name: /view details/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Open Edit Form' }));
    fireEvent.click(screen.getByRole('button', { name: 'Submit Edit' }));
    expect(await screen.findByText('Update failed')).toBeInTheDocument();
  });

  it('sorts class cards alphabetically by name', () => {
    const classes = [
      makeClass({ id: 'b', name: 'Zoo Class' }),
      makeClass({ id: 'a', name: 'Alpha Class' }),
    ];
    render(<ClassesSection {...defaultProps} classes={classes} classCounts={{}} />);
    const names = screen.getAllByRole('heading', { level: 4 }).map((el) => el.textContent);
    expect(names[0]).toBe('Alpha Class');
    expect(names[1]).toBe('Zoo Class');
  });

  it('shows admin teacher email column for admin role', () => {
    render(<ClassesSection {...defaultProps} userRole="admin" />);
    expect(screen.getByText(/baker@school\.com/i)).toBeInTheDocument();
  });
});
