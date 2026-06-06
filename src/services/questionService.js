/* global __app_id */
import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  doc,
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

const normalizeGradeValue = (gradeValue) => {
  if (!gradeValue) return '';
  const normalized = String(gradeValue).trim().toUpperCase();
  if (normalized === 'G3' || normalized.includes('3')) return 'G3';
  if (normalized === 'G4' || normalized.includes('4')) return 'G4';
  return normalized;
};

const normalizeTopicValue = (topicValue) => (
  String(topicValue || '')
    .trim()
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/\b(3rd|4th|grade\s*[34]|g[34])\b/g, '')
    .replace(/[^a-z0-9]+/g, '')
);

const matchesTopicAndGrade = (questionData, topic, grade) => (
  normalizeTopicValue(questionData.topic || questionData.concept) === normalizeTopicValue(topic) &&
  normalizeGradeValue(questionData.grade) === normalizeGradeValue(grade)
);

const getQuestionRefFromPath = (path) => {
  if (!path || typeof path !== 'string') return null;
  const segments = path.split('/').filter(Boolean);
  if (segments.length % 2 === 0) {
    return doc(db, ...segments);
  }
  return null;
};

const hydrateMissingClassQuestionMetadata = async (candidateQuestions) => {
  const hydrateable = candidateQuestions.filter((question) => (
    (!question.subtopic || !question.operation || !question.tags) && question.questionBankRef
  ));

  if (hydrateable.length === 0) {
    return candidateQuestions;
  }

  const hydratedByRef = new Map();
  await Promise.all(hydrateable.map(async (question) => {
    if (hydratedByRef.has(question.questionBankRef)) return;
    const questionRef = getQuestionRefFromPath(question.questionBankRef);
    if (!questionRef) return;

    try {
      const snap = await getDoc(questionRef);
      if (snap.exists()) {
        hydratedByRef.set(question.questionBankRef, snap.data());
      }
    } catch (error) {
      console.warn('[fetchQuestionsFromFirestore] Could not hydrate class question metadata:', {
        questionBankRef: question.questionBankRef,
        error,
      });
    }
  }));

  if (hydratedByRef.size === 0) {
    return candidateQuestions;
  }

  return candidateQuestions.map((question) => {
    const sourceQuestion = hydratedByRef.get(question.questionBankRef);
    if (!sourceQuestion) return question;
    return {
      ...sourceQuestion,
      ...question,
      subtopic: question.subtopic || sourceQuestion.subtopic,
      operation: question.operation || sourceQuestion.operation,
      tags: Array.isArray(question.tags) && question.tags.length > 0 ? question.tags : sourceQuestion.tags,
    };
  });
};

// Fetch questions from Firestore (class questions, user questionBank, teacher questionBank, shared questionBank)
// Note: Class questions are stored as reference documents that contain both:
//   1. Reference info (questionBankRef, teacherId) pointing to the original question
//   2. Full question data for efficient querying by topic/grade
export const fetchQuestionsFromFirestore = async (topic, grade, userId, classId, answeredQuestionIds, appId, allowedSubtopicsByTopic = null) => {
  const questions = [];
  const classQuestions = [];
  const currentAppId = appId || (typeof __app_id !== "undefined" ? __app_id : "default-app-id");
  const classIds = Array.isArray(classId)
    ? classId.filter(Boolean)
    : classId
      ? [classId]
      : [];
  const answeredSet = new Set(answeredQuestionIds || []);
  const seenQuestionIds = new Set(); // Track IDs to avoid duplicates
  const errors = {}; // Track errors by source

  const shuffleQuestions = (items) => {
    const shuffled = [...items];
    for (let i = shuffled.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const addClassQuestions = async (candidateQuestions, selectedClassId, sourceLabel) => {
    const hydratedCandidates = await hydrateMissingClassQuestionMetadata(candidateQuestions);
    const eligibleQuestions = [];
    const fallbackQuestions = [];
    let missingQuestionIdCount = 0;
    let subtopicFilteredCount = 0;
    let answeredOrDuplicateCount = 0;

    hydratedCandidates.forEach(candidateQuestion => {
      const questionId = candidateQuestion.questionId;
      if (!questionId) {
        missingQuestionIdCount++;
        console.warn('[fetchQuestionsFromFirestore] Class question missing questionId, skipping:', candidateQuestion);
        return;
      }

      if (answeredSet.has(questionId) || seenQuestionIds.has(questionId)) {
        answeredOrDuplicateCount++;
        return;
      }

      const normalizedQuestion = {
        ...candidateQuestion,
        classId: selectedClassId,
        questionId,
        source: 'questionBank',
        collection: 'classQuestions'
      };

      fallbackQuestions.push(normalizedQuestion);

      if (isSubtopicAllowed(candidateQuestion, topic, allowedSubtopicsByTopic)) {
        eligibleQuestions.push(normalizedQuestion);
      } else {
        subtopicFilteredCount++;
      }
    });

    const questionsToAdd = eligibleQuestions.length > 0 ? eligibleQuestions : fallbackQuestions;

    if (eligibleQuestions.length === 0 && fallbackQuestions.length > 0 && subtopicFilteredCount > 0) {
      console.warn(
        `[fetchQuestionsFromFirestore] Focus subtopic filters removed all ${subtopicFilteredCount} available class question-bank questions for classId ${selectedClassId}, topic "${topic}". Falling back to class question-bank questions without subtopic filtering.`
      );
    }

    questionsToAdd.forEach(question => {
      seenQuestionIds.add(question.questionId);
      classQuestions.push(question);
    });

    console.log(`[fetchQuestionsFromFirestore] ${sourceLabel} class questions for classId ${selectedClassId}:`, {
      added: questionsToAdd.length,
      matchedSubtopicFilter: eligibleQuestions.length,
      availableBeforeSubtopicFilter: fallbackQuestions.length,
      subtopicFiltered: subtopicFilteredCount,
      answeredOrDuplicate: answeredOrDuplicateCount,
      missingQuestionId: missingQuestionIdCount,
      totalCandidates: candidateQuestions.length,
    });

    return questionsToAdd.length;
  };

  try {
    // 1. Fetch class questions if classId provided (highest priority with retry)
    if (classIds.length > 0) {
      for (const selectedClassId of classIds) {
        try {
        // Check cache first
          const cachedQuestions = getCachedClassQuestions(selectedClassId, topic, grade, currentAppId);

          if (cachedQuestions && cachedQuestions.length > 0) {
            console.log(`[fetchQuestionsFromFirestore] Using cached class questions for classId: ${selectedClassId}, topic: ${topic}, grade: ${grade}`);

            const classQuestionsCount = await addClassQuestions(cachedQuestions, selectedClassId, 'Used cached');
            if (classQuestionsCount > 0) {
              const hydratedCachedQuestions = await hydrateMissingClassQuestionMetadata(cachedQuestions);
              setCachedClassQuestions(selectedClassId, topic, grade, currentAppId, hydratedCachedQuestions);
            }
          } else {
            // Cache miss - fetch from Firestore
            console.log(`[fetchQuestionsFromFirestore] Cache miss - fetching class questions for classId: ${selectedClassId}, topic: ${topic}, grade: ${grade}`);

            const fetchClassQuestions = async () => {
              const classQuestionsRef = collection(db, 'artifacts', currentAppId, 'classes', selectedClassId, 'questions');
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

            if (allFetchedQuestions.length === 0) {
              console.warn(
                `[fetchQuestionsFromFirestore] Exact class question query returned 0 for classId ${selectedClassId}, topic "${topic}", grade "${grade}". Trying normalized fallback.`
              );

              const fallbackSnapshot = await retryWithBackoff(async () => {
                const classQuestionsRef = collection(db, 'artifacts', currentAppId, 'classes', selectedClassId, 'questions');
                return await getDocs(classQuestionsRef);
              }, {
                maxRetries: 2,
                initialDelay: 500
              });

              fallbackSnapshot.forEach(doc => {
                const questionData = doc.data();
                if (matchesTopicAndGrade(questionData, topic, grade)) {
                  allFetchedQuestions.push({
                    ...questionData,
                    questionId: doc.id,
                    source: 'questionBank',
                    collection: 'classQuestions'
                  });
                }
              });

              console.log(
                `[fetchQuestionsFromFirestore] Normalized fallback found ${allFetchedQuestions.length} class questions for classId ${selectedClassId} (${fallbackSnapshot.size} total class questions scanned)`
              );
            }

            const classQuestionsCount = await addClassQuestions(
              allFetchedQuestions,
              selectedClassId,
              'Fetched'
            );

            // Cache after metadata hydration/filtering has had a chance to run.
            if (allFetchedQuestions.length > 0) {
              const hydratedFetchedQuestions = await hydrateMissingClassQuestionMetadata(allFetchedQuestions);
              setCachedClassQuestions(selectedClassId, topic, grade, currentAppId, hydratedFetchedQuestions);
            }

            console.log(`[fetchQuestionsFromFirestore] Successfully fetched ${classQuestionsCount} class questions for classId ${selectedClassId} (${allFetchedQuestions.length} topic/grade matched, ${allFetchedQuestions.length - classQuestionsCount} filtered out)`);
          }
        } catch (err) {
          const errorMessage = err?.message || err?.toString() || 'Unknown error';
          console.error('[fetchQuestionsFromFirestore] Error fetching class questions:', {
            error: err,
            code: err?.code,
            message: errorMessage,
            classId: selectedClassId,
            topic,
            grade
          });

          // Check if this is a missing index error
          if (errorMessage.toLowerCase().includes('index') || errorMessage.toLowerCase().includes('requires an index')) {
            errors[`classQuestions:${selectedClassId}`] = {
              type: 'index',
              message: 'Missing Firestore index. Please check the console for the index creation link.',
              details: errorMessage
            };
          } else {
            errors[`classQuestions:${selectedClassId}`] = {
              type: 'query',
              message: `Failed to load class questions: ${errorMessage}`,
              details: errorMessage
            };
          }
        }
      }

      questions.push(...(classIds.length > 1 ? shuffleQuestions(classQuestions) : classQuestions));
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
    classIds,
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
    const classQuestionErrorEntry = Object.entries(errors).find(([source]) => source.startsWith('classQuestions'));

    // Create a user-friendly error message
    const hasIndexError = Object.values(errors).some(e => e.type === 'index');
    if (hasIndexError) {
      throw new Error(`Database index required. Please contact support or check the browser console for the index creation link.`);
    } else if (classQuestionErrorEntry) {
      // Class questions are highest priority, so fail if they fail
      throw new Error(`Failed to load class questions. ${classQuestionErrorEntry[1].message}`);
    } else {
      throw new Error(`Failed to load questions: ${errorDetails}`);
    }
  }

  // Attach error information to the result for non-critical errors
  questions.errors = errors;

  return questions;
};
