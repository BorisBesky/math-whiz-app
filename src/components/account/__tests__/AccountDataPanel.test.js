import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

const mockNavigate = jest.fn();
const mockLogout = jest.fn();
const mockReauthCredential = jest.fn();
const mockReauthPopup = jest.fn();

jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}), { virtual: true });

jest.mock('../../../contexts/AuthContext', () => ({ useAuth: () => ({ logout: mockLogout }) }));

jest.mock('firebase/auth', () => ({
  EmailAuthProvider: { credential: (email, password) => ({ email, password }) },
  GoogleAuthProvider: function GoogleAuthProvider() { this.setCustomParameters = () => {}; },
  reauthenticateWithCredential: (...args) => mockReauthCredential(...args),
  reauthenticateWithPopup: (...args) => mockReauthPopup(...args),
}));

// eslint-disable-next-line import/first
import AccountDataPanel from '../AccountDataPanel';

const makeUser = (providerId = 'password', extra = {}) => ({
  uid: 'u1',
  email: 'kid@example.com',
  isAnonymous: false,
  providerData: [{ providerId }],
  getIdToken: jest.fn().mockResolvedValue('token-1'),
  ...extra,
});

const jsonResponse = (status, body) => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => body,
  blob: async () => new Blob([JSON.stringify(body)], { type: 'application/json' }),
});

const openDialog = () => fireEvent.click(screen.getByRole('button', { name: /delete account/i }));
const deleteButton = () => screen.getByRole('button', { name: /delete my account permanently/i });

beforeEach(() => {
  global.fetch = jest.fn();
  global.URL.createObjectURL = jest.fn(() => 'blob:url');
  global.URL.revokeObjectURL = jest.fn();
  mockLogout.mockResolvedValue(undefined);
  mockReauthCredential.mockResolvedValue({});
  mockReauthPopup.mockResolvedValue({});
});

describe('AccountDataPanel', () => {
  test('renders nothing for anonymous guests', () => {
    const { container } = render(<AccountDataPanel user={makeUser('password', { isAnonymous: true })} appId="app" />);
    expect(container).toBeEmptyDOMElement();
  });

  test('"Download my data" calls the export function with the user’s token and saves a file', async () => {
    const click = jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    global.fetch.mockResolvedValue(jsonResponse(200, { profile: {} }));
    render(<AccountDataPanel user={makeUser()} appId="app-1" />);
    fireEvent.click(screen.getByRole('button', { name: /download my data/i }));
    expect(await screen.findByText(/your data file has been downloaded/i)).toBeInTheDocument();
    expect(global.fetch).toHaveBeenCalledWith(
      '/.netlify/functions/export-account-data?appId=app-1',
      expect.objectContaining({ headers: { Authorization: 'Bearer token-1' } }),
    );
    expect(click).toHaveBeenCalled();
    click.mockRestore();
  });

  test('shows the server’s error when the export fails', async () => {
    global.fetch.mockResolvedValue(jsonResponse(500, { error: 'We could not prepare your data. Please try again.' }));
    render(<AccountDataPanel user={makeUser()} appId="app" />);
    fireEvent.click(screen.getByRole('button', { name: /download my data/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent('We could not prepare your data');
  });

  test('admins can export but are not offered deletion', () => {
    render(<AccountDataPanel user={makeUser()} appId="app" role="teacher" isAdmin />);
    expect(screen.getByRole('button', { name: /download my data/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /delete account/i })).not.toBeInTheDocument();
    expect(screen.getByText(/administrator accounts can't be deleted/i)).toBeInTheDocument();
  });

  test('dialog explains what is deleted, offers export, and gates on DELETE + password', () => {
    render(<AccountDataPanel user={makeUser()} appId="app" role="teacher" />);
    openDialog();
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveTextContent(/can't be undone/i);
    expect(dialog).toHaveTextContent(/classes you teach alone/i);
    expect(screen.getAllByRole('button', { name: /download my data/i }).length).toBe(2);

    expect(deleteButton()).toBeDisabled();
    fireEvent.change(screen.getByLabelText(/type delete to confirm/i), { target: { value: 'delete' } });
    fireEvent.change(screen.getByLabelText(/enter your password/i), { target: { value: 'pw' } });
    expect(deleteButton()).toBeDisabled();
    fireEvent.change(screen.getByLabelText(/type delete to confirm/i), { target: { value: 'DELETE' } });
    expect(deleteButton()).toBeEnabled();
  });

  test('password users reauthenticate, then the account is deleted, signed out and sent home', async () => {
    const user = makeUser('password');
    global.fetch.mockResolvedValue(jsonResponse(200, { success: true }));
    render(<AccountDataPanel user={user} appId="app" />);
    openDialog();
    fireEvent.change(screen.getByLabelText(/type delete to confirm/i), { target: { value: 'DELETE' } });
    fireEvent.change(screen.getByLabelText(/enter your password/i), { target: { value: 'secret' } });
    fireEvent.click(deleteButton());

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/login?accountDeleted=1', { replace: true }));
    expect(mockReauthCredential).toHaveBeenCalledWith(user, { email: 'kid@example.com', password: 'secret' });
    expect(user.getIdToken).toHaveBeenCalledWith(true);
    const [url, init] = global.fetch.mock.calls[0];
    expect(url).toBe('/.netlify/functions/delete-account');
    expect(JSON.parse(init.body)).toEqual({ appId: 'app', confirm: 'DELETE' });
    expect(mockLogout).toHaveBeenCalled();
  });

  test('Google users reauthenticate with a Google popup (no password field)', async () => {
    global.fetch.mockResolvedValue(jsonResponse(200, { success: true }));
    render(<AccountDataPanel user={makeUser('google.com')} appId="app" />);
    openDialog();
    expect(screen.queryByLabelText(/enter your password/i)).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(/type delete to confirm/i), { target: { value: 'DELETE' } });
    fireEvent.click(deleteButton());
    await waitFor(() => expect(mockNavigate).toHaveBeenCalled());
    expect(mockReauthPopup).toHaveBeenCalled();
  });

  test('a wrong password stops the flow before anything is deleted', async () => {
    mockReauthCredential.mockRejectedValue(Object.assign(new Error('x'), { code: 'auth/invalid-credential' }));
    render(<AccountDataPanel user={makeUser()} appId="app" />);
    openDialog();
    fireEvent.change(screen.getByLabelText(/type delete to confirm/i), { target: { value: 'DELETE' } });
    fireEvent.change(screen.getByLabelText(/enter your password/i), { target: { value: 'nope' } });
    fireEvent.click(deleteButton());
    expect(await screen.findByRole('alert')).toHaveTextContent('That password isn’t right.');
    expect(global.fetch).not.toHaveBeenCalled();
    expect(mockLogout).not.toHaveBeenCalled();
  });

  test('a cancelled Google popup shows a clear message', async () => {
    mockReauthPopup.mockRejectedValue(Object.assign(new Error('x'), { code: 'auth/popup-closed-by-user' }));
    render(<AccountDataPanel user={makeUser('google.com')} appId="app" />);
    openDialog();
    fireEvent.change(screen.getByLabelText(/type delete to confirm/i), { target: { value: 'DELETE' } });
    fireEvent.click(deleteButton());
    expect((await screen.findByRole('alert')).textContent.length).toBeGreaterThan(5);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test('server errors are shown and the user stays signed in', async () => {
    global.fetch.mockResolvedValue(jsonResponse(401, { error: 'Please confirm your identity again before deleting your account.', code: 'requires-recent-login' }));
    render(<AccountDataPanel user={makeUser()} appId="app" />);
    openDialog();
    fireEvent.change(screen.getByLabelText(/type delete to confirm/i), { target: { value: 'DELETE' } });
    fireEvent.change(screen.getByLabelText(/enter your password/i), { target: { value: 'pw' } });
    fireEvent.click(deleteButton());
    expect(await screen.findByRole('alert')).toHaveTextContent(/confirm your identity again/i);
    expect(mockLogout).not.toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
    expect(deleteButton()).toBeEnabled();
  });
});
