import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

const mockNavigate = jest.fn();
let mockSearch = '';
const mockAuthValue = {};

// react-router-dom v7 is ESM-only under this Jest setup; stub what StudentLogin uses.
jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  useLocation: () => ({ pathname: '/student-login', state: null }),
  useSearchParams: () => [new URLSearchParams(mockSearch)],
  Link: ({ to, children, ...rest }) => <a href={to} {...rest}>{children}</a>,
}), { virtual: true });

jest.mock('../../contexts/AuthContext', () => ({ useAuth: () => mockAuthValue }));

// eslint-disable-next-line import/first
import StudentLogin from '../StudentLogin';

const setAuth = (overrides = {}) => {
  Object.assign(mockAuthValue, {
    loginAsGuest: jest.fn(() => Promise.resolve({ uid: 'guest' })),
    loginWithEmail: jest.fn(),
    registerWithEmail: jest.fn(),
    loginWithGoogle: jest.fn(),
    registerWithGoogle: jest.fn(),
    resetPassword: jest.fn(),
    googleRedirect: { status: 'idle', error: null },
    clearGoogleRedirect: jest.fn(),
    ...overrides,
  });
};

describe('StudentLogin Google buttons', () => {
  beforeEach(() => {
    mockSearch = 'mode=signup';
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => jest.restoreAllMocks());

  it('"Sign up with Google" calls the Google sign-up and then navigates', async () => {
    setAuth({ registerWithGoogle: jest.fn(() => Promise.resolve({ user: { uid: 'g1' } })) });
    render(<StudentLogin />);
    fireEvent.click(screen.getByRole('button', { name: /sign up with google/i }));
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true }));
    expect(mockAuthValue.registerWithGoogle).toHaveBeenCalledWith('student');
    expect(mockAuthValue.loginAsGuest).not.toHaveBeenCalled();
  });

  it('keeps the redirect target from the join flow', async () => {
    mockSearch = `mode=signup&redirect=${encodeURIComponent('/join?code=ABC123')}`;
    setAuth({ registerWithGoogle: jest.fn(() => Promise.resolve({ user: { uid: 'g1' } })) });
    render(<StudentLogin />);
    fireEvent.click(screen.getByRole('button', { name: /sign up with google/i }));
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/join?code=ABC123', { replace: true }));
  });

  it('does not navigate (and so never lands as a guest) when Google did not sign anyone in', async () => {
    setAuth({ registerWithGoogle: jest.fn(() => Promise.resolve(undefined)) });
    render(<StudentLogin />);
    fireEvent.click(screen.getByRole('button', { name: /sign up with google/i }));
    expect(await screen.findByText(/did not complete/i)).toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();
    expect(mockAuthValue.loginAsGuest).not.toHaveBeenCalled();
  });

  it('shows the error message when Google sign-up fails', async () => {
    setAuth({ registerWithGoogle: jest.fn(() => Promise.reject(new Error('Your browser blocked the Google sign-in window.'))) });
    render(<StudentLogin />);
    fireEvent.click(screen.getByRole('button', { name: /sign up with google/i }));
    expect(await screen.findByText(/blocked the Google sign-in window/i)).toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('stays put while the browser redirects to Google', async () => {
    setAuth({ registerWithGoogle: jest.fn(() => Promise.resolve({ redirected: true })) });
    render(<StudentLogin />);
    const button = screen.getByRole('button', { name: /sign up with google/i });
    fireEvent.click(button);
    await waitFor(() => expect(mockAuthValue.registerWithGoogle).toHaveBeenCalled());
    expect(mockNavigate).not.toHaveBeenCalled();
    expect(button).toBeDisabled();
  });

  it('"Sign in with Google" uses the student sign-in', async () => {
    mockSearch = '';
    setAuth({ loginWithGoogle: jest.fn(() => Promise.resolve({ user: { uid: 'g1' } })) });
    render(<StudentLogin />);
    fireEvent.click(screen.getByRole('button', { name: /sign in with google/i }));
    await waitFor(() => expect(mockNavigate).toHaveBeenCalled());
    expect(mockAuthValue.loginWithGoogle).toHaveBeenCalledWith('student');
  });

  it('navigates after a successful Google redirect', async () => {
    setAuth({ googleRedirect: { status: 'success', error: null } });
    render(<StudentLogin />);
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true }));
    expect(mockAuthValue.clearGoogleRedirect).toHaveBeenCalled();
  });

  it('shows a failed Google redirect', async () => {
    setAuth({ googleRedirect: { status: 'error', error: 'Google sign-in is not enabled for this app.' } });
    render(<StudentLogin />);
    expect(await screen.findByText(/not enabled for this app/i)).toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
