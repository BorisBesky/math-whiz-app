import React, { useEffect, useState } from 'react';
import { CheckCircle2, Loader2, Mail, Save, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const GoogleMark = () => (
  <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
);

const inputClass = 'w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm focus:border-brand-purple focus:outline-none focus:ring-2 focus:ring-purple-200';

/**
 * "Save your progress" for guest students. Google and email both upgrade the
 * current guest account in place (same uid, so nothing is lost). If the
 * Google account / email already has a Math Whiz account, the user can sign
 * into it and the guest's progress is moved over by the server.
 */
const GuestUpgradeModal = ({ open, onClose, initialExistingAccount = null, onSaved }) => {
  const { saveGuestWithGoogle, saveGuestWithEmail, signInAndMergeGuest, retryGuestMerge } = useAuth();
  const [step, setStep] = useState('choose');
  const [existingAccount, setExistingAccount] = useState(null);
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [existingPassword, setExistingPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [mergeFailed, setMergeFailed] = useState(false);
  const [doneKind, setDoneKind] = useState('linked');

  useEffect(() => {
    if (!open) return;
    setError('');
    setMergeFailed(false);
    if (initialExistingAccount) {
      setExistingAccount(initialExistingAccount);
      setStep('exists');
    } else {
      setStep('choose');
    }
  }, [open, initialExistingAccount]);

  if (!open) return null;

  const finish = (kind) => {
    setDoneKind(kind);
    setStep('done');
    onSaved?.(kind);
  };

  const handleOutcome = (outcome) => {
    if (outcome?.redirected) return; // navigating to Google
    if (outcome?.existingAccount) {
      setExistingAccount(outcome.existingAccount);
      setExistingPassword(outcome.existingAccount.method === 'password' ? password : '');
      setStep('exists');
      return;
    }
    finish('linked');
  };

  const run = async (fn) => {
    setBusy(true);
    setError('');
    try {
      await fn();
    } catch (err) {
      setError(err?.message || 'Something went wrong. Please try again.');
      if (err?.code === 'guest/merge-failed') setMergeFailed(true);
    } finally {
      setBusy(false);
    }
  };

  const handleGoogle = () => run(async () => handleOutcome(await saveGuestWithGoogle()));

  const handleEmail = (event) => {
    event.preventDefault();
    run(async () => {
      if (password.length < 6) throw new Error('Choose a password with at least 6 characters.');
      handleOutcome(await saveGuestWithEmail({ email: email.trim(), password, displayName }));
    });
  };

  const handleMerge = (event) => {
    event?.preventDefault();
    run(async () => {
      await signInAndMergeGuest(existingAccount, { password: existingPassword });
      finish('merged');
    });
  };

  const handleRetry = () => run(async () => {
    await retryGuestMerge();
    setMergeFailed(false);
    finish('merged');
  });

  const closeDisabled = busy;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center sm:p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="guest-upgrade-title"
        className="max-h-[95vh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-white p-5 shadow-xl sm:rounded-3xl sm:p-6"
      >
        <div className="flex items-start justify-between gap-3">
          <h2 id="guest-upgrade-title" className="flex items-center gap-2 font-display text-xl font-bold text-gray-800">
            {step === 'done'
              ? <CheckCircle2 className="h-6 w-6 text-green-600" aria-hidden="true" />
              : <Save className="h-6 w-6 text-brand-purple" aria-hidden="true" />}
            {step === 'done' ? 'Progress saved!' : step === 'exists' ? 'You already have an account' : 'Save your progress'}
          </h2>
          <button type="button" onClick={onClose} disabled={closeDisabled} aria-label="Close" className="rounded-full p-1 text-gray-500 hover:bg-gray-100 disabled:opacity-50">
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        {step === 'choose' && (
          <>
            <p className="mt-2 text-sm text-gray-600">
              You&apos;re playing as a guest. Create a free account to keep your coins, rewards and quiz history,
              and to play on any device.
            </p>
            <button
              type="button"
              onClick={handleGoogle}
              disabled={busy}
              className="mt-4 flex w-full items-center justify-center gap-3 rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm font-bold text-gray-800 shadow-sm transition hover:bg-gray-50 disabled:opacity-60"
            >
              <GoogleMark /> Continue with Google
            </button>
            <div className="my-4 flex items-center gap-3 text-xs font-semibold uppercase text-gray-400">
              <span className="h-px flex-1 bg-gray-200" /> or use email <span className="h-px flex-1 bg-gray-200" />
            </div>
            <form onSubmit={handleEmail} className="space-y-3">
              <label className="block text-sm font-semibold text-gray-700" htmlFor="guest-name">
                Your name <span className="font-normal text-gray-400">(optional)</span>
              </label>
              <input id="guest-name" className={inputClass} value={displayName} onChange={(e) => setDisplayName(e.target.value)} autoComplete="nickname" />
              <label className="block text-sm font-semibold text-gray-700" htmlFor="guest-email">Email</label>
              <input id="guest-email" type="email" required className={inputClass} value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
              <label className="block text-sm font-semibold text-gray-700" htmlFor="guest-password">Password</label>
              <input id="guest-password" type="password" required className={inputClass} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" placeholder="At least 6 characters" />
              {error && <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{error}</p>}
              <button
                type="submit"
                disabled={busy}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-purple px-4 py-3 font-display font-bold text-white shadow-card transition hover:opacity-90 disabled:opacity-60"
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Mail className="h-4 w-4" aria-hidden="true" />}
                Create account with email
              </button>
            </form>
          </>
        )}

        {step === 'exists' && existingAccount && (
          <form onSubmit={handleMerge} className="mt-2 space-y-3">
            <p className="text-sm text-gray-600">
              {existingAccount.email ? <strong>{existingAccount.email}</strong> : 'This Google account'} already has a Math Whiz account.
              Sign in to it and we&apos;ll add your guest progress (coins, rewards and quiz history) to that account.
              The guest session is then removed.
            </p>
            {existingAccount.method === 'password' && !mergeFailed && (
              <>
                <label className="block text-sm font-semibold text-gray-700" htmlFor="existing-password">Password for that account</label>
                <input id="existing-password" type="password" required className={inputClass} value={existingPassword} onChange={(e) => setExistingPassword(e.target.value)} autoComplete="current-password" />
              </>
            )}
            {error && <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{error}</p>}
            {mergeFailed ? (
              <button type="button" onClick={handleRetry} disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-purple px-4 py-3 font-display font-bold text-white disabled:opacity-60">
                {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />} Try moving my progress again
              </button>
            ) : (
              <div className="flex flex-col gap-2">
                <button type="submit" disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-purple px-4 py-3 font-display font-bold text-white disabled:opacity-60">
                  {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />} Sign in and move my progress
                </button>
                <button type="button" disabled={busy} onClick={() => { setStep('choose'); setError(''); }} className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-60">
                  Use a different account
                </button>
              </div>
            )}
          </form>
        )}

        {step === 'done' && (
          <>
            <p className="mt-2 text-sm text-gray-600">
              {doneKind === 'merged'
                ? 'You’re signed in, and your guest progress was added to your account.'
                : 'Your account is ready. Everything you earned as a guest is saved.'}
            </p>
            <button type="button" onClick={onClose} className="mt-4 w-full rounded-xl bg-brand-purple px-4 py-3 font-display font-bold text-white">
              Keep playing
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default GuestUpgradeModal;
