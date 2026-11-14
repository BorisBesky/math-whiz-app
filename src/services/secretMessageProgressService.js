import { runTransaction } from 'firebase/firestore';
import { db } from '../firebase';
import { getUserDocRef } from '../utils/firebaseHelpers';
import {
  calculateSecretMessageCoins,
  completeMessage,
  normalizeMessageProgress,
} from '../components/secretMessage/messageLibrary';

// Compact bounded summary only: at most 200 message IDs, never question history.
// The transaction makes completion and coin rewards idempotent across tabs/devices.
export async function saveSecretMessageCompletion(userId, messageId, grade, performance) {
  const profile = getUserDocRef(userId);
  if (!profile) throw new Error('Sign in to save puzzle progress.');
  return runTransaction(db, async transaction => {
    const snapshot = await transaction.get(profile);
    if (!snapshot.exists()) throw new Error('Your student profile is not ready. Please try again.');
    const data = snapshot.data() || {};
    const current = normalizeMessageProgress(data.secretMessageProgress);
    const next = completeMessage(current, messageId, grade, performance);
    const newlyCompleted = next.completedCount > current.completedCount;
    const currentCoins = Number.isFinite(data.coins) ? data.coins : 0;
    const updates = { secretMessageProgress: next };
    if (newlyCompleted) {
      updates.coins = currentCoins + calculateSecretMessageCoins(performance);
    }
    transaction.update(profile, updates);
    return next;
  });
}
