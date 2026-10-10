import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Download, Loader2, ShieldCheck, Trash2, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import {
  DELETE_CONFIRM_WORD,
  deleteMyAccount,
  downloadMyData,
  getReauthMethod,
} from '../../services/accountService';

const DELETED_LIST = {
  student: [
    'Your profile, progress, coins and rewards store items',
    'Your quiz history and drawings',
    'Your class memberships and the messages you sent',
  ],
  teacher: [
    'Your profile, question bank and PDF uploads',
    'Classes you teach alone, with their questions and enrollments (students keep their own accounts)',
    'Your spot on classes you co-teach (the class stays with the other teachers)',
    'The messages you sent',
  ],
};

const DownloadButton = ({ onClick, busy, className = '' }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={busy}
    className={`inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-800 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
  >
    {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Download className="h-4 w-4" aria-hidden="true" />}
    {busy ? 'Preparing your data...' : 'Download my data'}
  </button>
);

/**
 * "Your data & account" card: data export plus a guarded account deletion flow.
 * Guests don't get it (nothing to export or delete). Admins can export but
 * can't delete themselves.
 */
const AccountDataPanel = ({ user, appId, role = 'student', isAdmin = false }) => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState('');
  const [downloaded, setDownloaded] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [password, setPassword] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  if (!user || user.isAnonymous) return null;

  const reauthMethod = getReauthMethod(user);
  const items = DELETED_LIST[role === 'teacher' ? 'teacher' : 'student'];
  const canSubmit = confirmText === DELETE_CONFIRM_WORD
    && (reauthMethod !== 'password' || password.length > 0)
    && !deleting;

  const handleDownload = async () => {
    setDownloading(true);
    setDownloadError('');
    try {
      await downloadMyData({ user, appId });
      setDownloaded(true);
    } catch (error) {
      setDownloadError(error.message || 'Could not download your data.');
    } finally {
      setDownloading(false);
    }
  };

  const closeModal = () => {
    if (deleting) return;
    setModalOpen(false);
    setConfirmText('');
    setPassword('');
    setDeleteError('');
  };

  const handleDelete = async (event) => {
    event.preventDefault();
    if (!canSubmit) return;
    setDeleting(true);
    setDeleteError('');
    try {
      await deleteMyAccount({ user, appId, password, confirmText });
    } catch (error) {
      setDeleteError(error.message || 'Your account could not be deleted.');
      setDeleting(false);
      return;
    }
    try {
      await logout();
    } catch (e) {
      // The account is already gone; a failed local sign-out doesn't matter.
    }
    navigate('/login?accountDeleted=1', { replace: true });
  };

  return (
    <section
      aria-labelledby="account-data-heading"
      className="rounded-2xl border border-gray-200 bg-white/90 p-5 shadow-sm"
    >
      <div className="flex items-start gap-3">
        <span className="inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-700">
          <ShieldCheck className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <h2 id="account-data-heading" className="text-lg font-bold text-gray-900">Your data &amp; account</h2>
          <p className="mt-0.5 text-sm text-gray-500">
            Download a copy of everything Math Whiz stores about you, or delete your account.
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <DownloadButton onClick={handleDownload} busy={downloading} />
        {!isAdmin && (
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
            Delete account
          </button>
        )}
      </div>
      {downloaded && !downloadError && !modalOpen && (
        <p role="status" className="mt-3 text-sm text-green-700">Your data file has been downloaded.</p>
      )}
      {downloadError && !modalOpen && (
        <p role="alert" className="mt-3 text-sm text-red-700">{downloadError}</p>
      )}
      {isAdmin && (
        <p className="mt-3 text-xs text-gray-500">
          Administrator accounts can&apos;t be deleted from here. Ask another administrator to remove your admin access first.
        </p>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-account-title"
            className="max-h-[95vh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-white p-5 shadow-xl sm:rounded-2xl sm:p-6"
          >
            <div className="flex items-start justify-between gap-3">
              <h2 id="delete-account-title" className="flex items-center gap-2 text-lg font-bold text-gray-900">
                <AlertTriangle className="h-5 w-5 text-red-600" aria-hidden="true" />
                Delete your account?
              </h2>
              <button type="button" onClick={closeModal} aria-label="Close" className="rounded p-1 text-gray-500 hover:bg-gray-100">
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            <p className="mt-3 text-sm text-gray-700">This can&apos;t be undone. We&apos;ll permanently delete:</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-gray-700">
              {items.map((item) => <li key={item}>{item}</li>)}
              <li>Your sign-in ({user.email || 'this account'})</li>
            </ul>
            <p className="mt-2 text-xs text-gray-500">
              Messages other people sent you stay in their inbox, with your name shown as &ldquo;Deleted user&rdquo;.
            </p>

            <div className="mt-4 rounded-xl bg-gray-50 p-4">
              <p className="text-sm font-semibold text-gray-900">Step 1: Keep a copy (optional)</p>
              <p className="mt-0.5 text-xs text-gray-500">Download your data before it&apos;s gone.</p>
              <DownloadButton onClick={handleDownload} busy={downloading} className="mt-3 w-full sm:w-auto" />
              {downloaded && !downloadError && (
                <p role="status" className="mt-2 text-sm text-green-700">Downloaded.</p>
              )}
              {downloadError && <p role="alert" className="mt-2 text-sm text-red-700">{downloadError}</p>}
            </div>

            <form onSubmit={handleDelete} className="mt-4 space-y-3">
              <p className="text-sm font-semibold text-gray-900">Step 2: Confirm</p>
              <label className="block text-sm text-gray-700" htmlFor="delete-confirm-input">
                Type <strong>{DELETE_CONFIRM_WORD}</strong> to confirm
              </label>
              <input
                id="delete-confirm-input"
                type="text"
                autoComplete="off"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
              />
              {reauthMethod === 'password' && (
                <>
                  <label className="block text-sm text-gray-700" htmlFor="delete-password-input">
                    Enter your password
                  </label>
                  <input
                    id="delete-password-input"
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                  />
                </>
              )}
              {reauthMethod === 'google' && (
                <p className="text-xs text-gray-500">You&apos;ll be asked to sign in with Google again to confirm it&apos;s you.</p>
              )}
              {deleteError && <p role="alert" className="text-sm text-red-700">{deleteError}</p>}
              <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
                <button type="button" onClick={closeModal} disabled={deleting} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!canSubmit}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {deleting && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                  {deleting ? 'Deleting...' : 'Delete my account permanently'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};

export default AccountDataPanel;
