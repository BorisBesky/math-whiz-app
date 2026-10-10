import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

const mockAuthValue = {};
jest.mock('../../../contexts/AuthContext', () => ({ useAuth: () => mockAuthValue }));
jest.mock('../../../hooks/useInternalMessages', () => ({ useUnreadMessageCount: () => 0 }));

// eslint-disable-next-line import/first
import GuestUpgradeModal from '../GuestUpgradeModal';
// eslint-disable-next-line import/first
import GuestSaveBanner from '../GuestSaveBanner';
// eslint-disable-next-line import/first
import AppHeader from '../../AppHeader';

const setAuth = (overrides = {}) => Object.assign(mockAuthValue, {
  saveGuestWithGoogle: jest.fn(),
  saveGuestWithEmail: jest.fn(),
  signInAndMergeGuest: jest.fn(),
  retryGuestMerge: jest.fn(),
  ...overrides,
});

beforeEach(() => {
  window.localStorage.clear();
  setAuth();
});

describe('GuestUpgradeModal', () => {
  const renderModal = (props = {}) => render(<GuestUpgradeModal open onClose={jest.fn()} {...props} />);

  test('offers Google and email', () => {
    renderModal();
    expect(screen.getByRole('dialog')).toHaveTextContent(/playing as a guest/i);
    expect(screen.getByRole('button', { name: /continue with google/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create account with email/i })).toBeInTheDocument();
  });

  test('Google upgrade in place shows the saved confirmation', async () => {
    const onSaved = jest.fn();
    mockAuthValue.saveGuestWithGoogle.mockResolvedValue({ user: { uid: 'g' }, linkedGuest: true });
    renderModal({ onSaved });
    fireEvent.click(screen.getByRole('button', { name: /continue with google/i }));
    expect(await screen.findByText(/everything you earned as a guest is saved/i)).toBeInTheDocument();
    expect(onSaved).toHaveBeenCalledWith('linked');
  });

  test('email upgrade passes name, email and password', async () => {
    mockAuthValue.saveGuestWithEmail.mockResolvedValue({ user: {}, linkedGuest: true });
    renderModal();
    fireEvent.change(screen.getByLabelText(/your name/i), { target: { value: 'Kid' } });
    fireEvent.change(screen.getByLabelText(/^email$/i), { target: { value: 'kid@example.com' } });
    fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: 'secret1' } });
    fireEvent.click(screen.getByRole('button', { name: /create account with email/i }));
    await screen.findByText(/progress saved/i);
    expect(mockAuthValue.saveGuestWithEmail).toHaveBeenCalledWith({ email: 'kid@example.com', password: 'secret1', displayName: 'Kid' });
  });

  test('short passwords are caught before calling Firebase', async () => {
    renderModal();
    fireEvent.change(screen.getByLabelText(/^email$/i), { target: { value: 'kid@example.com' } });
    fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: '123' } });
    fireEvent.click(screen.getByRole('button', { name: /create account with email/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/at least 6/);
    expect(mockAuthValue.saveGuestWithEmail).not.toHaveBeenCalled();
  });

  test('existing email: explains, prefills the password, and signs in + merges', async () => {
    mockAuthValue.saveGuestWithEmail.mockResolvedValue({ existingAccount: { method: 'password', email: 'sam@example.com' } });
    mockAuthValue.signInAndMergeGuest.mockResolvedValue({ merged: true });
    renderModal();
    fireEvent.change(screen.getByLabelText(/^email$/i), { target: { value: 'sam@example.com' } });
    fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: 'secret1' } });
    fireEvent.click(screen.getByRole('button', { name: /create account with email/i }));
    expect(await screen.findByText(/already has a math whiz account/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password for that account/i)).toHaveValue('secret1');
    fireEvent.click(screen.getByRole('button', { name: /sign in and move my progress/i }));
    expect(await screen.findByText(/guest progress was added to your account/i)).toBeInTheDocument();
    expect(mockAuthValue.signInAndMergeGuest).toHaveBeenCalledWith({ method: 'password', email: 'sam@example.com' }, { password: 'secret1' });
  });

  test('existing Google account (e.g. after a redirect) opens straight on the merge step', async () => {
    const existing = { method: 'google', credential: { t: 1 }, email: 'sam@gmail.com' };
    mockAuthValue.signInAndMergeGuest.mockResolvedValue({ merged: true });
    renderModal({ initialExistingAccount: existing });
    expect(screen.getByText('sam@gmail.com')).toBeInTheDocument();
    expect(screen.queryByLabelText(/password for that account/i)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /sign in and move my progress/i }));
    await screen.findByText(/progress saved/i);
    expect(mockAuthValue.signInAndMergeGuest).toHaveBeenCalledWith(existing, { password: '' });
  });

  test('a failed merge shows the error and a retry button', async () => {
    mockAuthValue.signInAndMergeGuest.mockRejectedValue(Object.assign(new Error('We couldn’t finish moving your guest progress. Please try again.'), { code: 'guest/merge-failed' }));
    mockAuthValue.retryGuestMerge.mockResolvedValue({ merged: true });
    renderModal({ initialExistingAccount: { method: 'google', credential: {} } });
    fireEvent.click(screen.getByRole('button', { name: /sign in and move my progress/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/couldn’t finish moving/);
    fireEvent.click(screen.getByRole('button', { name: /try moving my progress again/i }));
    await screen.findByText(/progress saved/i);
    expect(mockAuthValue.retryGuestMerge).toHaveBeenCalled();
  });
});

describe('GuestSaveBanner', () => {
  const progress = { coins: 12, questionSummary: { total: 8 } };

  test('only shows for guests with some progress', () => {
    const { rerender } = render(<GuestSaveBanner uid="g1" isGuest={false} userData={progress} onSave={jest.fn()} />);
    expect(screen.queryByText(/save your progress/i)).not.toBeInTheDocument();
    rerender(<GuestSaveBanner uid="g1" isGuest userData={{ coins: 1 }} onSave={jest.fn()} />);
    expect(screen.queryByText(/save your progress/i)).not.toBeInTheDocument();
    rerender(<GuestSaveBanner uid="g1" isGuest userData={progress} onSave={jest.fn()} />);
    expect(screen.getByText(/save your progress\?/i)).toBeInTheDocument();
    expect(screen.getByText(/earned 12 coins/i)).toBeInTheDocument();
  });

  test('is hidden during a quiz and stays dismissed for that guest', () => {
    const onSave = jest.fn();
    const { rerender, unmount } = render(<GuestSaveBanner uid="g1" isGuest userData={progress} hidden onSave={onSave} />);
    expect(screen.queryByRole('region')).not.toBeInTheDocument();
    rerender(<GuestSaveBanner uid="g1" isGuest userData={progress} onSave={onSave} />);
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));
    expect(onSave).toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: /dismiss/i }));
    expect(screen.queryByRole('region')).not.toBeInTheDocument();
    unmount();
    render(<GuestSaveBanner uid="g1" isGuest userData={progress} onSave={onSave} />);
    expect(screen.queryByRole('region')).not.toBeInTheDocument();
  });
});

describe('AppHeader guest chip', () => {
  const baseProps = {
    userData: { displayName: 'Young Mathematician', coins: 3 },
    userRole: 'student',
    navigateApp: jest.fn(),
    handleUserClick: jest.fn(),
    handleLogout: jest.fn(),
    startTutorial: jest.fn(),
    returnToTopics: jest.fn(),
  };

  test('guests see "Guest" and a Save progress button', () => {
    const onSaveProgress = jest.fn();
    render(<AppHeader {...baseProps} authUser={{ uid: 'g', isAnonymous: true }} isGuest onSaveProgress={onSaveProgress} />);
    expect(screen.getByText('Guest')).toBeInTheDocument();
    expect(screen.getByText(/not saved/i)).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('guest-save-progress'));
    expect(onSaveProgress).toHaveBeenCalled();
  });

  test('signed-in students don’t see it', () => {
    render(<AppHeader {...baseProps} authUser={{ uid: 's', isAnonymous: false }} isGuest={false} onSaveProgress={jest.fn()} />);
    expect(screen.queryByTestId('guest-save-progress')).not.toBeInTheDocument();
    expect(screen.getByText('Young Mathematician')).toBeInTheDocument();
  });
});

