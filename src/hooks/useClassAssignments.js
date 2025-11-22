import { useCallback } from 'react';
import { getAuth } from 'firebase/auth';
import { doc, getFirestore, updateDoc } from 'firebase/firestore';

const DEFAULT_APP_ID = 'default-app-id';

const parseJson = async (response) => {
  try {
    return await response.json();
  } catch (err) {
    return {};
  }
};

const useClassAssignments = ({ appId = DEFAULT_APP_ID } = {}) => {
  const db = getFirestore();

  const getToken = useCallback(async () => {
    const auth = getAuth();
    const token = await auth.currentUser?.getIdToken();
    if (!token) {
      throw new Error('User not authenticated');
    }
    return token;
  }, []);

  const findEnrollmentId = useCallback(async (token, classId, studentId) => {
    const url = `/.netlify/functions/class-students?classId=${classId}&studentId=${studentId}&appId=${appId}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const data = await parseJson(response);
      throw new Error(data.error || 'Failed to query class enrollment');
    }

    const enrollments = await response.json();
    const enrollment = enrollments.find((entry) => entry.studentId === studentId && entry.classId === classId);
    return enrollment ? enrollment.id : null;
  }, [appId]);

  const removeStudentFromClass = useCallback(async ({ studentId, classId }) => {
    if (!studentId || !classId) {
      throw new Error('Student ID and class ID are required');
    }

    const token = await getToken();
    const enrollmentId = await findEnrollmentId(token, classId, studentId);

    if (enrollmentId) {
      const response = await fetch(`/.netlify/functions/class-students?id=${enrollmentId}&appId=${appId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const data = await parseJson(response);
        throw new Error(data.error || 'Failed to remove student from class');
      }
    }

    const profileRef = doc(db, 'artifacts', appId, 'users', studentId, 'math_whiz_data', 'profile');
    await updateDoc(profileRef, {
      classId: null,
      updatedAt: new Date().toISOString(),
    });
  }, [appId, db, findEnrollmentId, getToken]);

  const assignStudentToClass = useCallback(async ({
    studentId,
    classId,
    studentName,
    studentEmail,
    currentClassId,
  }) => {
    if (!studentId || !classId) {
      throw new Error('Student ID and class ID are required to assign');
    }

    const token = await getToken();

    if (currentClassId && currentClassId !== classId) {
      try {
        await removeStudentFromClass({ studentId, classId: currentClassId });
      } catch (err) {
        console.warn('[useClassAssignments] Failed to remove prior enrollment but continuing', err);
      }
    }

    const response = await fetch('/.netlify/functions/class-students', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        classId,
        studentId,
        studentEmail: studentEmail || '',
        studentName: studentName || studentEmail || 'Student',
        appId,
      }),
    });

    if (!response.ok) {
      const data = await parseJson(response);
      throw new Error(data.error || 'Failed to assign student to class');
    }

    const profileRef = doc(db, 'artifacts', appId, 'users', studentId, 'math_whiz_data', 'profile');
    await updateDoc(profileRef, {
      classId,
      updatedAt: new Date().toISOString(),
    });
  }, [appId, db, getToken, removeStudentFromClass]);

  return {
    assignStudentToClass,
    removeStudentFromClass,
  };
};

export default useClassAssignments;
