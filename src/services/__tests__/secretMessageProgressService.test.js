import { runTransaction } from 'firebase/firestore';
import { getUserDocRef } from '../../utils/firebaseHelpers';
import { saveSecretMessageCompletion } from '../secretMessageProgressService';
import { SECRET_MESSAGES } from '../../components/secretMessage/secretMessageConfig';

jest.mock('firebase/firestore', () => ({ runTransaction: jest.fn() }));
jest.mock('../../firebase', () => ({ db: {} }));
jest.mock('../../utils/firebaseHelpers', () => ({ getUserDocRef: jest.fn() }));

it('atomically reads the current profile, awards coins once, and writes only a bounded puzzle summary', async () => {
  const profile = { path: 'own-profile' };
  getUserDocRef.mockReturnValue(profile);
  const transaction = {
    get: jest.fn().mockResolvedValue({ exists: () => true, data: () => ({ coins: 60 }) }),
    update: jest.fn(),
  };
  runTransaction.mockImplementation((db, callback) => callback(transaction));
  const result = await saveSecretMessageCompletion('student', SECRET_MESSAGES[0].id, 'G4', { total: 8, firstTry: 8, complexity: 0.5 });
  expect(getUserDocRef).toHaveBeenCalledWith('student');
  expect(transaction.get).toHaveBeenCalledWith(profile);
  expect(transaction.update).toHaveBeenCalledWith(profile, { secretMessageProgress: result, coins: 73 });
  expect(result.completedIds).toEqual([SECRET_MESSAGES[0].id]);
  expect(result.completedCount).toBe(1);
  transaction.update.mockClear();
  transaction.get.mockResolvedValue({ exists: () => true, data: () => ({ coins: 73, secretMessageProgress: result }) });
  const repeated = await saveSecretMessageCompletion('student', SECRET_MESSAGES[0].id, 'G4', { total: 8, firstTry: 0, complexity: 0.5 });
  expect(repeated).toEqual(result);
  expect(transaction.update).toHaveBeenCalledWith(profile, { secretMessageProgress: result });
});

it('does not write completion when the profile does not exist', async () => {
  getUserDocRef.mockReturnValue({ path: 'own-profile' });
  const transaction = { get: jest.fn().mockResolvedValue({ exists: () => false }), update: jest.fn() };
  runTransaction.mockImplementation((db, callback) => callback(transaction));
  await expect(saveSecretMessageCompletion('student', SECRET_MESSAGES[0].id, 'G3', {})).rejects.toThrow('profile');
  expect(transaction.update).not.toHaveBeenCalled();
});
