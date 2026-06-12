import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

jest.mock('../ui/ModalWrapper', () => {
  const React = require('react');
  return function MockModalWrapper({ isOpen, onClose, title, children }) {
    if (!isOpen) return null;
    return React.createElement(
      'div',
      { 'data-testid': 'modal-wrapper', 'data-title': title },
      children
    );
  };
});

const EditClassForm = require('../EditClassForm').default;

const defaultClass = {
  name: 'Room 5',
  description: 'Morning group',
  gradeLevel: 'G3',
  questionBankProbability: 0.7,
  questionMasteryThreshold: 3,
};

const renderForm = (overrides = {}) => {
  const props = {
    classData: defaultClass,
    onSubmit: jest.fn().mockResolvedValue(undefined),
    onCancel: jest.fn(),
    ...overrides,
  };
  return { ...render(<EditClassForm {...props} />), props };
};

describe('EditClassForm', () => {
  it('renders inside ModalWrapper', () => {
    renderForm();
    expect(screen.getByTestId('modal-wrapper')).toBeInTheDocument();
  });

  it('pre-populates the name field with classData', () => {
    renderForm();
    expect(screen.getByDisplayValue('Room 5')).toBeInTheDocument();
  });

  it('pre-populates the grade level with classData', () => {
    renderForm();
    expect(screen.getByDisplayValue('G3')).toBeInTheDocument();
  });

  it('shows a validation error when name is cleared and submitted', async () => {
    renderForm();
    fireEvent.change(screen.getByLabelText(/class name/i), { target: { value: '' } });
    fireEvent.submit(screen.getByRole('button', { name: /update class/i }).closest('form'));
    expect(await screen.findByText('Class name is required')).toBeInTheDocument();
  });

  it('shows a validation error when grade level is cleared and submitted', async () => {
    renderForm();
    fireEvent.change(screen.getByLabelText(/grade level/i), { target: { value: '' } });
    fireEvent.submit(screen.getByRole('button', { name: /update class/i }).closest('form'));
    expect(await screen.findByText('Grade level is required')).toBeInTheDocument();
  });

  it('clears the name validation error when the user types', async () => {
    renderForm();
    fireEvent.change(screen.getByLabelText(/class name/i), { target: { value: '' } });
    fireEvent.submit(screen.getByRole('button', { name: /update class/i }).closest('form'));
    expect(await screen.findByText('Class name is required')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(/class name/i), { target: { value: 'New Name' } });
    expect(screen.queryByText('Class name is required')).not.toBeInTheDocument();
  });

  it('calls onSubmit with the updated form data on valid submission', async () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined);
    renderForm({ onSubmit });
    fireEvent.change(screen.getByLabelText(/class name/i), { target: { value: 'Updated Name' } });
    fireEvent.submit(screen.getByRole('button', { name: /update class/i }).closest('form'));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Updated Name', gradeLevel: 'G3' })
    ));
  });

  it('includes updatedAt in the submitted data', async () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined);
    renderForm({ onSubmit });
    fireEvent.submit(screen.getByRole('button', { name: /update class/i }).closest('form'));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ updatedAt: expect.any(Date) })
    ));
  });

  it('disables the submit button while loading', async () => {
    let resolveSubmit;
    const onSubmit = jest.fn(() => new Promise((res) => { resolveSubmit = res; }));
    renderForm({ onSubmit });
    fireEvent.submit(screen.getByRole('button', { name: /update class/i }).closest('form'));
    expect(screen.getByRole('button', { name: /updating/i })).toBeDisabled();
    resolveSubmit();
    await waitFor(() => expect(screen.getByRole('button', { name: /update class/i })).not.toBeDisabled());
  });

  it('calls onCancel when the Cancel button is clicked', () => {
    const onCancel = jest.fn();
    renderForm({ onCancel });
    fireEvent.click(screen.getByRole('button', { name: /^cancel$/i }));
    expect(onCancel).toHaveBeenCalled();
  });

  it('renders G3 and G4 as grade level options', () => {
    renderForm();
    expect(screen.getByRole('option', { name: 'G3' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'G4' })).toBeInTheDocument();
  });

  it('reflects the mastery threshold from classData', () => {
    renderForm({ classData: { ...defaultClass, questionMasteryThreshold: 5 } });
    expect(screen.getByDisplayValue('5')).toBeInTheDocument();
  });
});
