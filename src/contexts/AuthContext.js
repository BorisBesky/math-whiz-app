import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getAuth, onAuthStateChanged, signInAnonymously, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, EmailAuthProvider, linkWithCredential, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';
import { USER_ROLES } from '../utils/userRoles';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const auth = getAuth();
  const db = getFirestore();
  const appId = 'default-app-id';

  // Get user profile with role from Firestore
  const getUserProfile = useCallback(async (userId) => {
    try {
      const userDoc = await getDoc(doc(db, 'artifacts', appId, 'users', userId, 'profile', 'main'));
      if (userDoc.exists()) {
        return userDoc.data();
      }
      return null;
    } catch (error) {
      console.error('Error getting user profile:', error);
      return null;
    }
  }, [db, appId]);

  // Create or update user profile with role
  const setUserProfile = useCallback(async (userId, profileData) => {
    try {
      await setDoc(doc(db, 'artifacts', appId, 'users', userId, 'profile', 'main'), profileData, { merge: true });
    } catch (error) {
      console.error('Error setting user profile:', error);
    }
  }, [db, appId]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      setError(null);

      if (firebaseUser) {
        try {
          // First check for admin custom claims
          const idTokenResult = await firebaseUser.getIdTokenResult();
          let role = USER_ROLES.STUDENT; // Default role

          console.log('Auth Debug - User:', firebaseUser.email, 'Custom Claims:', idTokenResult.claims);

          // Check for admin custom claim first (highest priority)
          if (idTokenResult.claims.admin === true) {
            role = USER_ROLES.ADMIN;
            console.log('Auth Debug - Admin role from custom claims');
            
            // Ensure admin user has a profile in Firestore
            const profile = await getUserProfile(firebaseUser.uid);
            if (!profile) {
              await setUserProfile(firebaseUser.uid, {
                role: USER_ROLES.ADMIN,
                email: firebaseUser.email,
                createdAt: new Date(),
                isAdmin: true
              });
              console.log('Auth Debug - Created admin profile in Firestore');
            }
          } else {
            // Get user profile from Firestore for non-admin users
            const profile = await getUserProfile(firebaseUser.uid);
            console.log('Auth Debug - User profile:', profile);

            if (profile && profile.role) {
              role = profile.role;
              console.log('Auth Debug - Role from profile:', role);
            } else if (firebaseUser.isAnonymous) {
              role = USER_ROLES.STUDENT;
              // Create default profile for anonymous users
              await setUserProfile(firebaseUser.uid, {
                role: USER_ROLES.STUDENT,
                createdAt: new Date(),
                isAnonymous: true
              });
              console.log('Auth Debug - Anonymous user, set as student');
            } else {
              console.log('Auth Debug - No profile found for registered user, defaulting to student');
            }
          }

          setUser(firebaseUser);
          setUserRole(role);
          console.log('Auth Debug - Final role set:', role);
        } catch (error) {
          console.error('Error processing user authentication:', error);
          setError('Failed to load user profile');
          setUser(null);
          setUserRole(null);
        }
      } else {
        setUser(null);
        setUserRole(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, [auth, db, getUserProfile, setUserProfile]);

  // Student login (anonymous)
  const loginAsGuest = async () => {
    try {
      setError(null);
      const result = await signInAnonymously(auth);
      return result.user;
    } catch (error) {
      setError('Failed to sign in as guest');
      throw error;
    }
  };

  // Student/Teacher/Admin login with email and password
  const loginWithEmail = async (email, password, expectedRole = null) => {
    try {
      setError(null);
      const result = await signInWithEmailAndPassword(auth, email, password);
      
      // Verify role if specified
      if (expectedRole) {
        // For admin role, check custom claims
        if (expectedRole === USER_ROLES.ADMIN) {
          const idTokenResult = await result.user.getIdTokenResult();
          if (!idTokenResult.claims.admin) {
            await signOut(auth);
            throw new Error(`This account is not registered as a ${expectedRole}`);
          }
        } else {
          // For student/teacher, check Firestore profile
          const profile = await getUserProfile(result.user.uid);
          if (!profile || profile.role !== expectedRole) {
            await signOut(auth);
            throw new Error(`This account is not registered as a ${expectedRole}`);
          }
        }
      }
      
      return result.user;
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  // Sign in with Google and verify role
  const loginWithGoogle = async (expectedRole) => {
    try {
      setError(null);
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // For admin role, check custom claims
      if (expectedRole === USER_ROLES.ADMIN) {
        const idTokenResult = await user.getIdTokenResult();
        if (!idTokenResult.claims.admin) {
          await signOut(auth);
          throw new Error(`This account is not registered as a ${expectedRole}`);
        }
      } else {
        // For other roles, check Firestore profile
        const profile = await getUserProfile(user.uid);
        if (profile) {
          if (profile.role !== expectedRole) {
            await signOut(auth);
            throw new Error(`This account is registered as a ${profile.role}, not as a ${expectedRole}.`);
          }
        } else {
          // If no profile exists, create one for the new user
          await setUserProfile(user.uid, {
            email: user.email,
            role: expectedRole,
            createdAt: new Date(),
            isAnonymous: false,
            displayName: user.displayName,
          });
        }
      }
      return user;
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  // Register new account with role
  const registerWithEmail = async (email, password, role, additionalData = {}) => {
    try {
      setError(null);
      
      // Prevent admin registration through this function
      if (role === USER_ROLES.ADMIN) {
        throw new Error('Admin accounts must be created by system administrators using the set-admin script');
      }
      
      const result = await createUserWithEmailAndPassword(auth, email, password);
      
      // Set user profile with role
      await setUserProfile(result.user.uid, {
        email,
        role,
        createdAt: new Date(),
        isAnonymous: false,
        ...additionalData
      });
      
      return result.user;
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  // Convert guest account to registered account
  const convertGuestToRegistered = async (email, password) => {
    try {
      setError(null);
      if (!user || !user.isAnonymous) {
        throw new Error('Can only convert anonymous accounts');
      }

      // Update the anonymous user with email/password
      const credential = EmailAuthProvider.credential(email, password);
      await linkWithCredential(user, credential);
      
      // Update profile
      await setUserProfile(user.uid, {
        email,
        role: USER_ROLES.STUDENT,
        isAnonymous: false,
        convertedAt: new Date()
      });
      
      return user;
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  // Logout
  const logout = async () => {
    try {
      setError(null);
      await signOut(auth);
    } catch (error) {
      setError('Failed to sign out');
      throw error;
    }
  };

  const value = {
    user,
    userRole,
    loading,
    error,
    loginAsGuest,
    loginWithEmail,
    loginWithGoogle,
    registerWithEmail,
    convertGuestToRegistered,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
