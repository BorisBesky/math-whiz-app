import { useCallback, useEffect, useState } from 'react';
import { getAuth } from 'firebase/auth';

const defaultState = [];

const usePortalTeachers = ({ appId = 'default-app-id', enabled }) => {
  const [teachers, setTeachers] = useState(defaultState);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState(null);

  const fetchTeachers = useCallback(async () => {
    if (!enabled) {
      setTeachers(defaultState);
      setLoading(false);
      return;
    }

    const auth = getAuth();
    const token = await auth.currentUser?.getIdToken();
    if (!token) {
      throw new Error('Not authenticated');
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/.netlify/functions/get-all-teachers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ appId }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to load teachers');
      }

      const teachersList = await response.json();
      setTeachers(teachersList);
    } catch (err) {
      console.error('[usePortalTeachers] Failed to fetch teachers', err);
      setError(err.message || 'Failed to load teachers');
      setTeachers(defaultState);
    } finally {
      setLoading(false);
    }
  }, [appId, enabled]);

  useEffect(() => {
    fetchTeachers().catch((err) => {
      console.error(err);
      setError(err.message || 'Failed to load teachers');
      setLoading(false);
    });
  }, [fetchTeachers]);

  const createTeacher = useCallback(async ({ name, email }) => {
    if (!enabled) return;
    const auth = getAuth();
    const token = await auth.currentUser?.getIdToken();
    if (!token) {
      throw new Error('Not authenticated');
    }

    const response = await fetch('/.netlify/functions/create-teacher', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name, email, appId }),
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(result.error || 'Failed to create teacher');
    }

    await fetchTeachers();
    return result;
  }, [appId, enabled, fetchTeachers]);

  const deleteTeacher = useCallback(async ({ id, uid, name, email }) => {
    if (!enabled) return;
    const auth = getAuth();
    const token = await auth.currentUser?.getIdToken();
    if (!token) {
      throw new Error('Not authenticated');
    }

    const response = await fetch('/.netlify/functions/delete-teacher', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ teacherId: id, teacherUid: uid, appId }),
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(result.error || `Failed to delete ${name || email || 'teacher'}`);
    }

    await fetchTeachers();
    return result;
  }, [appId, enabled, fetchTeachers]);

  return {
    teachers,
    loading,
    error,
    createTeacher,
    deleteTeacher,
    refresh: fetchTeachers,
  };
};

export default usePortalTeachers;
