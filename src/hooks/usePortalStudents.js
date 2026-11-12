import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
  const hasLoadedRef = useRef(false);
  const refreshInFlightRef = useRef(false);

  const classMap = useMemo(() => {
    return classes.reduce((acc, cls) => {
      acc.set(cls.id, cls);
      return acc;
    }, new Map());
  }, [classes]);

  // Stable signature of the current class-id SET so we only trigger a fetch
  // when the set of enrolled classes actually changes — not every time the
  // classes array identity flips (which happens on each `onSnapshot` tick in
  // usePortalClasses). Without this, a teacher sitting on the Students tab
  // paid an N× Firestore round-trip + /get-all-students call every time
  // their classes stream re-fired, dominated by the parent snapshot
  // frequency, not by their own actions.
  const classIdsKey = useMemo(
    () => classes.map((cls) => cls.id).sort().join('|'),
    [classes]
  );

  // Keep `classes` + `classMap` reachable from the fetch callback without
  // forcing a re-fetch when only their identity changed. `classMap.get(id)`
  // for the row's className/gradeLevel uses the freshest data available at
  // fetch time, same as before.
  const classesRef = useRef(classes);
  const classMapRef = useRef(classMap);
  useEffect(() => {
    classesRef.current = classes;
    classMapRef.current = classMap;
  }, [classes, classMap]);

  const fetchStudents = useCallback(async () => {
    if (refreshInFlightRef.current) return;
    refreshInFlightRef.current = true;
    const isInitialLoad = !hasLoadedRef.current;

    try {
      const auth = getAuth();
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('No authenticated user found');
      }

      if (isInitialLoad) setLoading(true);
      setError(null);

      const token = await currentUser.getIdToken();
      const response = await fetch('/.netlify/functions/get-all-students', {
        method: 'POST',
        cache: 'no-store',
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
      const db = getFirestore();
      const classEnrollmentsMap = new Map();

      // Batch every class's enrollment read through a single `classId in [...]`
      // query per 30-class chunk (Firestore's `in` operator cap). The previous
      // per-class parallel fan-out still cost one round-trip per class on
      // every 30 s auto-refresh; one chunk of 30 classes is now one round-trip
      // and one billed read-set, not 30. Errors on one chunk don't block the
      // others; a bad chunk logs and yields empty enrollments for its classes.
      const classesSnapshot = classesRef.current;
      const classMapSnapshot = classMapRef.current;
      const classIds = classesSnapshot.map((cls) => cls.id);
      const knownClassIds = new Set(classIds);
      const classIdChunks = [];
      for (let i = 0; i < classIds.length; i += 30) {
        classIdChunks.push(classIds.slice(i, i + 30));
      }
      const enrollmentsCol = collection(db, 'artifacts', appId, 'classStudents');

      await Promise.all(
        classIdChunks.map(async (chunk) => {
          try {
            const snapshot = await getDocs(query(enrollmentsCol, where('classId', 'in', chunk)));
            snapshot.forEach((docSnapshot) => {
              const enrollment = docSnapshot.data();
              if (!enrollment || !enrollment.studentId || !enrollment.classId) return;
              if (!knownClassIds.has(enrollment.classId)) return;
              const existingClassIds = classEnrollmentsMap.get(enrollment.studentId) || [];
              if (!existingClassIds.includes(enrollment.classId)) {
                classEnrollmentsMap.set(
                  enrollment.studentId,
                  [...existingClassIds, enrollment.classId]
                );
              }
            });
          } catch (enrollmentError) {
            console.warn(
              '[usePortalStudents] Failed to load enrollments for a class chunk',
              { chunk, error: enrollmentError }
            );
          }
        })
      );

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
          .map((classId) => classMapSnapshot.get(classId)?.name)
          .filter(Boolean);
        const primaryClass = primaryClassId ? classMapSnapshot.get(primaryClassId) : null;

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
      if (isInitialLoad) {
        setError(err?.message || 'Failed to load students');
        setStudents([]);
        setStats(defaultStats);
      }
    } finally {
      hasLoadedRef.current = true;
      refreshInFlightRef.current = false;
      if (isInitialLoad) setLoading(false);
    }
    // Deliberately depends on `classIdsKey`, not `classes` or `classMap`:
    // see the comment above where `classIdsKey` is declared.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appId, classIdsKey]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  useEffect(() => {
    const refreshWhenVisible = () => {
      if (document.visibilityState === 'visible') fetchStudents();
    };
    const intervalId = window.setInterval(refreshWhenVisible, 30000);
    window.addEventListener('focus', refreshWhenVisible);
    document.addEventListener('visibilitychange', refreshWhenVisible);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('focus', refreshWhenVisible);
      document.removeEventListener('visibilitychange', refreshWhenVisible);
    };
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
