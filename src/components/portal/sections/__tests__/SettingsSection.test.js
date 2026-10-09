import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

const mockUseFeatureSettings = jest.fn();
const mockUpdateFeatureSettings = jest.fn();

jest.mock('firebase/firestore', () => ({ getFirestore: () => ({ __db: true }) }));
jest.mock('../../../../hooks/useFeatureSettings', () => (...args) => mockUseFeatureSettings(...args));
jest.mock('../../../../services/featureSettings', () => ({
  updateFeatureSettings: (...args) => mockUpdateFeatureSettings(...args),
}));

// eslint-disable-next-line import/first
import SettingsSection from '../SettingsSection';

const renderSection = () => render(<SettingsSection appId="test-app" userId="admin-1" />);

describe('SettingsSection (admin feature toggles)', () => {
  beforeEach(() => {
    mockUseFeatureSettings.mockReturnValue({ settings: { aiStoryEnabled: false }, loading: false, error: null });
    mockUpdateFeatureSettings.mockResolvedValue(undefined);
  });

  it('reads the setting for the current app and shows it off', () => {
    renderSection();
    expect(mockUseFeatureSettings).toHaveBeenCalledWith({ appId: 'test-app' });
    const toggle = screen.getByRole('switch', { name: /ai story problems/i });
    expect(toggle).toHaveAttribute('aria-checked', 'false');
    expect(screen.getByText('Off')).toBeInTheDocument();
  });

  it('shows the setting on when enabled', () => {
    mockUseFeatureSettings.mockReturnValue({ settings: { aiStoryEnabled: true }, loading: false, error: null });
    renderSection();
    expect(screen.getByRole('switch', { name: /ai story problems/i })).toHaveAttribute('aria-checked', 'true');
  });

  it('writes the new value when toggled on', async () => {
    renderSection();
    fireEvent.click(screen.getByRole('switch', { name: /ai story problems/i }));
    await waitFor(() => expect(mockUpdateFeatureSettings).toHaveBeenCalledWith({
      db: { __db: true },
      appId: 'test-app',
      updates: { aiStoryEnabled: true },
      userId: 'admin-1',
    }));
    expect(await screen.findByText(/now on for students/i)).toBeInTheDocument();
  });

  it('writes false when toggled off', async () => {
    mockUseFeatureSettings.mockReturnValue({ settings: { aiStoryEnabled: true }, loading: false, error: null });
    renderSection();
    fireEvent.click(screen.getByRole('switch', { name: /ai story problems/i }));
    await waitFor(() => expect(mockUpdateFeatureSettings).toHaveBeenCalledWith(
      expect.objectContaining({ updates: { aiStoryEnabled: false } })
    ));
  });

  it('shows an error when saving fails (e.g. non-admin rejected by rules)', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    mockUpdateFeatureSettings.mockRejectedValue(new Error('Missing or insufficient permissions.'));
    renderSection();
    fireEvent.click(screen.getByRole('switch', { name: /ai story problems/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/insufficient permissions/i);
    console.error.mockRestore();
  });

  it('warns and shows off when the setting cannot be read', () => {
    mockUseFeatureSettings.mockReturnValue({
      settings: { aiStoryEnabled: false }, loading: false, error: new Error('permission-denied'),
    });
    renderSection();
    expect(screen.getByText(/treated as off/i)).toBeInTheDocument();
    expect(screen.getByRole('switch', { name: /ai story problems/i })).toHaveAttribute('aria-checked', 'false');
  });

  it('shows a loading row while the setting loads', () => {
    mockUseFeatureSettings.mockReturnValue({ settings: { aiStoryEnabled: false }, loading: true, error: null });
    renderSection();
    expect(screen.getByText(/loading settings/i)).toBeInTheDocument();
    expect(screen.queryByRole('switch')).not.toBeInTheDocument();
  });
});
