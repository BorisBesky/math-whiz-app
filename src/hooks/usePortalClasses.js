import { useCallback, useEffect, useMemo, useState } from 'react';
import { addDoc, collection, getFirestore, onSnapshot, query, where } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { USER_ROLES } from '../utils/userRoles';

const DEFAULT_STATE = [];

const usePortalClasses = ({ appId = 'default-app-id', userRole, userId, userEmail }) => {
  const [classes, setClasses] = useState(DEFAULT_STATE);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const db = getFirestore();

  useEffect(() => {
    if (!db || !userRole || (userRole !== USER_ROLES.ADMIN && !userId)) {
      setLoading(false);
      return undefined;
    }

    setLoading(true);
    setError(null);

    const classesRef = collection(db, 'artifacts', appId, 'classes');
    const queryRef = userRole === USER_ROLES.ADMIN
      ? classesRef
      : query(classesRef, where('teacherIds', 'array-contains', userId));

    const unsubscribe = onSnapshot(queryRef, (snapshot) => {
      const data = snapshot.docs.map((docSnapshot) => ({
        id: docSnapshot.id,
        ...docSnapshot.data(),
      }));
      setClasses(data);
      setLoading(false);
    }, (err) => {
      console.error('[usePortalClasses] Failed to load classes', err);
      setError(err?.message || 'Failed to load classes');
      setLoading(false);
    });

    return unsubscribe;
  }, [appId, db, userRole, userId]);

  const summary = useMemo(() => ({
    total: classes.length,
    grades: Array.from(new Set(classes.map((cls) => cls.gradeLevel || cls.grade || 'Unknown'))),
  }), [classes]);

  const createClass = useCallback(async (classData, options = {}) => {
    if (!db) {
      throw new Error('Firestore is not initialized');
    }

    if (!userRole || (userRole !== USER_ROLES.TEACHER && userRole !== USER_ROLES.ADMIN)) {
      throw new Error('You do not have permission to create classes');
    }

    const ownerId = options.teacherId || userId;
    if (!ownerId) {
      throw new Error('Teacher ID is required to create a class');
    }

    const ownerEmail = options.teacherEmail || userEmail || null;
    const payload = {
      ...classData,
      teacherIds: [ownerId],
      createdBy: ownerId,
      teacherId: ownerId, // backward compat
      teacherEmail: ownerEmail,
      createdAt: new Date(),
    };

    const classesRef = collection(db, 'artifacts', appId, 'classes');
    await addDoc(classesRef, payload);
  }, [appId, db, userEmail, userId, userRole]);

  const deleteClass = useCallback(async (classId) => {
    if (!userRole || (userRole !== USER_ROLES.TEACHER && userRole !== USER_ROLES.ADMIN)) {
      throw new Error('You do not have permission to delete classes');
    }

    if (!window.confirm('Are you sure you want to delete this class? This action cannot be undone.')) {
      return;
    }

    try {
      // Get auth token for the API call
      const auth = getAuth();
      const token = await auth.currentUser?.getIdToken();

      if (!token) {
        throw new Error('Authentication required');
      }

      // Use the serverless function to delete class (handles enrollments and permissions)
      const response = await fetch(`/.netlify/functions/classes?id=${classId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to delete class');
      }
    } catch (err) {
      console.error('Error deleting class:', err);
      throw new Error(err.message || 'Failed to delete class');
    }
  }, [userRole]);

  return { classes, loading, error, summary, createClass, deleteClass };
};

export default usePortalClasses;
