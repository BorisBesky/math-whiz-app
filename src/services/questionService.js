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
import { getUserAttemptsCollectionRef, getUserDocRef } from "../utils/firebaseHelpers";
import { getCachedClassQuestions, setCachedClassQuestions } from "../utils/questionCache";
import { isSubtopicAllowed } from "../utils/subtopicUtils";
import { gradeWordPattern, normalizeGradeKey } from "../content/registry";

export const isLikelyOfflineError = (error) => {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return true;
  }

  const errorCode = String(error?.code || '').toLowerCase();
  const errorMessage = String(error?.message || error || '').toLowerCase();

  return (
    errorCode.includes('unavailable') ||
    errorMessage.includes('offline') ||
    errorMessage.includes('network') ||
    errorMessage.includes('failed to fetch') ||
    errorMessage.includes('client is offline')
  );
};

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

export const getQuestionHistory = async (userId, topic = null, legacyHistory = null) => {
  if (!userId) return [];
  const userDocRef = getUserDocRef(userId);
  const attemptsRef = getUserAttemptsCollectionRef(userId);
  try {
    const attemptsQuery = attemptsRef && topic
      ? query(attemptsRef, where('topic', '==', topic))
      : attemptsRef;
    const attemptsSnapshot = attemptsQuery ? await getDocs(attemptsQuery) : null;
    if (attemptsSnapshot && !attemptsSnapshot.empty) {
      return attemptsSnapshot.docs
        .map((attemptDoc) => ({ id: attemptDoc.id, ...attemptDoc.data() }))
        .sort((a, b) => String(a.timestamp || '').localeCompare(String(b.timestamp || '')));
    }
  } catch (error) {
    if (!isLikelyOfflineError(error)) {
      throw error;
    }
    console.warn('[questionService] Attempt history unavailable offline; falling back to cached profile history.', error);
  }

  if (Array.isArray(legacyHistory)) {
    return topic
      ? legacyHistory.filter((attempt) => attempt.topic === topic)
      : legacyHistory;
  }

  try {
    const userDoc = await getDoc(userDocRef);
    if (userDoc.exists() && userDoc.data().answeredQuestions) {
      const profileLegacyHistory = userDoc.data().answeredQuestions;
      return topic
        ? profileLegacyHistory.filter((attempt) => attempt.topic === topic)
        : profileLegacyHistory;
    }
  } catch (error) {
    if (!isLikelyOfflineError(error)) {
      throw error;
    }
    console.warn('[questionService] Profile history unavailable offline; using empty history.', error);
  }
  return [];
};

// Fetch answered question bank question IDs from user profile
export const getAnsweredQuestionBankQuestions = async (userId) => {
  if (!userId) return [];
  const userDocRef = getUserDocRef(userId);
  try {
    const userDoc = await getDoc(userDocRef);
    if (userDoc.exists() && userDoc.data().answeredQuestionBankQuestions) {
      return userDoc.data().answeredQuestionBankQuestions;
    }
  } catch (error) {
    if (!isLikelyOfflineError(error)) {
      throw error;
    }
    console.warn('[questionService] Answered question-bank ids unavailable offline; using empty list.', error);
  }
  return [];
};

const normalizeGradeValue = (gradeValue) => {
  if (!gradeValue) return '';
  // Registry-backed key matching; unknown values pass through uppercased
  // (historical behavior for free-form grade strings on bank questions).
  return normalizeGradeKey(gradeValue) || String(gradeValue).trim().toUpperCase();
};

// Grade vocabulary ('3rd', 'grade 4', 'g4', ...) derived from the registry.
const GRADE_WORD_REGEX = new RegExp(gradeWordPattern(), 'g');

const normalizeTopicValue = (topicValue) => (
  String(topicValue || '')
    .trim()
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(GRADE_WORD_REGEX, '')
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

const canHydrateQuestionRefInClient = (path) => (
  typeof path === 'string' && path.includes('/sharedQuestionBank/')
);

const hydrateMissingClassQuestionMetadata = async (candidateQuestions) => {
  const hydrateableByRef = new Map();
  candidateQuestions.forEach((question) => {
    if (
      (!question.subtopic || !question.operation || !question.tags) &&
      canHydrateQuestionRefInClient(question.questionBankRef) &&
      !hydrateableByRef.has(question.questionBankRef)
    ) {
      hydrateableByRef.set(question.questionBankRef, question);
    }
  });

  if (hydrateableByRef.size === 0) {
    return candidateQuestions;
  }

  const hydratedByRef = new Map();
  await Promise.all(Array.from(hydrateableByRef.keys()).map(async (questionBankRef) => {
    const questionRef = getQuestionRefFromPath(questionBankRef);
    if (!questionRef) return;

    try {
      const snap = await getDoc(questionRef);
      if (snap.exists()) {
        hydratedByRef.set(questionBankRef, snap.data());
      }
    } catch (error) {
      console.warn('[fetchQuestionsFromFirestore] Could not hydrate class question metadata:', {
        questionBankRef,
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
export const fetchQuestionsFromFirestore = async (
  topic,
  grade,
  userId,
  classId,
  answeredQuestionIds,
  appId,
  allowedSubtopicsByTopic = null,
  minimumQuestionCount = 0
) => {
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

    return {
      addedCount: questionsToAdd.length,
      hydratedCandidates,
    };
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

            const {
              addedCount: classQuestionsCount,
              hydratedCandidates,
            } = await addClassQuestions(cachedQuestions, selectedClassId, 'Used cached');
            if (classQuestionsCount > 0) {
              setCachedClassQuestions(selectedClassId, topic, grade, currentAppId, hydratedCandidates);
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

            const {
              addedCount: classQuestionsCount,
              hydratedCandidates,
            } = await addClassQuestions(
              allFetchedQuestions,
              selectedClassId,
              'Fetched'
            );

            // Cache after metadata hydration/filtering has had a chance to run.
            if (allFetchedQuestions.length > 0) {
              setCachedClassQuestions(selectedClassId, topic, grade, currentAppId, hydratedCandidates);
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
          if (isLikelyOfflineError(err)) {
            errors[`classQuestions:${selectedClassId}`] = {
              type: 'offline',
              message: 'Class questions are unavailable while offline.',
              details: errorMessage
            };
          } else if (errorMessage.toLowerCase().includes('index') || errorMessage.toLowerCase().includes('requires an index')) {
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

    const hasEnoughClassQuestions = minimumQuestionCount > 0 && questions.length >= minimumQuestionCount;
    if (hasEnoughClassQuestions) {
      console.log(
        `[fetchQuestionsFromFirestore] Class questions satisfied the requested pool size (${questions.length}/${minimumQuestionCount}); skipping additional question banks.`
      );
    }

    // 2-4. Personal and shared banks are independent. Start both reads together
    // so an empty or slow bank does not serially delay the first quiz question.
    if (!hasEnoughClassQuestions) {
      const settleRequest = async (request) => {
        try {
          return { snapshot: await request() };
        } catch (error) {
          return { error };
        }
      };

      const userQuestionsRequest = userId
        ? (() => {
            console.log(`[fetchQuestionsFromFirestore] Fetching user questionBank for userId: ${userId}, topic: ${topic}, grade: ${grade}`);
            const userQuestionBankRef = collection(db, 'artifacts', currentAppId, 'users', userId, 'questionBank');
            const userQuestionBankQuery = query(
              userQuestionBankRef,
              where('topic', '==', topic),
              where('grade', '==', grade)
            );
            return settleRequest(() => retryWithBackoff(
              () => getDocs(userQuestionBankQuery),
              { maxRetries: 2, initialDelay: 500 }
            ));
          })()
        : Promise.resolve(null);

      console.log(`[fetchQuestionsFromFirestore] Fetching shared questionBank for topic: ${topic}, grade: ${grade}`);
      const sharedRef = collection(db, 'artifacts', currentAppId, 'sharedQuestionBank');
      const sharedQuery = query(
        sharedRef,
        where('topic', '==', topic),
        where('grade', '==', grade)
      );
      const sharedQuestionsRequest = settleRequest(() => retryWithBackoff(
        () => getDocs(sharedQuery),
        { maxRetries: 2, initialDelay: 500 }
      ));

      const [userResult, sharedResult] = await Promise.all([
        userQuestionsRequest,
        sharedQuestionsRequest,
      ]);

      const addQuestionBankSnapshot = (snapshot, source, collectionName) => {
        let addedCount = 0;
        snapshot.forEach(doc => {
          const questionData = doc.data();
          if (!isSubtopicAllowed(questionData, topic, allowedSubtopicsByTopic)) {
            return;
          }
          if (!answeredSet.has(doc.id) && !seenQuestionIds.has(doc.id)) {
            seenQuestionIds.add(doc.id);
            questions.push({
              ...questionData,
              questionId: doc.id,
              source,
              collection: collectionName,
            });
            addedCount++;
          }
        });
        return addedCount;
      };

      if (userResult?.snapshot) {
        const userQuestionsCount = addQuestionBankSnapshot(
          userResult.snapshot,
          'questionBank',
          'questionBank'
        );
        console.log(`[fetchQuestionsFromFirestore] Successfully fetched ${userQuestionsCount} user questions (${userResult.snapshot.size} total)`);
      } else if (userResult?.error) {
        const err = userResult.error;
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
          type: isLikelyOfflineError(err) ? 'offline' : (errorMessage.toLowerCase().includes('index') ? 'index' : 'query'),
          message: `Failed to load personal questions: ${errorMessage}`,
          details: errorMessage
        };
      }

      if (sharedResult.snapshot) {
        const sharedQuestionsCount = addQuestionBankSnapshot(
          sharedResult.snapshot,
          'sharedQuestionBank',
          'sharedQuestionBank'
        );
        console.log(`[fetchQuestionsFromFirestore] Successfully fetched ${sharedQuestionsCount} shared questions (${sharedResult.snapshot.size} total)`);
      } else if (sharedResult.error) {
        const err = sharedResult.error;
        const errorMessage = err?.message || err?.toString() || 'Unknown error';
        console.error('[fetchQuestionsFromFirestore] Error fetching shared questions:', {
          error: err,
          code: err?.code,
          message: errorMessage,
          topic,
          grade
        });
        errors.sharedQuestions = {
          type: isLikelyOfflineError(err) ? 'offline' : (errorMessage.toLowerCase().includes('index') ? 'index' : 'query'),
          message: `Failed to load shared questions: ${errorMessage}`,
          details: errorMessage
        };
      }
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
    const onlyOfflineErrors = Object.values(errors).every((error) => error.type === 'offline');
    if (onlyOfflineErrors) {
      console.warn('[fetchQuestionsFromFirestore] Firestore is unavailable offline; continuing with generated questions.', errors);
      questions.errors = errors;
      return questions;
    }

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
