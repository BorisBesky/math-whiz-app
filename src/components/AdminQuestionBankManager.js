import React, { useState, useEffect } from 'react';
import { getFirestore, collection, query, onSnapshot, doc, deleteDoc, addDoc, getDocs, getDoc, updateDoc, orderBy } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import QuestionBankManager from './QuestionBankManager';

const AdminQuestionBankManager = ({ classes, appId }) => {
  const [teacherQuestions, setTeacherQuestions] = useState([]);
  const [sharedQuestions, setSharedQuestions] = useState([]);
  const [allTeachers, setAllTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const db = getFirestore();
  const currentAppId = appId || 'default-app-id';
  const auth = getAuth();

  // Load all teachers
  useEffect(() => {
    const loadTeachers = async () => {
      try {
        const usersRef = collection(db, 'artifacts', currentAppId, 'users');
        const usersSnapshot = await getDocs(usersRef);
        const teachersList = [];
        
        for (const userDoc of usersSnapshot.docs) {
          try {
            const profileRef = doc(db, 'artifacts', currentAppId, 'users', userDoc.id, 'math_whiz_data', 'profile');
            const profileDoc = await getDoc(profileRef);
            
            if (profileDoc.exists()) {
              const data = profileDoc.data();
              if (data.role === 'teacher' || data.role === 'admin') {
                teachersList.push({
                  id: userDoc.id,
                  email: data.email || userDoc.id,
                  name: data.name || data.displayName || data.email || userDoc.id
                });
              }
            }
          } catch (e) {
            console.warn(`Could not load profile for user ${userDoc.id}:`, e);
          }
        }
        
        setAllTeachers(teachersList);
      } catch (err) {
        console.error('Error loading teachers:', err);
      }
    };

    if (db) {
      loadTeachers();
    }
  }, [db, currentAppId]);

  // Load teacher questions
  useEffect(() => {
    if (!db || allTeachers.length === 0) return;

    const unsubscribes = [];

    // Load questions from all teachers' questionBanks
    allTeachers.forEach(teacher => {
      const questionBankRef = collection(db, 'artifacts', currentAppId, 'users', teacher.id, 'questionBank');
      const q = query(questionBankRef, orderBy('createdAt', 'desc'));

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const questionsData = snapshot.docs.map(doc => ({
          id: doc.id,
          userId: teacher.id,
          teacherName: teacher.name,
          teacherEmail: teacher.email,
          collection: 'questionBank',
          ...doc.data()
        }));

        setTeacherQuestions(prev => {
          const filtered = prev.filter(q => q.userId !== teacher.id);
          return [...filtered, ...questionsData];
        });
      }, (err) => {
        console.error(`Error loading questions for teacher ${teacher.id}:`, err);
      });

      unsubscribes.push(unsubscribe);
    });

    return () => unsubscribes.forEach(unsub => unsub());
  }, [db, currentAppId, allTeachers]);

  // Load shared questions
  useEffect(() => {
    if (!db) return;

    const sharedRef = collection(db, 'artifacts', currentAppId, 'sharedQuestionBank');
    const q = query(sharedRef, orderBy('addedAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const questionsData = snapshot.docs.map(doc => ({
        id: doc.id,
        collection: 'sharedQuestionBank',
        ...doc.data()
      }));
      setSharedQuestions(questionsData);
      setLoading(false);
    }, (err) => {
      console.error('Error loading shared questions:', err);
      setError('Failed to load shared questions');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [db, currentAppId]);

  const handleAddToSharedBank = async (selectedQuestionIds) => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error('Not authenticated');

      const adds = [];
      for (const questionId of selectedQuestionIds) {
        const question = teacherQuestions.find(q => q.id === questionId && q.collection === 'questionBank');
        if (question) {
          const sharedRef = collection(db, 'artifacts', currentAppId, 'sharedQuestionBank');
          adds.push(
            addDoc(sharedRef, {
              ...question,
              createdBy: question.userId,
              addedBy: currentUser.uid,
              addedAt: new Date(),
              collection: 'sharedQuestionBank'
            })
          );
        }
      }

      await Promise.all(adds);
    } catch (err) {
      console.error('Error adding questions to shared bank:', err);
      throw err;
    }
  };

  const handleRemoveFromSharedBank = async (selectedQuestionIds) => {
    if (!window.confirm(`Are you sure you want to remove ${selectedQuestionIds.size} question(s) from shared bank?`)) {
      throw new Error('Cancelled');
    }

    try {
      const deletes = Array.from(selectedQuestionIds)
        .filter(qId => {
          const q = sharedQuestions.find(q => q.id === qId);
          return q && q.collection === 'sharedQuestionBank';
        })
        .map(questionId => {
          const questionRef = doc(db, 'artifacts', currentAppId, 'sharedQuestionBank', questionId);
          return deleteDoc(questionRef);
        });

      await Promise.all(deletes);
    } catch (err) {
      console.error('Error removing questions from shared bank:', err);
      throw err;
    }
  };

  const handleDeleteQuestion = async (selectedQuestionIds) => {
    if (!window.confirm(`Are you sure you want to delete ${selectedQuestionIds.size} question(s)?`)) {
      throw new Error('Cancelled');
    }

    try {
      const deletes = [];
      for (const questionId of selectedQuestionIds) {
        const question = [...teacherQuestions, ...sharedQuestions].find(q => q.id === questionId);
        if (!question) continue;

        if (question.collection === 'questionBank') {
          const questionRef = doc(db, 'artifacts', currentAppId, 'users', question.userId, 'questionBank', questionId);
          deletes.push(deleteDoc(questionRef));
        } else if (question.collection === 'sharedQuestionBank') {
          const questionRef = doc(db, 'artifacts', currentAppId, 'sharedQuestionBank', questionId);
          deletes.push(deleteDoc(questionRef));
        }
      }

      await Promise.all(deletes);
    } catch (err) {
      console.error('Error deleting questions:', err);
      throw err;
    }
  };

  const handleAssignToClass = async (selectedQuestionIds, classId) => {
    try {
      const updates = [];
      for (const questionId of selectedQuestionIds) {
        const question = [...teacherQuestions, ...sharedQuestions].find(q => q.id === questionId);
        if (!question) continue;

        if (question.collection === 'questionBank') {
          const currentAssignedClasses = question.assignedClasses || [];
          if (!currentAssignedClasses.includes(classId)) {
            const questionRef = doc(db, 'artifacts', currentAppId, 'users', question.userId, 'questionBank', questionId);
            updates.push(
              updateDoc(questionRef, {
                assignedClasses: [...currentAssignedClasses, classId]
              })
            );
          }
        } else if (question.collection === 'sharedQuestionBank') {
          const currentAssignedClasses = question.assignedClasses || [];
          if (!currentAssignedClasses.includes(classId)) {
            const questionRef = doc(db, 'artifacts', currentAppId, 'sharedQuestionBank', questionId);
            updates.push(
              updateDoc(questionRef, {
                assignedClasses: [...currentAssignedClasses, classId]
              })
            );
          }
        }
      }

      await Promise.all(updates);
    } catch (err) {
      console.error('Error assigning questions to class:', err);
      throw err;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <QuestionBankManager
      classes={classes}
      appId={appId}
      userId={null}
      questions={teacherQuestions}
      sharedQuestions={sharedQuestions}
      allTeachers={allTeachers}
      isAdmin={true}
      onAddToSharedBank={handleAddToSharedBank}
      onRemoveFromSharedBank={handleRemoveFromSharedBank}
      onDeleteQuestion={handleDeleteQuestion}
      onAssignToClass={handleAssignToClass}
      groupingMode="teacher-source"
      showViewModeTabs={true}
    />
  );
};

export default AdminQuestionBankManager;
