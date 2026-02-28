import { useCallback, useEffect, useMemo, useState } from 'react';
import { getAuth } from 'firebase/auth';
import { getTodayDateString } from '../utils/common_utils';
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
        throw new Error(errorData.error || `Request failed with status ${response.status}`);
      }

      const rawStudentData = await response.json();
      const today = getTodayDateString();
      let totalQuestions = 0;
      let totalCorrect = 0;
      let activeToday = 0;

      const processed = rawStudentData.map((data) => {
        const answeredQuestions = data.answeredQuestions || [];
        const questionsToday = answeredQuestions.filter((q) => q.date === today);
        const correctAnswers = answeredQuestions.filter((q) => q.isCorrect).length;
        const totalStudentQuestions = answeredQuestions.length;
        const accuracy = totalStudentQuestions > 0 ? (correctAnswers / totalStudentQuestions) * 100 : 0;

        if (questionsToday.length > 0) {
          activeToday += 1;
        }

        totalQuestions += totalStudentQuestions;
        totalCorrect += correctAnswers;

        const classInfo = data.classId ? classMap.get(data.classId) : null;

        return {
          id: data.id,
          email: data.email || null,
          displayName: getStudentDisplayName(data),
          classId: data.classId || null,
          className: classInfo?.name || data.className || 'Unassigned',
          grade: data.selectedGrade || classInfo?.gradeLevel || 'N/A',
          coins: data.coins || 0,
          totalQuestions: totalStudentQuestions,
          accuracy: Math.round(accuracy),
          questionsToday: questionsToday.length,
          answeredQuestions,
          dailyGoalsByGrade: data.dailyGoalsByGrade || {},
          latestActivity: answeredQuestions.length > 0
            ? answeredQuestions[answeredQuestions.length - 1].timestamp
            : null,
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
  }, [appId, classMap]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const classCounts = useMemo(() => {
    return students.reduce((acc, student) => {
      if (!student.classId) {
        return acc;
      }
      acc[student.classId] = (acc[student.classId] || 0) + 1;
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
