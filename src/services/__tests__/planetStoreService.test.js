import { runTransaction } from 'firebase/firestore';
import { purchasePlanetItem, setPlanetItemActive } from '../planetStoreService';
import { getPlanetCollection } from '../../components/rewards/planetConfig';

jest.mock('firebase/firestore', () => ({ runTransaction: jest.fn() }));

const db = {};
const ref = { id: 'student-profile' };
let profile;
let transaction;

beforeEach(() => {
  profile = { coins: 100 };
  transaction = {
    get: jest.fn(async () => ({ exists: () => true, data: () => profile })),
    update: jest.fn((_, updates) => { profile = { ...profile, ...updates }; }),
  };
  runTransaction.mockImplementation((_, callback) => callback(transaction));
});

test('a first purchase deducts its catalog price and permanently adds it to the world', async () => {
  await purchasePlanetItem(db, ref, 'pine-forest');
  expect(profile).toEqual({ coins: 85, ownedPlanetItems: ['pine-forest'], activePlanetItems: ['pine-forest'] });
});

test('a repeated purchase cannot charge twice', async () => {
  await purchasePlanetItem(db, ref, 'pine-forest');
  const result = await purchasePlanetItem(db, ref, 'pine-forest');
  expect(result.alreadyOwned).toBe(true);
  expect(profile.coins).toBe(85);
  expect(transaction.update).toHaveBeenCalledTimes(1);
});

test('the current stored balance, including an exactly sufficient balance, governs spending', async () => {
  profile.coins = 15;
  await purchasePlanetItem(db, ref, 'pine-forest');
  expect(profile.coins).toBe(0);
  await expect(purchasePlanetItem(db, ref, 'wildflowers')).rejects.toThrow('15 more coins');
  expect(transaction.update).toHaveBeenCalledTimes(1);
});

test('unknown items, missing profiles, and invalid balances cannot be purchased', async () => {
  await expect(purchasePlanetItem(db, ref, 'made-up-item')).rejects.toThrow('unavailable');
  profile.coins = NaN;
  await expect(purchasePlanetItem(db, ref, 'pine-forest')).rejects.toThrow('15 more coins');
  transaction.get.mockResolvedValue({ exists: () => false });
  await expect(purchasePlanetItem(db, ref, 'pine-forest')).rejects.toThrow('profile is still loading');
  expect(transaction.update).not.toHaveBeenCalled();
});

test('tucking away and restoring never loses ownership or charges coins', async () => {
  await purchasePlanetItem(db, ref, 'pine-forest');
  await setPlanetItemActive(db, ref, 'pine-forest', false);
  expect(profile.activePlanetItems).toEqual([]);
  expect(profile.ownedPlanetItems).toEqual(['pine-forest']);
  await setPlanetItemActive(db, ref, 'pine-forest', true);
  await setPlanetItemActive(db, ref, 'pine-forest', true);
  expect(profile.activePlanetItems).toEqual(['pine-forest']);
  expect(profile.coins).toBe(85);
});

test('unowned scenery cannot be activated and hidden items stay hidden after a new purchase', async () => {
  await expect(setPlanetItemActive(db, ref, 'cottage', true)).rejects.toThrow('Buy this item');
  profile = { coins: 100, ownedPlanetItems: ['cottage'], activePlanetItems: [] };
  await purchasePlanetItem(db, ref, 'pine-forest');
  expect(profile.activePlanetItems).toEqual(['pine-forest']);
  expect(profile.ownedPlanetItems).toEqual(['cottage', 'pine-forest']);
});

test('existing profiles need no migration and explicitly hidden collections remain empty', () => {
  expect(getPlanetCollection({})).toEqual({ owned: [], active: [] });
  expect(getPlanetCollection({ ownedPlanetItems: ['pond', 'pond', 'unknown'] })).toEqual({ owned: ['pond'], active: ['pond'] });
  expect(getPlanetCollection({ ownedPlanetItems: ['pond'], activePlanetItems: [] })).toEqual({ owned: ['pond'], active: [] });
});

test('transaction errors propagate so the UI can offer a retry without claiming success', async () => {
  runTransaction.mockRejectedValueOnce(new Error('offline'));
  await expect(purchasePlanetItem(db, ref, 'pond')).rejects.toThrow('offline');
  expect(transaction.update).not.toHaveBeenCalled();
});
