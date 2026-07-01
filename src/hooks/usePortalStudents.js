import { useCallback, useEffect, useMemo, useState } from 'react';
import { getAuth } from 'firebase/auth';
import { collection, getDocs, getFirestore, query, where } from 'firebase/firestore';
import { getStudentDisplayName } from '../utils/studentName';

const defaultStats = {
  totalStudents: 0,
  activeToday: 0,
  totalQuestions: 0,
  averageAccuracy: 0,
};

const usePortalStudents = ({ appId = 'default-app-id', classes = [] }) => {
  const [students, setStudents] = useState([]);
  const [stats, setStats] = useState(defaultStats);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const classMap = useMemo(() => {
    return classes.reduce((acc, cls) => {
      acc.set(cls.id, cls);
      return acc;
    }, new Map());
  }, [classes]);

  const fetchStudents = useCallback(async () => {
    try {
      const auth = getAuth();
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('No authenticated user found');
      }

      setLoading(true);
      setError(null);

      const token = await currentUser.getIdToken();
      const response = await fetch('/.netlify/functions/get-all-students', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ appId }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const message = errorData.error || `Request failed with status ${response.status}`;
        throw new Error(errorData.details ? `${message}: ${errorData.details}` : message);
      }

      const rawStudentData = await response.json();
      const db = getFirestore();
      const classEnrollmentsMap = new Map();

      for (const classItem of classes) {
        const enrollmentsQuery = query(
          collection(db, 'artifacts', appId, 'classStudents'),
          where('classId', '==', classItem.id)
        );
        const enrollmentsSnapshot = await getDocs(enrollmentsQuery);
        enrollmentsSnapshot.forEach((docSnapshot) => {
          const enrollment = docSnapshot.data();
          const existingClassIds = classEnrollmentsMap.get(enrollment.studentId) || [];
          if (!existingClassIds.includes(classItem.id)) {
            classEnrollmentsMap.set(enrollment.studentId, [...existingClassIds, classItem.id]);
          }
        });
      }

      let totalQuestions = 0;
      let totalCorrect = 0;
      let activeToday = 0;

      const processed = rawStudentData.map((data) => {
        const correctAnswers = Number(data.correctQuestions || 0);
        const totalStudentQuestions = Number(data.totalQuestions || 0);
        const questionsTodayCount = Number(data.questionsToday || 0);
        const accuracy = totalStudentQuestions > 0 ? (correctAnswers / totalStudentQuestions) * 100 : 0;

        if (questionsTodayCount > 0) {
          activeToday += 1;
        }

        totalQuestions += totalStudentQuestions;
        totalCorrect += correctAnswers;

        const classIds = classEnrollmentsMap.get(data.id) || (data.classId ? [data.classId] : []);
        const primaryClassId = classIds[0] || null;
        const classNames = classIds
          .map((classId) => classMap.get(classId)?.name)
          .filter(Boolean);
        const primaryClass = primaryClassId ? classMap.get(primaryClassId) : null;

        return {
          id: data.id,
          email: data.email || null,
          displayName: getStudentDisplayName(data),
          classId: primaryClassId,
          classIds,
          className: classNames.length > 0 ? classNames.join(', ') : (data.className || 'Unassigned'),
          grade: data.selectedGrade || primaryClass?.gradeLevel || 'N/A',
          coins: data.coins || 0,
          totalQuestions: totalStudentQuestions,
          accuracy: Math.round(accuracy),
          questionsToday: questionsTodayCount,
          answeredQuestions: [],
          historyLoaded: false,
          dailyGoalsByGrade: data.dailyGoalsByGrade || {},
          latestActivity: data.latestActivity || null,
        };
      });

      setStudents(processed);
      setStats({
        totalStudents: processed.length,
        activeToday,
        totalQuestions,
        averageAccuracy: totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0,
      });
    } catch (err) {
      console.error('[usePortalStudents] Failed to load students', err);
      setError(err?.message || 'Failed to load students');
      setStudents([]);
      setStats(defaultStats);
    } finally {
      setLoading(false);
    }
  }, [appId, classMap, classes]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const classCounts = useMemo(() => {
    return students.reduce((acc, student) => {
      if (!student.classIds || student.classIds.length === 0) {
        return acc;
      }
      student.classIds.forEach((classId) => {
        acc[classId] = (acc[classId] || 0) + 1;
      });
      return acc;
    }, {});
  }, [students]);

  return {
    students,
    stats,
    classCounts,
    loading,
    error,
    refresh: fetchStudents,
  };
};

export default usePortalStudents;
