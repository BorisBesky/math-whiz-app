import { useCallback, useEffect, useMemo, useState } from 'react';
import { addDoc, collection, getFirestore, onSnapshot, query, where } from 'firebase/firestore';
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
      : query(classesRef, where('teacherId', '==', userId));

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
      teacherId: ownerId,
      teacherEmail: ownerEmail,
      createdAt: new Date(),
    };

    const classesRef = collection(db, 'artifacts', appId, 'classes');
    await addDoc(classesRef, payload);
  }, [appId, db, userEmail, userId, userRole]);

  return { classes, loading, error, summary, createClass };
};

export default usePortalClasses;
