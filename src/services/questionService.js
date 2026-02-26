/* global __app_id */
import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
} from "firebase/firestore";
import { db } from '../firebase';
import { getUserDocRef } from "../utils/firebaseHelpers";
import { getCachedClassQuestions, setCachedClassQuestions } from "../utils/questionCache";
import { isSubtopicAllowed } from "../utils/subtopicUtils";

// Retry helper with exponential backoff
export const retryWithBackoff = async (fn, options = {}) => {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 5000,
    backoffFactor = 2,
    retryableErrors = ['unavailable', 'deadline-exceeded', 'resource-exhausted', 'failed-precondition']
  } = options;

  let lastError;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Check if error is retryable
      const errorCode = error?.code?.toLowerCase() || '';
      const errorMessage = error?.message?.toLowerCase() || '';
      const isRetryable = retryableErrors.some(code =>
        errorCode.includes(code) || errorMessage.includes(code)
      );

      // Check if this is a missing index error (not retryable)
      const isMissingIndex = errorMessage.includes('index') || errorMessage.includes('requires an index');

      if (attempt === maxRetries || !isRetryable || isMissingIndex) {
        throw error;
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(initialDelay * Math.pow(backoffFactor, attempt), maxDelay);
      console.log(`Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
};

export const getQuestionHistory = async (userId) => {
  if (!userId) return [];
  const userDocRef = getUserDocRef(userId);
  const userDoc = await getDoc(userDocRef);
  if (userDoc.exists() && userDoc.data().answeredQuestions) {
    return userDoc.data().answeredQuestions;
  }
  return [];
};

// Fetch answered question bank question IDs from user profile
export const getAnsweredQuestionBankQuestions = async (userId) => {
  if (!userId) return [];
  const userDocRef = getUserDocRef(userId);
  const userDoc = await getDoc(userDocRef);
  if (userDoc.exists() && userDoc.data().answeredQuestionBankQuestions) {
    return userDoc.data().answeredQuestionBankQuestions;
  }
  return [];
};

// Fetch questions from Firestore (class questions, user questionBank, teacher questionBank, shared questionBank)
// Note: Class questions are stored as reference documents that contain both:
//   1. Reference info (questionBankRef, teacherId) pointing to the original question
//   2. Full question data for efficient querying by topic/grade
export const fetchQuestionsFromFirestore = async (topic, grade, userId, classId, answeredQuestionIds, appId, allowedSubtopicsByTopic = null) => {
  const questions = [];
  const currentAppId = appId || (typeof __app_id !== "undefined" ? __app_id : "default-app-id");
  const answeredSet = new Set(answeredQuestionIds || []);
  const seenQuestionIds = new Set(); // Track IDs to avoid duplicates
  const errors = {}; // Track errors by source

  try {
    // 1. Fetch class questions if classId provided (highest priority with retry)
    if (classId) {
      try {
        // Check cache first
        const cachedQuestions = getCachedClassQuestions(classId, topic, grade, currentAppId);

        if (cachedQuestions && cachedQuestions.length > 0) {
          console.log(`[fetchQuestionsFromFirestore] Using cached class questions for classId: ${classId}, topic: ${topic}, grade: ${grade}`);

          let classQuestionsCount = 0;
          cachedQuestions.forEach(cachedQuestion => {
            const questionId = cachedQuestion.questionId;
            if (!questionId) {
              console.warn('[fetchQuestionsFromFirestore] Cached question missing questionId, skipping:', cachedQuestion);
              return;
            }
            // Check subtopic restrictions
            if (!isSubtopicAllowed(cachedQuestion, topic, allowedSubtopicsByTopic)) {
              return; // Skip this question
            }
            if (!answeredSet.has(questionId) && !seenQuestionIds.has(questionId)) {
              seenQuestionIds.add(questionId);
              questions.push({
                ...cachedQuestion,
                questionId: questionId,
                source: 'questionBank',
                collection: 'classQuestions'
              });
              classQuestionsCount++;
            }
          });

          console.log(`[fetchQuestionsFromFirestore] Used ${classQuestionsCount} cached class questions (${cachedQuestions.length} total cached, ${cachedQuestions.length - classQuestionsCount} filtered out)`);
        } else {
          // Cache miss - fetch from Firestore
          console.log(`[fetchQuestionsFromFirestore] Cache miss - fetching class questions for classId: ${classId}, topic: ${topic}, grade: ${grade}`);

          const fetchClassQuestions = async () => {
            const classQuestionsRef = collection(db, 'artifacts', currentAppId, 'classes', classId, 'questions');
            const classQuery = query(
              classQuestionsRef,
              where('topic', '==', topic),
              where('grade', '==', grade)
            );
            return await getDocs(classQuery);
          };

          // Use retry logic for class questions (highest priority)
          const classSnapshot = await retryWithBackoff(fetchClassQuestions, {
            maxRetries: 3,
            initialDelay: 1000
          });

          // Store all fetched questions in cache (before filtering)
          const allFetchedQuestions = [];
          classSnapshot.forEach(doc => {
            allFetchedQuestions.push({
              ...doc.data(),
              questionId: doc.id,
              source: 'questionBank',
              collection: 'classQuestions'
            });
          });

          // Cache the fetched questions
          if (allFetchedQuestions.length > 0) {
            setCachedClassQuestions(classId, topic, grade, currentAppId, allFetchedQuestions);
          }

          // Filter and add to questions array
          let classQuestionsCount = 0;
          classSnapshot.forEach(doc => {
            const questionData = doc.data();
            // Check subtopic restrictions
            if (!isSubtopicAllowed(questionData, topic, allowedSubtopicsByTopic)) {
              return; // Skip this question
            }
            if (!answeredSet.has(doc.id) && !seenQuestionIds.has(doc.id)) {
              seenQuestionIds.add(doc.id);
              questions.push({
                ...questionData,
                questionId: doc.id,
                source: 'questionBank',
                collection: 'classQuestions'
              });
              classQuestionsCount++;
            }
          });

          console.log(`[fetchQuestionsFromFirestore] Successfully fetched ${classQuestionsCount} class questions (${classSnapshot.size} total, ${classSnapshot.size - classQuestionsCount} filtered out)`);
        }
      } catch (err) {
        const errorMessage = err?.message || err?.toString() || 'Unknown error';
        console.error('[fetchQuestionsFromFirestore] Error fetching class questions:', {
          error: err,
          code: err?.code,
          message: errorMessage,
          classId,
          topic,
          grade
        });

        // Check if this is a missing index error
        if (errorMessage.toLowerCase().includes('index') || errorMessage.toLowerCase().includes('requires an index')) {
          errors.classQuestions = {
            type: 'index',
            message: 'Missing Firestore index. Please check the console for the index creation link.',
            details: errorMessage
          };
        } else {
          errors.classQuestions = {
            type: 'query',
            message: `Failed to load class questions: ${errorMessage}`,
            details: errorMessage
          };
        }
      }
    }

    // 2. Fetch user's own questionBank
    if (userId) {
      try {
        console.log(`[fetchQuestionsFromFirestore] Fetching user questionBank for userId: ${userId}, topic: ${topic}, grade: ${grade}`);

        const fetchUserQuestions = async () => {
          const userQuestionBankRef = collection(db, 'artifacts', currentAppId, 'users', userId, 'questionBank');
          const userQuestionBankQuery = query(
            userQuestionBankRef,
            where('topic', '==', topic),
            where('grade', '==', grade)
          );
          return await getDocs(userQuestionBankQuery);
        };

        // Use retry logic but with fewer attempts than class questions
        const userQuestionBankSnapshot = await retryWithBackoff(fetchUserQuestions, {
          maxRetries: 2,
          initialDelay: 500
        });

        let userQuestionsCount = 0;
        userQuestionBankSnapshot.forEach(doc => {
          const questionData = doc.data();
          // Check subtopic restrictions
          if (!isSubtopicAllowed(questionData, topic, allowedSubtopicsByTopic)) {
            return; // Skip this question
          }
          if (!answeredSet.has(doc.id) && !seenQuestionIds.has(doc.id)) {
            seenQuestionIds.add(doc.id);
            questions.push({
              ...questionData,
              questionId: doc.id,
              source: 'questionBank',
              collection: 'questionBank'
            });
            userQuestionsCount++;
          }
        });

        console.log(`[fetchQuestionsFromFirestore] Successfully fetched ${userQuestionsCount} user questions (${userQuestionBankSnapshot.size} total)`);
      } catch (err) {
        const errorMessage = err?.message || err?.toString() || 'Unknown error';
        console.error('[fetchQuestionsFromFirestore] Error fetching user questionBank:', {
          error: err,
          code: err?.code,
          message: errorMessage,
          userId,
          topic,
          grade
        });

        errors.userQuestions = {
          type: errorMessage.toLowerCase().includes('index') ? 'index' : 'query',
          message: `Failed to load personal questions: ${errorMessage}`,
          details: errorMessage
        };
      }
    }

    // 3. Fetch teacher's questionBank (if student has a teacher)
    // Note: This would require checking if student has a teacher assigned
    // For now, we'll skip this as it requires additional logic to determine teacher

    // 4. Fetch shared questionBank (all students can access)
    try {
      console.log(`[fetchQuestionsFromFirestore] Fetching shared questionBank for topic: ${topic}, grade: ${grade}`);

      const fetchSharedQuestions = async () => {
        const sharedRef = collection(db, 'artifacts', currentAppId, 'sharedQuestionBank');
        const sharedQuery = query(
          sharedRef,
          where('topic', '==', topic),
          where('grade', '==', grade)
        );
        return await getDocs(sharedQuery);
      };

      // Use retry logic for shared questions
      const sharedSnapshot = await retryWithBackoff(fetchSharedQuestions, {
        maxRetries: 2,
        initialDelay: 500
      });

      let sharedQuestionsCount = 0;
      sharedSnapshot.forEach(doc => {
        const questionData = doc.data();
        // Check subtopic restrictions
        if (!isSubtopicAllowed(questionData, topic, allowedSubtopicsByTopic)) {
          return; // Skip this question
        }
        if (!answeredSet.has(doc.id) && !seenQuestionIds.has(doc.id)) {
          seenQuestionIds.add(doc.id);
          questions.push({
            ...questionData,
            questionId: doc.id,
            source: 'sharedQuestionBank',
            collection: 'sharedQuestionBank'
          });
          sharedQuestionsCount++;
        }
      });

      console.log(`[fetchQuestionsFromFirestore] Successfully fetched ${sharedQuestionsCount} shared questions (${sharedSnapshot.size} total)`);
    } catch (err) {
      const errorMessage = err?.message || err?.toString() || 'Unknown error';
      console.error('[fetchQuestionsFromFirestore] Error fetching shared questions:', {
        error: err,
        code: err?.code,
        message: errorMessage,
        topic,
        grade
      });

      errors.sharedQuestions = {
        type: errorMessage.toLowerCase().includes('index') ? 'index' : 'query',
        message: `Failed to load shared questions: ${errorMessage}`,
        details: errorMessage
      };
    }

  } catch (error) {
    console.error('[fetchQuestionsFromFirestore] Unexpected error in fetchQuestionsFromFirestore:', error);
    errors.general = {
      type: 'unexpected',
      message: `Unexpected error: ${error?.message || error}`,
      details: error
    };
  }

  // Log summary
  console.log(`[fetchQuestionsFromFirestore] Fetch summary:`, {
    totalQuestions: questions.length,
    classId,
    userId,
    topic,
    grade,
    errors: Object.keys(errors).length > 0 ? errors : 'none'
  });

  // If we have errors and no questions, throw an error with details
  if (questions.length === 0 && Object.keys(errors).length > 0) {
    const errorDetails = Object.entries(errors)
      .map(([source, error]) => `${source}: ${error.message}`)
      .join('; ');

    // Create a user-friendly error message
    const hasIndexError = Object.values(errors).some(e => e.type === 'index');
    if (hasIndexError) {
      throw new Error(`Database index required. Please contact support or check the browser console for the index creation link.`);
    } else if (errors.classQuestions) {
      // Class questions are highest priority, so fail if they fail
      throw new Error(`Failed to load class questions. ${errors.classQuestions.message}`);
    } else {
      throw new Error(`Failed to load questions: ${errorDetails}`);
    }
  }

  // Attach error information to the result for non-critical errors
  questions.errors = errors;

  return questions;
};
