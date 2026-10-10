import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

const mockNavigate = jest.fn();
let mockSearch = '';
const mockAuthValue = {};

// react-router-dom v7 is ESM-only under this Jest setup; stub what TeacherLogin uses.
jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  useLocation: () => ({ pathname: '/teacher-login', state: null }),
  useSearchParams: () => [new URLSearchParams(mockSearch)],
  Link: ({ to, children, ...rest }) => <a href={to} {...rest}>{children}</a>,
}), { virtual: true });

jest.mock('../../contexts/AuthContext', () => ({ useAuth: () => mockAuthValue }));

// eslint-disable-next-line import/first
import TeacherLogin from '../TeacherLogin';

const setAuth = (loginWithGoogle) => {
  Object.assign(mockAuthValue, {
    loginWithEmail: jest.fn(),
    registerWithEmail: jest.fn(),
    resetPassword: jest.fn(),
    loginWithGoogle,
  });
};

describe('TeacherLogin Google button', () => {
  beforeEach(() => {
    mockSearch = '';
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => jest.restoreAllMocks());

  it('"Sign in with Google" logs a teacher in (login only) and opens the portal', async () => {
    setAuth(jest.fn(() => Promise.resolve({ uid: 't1' })));
    render(<TeacherLogin />);
    fireEvent.click(screen.getByRole('button', { name: /sign in with google/i }));
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/teacher', { replace: true }));
    expect(mockAuthValue.loginWithGoogle).toHaveBeenCalledWith('teacher', { allowSignUp: false });
  });

  it('"Sign up with Google" allows creating a teacher account', async () => {
    mockSearch = 'mode=signup';
    setAuth(jest.fn(() => Promise.resolve({ uid: 't1' })));
    render(<TeacherLogin />);
    fireEvent.click(screen.getByRole('button', { name: /sign up with google/i }));
    await waitFor(() => expect(mockNavigate).toHaveBeenCalled());
    expect(mockAuthValue.loginWithGoogle).toHaveBeenCalledWith('teacher', { allowSignUp: true });
  });

  it('shows the rejection message for a non-teacher Google account and stays on the page', async () => {
    setAuth(jest.fn(() => Promise.reject(new Error('This Google account is registered as a student, not a teacher. Please use the student login.'))));
    render(<TeacherLogin />);
    fireEvent.click(screen.getByRole('button', { name: /sign in with google/i }));
    expect(await screen.findByText(/registered as a student, not a teacher/i)).toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
