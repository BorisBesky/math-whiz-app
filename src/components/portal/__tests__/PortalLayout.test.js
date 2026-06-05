import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import PortalLayout from '../PortalLayout';

const mockSections = [
  { id: 'overview', label: 'Overview', description: 'Dashboard overview', icon: null },
  { id: 'students', label: 'Students', description: 'Manage students', icon: null },
  { id: 'messages', label: 'Messages', description: 'Internal messages', icon: null },
];

const renderLayout = (overrides = {}) => {
  const props = {
    sections: mockSections,
    activeSectionId: 'overview',
    onSectionChange: jest.fn(),
    user: { displayName: 'Test User', email: 'test@example.com' },
    roleLabel: 'Teacher',
    onLogout: jest.fn(),
    children: <div>Child content</div>,
    ...overrides,
  };
  return { props, ...render(<PortalLayout {...props} />) };
};

describe('PortalLayout', () => {
  it('calls onLogout when Sign out button is clicked', () => {
    const onLogout = jest.fn();
    renderLayout({ onLogout });
    fireEvent.click(screen.getByRole('button', { name: /sign out/i }));
    expect(onLogout).toHaveBeenCalled();
  });

  it('renders the active section label in the header', () => {
    renderLayout({ activeSectionId: 'students' });
    const headings = screen.getAllByText('Students');
    expect(headings.length).toBeGreaterThanOrEqual(1);
  });

  it('renders the active section description in the header', () => {
    renderLayout({ activeSectionId: 'students' });
    expect(screen.getByText('Manage students')).toBeInTheDocument();
  });

  it('renders roleLabel in the sidebar and header', () => {
    renderLayout({ roleLabel: 'Admin' });
    const instances = screen.getAllByText('Admin');
    expect(instances.length).toBeGreaterThanOrEqual(1);
  });

  it('renders the user display name and email', () => {
    renderLayout({ user: { displayName: 'Jane Doe', email: 'jane@example.com' } });
    expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    expect(screen.getAllByText('jane@example.com').length).toBeGreaterThanOrEqual(1);
  });

  it('falls back to email when displayName is absent', () => {
    renderLayout({ user: { email: 'noname@example.com' } });
    const matches = screen.getAllByText('noname@example.com');
    expect(matches.length).toBeGreaterThanOrEqual(1);
  });

  it('renders all section labels in the sidebar', () => {
    renderLayout();
    expect(screen.getAllByText('Overview').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Students').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Messages').length).toBeGreaterThanOrEqual(1);
  });

  it('calls onSectionChange when a sidebar nav button is clicked', () => {
    const onSectionChange = jest.fn();
    renderLayout({ onSectionChange });
    // Find the sidebar nav buttons (aside > nav > button)
    const sidebarButtons = screen.getAllByRole('button', { name: /students/i });
    fireEvent.click(sidebarButtons[0]);
    expect(onSectionChange).toHaveBeenCalledWith('students');
  });

  it('collapses and expands the desktop sidebar', () => {
    renderLayout();

    expect(screen.getByText('Workspace')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /collapse portal sidebar/i }));

    expect(screen.queryByText('Workspace')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Overview', current: 'page' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /expand portal sidebar/i }));

    expect(screen.getByText('Workspace')).toBeInTheDocument();
  });

  it('marks the active section with aria-current="page"', () => {
    renderLayout({ activeSectionId: 'overview' });
    const currentButton = screen.getByRole('button', { name: 'Overview', current: 'page' });
    expect(currentButton).toBeInTheDocument();
  });

  it('renders the mobile section select and calls onSectionChange on change', () => {
    const onSectionChange = jest.fn();
    renderLayout({ onSectionChange });
    const selects = screen.getAllByRole('combobox');
    expect(selects.length).toBeGreaterThanOrEqual(1);
    fireEvent.change(selects[0], { target: { value: 'messages' } });
    expect(onSectionChange).toHaveBeenCalledWith('messages');
  });

  it('renders children in the main content area', () => {
    renderLayout({ children: <div>Unique child content</div> });
    expect(screen.getByText('Unique child content')).toBeInTheDocument();
  });
});

export {};
