import { useCallback } from 'react';
import { getAuth } from 'firebase/auth';
import { collection, doc, getDocs, getFirestore, query, updateDoc, where } from 'firebase/firestore';

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
    const remainingEnrollmentsQuery = query(
      collection(db, 'artifacts', appId, 'classStudents'),
      where('studentId', '==', studentId)
    );
    const remainingEnrollmentsSnapshot = await getDocs(remainingEnrollmentsQuery);
    const nextPrimaryClassId = remainingEnrollmentsSnapshot.empty
      ? null
      : remainingEnrollmentsSnapshot.docs[0].data().classId || null;

    await updateDoc(profileRef, {
      classId: nextPrimaryClassId,
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
  }, [appId, db, getToken]);

  return {
    assignStudentToClass,
    removeStudentFromClass,
  };
};

export default useClassAssignments;
