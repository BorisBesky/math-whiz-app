import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

const mockNavigate = jest.fn();
let mockSearch = '';
const mockAuthValue = {};

jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  useLocation: () => ({ pathname: '/student-login', state: null }),
  useSearchParams: () => [new URLSearchParams(mockSearch)],
  Link: ({ to, children, ...rest }) => <a href={to} {...rest}>{children}</a>,
}), { virtual: true });

jest.mock('../../contexts/AuthContext', () => ({ useAuth: () => mockAuthValue }));
jest.mock('../guest/GuestUpgradeModal', () => ({ open, initialExistingAccount }) => (
  open ? <div data-testid="guest-modal">{initialExistingAccount ? `exists:${initialExistingAccount.email || initialExistingAccount.method}` : 'choose'}</div> : null
));

// eslint-disable-next-line import/first
import StudentLogin from '../StudentLogin';

const setAuth = (user, overrides = {}) => Object.assign(mockAuthValue, {
  user,
  loginAsGuest: jest.fn(),
  loginWithEmail: jest.fn(),
  registerWithEmail: jest.fn(),
  loginWithGoogle: jest.fn(),
  registerWithGoogle: jest.fn(),
  resetPassword: jest.fn(),
  logout: jest.fn(),
  googleRedirect: { status: 'idle', error: null },
  clearGoogleRedirect: jest.fn(),
  ...overrides,
});

beforeEach(() => {
  mockSearch = '';
  jest.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => jest.restoreAllMocks());

describe('StudentLogin for a guest', () => {
  test('keeps the guest session and offers to save progress', () => {
    setAuth({ uid: 'g', isAnonymous: true });
    render(<StudentLogin />);
    expect(screen.getByTestId('guest-session-card')).toHaveTextContent(/playing as a guest/i);
    expect(screen.queryByRole('button', { name: /start as guest/i })).not.toBeInTheDocument();
    expect(mockAuthValue.loginAsGuest).not.toHaveBeenCalled();
    expect(mockAuthValue.logout).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: /save my progress/i }));
    expect(screen.getByTestId('guest-modal')).toHaveTextContent('choose');
  });

  test('"Keep playing as guest" goes back without changing anything', () => {
    setAuth({ uid: 'g', isAnonymous: true });
    render(<StudentLogin />);
    fireEvent.click(screen.getByRole('button', { name: /keep playing as guest/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true });
  });

  test('email sign-up with an email that already has an account offers sign-in + merge', async () => {
    setAuth({ uid: 'g', isAnonymous: true }, {
      registerWithEmail: jest.fn().mockRejectedValue(Object.assign(new Error('in use'), { code: 'auth/email-already-in-use' })),
    });
    mockSearch = 'mode=signup';
    render(<StudentLogin />);
    fireEvent.change(screen.getByLabelText(/^email/i), { target: { value: 'sam@example.com' } });
    fireEvent.change(screen.getByLabelText(/^password/i), { target: { value: 'secret1' } });
    fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: 'secret1' } });
    fireEvent.click(screen.getByRole('button', { name: /^create account$/i }));
    expect(await screen.findByTestId('guest-modal')).toHaveTextContent('exists:sam@example.com');
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  test('Google sign-in that hits an existing account offers sign-in + merge', async () => {
    setAuth({ uid: 'g', isAnonymous: true }, {
      loginWithGoogle: jest.fn().mockResolvedValue({ existingAccount: { method: 'google', email: 'sam@gmail.com', credential: {} } }),
    });
    render(<StudentLogin />);
    fireEvent.click(screen.getByRole('button', { name: /sign in with google/i }));
    expect(await screen.findByTestId('guest-modal')).toHaveTextContent('exists:sam@gmail.com');
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  test('non-guests still see "Start as Guest" and no guest card', () => {
    setAuth(null);
    render(<StudentLogin />);
    expect(screen.getByRole('button', { name: /start as guest/i })).toBeInTheDocument();
    expect(screen.queryByTestId('guest-session-card')).not.toBeInTheDocument();
  });
});
