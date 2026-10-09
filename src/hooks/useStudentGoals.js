import { useCallback, useState } from 'react';
import { doc, getFirestore, writeBatch } from 'firebase/firestore';
import { getDefaultGradeKey } from '../content/registry';

/**
 * Shared "set daily goals" flow for one or many students. Owns the GoalsModal
 * state and the Firestore batch write so the Students table and the class
 * roster use the exact same behaviour.
 *
 * Usage:
 *   const { goalsModalProps, openGoalsForStudent, openGoalsForStudents } =
 *     useStudentGoals({ appId, onSaved: refresh });
 *   <GoalsModal {...goalsModalProps} />
 */
const useStudentGoals = ({ appId, onSaved } = {}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [grade, setGrade] = useState(getDefaultGradeKey());
  const [targets, setTargets] = useState({});
  const [studentIds, setStudentIds] = useState([]);

  const openGoalsForStudent = useCallback((student) => {
    if (!student) return;
    const studentGrade = student.grade || getDefaultGradeKey();
    setGrade(studentGrade);
    setTargets(student.dailyGoalsByGrade?.[studentGrade] || {});
    setStudentIds([student.id]);
    setIsOpen(true);
  }, []);

  const openGoalsForStudents = useCallback((ids = []) => {
    const list = Array.from(ids);
    if (list.length === 0) return;
    setGrade(getDefaultGradeKey());
    setTargets({});
    setStudentIds(list);
    setIsOpen(true);
  }, []);

  const closeGoals = useCallback(() => setIsOpen(false), []);

  const saveGoals = useCallback(async ({ grade: savedGrade, targets: savedTargets }) => {
    if (!appId) {
      throw new Error('App ID is missing');
    }
    const db = getFirestore();
    const batch = writeBatch(db);
    studentIds.forEach((studentId) => {
      const studentRef = doc(db, 'artifacts', appId, 'users', studentId, 'math_whiz_data', 'profile');
      batch.update(studentRef, { [`dailyGoalsByGrade.${savedGrade}`]: savedTargets });
    });
    await batch.commit();
    if (onSaved) await onSaved();
  }, [appId, onSaved, studentIds]);

  return {
    goalsModalProps: {
      isOpen,
      onClose: closeGoals,
      initialGrade: grade,
      initialTargets: targets,
      studentCount: studentIds.length,
      onSave: saveGoals,
    },
    isGoalsOpen: isOpen,
    openGoalsForStudent,
    openGoalsForStudents,
    closeGoals,
  };
};

export default useStudentGoals;
