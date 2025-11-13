import React, { useState, useEffect } from 'react';
import { getFirestore, collection, onSnapshot, doc, deleteDoc, addDoc, getDocs, updateDoc, setDoc, collectionGroup } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import QuestionBankManager from './QuestionBankManager';

const AdminQuestionBankManager = ({ classes, appId }) => {
  const [teacherQuestions, setTeacherQuestions] = useState([]);
  const [sharedQuestions, setSharedQuestions] = useState([]);
  const [allTeachers, setAllTeachers] = useState([]);
  const [loading, setLoading] = useState(true);

  const db = getFirestore();
  const currentAppId = appId || 'default-app-id';
  const auth = getAuth();

  // Load all teachers
  useEffect(() => {
    const loadTeachers = async () => {
      let retries = 0;
      const maxRetries = 3;
      
      while (retries <= maxRetries) {
        try {
          console.log('[AdminQuestionBankManager] Loading teachers using collectionGroup query (attempt', retries + 1, '/', maxRetries + 1, ')');
          // Use collectionGroup to query all math_whiz_data/profile documents
          const profilesGroup = collectionGroup(db, 'math_whiz_data');
          const profilesSnapshot = await getDocs(profilesGroup);
          
          console.log('[AdminQuestionBankManager] Found', profilesSnapshot.size, 'profiles');
          const teachersList = [];
          
          profilesSnapshot.forEach((profileDoc) => {
            const data = profileDoc.data();
            // Extract userId from the document path: artifacts/{appId}/users/{userId}/math_whiz_data/profile
            const userId = profileDoc.ref.parent.parent.id;
            
            console.log('[AdminQuestionBankManager] User', userId, 'role:', data.role);
            
            if (data.role === 'teacher' || data.role === 'admin') {
              teachersList.push({
                id: userId,
                email: data.email || userId,
                name: data.name || data.displayName || data.email || userId
              });
            }
          });
          
          console.log('[AdminQuestionBankManager] Successfully loaded', teachersList.length, 'teachers/admins:', teachersList);
          setAllTeachers(teachersList);
          return; // Success, exit the retry loop
        } catch (err) {
          const errorMessage = err?.message || err?.toString() || 'Unknown error';
          const errorCode = err?.code?.toLowerCase() || '';
          
          // Check if error is retryable
          const retryableErrors = ['unavailable', 'deadline-exceeded', 'resource-exhausted'];
          const isRetryable = retryableErrors.some(code => 
            errorCode.includes(code) || errorMessage.toLowerCase().includes(code)
          );
          
          // Check if this is a missing index error (not retryable)
          const isMissingIndex = errorMessage.toLowerCase().includes('index') || 
                                  errorMessage.toLowerCase().includes('requires an index');
          
          if (retries === maxRetries || !isRetryable || isMissingIndex) {
            console.error('[AdminQuestionBankManager] Error loading teachers after', retries + 1, 'attempts:', {
              error: err,
              code: err?.code,
              message: errorMessage
            });
            
            // Show user-friendly error message
            if (isMissingIndex) {
              console.error('[AdminQuestionBankManager] Missing Firestore index. Please check the console for the index creation link.');
            }
            
            // Set empty array so UI doesn't stay in loading state forever
            setAllTeachers([]);
            return;
          }
          
          // Retry with exponential backoff
          retries++;
          const delay = Math.min(1000 * Math.pow(2, retries - 1), 5000);
          console.warn('[AdminQuestionBankManager] Retrying teacher load in', delay, 'ms due to:', errorMessage);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
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
      
      // Query without orderBy to avoid index requirements
      const unsubscribe = onSnapshot(questionBankRef, (snapshot) => {
        console.log(`[AdminQuestionBankManager] Loaded ${snapshot.size} questions for teacher ${teacher.name} (${teacher.id})`);
        const questionsData = snapshot.docs.map(doc => ({
          id: doc.id,
          userId: teacher.id,
          teacherName: teacher.name,
          teacherEmail: teacher.email,
          collection: 'questionBank',
          ...doc.data()
        }));

        // Sort client-side by createdAt
        questionsData.sort((a, b) => {
          if (a.createdAt && b.createdAt) {
            const timeA = a.createdAt.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
            const timeB = b.createdAt.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
            return timeB - timeA; // desc
          }
          return 0;
        });

        setTeacherQuestions(prev => {
          const filtered = prev.filter(q => q.userId !== teacher.id);
          return [...filtered, ...questionsData];
        });
      }, (err) => {
        const errorMessage = err?.message || err?.toString() || 'Unknown error';
        console.error(`[AdminQuestionBankManager] Error loading questions for teacher ${teacher.id}:`, {
          error: err,
          code: err?.code,
          message: errorMessage,
          teacherId: teacher.id,
          teacherName: teacher.name
        });
        
        // Check if this is a missing index error
        if (errorMessage.toLowerCase().includes('index') || errorMessage.toLowerCase().includes('requires an index')) {
          console.warn(`[AdminQuestionBankManager] Missing index for teacher ${teacher.name}'s questions. Please check the console for the index creation link.`);
        }
        
        // Continue loading other teachers' questions even if one fails
        // Remove this teacher's questions from the list if they were previously loaded
        setTeacherQuestions(prev => prev.filter(q => q.userId !== teacher.id));
      });

      unsubscribes.push(unsubscribe);
    });

    return () => unsubscribes.forEach(unsub => unsub());
  }, [db, currentAppId, allTeachers]);

  // Load shared questions
  useEffect(() => {
    if (!db) return;

    const sharedRef = collection(db, 'artifacts', currentAppId, 'sharedQuestionBank');
    
    // Query without orderBy to avoid index requirements
    console.log('[AdminQuestionBankManager] Loading shared questions');
    const unsubscribe = onSnapshot(sharedRef, (snapshot) => {
      console.log(`[AdminQuestionBankManager] Loaded ${snapshot.size} shared questions`);
      const questionsData = snapshot.docs.map(doc => ({
        id: doc.id,
        collection: 'sharedQuestionBank',
        ...doc.data()
      }));
      
      // Sort client-side by addedAt or createdAt
      questionsData.sort((a, b) => {
        const timeFieldA = a.addedAt || a.createdAt;
        const timeFieldB = b.addedAt || b.createdAt;
        if (timeFieldA && timeFieldB) {
          const timeA = timeFieldA.toDate ? timeFieldA.toDate() : new Date(timeFieldA);
          const timeB = timeFieldB.toDate ? timeFieldB.toDate() : new Date(timeFieldB);
          return timeB - timeA; // desc
        }
        return 0;
      });
      
      setSharedQuestions(questionsData);
      setLoading(false);
    }, (err) => {
      const errorMessage = err?.message || err?.toString() || 'Unknown error';
      console.error('[AdminQuestionBankManager] Error loading shared questions:', {
        error: err,
        code: err?.code,
        message: errorMessage
      });
      
      // Check if this is a missing index error
      if (errorMessage.toLowerCase().includes('index') || errorMessage.toLowerCase().includes('requires an index')) {
        console.warn('[AdminQuestionBankManager] Missing index for shared questions. Please check the console for the index creation link.');
      }
      
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

        // Create reference document in class questions subcollection
        const classQuestionRef = doc(db, 'artifacts', currentAppId, 'classes', classId, 'questions', questionId);
        updates.push(
          setDoc(classQuestionRef, {
            // Reference information
            questionBankRef: question.collection === 'questionBank' 
              ? `artifacts/${currentAppId}/users/${question.userId}/questionBank/${questionId}`
              : `artifacts/${currentAppId}/sharedQuestionBank/${questionId}`,
            teacherId: question.userId || null,
            assignedAt: new Date(),
            isSharedQuestion: question.collection === 'sharedQuestionBank',
            
            // Essential question data (for querying and display)
            topic: question.topic,
            grade: question.grade,
            question: question.question,
            correctAnswer: question.correctAnswer,
            options: question.options,
            hint: question.hint || '',
            standard: question.standard || '',
            concept: question.concept || '',
            images: question.images || [],
            source: question.source || 'questionBank',
            pdfSource: question.pdfSource || '',
            createdAt: question.createdAt || new Date(),
            createdBy: question.createdBy || question.userId
          }, { merge: true })
        );

        // Update assignedClasses array in original question
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
