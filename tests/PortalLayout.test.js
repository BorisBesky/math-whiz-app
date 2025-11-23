import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import PortalLayout from '../src/components/portal/PortalLayout';

describe('PortalLayout', () => {
  it('calls onLogout when Sign out button is clicked', () => {
    const onLogout = jest.fn();
    const sections = [{ id: 'overview', label: 'Overview', icon: null, render: () => <div>Overview</div> }];
    render(
      <PortalLayout
        sections={sections}
        activeSectionId="overview"
        onSectionChange={() => {}}
        user={{ displayName: 'Test User', email: 'test@example.com' }}
        roleLabel="Teacher"
        onLogout={onLogout}
      >
        <div>Child content</div>
      </PortalLayout>
    );

    const signOutButton = screen.getByRole('button', { name: /sign out/i });
    fireEvent.click(signOutButton);
    expect(onLogout).toHaveBeenCalled();
  });
});

export {};
