import React, { useState } from 'react';
import { Save, X } from 'lucide-react';
import { dismissGuestBanner, hasMeaningfulGuestProgress, isGuestBannerDismissed } from '../../services/guestUpgrade';

/**
 * Small, dismissible nudge for guests who have earned something worth keeping.
 * Shown once per guest per device until dismissed or the account is saved.
 */
const GuestSaveBanner = ({ uid, userData, isGuest, hidden = false, onSave }) => {
  const [dismissed, setDismissed] = useState(() => isGuestBannerDismissed(uid));
  if (!isGuest || hidden || dismissed || !hasMeaningfulGuestProgress(userData)) return null;

  const coins = Number(userData?.coins || 0);
  return (
    <div role="region" aria-label="Save your progress" className="fixed inset-x-3 bottom-3 z-20 mx-auto max-w-md rounded-2xl border border-purple-100 bg-white/95 p-4 shadow-card backdrop-blur-md sm:left-auto sm:right-4 sm:mx-0">
      <div className="flex items-start gap-3">
        <span className="inline-flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-purple-100 text-brand-purple">
          <Save className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-display font-bold text-gray-800">Nice work! Save your progress?</p>
          <p className="mt-0.5 text-sm text-gray-600">
            {coins > 0 ? `You've earned ${coins} coins as a guest. ` : ''}Create a free account so you don&apos;t lose it.
          </p>
          <button type="button" onClick={onSave} className="mt-2 rounded-full bg-brand-purple px-4 py-1.5 text-sm font-bold text-white hover:opacity-90">
            Create account
          </button>
        </div>
        <button
          type="button"
          aria-label="Dismiss"
          onClick={() => { dismissGuestBanner(uid); setDismissed(true); }}
          className="rounded-full p-1 text-gray-400 hover:bg-gray-100"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
};

export default GuestSaveBanner;
