import { runTransaction } from 'firebase/firestore';
import { getPlanetCollection, getPlanetItem } from '../components/rewards/planetConfig';

// Read the balance inside the transaction. Double clicks, concurrent tabs, and
// retries must never charge twice or spend a stale balance below zero.
export async function purchasePlanetItem(db, profileRef, itemId) {
  const item = getPlanetItem(itemId);
  if (!item || !profileRef) throw new Error('This planet item is unavailable. Please try again.');
  return runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(profileRef);
    if (!snapshot.exists()) throw new Error('Your profile is still loading. Please try again.');
    const profile = snapshot.data();
    const { owned, active } = getPlanetCollection(profile);
    if (owned.includes(item.id)) return { alreadyOwned: true, item };
    const coins = Number.isFinite(profile.coins) ? profile.coins : 0;
    if (coins < item.price) throw new Error(`You need ${item.price - coins} more coins. Keep practicing!`);
    transaction.update(profileRef, {
      coins: coins - item.price,
      ownedPlanetItems: [...owned, item.id],
      activePlanetItems: [...active, item.id],
    });
    return { alreadyOwned: false, item };
  });
}

export async function setPlanetItemActive(db, profileRef, itemId, enabled) {
  if (!getPlanetItem(itemId) || !profileRef) throw new Error('This planet item is unavailable.');
  return runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(profileRef);
    if (!snapshot.exists()) throw new Error('Your profile is still loading. Please try again.');
    const { owned, active } = getPlanetCollection(snapshot.data());
    if (!owned.includes(itemId)) throw new Error('Buy this item before adding it to your planet.');
    const next = active.filter((id) => id !== itemId);
    if (enabled) next.push(itemId);
    transaction.update(profileRef, { activePlanetItems: next });
  });
}
