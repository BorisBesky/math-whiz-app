import { runTransaction } from 'firebase/firestore';
import { db } from '../firebase';
import { getUserDocRef } from '../utils/firebaseHelpers';
import { completeMessage } from '../components/secretMessage/messageLibrary';

// Compact bounded summary only: at most 200 message IDs, never question history.
// The transaction makes completion idempotent across tabs/devices.
export async function saveSecretMessageCompletion(userId, messageId, grade, performance) {
  const profile = getUserDocRef(userId);
  if (!profile) throw new Error('Sign in to save puzzle progress.');
  return runTransaction(db, async transaction => {
    const snapshot = await transaction.get(profile);
    if (!snapshot.exists()) throw new Error('Your student profile is not ready. Please try again.');
    const next = completeMessage(snapshot.data().secretMessageProgress, messageId, grade, performance);
    transaction.update(profile, { secretMessageProgress: next });
    return next;
  });
}
