import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { onAuthStateChanged, signInAnonymously, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, EmailAuthProvider, linkWithCredential, GoogleAuthProvider, signInWithPopup, sendPasswordResetEmail, getAdditionalUserInfo, deleteUser, updateProfile } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth as firebaseAuth, db as firebaseDb } from '../firebase';
import { USER_ROLES } from '../utils/userRoles';
import {
  completeGoogleRedirect,
  createGoogleProvider,
  hasPendingGoogleRedirect,
  signInWithExistingGoogleCredential,
  startStudentGoogleAuth,
  toFriendlyAuthError,
} from '../services/googleAuth';
import { EMAIL_EXISTS_CODES, requestGuestMerge, toFriendlyEmailError } from '../services/guestUpgrade';

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
  // Result of a Google sign-in that fell back to a full-page redirect.
  const [googleRedirect, setGoogleRedirect] = useState(() => (
    hasPendingGoogleRedirect() ? { status: 'pending', error: null } : { status: 'idle', error: null }
  ));

  const auth = firebaseAuth;
  const db = firebaseDb;
  const appId = 'default-app-id';

  // Get user profile with role from Firestore
  const getUserProfile = useCallback(async (userId) => {
    try {
      const userDoc = await getDoc(doc(db, 'artifacts', appId, 'users', userId, 'math_whiz_data', 'profile'));
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
      await setDoc(doc(db, 'artifacts', appId, 'users', userId, 'math_whiz_data', 'profile'), profileData, { merge: true });
    } catch (error) {
      console.error('Error setting user profile:', error);
    }
  }, [db, appId]);

  // Role chosen by an explicit sign-up/sign-in flow for this uid. Keeps
  // onAuthStateChanged (which can read the profile before the flow writes it)
  // from downgrading a brand-new teacher to "student".
  const roleOverrideRef = useRef(null);

  // Make sure a teacher's ID token carries the `role: 'teacher'` custom claim
  // that Firestore rules (isTeacher()) check. Self-registered teachers get it
  // from the set-teacher-claims function; refresh the token afterwards.
  // Skipped for admin-claim users: set-teacher-claims replaces all custom
  // claims and would drop `admin`, and admins already pass isAdmin().
  const ensureTeacherClaims = useCallback(async (firebaseUser) => {
    try {
      const idTokenResult = await firebaseUser.getIdTokenResult();
      if (idTokenResult.claims.role === 'teacher' || idTokenResult.claims.admin === true) return true;
      const idToken = await firebaseUser.getIdToken();
      const response = await fetch('/.netlify/functions/set-teacher-claims', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({ appId }),
      });
      if (!response.ok) {
        console.error('Failed to set teacher claims:', response.status);
        return false;
      }
      await firebaseUser.getIdToken(true);
      return true;
    } catch (claimError) {
      console.error('Error setting teacher claims:', claimError);
      return false;
    }
  }, [appId]);

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
            // Check if this is a teacher with admin claims or a true admin
            const profile = await getUserProfile(firebaseUser.uid);
            
            if (profile && profile.role === USER_ROLES.TEACHER) {
              role = USER_ROLES.TEACHER;
              console.log('Auth Debug - Teacher role with admin claims');
            } else {
              role = USER_ROLES.ADMIN;
              console.log('Auth Debug - Admin role from custom claims');
              
              // Ensure admin user has a profile in Firestore
              if (!profile) {
                await setUserProfile(firebaseUser.uid, {
                  role: USER_ROLES.ADMIN,
                  email: firebaseUser.email,
                  createdAt: new Date(),
                  isAdmin: true
                });
                console.log('Auth Debug - Created admin profile in Firestore');
              }
            }
          } else {
            // Get user profile from Firestore for non-admin users
            const profile = await getUserProfile(firebaseUser.uid);
            console.log('Auth Debug - User profile:', profile);

            if (profile && profile.role) {
              role = profile.role;
              console.log('Auth Debug - Role from profile:', role);

              // Patch missing custom claims for teachers on session restore
              if (role === USER_ROLES.TEACHER && idTokenResult.claims.role !== 'teacher') {
                try {
                  const idToken = await firebaseUser.getIdToken();
                  const response = await fetch('/.netlify/functions/set-teacher-claims', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${idToken}`,
                    },
                    body: JSON.stringify({ appId }),
                  });
                  if (response.ok) {
                    await firebaseUser.getIdToken(true);
                    console.log('Auth Debug - Patched missing teacher custom claims');
                  }
                } catch (claimError) {
                  console.error('Error patching teacher claims:', claimError);
                }
              }
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

          if (roleOverrideRef.current && roleOverrideRef.current.uid === firebaseUser.uid) {
            role = roleOverrideRef.current.role;
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
        roleOverrideRef.current = null;
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
          // Also check that they're not actually a teacher
          const profile = await getUserProfile(result.user.uid);
          if (profile && profile.role === USER_ROLES.TEACHER) {
            await signOut(auth);
            throw new Error('This account is registered as a teacher. Please use the teacher login.');
          }
        } else if (expectedRole === USER_ROLES.TEACHER) {
          // For teacher role, check Firestore profile (custom claims may not be set for self-registered teachers)
          const profile = await getUserProfile(result.user.uid);
          if (!profile || profile.role !== USER_ROLES.TEACHER) {
            await signOut(auth);
            throw new Error('This account is not registered as a teacher. Please use the appropriate login page.');
          }
          // Patch missing custom claims for existing teachers who registered before the fix
          await ensureTeacherClaims(result.user);
        } else {
          // For student, check Firestore profile and ensure no admin claims
          const idTokenResult = await result.user.getIdTokenResult();
          if (idTokenResult.claims.admin) {
            await signOut(auth);
            throw new Error('This account has administrative privileges. Please use the appropriate login.');
          }
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


  // After Google authenticates a student: upgrade a linked guest profile, or
  // check/create the student profile for a normal sign-in.
  const finishStudentGoogleSignIn = useCallback(async ({ user, linkedGuest }) => {
    if (linkedGuest) {
      // Same uid as the guest, so all guest progress is kept.
      await setUserProfile(user.uid, {
        email: user.email,
        role: USER_ROLES.STUDENT,
        isAnonymous: false,
        displayName: user.displayName,
        convertedAt: new Date(),
      });
      setUser(user);
      setUserRole(USER_ROLES.STUDENT);
      return user;
    }

    const idTokenResult = await user.getIdTokenResult();
    if (idTokenResult.claims.admin) {
      await signOut(auth);
      throw new Error('This account has administrative privileges. Please use the appropriate login.');
    }
    const profile = await getUserProfile(user.uid);
    if (profile) {
      if (profile.role && profile.role !== USER_ROLES.STUDENT) {
        await signOut(auth);
        throw new Error(`This account is registered as a ${profile.role}, not as a student. Please use the ${profile.role} login.`);
      }
    } else {
      await setUserProfile(user.uid, {
        email: user.email,
        role: USER_ROLES.STUDENT,
        createdAt: new Date(),
        isAnonymous: false,
        displayName: user.displayName,
      });
    }
    setUserRole(USER_ROLES.STUDENT);
    return user;
  }, [auth, getUserProfile, setUserProfile]);

  // Student Google sign-in and sign-up share one flow: popup (redirect if the
  // popup is blocked), linking an existing guest session when there is one.
  const studentGoogleAuth = async () => {
    setError(null);
    try {
      const outcome = await startStudentGoogleAuth(auth);
      if (outcome.redirected) return { redirected: true };
      if (outcome.existingAccount) return { existingAccount: outcome.existingAccount };
      const user = await finishStudentGoogleSignIn(outcome);
      return { user, linkedGuest: outcome.linkedGuest, replacedGuest: outcome.replacedGuest };
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  // Finish a Google redirect (popup was blocked) when the page loads again.
  // Guarded by a ref, not a cancel flag: React StrictMode runs effects twice in
  // development, and the redirect result can only be consumed once.
  const redirectHandledRef = useRef(false);
  useEffect(() => {
    if (redirectHandledRef.current || !hasPendingGoogleRedirect()) return;
    redirectHandledRef.current = true;
    (async () => {
      try {
        const outcome = await completeGoogleRedirect(auth);
        if (!outcome) {
          setGoogleRedirect({ status: 'idle', error: null });
          return;
        }
        if (outcome.existingAccount) {
          // A guest tried to link a Google account that already has an account.
          setGoogleRedirect({ status: 'exists', error: null, existingAccount: outcome.existingAccount });
          return;
        }
        await finishStudentGoogleSignIn(outcome);
        setGoogleRedirect({ status: 'success', error: null });
      } catch (redirectError) {
        console.error('Google redirect sign-in failed:', redirectError);
        setGoogleRedirect({ status: 'error', error: redirectError.message });
      }
    })();
  }, [auth, finishStudentGoogleSignIn]);

  const clearGoogleRedirect = useCallback(() => {
    setGoogleRedirect({ status: 'idle', error: null });
  }, []);

  // Google sign-up (students only).
  const registerWithGoogle = async (expectedRole = USER_ROLES.STUDENT) => {
    if (expectedRole !== USER_ROLES.STUDENT) {
      const roleError = new Error('Only student accounts can be created with Google here.');
      setError(roleError.message);
      throw roleError;
    }
    return studentGoogleAuth();
  };

  // Teacher Google sign-in uses the same rule as teacher email login: the
  // Firestore profile must say role 'teacher' (custom claims are patched
  // afterwards). With allowSignUp (the "Sign up with Google" button), a Google
  // account with no profile yet becomes a teacher, mirroring the open email
  // teacher sign-up. Anything else is signed out with a clear message.
  const finishTeacherGoogleSignIn = async (result, { allowSignUp = false } = {}) => {
    const user = result.user;
    const isNewUser = Boolean(getAdditionalUserInfo(result)?.isNewUser);
    const rejectAccount = async (message) => {
      if (isNewUser) {
        // Don't leave an empty auth account behind for a rejected first login.
        try {
          await deleteUser(user);
        } catch (deleteError) {
          await signOut(auth);
        }
      } else {
        await signOut(auth);
      }
      throw new Error(message);
    };

    const idTokenResult = await user.getIdTokenResult();
    const profile = await getUserProfile(user.uid);

    if (profile && profile.role === USER_ROLES.TEACHER) {
      roleOverrideRef.current = { uid: user.uid, role: USER_ROLES.TEACHER };
      await ensureTeacherClaims(user);
      setUserRole(USER_ROLES.TEACHER);
      return user;
    }
    if (idTokenResult.claims.admin === true) {
      return rejectAccount('This Google account is an administrator account. Please use the admin login.');
    }
    if (profile && profile.role) {
      return rejectAccount(`This Google account is registered as a ${profile.role}, not a teacher. Please use the ${profile.role} login.`);
    }
    if (!allowSignUp) {
      return rejectAccount('No teacher account was found for this Google account. Use "Sign up with Google" to create one.');
    }

    roleOverrideRef.current = { uid: user.uid, role: USER_ROLES.TEACHER };
    await setUserProfile(user.uid, {
      email: user.email,
      role: USER_ROLES.TEACHER,
      displayName: user.displayName || (user.email ? user.email.split('@')[0] : ''),
      createdAt: new Date(),
      isAnonymous: false,
    });
    await ensureTeacherClaims(user);
    setUserRole(USER_ROLES.TEACHER);
    return user;
  };

  // Sign in with Google and verify role
  const loginWithGoogle = async (expectedRole, options = {}) => {
    if (expectedRole === USER_ROLES.STUDENT) {
      return studentGoogleAuth();
    }
    try {
      setError(null);
      const provider = expectedRole === USER_ROLES.TEACHER ? createGoogleProvider() : new GoogleAuthProvider();

      let result;
      try {
        result = await signInWithPopup(auth, provider);
      } catch (popupError) {
        throw toFriendlyAuthError(popupError);
      }
      const user = result.user;

      // For admin role, check custom claims
      if (expectedRole === USER_ROLES.ADMIN) {
        const idTokenResult = await user.getIdTokenResult();
        if (!idTokenResult.claims.admin) {
          await signOut(auth);
          throw new Error(`This account is not registered as a ${expectedRole}`);
        }
        // Also check that they're not actually a teacher
        const profile = await getUserProfile(user.uid);
        if (profile && profile.role === USER_ROLES.TEACHER) {
          await signOut(auth);
          throw new Error('This account is registered as a teacher. Please use the teacher login.');
        }
      } else if (expectedRole === USER_ROLES.TEACHER) {
        return await finishTeacherGoogleSignIn(result, options);
      } else {
        // For other roles, check Firestore profile
        const idTokenResult = await user.getIdTokenResult();
        if (idTokenResult.claims.admin) {
          await signOut(auth);
          throw new Error('This account has administrative privileges. Please use the appropriate login.');
        }
        const profile = await getUserProfile(user.uid);
        if (profile) {
          if (profile.role !== expectedRole) {
            await signOut(auth);
            throw new Error(`This account is registered as a ${profile.role}, not as a ${expectedRole}.`);
          }
        } else {
          // If no profile exists, create one for the new user (only for students)
          if (expectedRole === USER_ROLES.STUDENT) {
            await setUserProfile(user.uid, {
              email: user.email,
              role: expectedRole,
              createdAt: new Date(),
              isAnonymous: false,
              displayName: user.displayName,
            });
          } else {
            await signOut(auth);
            throw new Error(`No profile found for this account. Please contact your administrator.`);
          }
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
      
      // // For teacher registration, use the create-teacher API to get admin claims
      // if (role === USER_ROLES.TEACHER) {
      //   throw new Error('Teacher accounts must be created by administrators through the admin portal. Please contact your administrator to create a teacher account.');
      // }

      // If user is anonymous, link the account. Otherwise, create a new one.
      if (auth.currentUser && auth.currentUser.isAnonymous) {
        // Link first (same uid, so the guest's progress is kept), then mark the
        // profile as converted. Writing the profile first would leave a guest
        // profile claiming an email it doesn't own when the link fails
        // (e.g. email already in use).
        const guestUid = auth.currentUser.uid;
        roleOverrideRef.current = { uid: guestUid, role };
        const credential = EmailAuthProvider.credential(email, password);
        let result;
        try {
          result = await linkWithCredential(auth.currentUser, credential);
        } catch (linkError) {
          roleOverrideRef.current = null;
          throw linkError;
        }
        await setUserProfile(guestUid, {
          email,
          role,
          isAnonymous: false,
          convertedAt: new Date(),
          ...additionalData
        });

        // For teacher registration, set custom claims via backend
        if (role === USER_ROLES.TEACHER) {
          try {
            const idToken = await result.user.getIdToken();
            const response = await fetch('/.netlify/functions/set-teacher-claims', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${idToken}`,
              },
              body: JSON.stringify({ appId }),
            });
            if (response.ok) {
              await result.user.getIdToken(true);
            } else {
              console.error('Failed to set teacher claims:', await response.text());
            }
          } catch (claimError) {
            console.error('Error setting teacher claims:', claimError);
          }
        }

        // Manually set the role to avoid race condition
        setUserRole(role);

        return result.user;
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

      // For teacher registration, set custom claims via backend
      if (role === USER_ROLES.TEACHER) {
        try {
          const idToken = await result.user.getIdToken();
          const response = await fetch('/.netlify/functions/set-teacher-claims', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${idToken}`,
            },
            body: JSON.stringify({ appId }),
          });
          if (response.ok) {
            // Force token refresh to pick up new custom claims
            await result.user.getIdToken(true);
          } else {
            console.error('Failed to set teacher claims:', await response.text());
          }
        } catch (claimError) {
          console.error('Error setting teacher claims:', claimError);
        }
      }

      // Manually set the role since onAuthStateChanged may have already
      // fired before the profile was written (race condition)
      setUserRole(role);

      return result.user;
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  // Logout
  // ---- Guest -> real account ------------------------------------------------
  // Both save paths link a credential to the current anonymous user, so the
  // uid and all guest data stay put. If the Google account / email already has
  // its own Math Whiz account they resolve with { existingAccount } and the UI
  // offers signInAndMergeGuest().
  const pendingGuestMergeRef = useRef(null);

  const requireGuest = () => {
    if (!auth.currentUser || !auth.currentUser.isAnonymous) {
      throw new Error('You’re already signed in to an account.');
    }
    return auth.currentUser;
  };

  const saveGuestWithGoogle = async () => {
    requireGuest();
    return studentGoogleAuth();
  };

  const saveGuestWithEmail = async ({ email, password, displayName }) => {
    setError(null);
    const guest = requireGuest();
    roleOverrideRef.current = { uid: guest.uid, role: USER_ROLES.STUDENT };
    let result;
    try {
      result = await linkWithCredential(guest, EmailAuthProvider.credential(email, password));
    } catch (linkError) {
      roleOverrideRef.current = null;
      if (EMAIL_EXISTS_CODES.has(linkError?.code)) {
        return { existingAccount: { method: 'password', email } };
      }
      throw toFriendlyEmailError(linkError);
    }
    const name = (displayName || '').trim();
    await setUserProfile(guest.uid, {
      email,
      role: USER_ROLES.STUDENT,
      isAnonymous: false,
      convertedAt: new Date(),
      ...(name ? { displayName: name } : {}),
    });
    if (name) {
      try {
        await updateProfile(result.user, { displayName: name });
      } catch (e) {
        // the auth user's display name is cosmetic
      }
    }
    setUserRole(USER_ROLES.STUDENT);
    return { user: result.user, linkedGuest: true };
  };

  const runGuestMerge = async () => {
    const pending = pendingGuestMergeRef.current;
    if (!pending || !auth.currentUser) throw new Error('There is no guest progress waiting to be moved.');
    const data = await requestGuestMerge({ user: auth.currentUser, guestIdToken: pending.guestIdToken, appId });
    pendingGuestMergeRef.current = null;
    return { merged: true, summary: data.summary };
  };

  // Sign into the existing account and move the guest's progress into it.
  const signInAndMergeGuest = async (existingAccount, { password } = {}) => {
    setError(null);
    const guest = requireGuest();
    // Captured before switching: the server's proof that this guest is ours.
    const guestIdToken = await guest.getIdToken();

    let user;
    if (existingAccount?.method === 'google') {
      user = await signInWithExistingGoogleCredential(auth, existingAccount.credential);
    } else {
      try {
        const result = await signInWithEmailAndPassword(auth, existingAccount?.email, password);
        user = result.user;
      } catch (signInError) {
        throw toFriendlyEmailError(signInError);
      }
    }

    const idTokenResult = await user.getIdTokenResult();
    const profile = await getUserProfile(user.uid);
    if (idTokenResult.claims.admin || (profile?.role && profile.role !== USER_ROLES.STUDENT)) {
      await signOut(auth);
      throw new Error('That account isn’t a student account, so guest progress can’t be moved into it. Use the teacher login for that account.');
    }
    setUserRole(USER_ROLES.STUDENT);
    pendingGuestMergeRef.current = { guestIdToken };
    return runGuestMerge();
  };

  const retryGuestMerge = () => runGuestMerge();

  const logout = async () => {
    try {
      setError(null);
      await signOut(auth);
    } catch (error) {
      setError('Failed to sign out');
      throw error;
    }
  };

  // Reset password
  const resetPassword = async (email) => {
    try {
      setError(null);
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      setError(error.message);
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
    registerWithGoogle,
    googleRedirect,
    clearGoogleRedirect,
    registerWithEmail,
    saveGuestWithGoogle,
    saveGuestWithEmail,
    signInAndMergeGuest,
    retryGuestMerge,
    logout,
    resetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
