/**
 * Tests for Profile Utilities
 * Tests user profile CRUD operations with mocked Firebase
 */

import { doc, getDoc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import {
  getUserProfile,
  saveUserProfile,
  updateUserProfile,
  deleteUserProfile,
  getProfileReference
} from '../profileUtils';

// Mock Firebase Firestore
jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  getDoc: jest.fn(),
  setDoc: jest.fn(),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn()
}));

// Mock the db import from firebase
jest.mock('../../firebase', () => ({
  db: {}
}));

describe('profileUtils', () => {
  const mockUserId = 'test-user-123';
  const mockProfileData = {
    coins: 100,
    answeredQuestions: [],
    dailyGoals: { fractions: 10 }
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Set up default mock for doc
    doc.mockReturnValue({ path: 'mock/path' });
  });

  describe('getUserProfile', () => {
    it('returns profile data when user exists', async () => {
      getDoc.mockResolvedValue({
        exists: () => true,
        data: () => mockProfileData
      });

      const result = await getUserProfile(mockUserId);

      expect(result).toEqual(mockProfileData);
      expect(doc).toHaveBeenCalled();
      expect(getDoc).toHaveBeenCalled();
    });

    it('returns null when user does not exist', async () => {
      getDoc.mockResolvedValue({
        exists: () => false,
        data: () => null
      });

      const result = await getUserProfile(mockUserId);

      expect(result).toBeNull();
    });

    it('throws error on Firebase failure', async () => {
      const error = new Error('Firebase connection failed');
      getDoc.mockRejectedValue(error);

      await expect(getUserProfile(mockUserId)).rejects.toThrow('Firebase connection failed');
    });

    it('uses correct document path structure', async () => {
      getDoc.mockResolvedValue({
        exists: () => true,
        data: () => mockProfileData
      });

      await getUserProfile(mockUserId);

      // Verify doc was called with correct path segments
      expect(doc).toHaveBeenCalledWith(
        expect.anything(),
        'artifacts',
        expect.any(String), // appId
        'users',
        mockUserId,
        'math_whiz_data',
        'profile'
      );
    });
  });

  describe('saveUserProfile', () => {
    it('saves profile data with merge option', async () => {
      setDoc.mockResolvedValue(undefined);

      const result = await saveUserProfile(mockUserId, mockProfileData);

      expect(result).toEqual(mockProfileData);
      expect(setDoc).toHaveBeenCalledWith(
        expect.anything(),
        mockProfileData,
        { merge: true }
      );
    });

    it('throws error on save failure', async () => {
      const error = new Error('Write permission denied');
      setDoc.mockRejectedValue(error);

      await expect(saveUserProfile(mockUserId, mockProfileData))
        .rejects.toThrow('Write permission denied');
    });

    it('handles empty profile data', async () => {
      setDoc.mockResolvedValue(undefined);

      const result = await saveUserProfile(mockUserId, {});

      expect(result).toEqual({});
      expect(setDoc).toHaveBeenCalled();
    });
  });

  describe('updateUserProfile', () => {
    it('updates specific fields in profile', async () => {
      updateDoc.mockResolvedValue(undefined);

      const updates = { coins: 150, 'dailyGoals.fractions': 15 };
      const result = await updateUserProfile(mockUserId, updates);

      expect(result).toEqual(updates);
      expect(updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        updates
      );
    });

    it('throws error on update failure', async () => {
      const error = new Error('Document not found');
      updateDoc.mockRejectedValue(error);

      await expect(updateUserProfile(mockUserId, { coins: 200 }))
        .rejects.toThrow('Document not found');
    });
  });

  describe('deleteUserProfile', () => {
    it('returns true on successful deletion', async () => {
      deleteDoc.mockResolvedValue(undefined);

      const result = await deleteUserProfile(mockUserId);

      expect(result).toBe(true);
      expect(deleteDoc).toHaveBeenCalled();
    });

    it('throws error on deletion failure', async () => {
      const error = new Error('Delete permission denied');
      deleteDoc.mockRejectedValue(error);

      await expect(deleteUserProfile(mockUserId))
        .rejects.toThrow('Delete permission denied');
    });
  });

  describe('getProfileReference', () => {
    it('returns document reference', () => {
      const mockRef = { path: 'mock/reference/path' };
      doc.mockReturnValue(mockRef);

      const result = getProfileReference(mockUserId);

      expect(result).toBe(mockRef);
      expect(doc).toHaveBeenCalled();
    });
  });
});
