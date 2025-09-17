import { doc, getDoc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../MainApp';

/**
 * Get the standardized profile document reference path
 * All user profiles are now stored at: /artifacts/{appId}/users/{userId}/math_whiz_data/profile
 */
const getProfileDocRef = (userId) => {
  const appId = process.env.REACT_APP_ID || 'math-whiz-app';
  return doc(db, 'artifacts', appId, 'users', userId, 'profile');
};

/**
 * Get user profile data
 * @param {string} userId - The user ID
 * @returns {Promise<Object|null>} Profile data or null if not found
 */
export const getUserProfile = async (userId) => {
  try {
    const profileRef = getProfileDocRef(userId);
    const profileSnap = await getDoc(profileRef);
    return profileSnap.exists() ? profileSnap.data() : null;
  } catch (error) {
    console.error('Error getting user profile:', error);
    throw error;
  }
};

/**
 * Save user profile data (creates or overwrites)
 * @param {string} userId - The user ID
 * @param {Object} profileData - The profile data to save
 * @returns {Promise<Object>} The saved profile data
 */
export const saveUserProfile = async (userId, profileData) => {
  try {
    const profileRef = getProfileDocRef(userId);
    await setDoc(profileRef, profileData, { merge: true });
    return profileData;
  } catch (error) {
    console.error('Error saving user profile:', error);
    throw error;
  }
};

/**
 * Update specific fields in user profile
 * @param {string} userId - The user ID
 * @param {Object} updates - The fields to update
 * @returns {Promise<Object>} The update object
 */
export const updateUserProfile = async (userId, updates) => {
  try {
    const profileRef = getProfileDocRef(userId);
    await updateDoc(profileRef, updates);
    return updates;
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};

/**
 * Delete user profile
 * @param {string} userId - The user ID
 * @returns {Promise<boolean>} Success status
 */
export const deleteUserProfile = async (userId) => {
  try {
    const profileRef = getProfileDocRef(userId);
    await deleteDoc(profileRef);
    return true;
  } catch (error) {
    console.error('Error deleting user profile:', error);
    throw error;
  }
};

/**
 * Get the profile document reference (for advanced use cases)
 * @param {string} userId - The user ID
 * @returns {DocumentReference} Firestore document reference
 */
export const getProfileReference = (userId) => {
  return getProfileDocRef(userId);
};