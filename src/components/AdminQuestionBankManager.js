import React, { useState, useEffect } from 'react';
import { getFirestore, collection, onSnapshot, doc, deleteDoc, addDoc, getDocs, updateDoc, setDoc, collectionGroup, deleteField, getDoc, query, where } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import QuestionBankManager from './QuestionBankManager';
import { clearCachedClassQuestions } from '../utils/questionCache';

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
          // Use collectionGroup with role filter to fetch only teacher/admin profiles
          const profilesQuery = query(
            collectionGroup(db, 'math_whiz_data'),
            where('role', 'in', ['teacher', 'admin'])
          );
          const profilesSnapshot = await getDocs(profilesQuery);

          console.log('[AdminQuestionBankManager] Found', profilesSnapshot.size, 'profiles');
          const teachersList = [];
          const seenTeacherIds = new Set();

          profilesSnapshot.forEach((profileDoc) => {
            const data = profileDoc.data();
            // Extract userId from the document path: artifacts/{appId}/users/{userId}/math_whiz_data/profile
            const userId = profileDoc.ref.parent.parent.id;

            console.log('[AdminQuestionBankManager] User', userId, 'role:', data.role);

            if ((data.role === 'teacher' || data.role === 'admin') && !seenTeacherIds.has(userId)) {
              seenTeacherIds.add(userId);
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
          const combined = [...filtered, ...questionsData];
          // Deduplicate by ID to be safe
          const uniqueQuestions = Array.from(new Map(combined.map(q => [q.id, q])).values());
          return uniqueQuestions;
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
      // Spread doc data first, then override id/collection to ensure
      // Firestore doc.id is always used for selection and keys, even
      // if the document contains an "id" field copied from teacher bank.
      const questionsData = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
        collection: 'sharedQuestionBank'
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

      // Deduplicate by ID to prevent duplicate keys in React
      const uniqueQuestions = Array.from(new Map(questionsData.map(q => [q.id, q])).values());
      setSharedQuestions(uniqueQuestions);
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
          // Avoid copying the teacher question's id field into the
          // shared document data; the shared doc will get its own
          // Firestore id, which we use for selection and keys.
          const { id: _ignoreId, ...questionData } = question;
          const sharedRef = collection(db, 'artifacts', currentAppId, 'sharedQuestionBank');
          adds.push(
            addDoc(sharedRef, {
              ...questionData,
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

        const isDrawingQuestion = question.questionType === 'drawing';
        const classQuestionData = {
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
          questionType: question.questionType || 'multiple-choice',
          hint: question.hint || '',
          standard: question.standard || '',
          concept: question.concept || '',
          images: question.images || [],
          source: question.source || 'questionBank',
          pdfSource: question.pdfSource || '',
          createdAt: question.createdAt || new Date(),
          createdBy: question.createdBy || question.userId
        };

        // Only include correctAnswer and options for non-drawing questions
        if (!isDrawingQuestion) {
          classQuestionData.correctAnswer = question.correctAnswer;
          classQuestionData.options = question.options;
        }

        updates.push(
          setDoc(classQuestionRef, classQuestionData, { merge: true })
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

      // Clear cache for affected class/topic/grade combinations
      const affectedCombinations = new Set();
      for (const questionId of selectedQuestionIds) {
        const question = [...teacherQuestions, ...sharedQuestions].find(q => q.id === questionId);
        if (question && question.topic && question.grade) {
          affectedCombinations.add(`${question.topic}_${question.grade}`);
        }
      }

      affectedCombinations.forEach(combo => {
        const [topic, grade] = combo.split('_');
        clearCachedClassQuestions(classId, topic, grade, currentAppId);
      });
    } catch (err) {
      console.error('Error assigning questions to class:', err);
      throw err;
    }
  };

  const handleEditQuestion = async (updatedQuestion) => {
    try {
      console.log('[AdminQuestionBankManager] handleEditQuestion called with:', updatedQuestion);

      const { id, collection: collectionName, userId: questionUserId, teacherName, teacherEmail, ...dataToSave } = updatedQuestion;

      console.log('[AdminQuestionBankManager] Extracted fields:', {
        id,
        collection: collectionName,
        userId: questionUserId,
        questionType: updatedQuestion.questionType,
        dataToSaveKeys: Object.keys(dataToSave)
      });

      if (!id) {
        throw new Error('Question ID is required for editing');
      }

      if (!collectionName) {
        console.error('[AdminQuestionBankManager] ERROR: No collection name!', updatedQuestion);
        throw new Error('Collection is required for editing');
      }

      let questionRef;
      if (collectionName === 'questionBank') {
        questionRef = doc(db, 'artifacts', currentAppId, 'users', questionUserId, 'questionBank', id);
        console.log('[AdminQuestionBankManager] Using teacher question ref:', questionRef.path);
      } else if (collectionName === 'sharedQuestionBank') {
        questionRef = doc(db, 'artifacts', currentAppId, 'sharedQuestionBank', id);
        console.log('[AdminQuestionBankManager] Using shared question ref:', questionRef.path);
      } else {
        console.error('[AdminQuestionBankManager] Unknown collection:', collectionName);
        throw new Error('Unknown collection for question');
      }

      // Deduplicate assignedClasses
      const uniqueAssignedClasses = [...new Set(dataToSave.assignedClasses || [])];

      // Clean data to save - ensure we have all required fields
      const cleanData = {
        topic: dataToSave.topic,
        grade: dataToSave.grade,
        question: dataToSave.question,
        questionType: dataToSave.questionType || 'multiple-choice',
        hint: dataToSave.hint || '',
        standard: dataToSave.standard || '',
        concept: dataToSave.concept || '',
        images: dataToSave.images || [],
        assignedClasses: uniqueAssignedClasses,
        source: dataToSave.source || 'questionBank',
        pdfSource: dataToSave.pdfSource || '',
        createdBy: dataToSave.createdBy || questionUserId,
        updatedAt: new Date()
      };

      // Only include correctAnswer and options for non-drawing questions
      const isDrawingQuestion = cleanData.questionType === 'drawing';
      if (!isDrawingQuestion) {
        cleanData.correctAnswer = dataToSave.correctAnswer || '';
        cleanData.options = dataToSave.options || [];
      } else {
        // Explicitly delete fields for drawing questions
        cleanData.correctAnswer = deleteField();
        cleanData.options = deleteField();
      }

      // Preserve createdAt if it exists
      if (dataToSave.createdAt) {
        cleanData.createdAt = dataToSave.createdAt;
      }

      // For shared questions, preserve additional metadata
      if (collectionName === 'sharedQuestionBank') {
        if (dataToSave.addedBy) cleanData.addedBy = dataToSave.addedBy;
        if (dataToSave.addedAt) cleanData.addedAt = dataToSave.addedAt;
      }

      console.log('[AdminQuestionBankManager] Saving cleaned data:', cleanData);

      // Use setDoc with merge to safely update fields
      await setDoc(questionRef, cleanData, { merge: true });

      // Verify the update by re-fetching the document
      const verifyDoc = await getDoc(questionRef);
      if (verifyDoc.exists()) {
        console.log('[AdminQuestionBankManager] Verified update in DB:', verifyDoc.data());
      } else {
        console.warn('[AdminQuestionBankManager] Could not verify update - document not found');
      }

      // Update class references if needed
      if (uniqueAssignedClasses.length > 0) {
        const updates = uniqueAssignedClasses.map(classId => {
          const classQuestionRef = doc(db, 'artifacts', currentAppId, 'classes', classId, 'questions', id);
          const classData = {
            topic: updatedQuestion.topic,
            grade: updatedQuestion.grade,
            question: updatedQuestion.question,
            questionType: updatedQuestion.questionType || 'multiple-choice',
            hint: updatedQuestion.hint || '',
            standard: updatedQuestion.standard || '',
            concept: updatedQuestion.concept || '',
            images: updatedQuestion.images || [],
          };

          // Only include correctAnswer and options for non-drawing questions
          if (!isDrawingQuestion) {
            classData.correctAnswer = updatedQuestion.correctAnswer;
            classData.options = updatedQuestion.options;
          }

          return setDoc(classQuestionRef, classData, { merge: true });
        });
        await Promise.all(updates);

        // Clear cache
        const affectedCombinations = new Set();
        if (updatedQuestion.topic && updatedQuestion.grade) {
          affectedCombinations.add(`${updatedQuestion.topic}_${updatedQuestion.grade}`);
        }

        uniqueAssignedClasses.forEach(classId => {
          affectedCombinations.forEach(combo => {
            const [topic, grade] = combo.split('_');
            clearCachedClassQuestions(classId, topic, grade, currentAppId);
          });
        });
      }
    } catch (err) {
      console.error('Error updating question:', err);
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
      onEditQuestion={handleEditQuestion}
      groupingMode="teacher-source"
      showViewModeTabs={true}
    />
  );
};

export default AdminQuestionBankManager;
