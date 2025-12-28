/* global __firebase_config, __app_id, __initial_auth_token */
import React, { useState, useEffect, useRef, useCallback } from "react";
import { Routes, Route, useLocation, useNavigate, useParams } from "react-router-dom";
import "katex/dist/katex.min.css";
import renderMathInElement from "katex/contrib/auto-render";
import {
  ChevronsRight,
  HelpCircle,
  Sparkles,
  X,
  BarChart2,
  Award,
  Coins,
  Pause,
  Play,
  Store,
  CheckCircle,
  Home,
  BookOpen,
  LogOut,
  User,
  Shield,
  PenTool,
} from "lucide-react";
import { initializeApp } from "firebase/app";
import {
  getAuth,
  signInAnonymously,
  onAuthStateChanged,
  signInWithCustomToken,
} from "firebase/auth";
import {
  getFirestore,
  doc,
  setDoc,
  onSnapshot,
  updateDoc,
  increment,
  arrayUnion,
  getDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { useAuth } from './contexts/AuthContext';
import { TutorialProvider, useTutorial } from './contexts/TutorialContext';
import TutorialOverlay from './components/TutorialOverlay';
import { mainAppTutorial } from './tutorials/mainAppTutorial';
import { dashboardTutorial } from './tutorials/dashboardTutorial';
import { storeTutorial } from './tutorials/storeTutorial';
import { USER_ROLES } from './utils/userRoles';
import SketchOverlay from './components/SketchCanvas';
import DrawingCanvas from './components/DrawingCanvas';
import NumberPad from './components/NumberPad';
import { isNumericQuestion, normalizeNumericAnswer } from './utils/answer-helpers';
import {
  adaptAnsweredHistory,
  nextTargetComplexity,
  computePerTopicComplexity,
  rankQuestionsByComplexity,
} from "./utils/complexityEngine";
import { TOPICS, APP_STATES } from "./constants/topics";
import content from "./content";
import { getCachedClassQuestions, setCachedClassQuestions } from "./utils/questionCache";
import { loadStoreImages } from "./utils/storeImages";
import { isSubtopicAllowed } from "./utils/subtopicUtils";

// --- Firebase Configuration ---
// Using individual environment variables for better security
let firebaseConfig = {};

if (typeof __firebase_config !== "undefined") {
  console.log("Using __firebase_config");
  firebaseConfig = JSON.parse(__firebase_config);
} else {
  // Use individual environment variables (these are safe to expose)
  firebaseConfig = {
    apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
    authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
    storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.REACT_APP_FIREBASE_APP_ID,
  };
  console.log("Using environment variables");

  // Check if we have the minimum required config
  if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
    console.warn(
      "Firebase configuration incomplete. Some features may not work."
    );
  }
}

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Export db and storage for use in other modules
export { db, storage };

const DEFAULT_DAILY_GOAL = 4;
const DAILY_GOAL_BONUS = 10;
const STORE_BACKGROUND_COST = 20;
const GOAL_RANGE_MIN = 4;
const GOAL_RANGE_MAX = 40;
const GOAL_RANGE_STEP = 1;

// --- Helper Functions ---
const getTodayDateString = () => {
  const today = new Date();
  return today.toISOString().split("T")[0]; // YYYY-MM-DD format
};

const getUserDocRef = (userId) => {
  const appId = typeof __app_id !== "undefined" ? __app_id : "default-app-id";
  if (!userId) return null;
  // Using the required path structure for user-specific data
  return doc(
    db,
    "artifacts",
    appId,
    "users",
    userId,
    "math_whiz_data",
    "profile"
  );
};

// --- Helper function to sanitize topic names for Firestore field paths ---
const sanitizeTopicName = (topicName) => {
  // Add error handling for undefined/null values
  if (!topicName || typeof topicName !== 'string') {
    return 'unknown_topic';
  }
  
  // Replace problematic characters with underscores
  return topicName
    .replace(/[().&\s]/g, "_") // Replace parentheses, periods, ampersands, and spaces
    .replace(/_+/g, "_") // Replace multiple underscores with single
    .replace(/^_|_$/g, ""); // Remove leading/trailing underscores
};

// --- Concept Explanation HTML Files Mapping ---
const conceptExplanationFiles = {
  // 3rd Grade Topics
  [TOPICS.MULTIPLICATION]: "/multiplicationExplanation.html",
  [TOPICS.DIVISION]: "/divisionExplanation.html",
  // Fraction subtopics
  [TOPICS.FRACTIONS_ADDITION]: "/fractionAdditionExplanation.html",
  [TOPICS.FRACTIONS_SIMPLIFICATION]: "/fractionSimplificationExplanation.html",
  [TOPICS.FRACTIONS_EQUIVALENCY]: "/fractionEquivalencyExplanation.html",
  [TOPICS.FRACTIONS_COMPARISON]: "/fractionComparisonExplanation.html",
  // Fallback for any generic fractions (kept for backward compatibility)
  [TOPICS.FRACTIONS]: "/fractionAdditionExplanation.html",
  [TOPICS.AREA]: "/areaExplanation.html",
  [TOPICS.PERIMETER]: "/perimeterExplanation.html",
  [TOPICS.VOLUME]: "/volumeExplanation.html",

  // 4th Grade Topics (to be implemented in Phase 3)
  [TOPICS.OPERATIONS_ALGEBRAIC_THINKING]: "/oa4Explanation.html",
  [TOPICS.BASE_TEN]: "/nbt4Explanation.html",
  [TOPICS.FRACTIONS_4TH]: "/nf4Explanation.html",
  [TOPICS.MEASUREMENT_DATA_4TH]: "/md4Explanation.html",
  [TOPICS.GEOMETRY]: "/g4Explanation.html",
  [TOPICS.BINARY_ADDITION]: "/binaryAdditionExplanation.html",
};

// --- Store Items ---
// Store items are now loaded dynamically from Firebase Storage
// See MainAppContent component for loading logic

// --- Dynamic Quiz Generation ---
const generateQuizQuestions = async (
  topic,
  dailyGoals,
  questionHistory,
  difficulty,
  grade = "G3",
  userId = null,
  classId = null,
  answeredQuestionIds = [],
  appId = null,
  questionBankProbability = 0.7, // Default 70% chance for question bank questions
  allowedSubtopicsByTopic = null // Subtopic restrictions from enrollment
) => {
  // Use existing complexity engine instead of rebuilding scoring logic
  const adapted = adaptAnsweredHistory(questionHistory);
  const ranked = rankQuestionsByComplexity(adapted);

  // Helper function to generate a unique signature for a question
  // Uses question text + correct answer to handle cases where questions have same text but different answers (e.g., clock reading)
  const getQuestionSignature = (q) => {
    return `${q.question}|||${q.correctAnswer ?? ''}`;
  };

  // Build mastery index: questions with high complexity scores (struggled with) get higher need
  const questionMastery = new Map();

  ranked.forEach((r) => {
    // Use question signature (question + correctAnswer) as key to match lookup logic
    const questionSig = getQuestionSignature(r);
    if (!questionMastery.has(questionSig)) {
      questionMastery.set(questionSig, { totalComplexity: 0, count: 0 });
    }
    const entry = questionMastery.get(questionSig);
    entry.totalComplexity += r.complexityScore || 0;
    entry.count += 1;
  });

  const dailyGoal = dailyGoals?.[topic] || DEFAULT_DAILY_GOAL;
  const questions = [];
  const usedQuestions = new Set(); // Track unique question signatures
  const numQuestions = Math.max(1, dailyGoal);
  let attempts = 0;
  
  // Increase max attempts if subtopic restrictions are present (more restrictive = more attempts needed)
  // Base multiplier of 10, increase to 30 if subtopic restrictions exist
  const hasSubtopicRestrictions = allowedSubtopicsByTopic && Object.keys(allowedSubtopicsByTopic).length > 0;
  const baseMultiplier = hasSubtopicRestrictions ? 30 : 10;
  const maxAttempts = numQuestions * baseMultiplier; // Prevent infinite loops
  
  // Track statistics for better error reporting
  let filteredBySubtopicCount = 0;
  let consecutiveFilteredCount = 0;
  const maxConsecutiveFiltered = 50; // Early exit if too many consecutive filtered questions

  // Fetch questions from Firestore
  const firestoreQuestions = await fetchQuestionsFromFirestore(
    topic,
    grade,
    userId,
    classId,
    answeredQuestionIds,
    appId,
    allowedSubtopicsByTopic
  );
  let firestoreQuestionIndex = 0;

  while (questions.length < numQuestions && attempts < maxAttempts) {
    attempts++;
    let question = {};
    let useFirestoreQuestion = false;
    
    // Early exit if too many consecutive questions are filtered (likely no valid questions exist)
    if (consecutiveFilteredCount >= maxConsecutiveFiltered) {
      console.warn(
        `Stopped quiz generation after ${maxConsecutiveFiltered} consecutive questions were filtered by subtopic restrictions. ` +
        `This may indicate that no valid questions exist for the current subtopic restrictions. ` +
        `Generated ${questions.length} out of ${numQuestions} requested questions for ${topic}.`
      );
      break;
    }

    // Use configured probability to select Firestore question if available
    if (firestoreQuestions.length > 0 && firestoreQuestionIndex < firestoreQuestions.length && Math.random() < questionBankProbability) {
      const firestoreQ = firestoreQuestions[firestoreQuestionIndex];
      // Check if question is unique using signature
      const questionSig = getQuestionSignature(firestoreQ);
      if (!usedQuestions.has(questionSig)) {
        question = {
          ...firestoreQ,
          concept: firestoreQ.topic || firestoreQ.concept || topic,
        };
        useFirestoreQuestion = true;
        firestoreQuestionIndex++;
      }
    }

    // If not using Firestore question, generate one
    if (!useFirestoreQuestion) {
      switch (topic) {
      case TOPICS.MULTIPLICATION:
        // Use the new pluggable content system for Multiplication
        const multiplicationTopic = content.getTopic('g3', 'multiplication');
        if (multiplicationTopic) {
          // Get allowed subtopics for this topic if restrictions exist
          const allowedSubtopicsForThisTopic = allowedSubtopicsByTopic && allowedSubtopicsByTopic[topic]
            ? allowedSubtopicsByTopic[topic]
            : null;
          question = multiplicationTopic.generateQuestion(difficulty, allowedSubtopicsForThisTopic);
          if (question) {
            question.concept = TOPICS.MULTIPLICATION;
          }
        }
        break;
      case TOPICS.DIVISION:
        // Use the new pluggable content system for Division
        const divisionTopic = content.getTopic('g3', 'division');
        if (divisionTopic) {
          // Get allowed subtopics for this topic if restrictions exist
          const allowedSubtopicsForThisTopic = allowedSubtopicsByTopic && allowedSubtopicsByTopic[topic]
            ? allowedSubtopicsByTopic[topic]
            : null;
          question = divisionTopic.generateQuestion(difficulty, allowedSubtopicsForThisTopic);
          if (question) {
            question.concept = TOPICS.DIVISION;
          }
        }
        break;
      case TOPICS.FRACTIONS:
        // Use the new pluggable content system for G3 Fractions
        const g3FractionsTopic = content.getTopic('g3', 'fractions');
        if (g3FractionsTopic) {
          // Get allowed subtopics for this topic if restrictions exist
          const allowedSubtopicsForThisTopic = allowedSubtopicsByTopic && allowedSubtopicsByTopic[topic]
            ? allowedSubtopicsByTopic[topic]
            : null;
          question = g3FractionsTopic.generateQuestion(difficulty, allowedSubtopicsForThisTopic);
          if (question) {
            question.concept = TOPICS.FRACTIONS;
          }
        }
        break;
      case TOPICS.MEASUREMENT_DATA:
        // Use the new pluggable content system for G3 Measurement & Data
        const g3MeasurementDataTopic = content.getTopic('g3', 'measurement-data');
        if (g3MeasurementDataTopic) {
          // Get allowed subtopics for this topic if restrictions exist
          const allowedSubtopicsForThisTopic = allowedSubtopicsByTopic && allowedSubtopicsByTopic[topic]
            ? allowedSubtopicsByTopic[topic]
            : null;
          question = g3MeasurementDataTopic.generateQuestion(difficulty, allowedSubtopicsForThisTopic);
          if (question) {
            question.concept = TOPICS.MEASUREMENT_DATA;
          }
        }
        break;

      // 4th Grade Topics
      case TOPICS.OPERATIONS_ALGEBRAIC_THINKING:
        // Use the new pluggable content system for Operations & Algebraic Thinking
        const oaTopic = content.getTopic('g4', 'operations-algebraic-thinking');
        if (oaTopic) {
          // Get allowed subtopics for this topic if restrictions exist
          const allowedSubtopicsForThisTopic = allowedSubtopicsByTopic && allowedSubtopicsByTopic[topic]
            ? allowedSubtopicsByTopic[topic]
            : null;
          question = oaTopic.generateQuestion(difficulty, allowedSubtopicsForThisTopic);
          // Ensure the concept field matches the old TOPICS constant for compatibility
          if (question) {
            question.concept = TOPICS.OPERATIONS_ALGEBRAIC_THINKING;
          }
        } 
        break;

      case TOPICS.BASE_TEN:
        // Use the new pluggable content system for Base Ten
        const baseTenTopic = content.getTopic('g4', 'base-ten');
        if (baseTenTopic) {
          // Get allowed subtopics for this topic if restrictions exist
          const allowedSubtopicsForThisTopic = allowedSubtopicsByTopic && allowedSubtopicsByTopic[topic]
            ? allowedSubtopicsByTopic[topic]
            : null;
          question = baseTenTopic.generateQuestion(difficulty, allowedSubtopicsForThisTopic);
          // Ensure the concept field matches the old TOPICS constant for compatibility
          if (question) {
            question.concept = TOPICS.BASE_TEN;
          }
        }
        break;

      case TOPICS.FRACTIONS_4TH:
        // Use the new pluggable content system for Fractions
        const fractionsTopic = content.getTopic('g4', 'fractions');
        if (fractionsTopic) {
          // Get allowed subtopics for this topic if restrictions exist
          const allowedSubtopicsForThisTopic = allowedSubtopicsByTopic && allowedSubtopicsByTopic[topic]
            ? allowedSubtopicsByTopic[topic]
            : null;
          question = fractionsTopic.generateQuestion(difficulty, allowedSubtopicsForThisTopic);
          // Ensure the concept field matches the old TOPICS constant for compatibility
          if (question) {
            question.concept = TOPICS.FRACTIONS_4TH;
          }
        }
        break;

      case TOPICS.MEASUREMENT_DATA_4TH:
        // Use the new pluggable content system for Measurement & Data
        const measurementDataTopic = content.getTopic('g4', 'measurement-data');
        if (measurementDataTopic) {
          // Get allowed subtopics for this topic if restrictions exist
          const allowedSubtopicsForThisTopic = allowedSubtopicsByTopic && allowedSubtopicsByTopic[topic]
            ? allowedSubtopicsByTopic[topic]
            : null;
          question = measurementDataTopic.generateQuestion(difficulty, allowedSubtopicsForThisTopic);
          // Ensure the concept field matches the old TOPICS constant for compatibility
          if (question) {
            question.concept = TOPICS.MEASUREMENT_DATA_4TH;
          }
        }
        break;

      case TOPICS.GEOMETRY:
        // Use the new pluggable content system for Geometry
        const geometryTopic = content.getTopic('g4', 'geometry');
        if (geometryTopic) {
          // Get allowed subtopics for this topic if restrictions exist
          const allowedSubtopicsForThisTopic = allowedSubtopicsByTopic && allowedSubtopicsByTopic[topic]
            ? allowedSubtopicsByTopic[topic]
            : null;
          question = geometryTopic.generateQuestion(difficulty, allowedSubtopicsForThisTopic);
          // Ensure the concept field matches the old TOPICS constant for compatibility
          if (question) {
            question.concept = TOPICS.GEOMETRY;
          }
        }
        break;

      case TOPICS.BINARY_ADDITION:
        // Use the new pluggable content system for Binary Addition
        const binaryAdditionTopic = content.getTopic('g4', 'binary-addition');
        if (binaryAdditionTopic) {
          // Get allowed subtopics for this topic if restrictions exist
          const allowedSubtopicsForThisTopic = allowedSubtopicsByTopic && allowedSubtopicsByTopic[topic]
            ? allowedSubtopicsByTopic[topic]
            : null;
          question = binaryAdditionTopic.generateQuestion(difficulty, allowedSubtopicsForThisTopic);
          // Ensure the concept field matches the old TOPICS constant for compatibility
          if (question) {
            question.concept = TOPICS.BINARY_ADDITION;
          }
        }
        break;

      default:
        question = {
          question: "No question generated",
          options: [],
          correctAnswer: "",
          concept: "Math",
        };
      }
    }

    // Skip if question generation failed (e.g., no valid subtopics)
    if (!question || !question.question) {
      attempts++;
      continue;
    }

    // Use complexity-based mastery to bias selection toward struggled/unseen items
    // Only apply to generated questions, not Firestore questions
    // Use question signature for mastery lookup to handle questions with same text but different answers
    const questionSigForMastery = getQuestionSignature(question);
    const masteryEntry = useFirestoreQuestion ? null : questionMastery.get(questionSigForMastery);

    let acceptProb = 0.7; // baseline for unseen questions
    if (!useFirestoreQuestion && masteryEntry && masteryEntry.count > 0) {
      // Higher average complexity score = more struggle = higher need
      const avgComplexity = masteryEntry.totalComplexity / masteryEntry.count;
      const need = Math.min(1, avgComplexity); // complexity [0,1] → need [0,1] capped at 1
      acceptProb = 0.1 + 0.9 * need; // struggled items get up to 1.0, mastered get 0.1
      if (process.env.NODE_ENV === "development") {
        console.log(
          `Question: ${question.question}, avgComplexity: ${avgComplexity}, totalComplexity: ${masteryEntry.totalComplexity}, need: ${need}, acceptProb: ${acceptProb}`
        );
      }
    }

    // Check subtopic restrictions
    const subtopicAllowed = isSubtopicAllowed(question, topic, allowedSubtopicsByTopic);
    if (!subtopicAllowed) {
      // Skip this question if subtopic is not allowed
      filteredBySubtopicCount++;
      consecutiveFilteredCount++;
      continue;
    }

    // Generate unique signature for this question
    const questionSig = getQuestionSignature(question);
    
    // For Firestore questions, always accept if unique. For generated, use probabilistic acceptance
    const shouldAccept = useFirestoreQuestion 
      ? !usedQuestions.has(questionSig)
      : Math.random() <= acceptProb && !usedQuestions.has(questionSig);

    if (shouldAccept) {
      usedQuestions.add(questionSig);
      questions.push(question);
      // Reset consecutive filtered count when we successfully accept a question
      consecutiveFilteredCount = 0;
    }
  }

  // If we couldn't generate enough unique questions, log a detailed warning
  if (questions.length < numQuestions) {
    const warningParts = [
      `Could only generate ${questions.length} unique questions out of ${numQuestions} requested for ${topic}`
    ];
    
    if (attempts >= maxAttempts) {
      warningParts.push(`(reached maximum attempts limit: ${maxAttempts})`);
    }
    
    if (filteredBySubtopicCount > 0) {
      warningParts.push(
        `${filteredBySubtopicCount} question${filteredBySubtopicCount > 1 ? 's were' : ' was'} filtered out due to subtopic restrictions`
      );
    }
    
    if (hasSubtopicRestrictions && questions.length === 0) {
      warningParts.push(
        `No valid questions found matching the subtopic restrictions. ` +
        `Consider reviewing the Focus settings for this student.`
      );
    }
    
    console.warn(warningParts.join('. ') + '.');
  }

  return questions;
};

// Grade-specific topics
const quizTopicsByGrade = {
  G3: [TOPICS.MULTIPLICATION, TOPICS.DIVISION, TOPICS.FRACTIONS, TOPICS.MEASUREMENT_DATA],
  G4: [
    TOPICS.OPERATIONS_ALGEBRAIC_THINKING,
    TOPICS.BASE_TEN,
    TOPICS.FRACTIONS_4TH,
    TOPICS.MEASUREMENT_DATA_4TH,
    TOPICS.GEOMETRY,
    TOPICS.BINARY_ADDITION,
  ],
};

// --- Helper function to check topic availability ---
const getTopicAvailability = (userData, selectedGrade = "G3") => {
  if (!userData)
    return {
      availableTopics: [],
      unavailableTopics: [],
      allCompleted: false,
      topicStats: [],
    };

  const today = getTodayDateString();
  const currentTopics =
    quizTopicsByGrade[selectedGrade] || quizTopicsByGrade.G3;
  

  // Get goals and progress for the selected grade
  const dailyGoalsForGrade =
    userData?.dailyGoalsByGrade?.[selectedGrade] || userData?.dailyGoals || {};
  const progressForGrade =
    userData?.progressByGrade?.[today]?.[selectedGrade] ||
    userData?.progress?.[today] ||
    {};

  const topicStats = currentTopics.map((topic) => {
    // Handle undefined topics gracefully
    if (!topic) {
      return {
        topic: 'undefined',
        correctAnswers: 0,
        completed: false,
        goal: DEFAULT_DAILY_GOAL,
      };
    }
    
    const goalForTopic = dailyGoalsForGrade[topic] || DEFAULT_DAILY_GOAL;
    const sanitizedTopic = sanitizeTopicName(topic);
    const stats = progressForGrade[sanitizedTopic] || {
      correct: 0,
      incorrect: 0,
    };

    return {
      topic,
      correctAnswers: stats.correct,
      completed: stats.correct >= goalForTopic,
      goal: goalForTopic,
    };
  });

  const completedTopics = topicStats.filter((t) => t.completed);
  const incompleteTopics = topicStats.filter((t) => !t.completed);

  // If all topics are completed, make all available again
  // This handles the case where reset didn't happen properly or user came back after all topics were done
  if (completedTopics.length === currentTopics.length) {
    return {
      availableTopics: currentTopics,
      unavailableTopics: [],
      allCompleted: true,
      topicStats,
    };
  }

  // If no topics are completed, all are available
  if (completedTopics.length === 0) {
    return {
      availableTopics: currentTopics,
      unavailableTopics: [],
      allCompleted: false,
      topicStats,
    };
  }

  // Some topics are completed - those become unavailable until others catch up
  const availableTopics = incompleteTopics.map((t) => t.topic);
  const unavailableTopics = completedTopics.map((t) => t.topic);

  return {
    availableTopics,
    unavailableTopics,
    allCompleted: false,
    topicStats,
  };
};

const getQuestionHistory = async (userId) => {
  if (!userId) return [];
  const userDocRef = getUserDocRef(userId);
  const userDoc = await getDoc(userDocRef);
  if (userDoc.exists() && userDoc.data().answeredQuestions) {
    return userDoc.data().answeredQuestions;
  }
  return [];
};

// Fetch answered question bank question IDs from user profile
const getAnsweredQuestionBankQuestions = async (userId) => {
  if (!userId) return [];
  const userDocRef = getUserDocRef(userId);
  const userDoc = await getDoc(userDocRef);
  if (userDoc.exists() && userDoc.data().answeredQuestionBankQuestions) {
    return userDoc.data().answeredQuestionBankQuestions;
  }
  return [];
};

// Fetch questions from Firestore (class questions, user questionBank, teacher questionBank, shared questionBank)
// Retry helper with exponential backoff
const retryWithBackoff = async (fn, options = {}) => {
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

// Note: Class questions are stored as reference documents that contain both:
//   1. Reference info (questionBankRef, teacherId) pointing to the original question
//   2. Full question data for efficient querying by topic/grade
const fetchQuestionsFromFirestore = async (topic, grade, userId, classId, answeredQuestionIds, appId, allowedSubtopicsByTopic = null) => {
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

// --- Helper Functions for Topic Encoding ---
const encodeTopicForPath = (topic) => encodeURIComponent(topic);
const decodeTopicFromPath = (topicParam) => {
  try {
    return decodeURIComponent(topicParam || '');
  } catch {
    return topicParam || '';
  }
};

const ResumeModal = ({ userData, startNewQuiz, resumePausedQuiz, navigateApp }) => {
  const { topic: topicParam } = useParams();
  const t = decodeTopicFromPath(topicParam);
  const pausedQuizData = userData?.pausedQuizzes?.[t];
  const hasPausedQuestions = (pausedQuizData?.questions || []).length > 0;
  const [isStarting, setIsStarting] = useState(false);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50">
      <div className="bg-white/50 backdrop-blur-sm rounded-2xl shadow-xl max-w-sm w-full p-8 text-center">
        <h3 className="text-2xl font-bold text-gray-800 mb-4">
          Paused Quiz Found!
        </h3>
        <p className="text-gray-600 mb-8">
          Do you want to continue your quiz on "{t}" or start a new one?
        </p>
        <div className="flex flex-col gap-4">
          <button
            disabled={isStarting}
            onClick={() => {
              if (hasPausedQuestions) {
                resumePausedQuiz(t);
              } else {
                startNewQuiz(t);
              }
              navigateApp(`/quiz/${encodeTopicForPath(t)}`, {
                state: { fromResumeModal: true },
              });
            }}
            className={`w-full bg-blue-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2 ${isStarting ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <Play size={20} /> Resume Paused Quiz
          </button>
          <button
            disabled={isStarting}
            onClick={async () => {
              if (isStarting) return;
              setIsStarting(true);
              console.log('[Resume] Start new button clicked', { topic: t });
              try {
                await startNewQuiz(t);
                navigateApp(`/quiz/${encodeTopicForPath(t)}`, {
                  state: { fromResumeModal: true },
                });
              } catch (error) {
                console.error('[Resume] Error starting new quiz:', error);
                setIsStarting(false);
              }
            }}
            className={`w-full bg-gray-200 text-gray-800 font-bold py-3 px-6 rounded-lg hover:bg-gray-300 transition ${isStarting ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isStarting ? 'Starting...' : 'Start New Quiz'}
          </button>
        </div>
      </div>
    </div>
  );
};

const MainAppContent = () => {
  const { startTutorial } = useTutorial();
  const { user: authUser, logout: authLogout, userRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const appBasePath = location.pathname.startsWith('/app') ? '/app' : '';
  
  const navigateApp = useCallback(
    (to, options) => {
      const normalized = to.startsWith('/') ? to : `/${to}`;
      navigate(`${appBasePath}${normalized}`, options);
    },
    [navigate, appBasePath]
  );
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [selectedGrade, setSelectedGrade] = useState("G3"); // Default to 3rd grade
  const [currentTopic, setCurrentTopic] = useState(null);
  const [currentQuiz, setCurrentQuiz] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [userAnswer, setUserAnswer] = useState(null);
  const [numericInput, setNumericInput] = useState(''); // For number pad input
  const [showHint, setShowHint] = useState(false);
  const [feedback, setFeedback] = useState(null); // Changed to null, will hold an object {message, type}
  const [isAnswered, setIsAnswered] = useState(false);
  const [quizState, setQuizState] = useState(APP_STATES.TOPIC_SELECTION); // App states managed via constants

  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState("");
  const [modalTitle, setModalTitle] = useState("");
  const [modalReactComponent, setModalReactComponent] = useState(null);
  const [purchaseFeedback, setPurchaseFeedback] = useState("");
  const [storyCreatedForCurrentQuiz, setStoryCreatedForCurrentQuiz] =
    useState(false);
  // Store UI: selected theme tab (animals | halloween | magic)
  const [storeTheme, setStoreTheme] = useState("animals");
  // Store items loaded dynamically from Firebase Storage
  const [storeItems, setStoreItems] = useState([]);
  // Enrollment state derived solely from artifacts/{appId}/classStudents
  const [isEnrolled, setIsEnrolled] = useState(false);
  // Prevent repeated quiz initialization loops when resuming/starting
  const quizInitInProgressRef = useRef(false);

  // Navigate to login page for anonymous users to upgrade their account
  const handleUserClick = () => {
    if (authUser && authUser.isAnonymous) {
      navigate('/student-login?mode=signup');
    }
  };

  // Custom logout handler that navigates to login page
  const handleLogout = async () => {
    try {
      await authLogout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // New state variables for story problem functionality
  const [showStoryHint, setShowStoryHint] = useState(false);
  const [showStoryAnswer, setShowStoryAnswer] = useState(false);
  const [storyData, setStoryData] = useState(null);

  // Drawing question state
  const [drawingImageBase64, setDrawingImageBase64] = useState(null);
  const [isValidatingDrawing, setIsValidatingDrawing] = useState(false);
  const [drawingFeedback, setDrawingFeedback] = useState(null);

  const [difficulty, setDifficulty] = useState(0.5);
  const [lastAskedComplexityByTopic, setLastAskedComplexityByTopic] = useState(
    {}
  );

  const questionStartTime = useRef(null);
  const quizContainerRef = useRef(null);

  // Utility: convert simple a/b patterns to TeX fractions for display
  const formatMathText = (text) => {
    if (typeof text !== "string") return text;
    // Replace bare fractions with TeX inline form \(\frac{a}{b}\)
    return text.replace(
      /(?<![\\\d])\b(\d+)\s*\/\s*(\d+)\b/g,
      (_, a, b) => `\\(\\frac{${a}}{${b}}\\)`
    );
  };

  // Load store images from Firebase Storage on component mount
  useEffect(() => {
    const loadImages = async () => {
      try {
        const images = await loadStoreImages();
        // Normalize theme names to lowercase for consistency
        const normalizedImages = images.map(item => ({
          ...item,
          theme: item.theme?.toLowerCase()
        }));
        setStoreItems(normalizedImages);
        console.log(`[MainApp] Loaded ${normalizedImages.length} store images`);
      } catch (error) {
        console.error('[MainApp] Error loading store images:', error);
        // Set empty array as fallback to prevent crashes
        setStoreItems([]);
      }
    };
    loadImages();
  }, []);
  // Sync storeTheme with available themes when storeItems changes
  useEffect(() => {
    if (storeItems.length > 0) {
      const availableThemes = [...new Set(storeItems.map((item) => item.theme?.toLowerCase()).filter(Boolean))];
      // If current theme doesn't exist in available themes, set to first available theme
      if (!availableThemes.includes(storeTheme) && availableThemes.length > 0) {
        setStoreTheme(availableThemes[0]);
      }
    }
  }, [storeItems, storeTheme]);

  // Auto-render KaTeX inside the quiz container when content changes
  useEffect(() => {
    if (quizState === APP_STATES.IN_PROGRESS && quizContainerRef.current) {
      try {
        renderMathInElement(quizContainerRef.current, {
          delimiters: [
            { left: "$$", right: "$$", display: true },
            { left: "\\(", right: "\\)", display: false },
            { left: "\\[", right: "\\]", display: true },
          ],
          throwOnError: false,
        });
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn("KaTeX render error:", e);
      }
    }
  }, [quizState, currentQuestionIndex, currentQuiz, userAnswer, isAnswered, feedback]);

  // Keep quizState in sync with the current route (used by tutorial + KaTeX effect)
  useEffect(() => {
    const effectivePath = location.pathname.startsWith('/app')
      ? location.pathname.slice('/app'.length) || '/'
      : location.pathname;

    if (effectivePath.startsWith('/quiz/')) {
      setQuizState(APP_STATES.IN_PROGRESS);
    } else if (effectivePath.startsWith('/results/')) {
      setQuizState(APP_STATES.RESULTS);
    } else if (effectivePath.startsWith('/store')) {
      setQuizState(APP_STATES.STORE);
    } else if (effectivePath.startsWith('/dashboard')) {
      setQuizState(APP_STATES.DASHBOARD);
    } else {
      setQuizState(APP_STATES.TOPIC_SELECTION);
    }
  }, [location.pathname]);

  const updateDifficulty = (score, numQuestions) => {
    const newDifficulty = Math.min(
      1,
      Math.max(0, difficulty + (score / numQuestions - 0.75) / 10)
    );
    setDifficulty(newDifficulty);
  };

  // --- Firebase Auth and Data Loading ---
  useEffect(() => {
    let unsubscribeSnapshot = () => {};
    let unsubscribeEnrollment = () => {};

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      unsubscribeSnapshot(); // Clean up previous listener if user changes
      unsubscribeEnrollment();

      if (currentUser) {
        setUser(currentUser);

        // Temporary: Expose auth objects globally for testing
        // Remove this in production
        if (process.env.NODE_ENV === "development") {
          window.firebaseAuth = auth;
          window.currentUser = currentUser;
          console.log("🧪 Firebase auth exposed for testing:", currentUser.uid);
        }

        const userDocRef = getUserDocRef(currentUser.uid);

        unsubscribeSnapshot = onSnapshot(
          userDocRef,
          (docSnap) => {
            if (docSnap.exists()) {
              const data = docSnap.data();
              const today = getTodayDateString();
              const updatePayload = {};
              let needsUpdate = false;

              // Migration: Set selectedGrade if missing (default to G3 for existing users)
              if (!data.selectedGrade) {
                data.selectedGrade = "G3";
                updatePayload.selectedGrade = "G3";
                needsUpdate = true;
              }

              // Migration: dailyGoals → dailyGoalsByGrade
              if (data.dailyGoals && !data.dailyGoalsByGrade) {
                const dailyGoalsByGrade = {
                  G3: { ...data.dailyGoals }, // Copy existing goals to G3
                  G4: {}, // Initialize G4 goals
                };

                // Initialize G4 goals with defaults
                quizTopicsByGrade.G4.forEach((topic) => {
                  dailyGoalsByGrade.G4[topic] = DEFAULT_DAILY_GOAL;
                });

                data.dailyGoalsByGrade = dailyGoalsByGrade;
                updatePayload.dailyGoalsByGrade = dailyGoalsByGrade;
                needsUpdate = true;
              }

              // Migration: progress → progressByGrade
              if (data.progress && !data.progressByGrade) {
                const progressByGrade = {};

                // Migrate existing progress data to G3 for each date
                Object.keys(data.progress).forEach((date) => {
                  progressByGrade[date] = {
                    G3: { ...data.progress[date] },
                    G4: {}, // Initialize empty G4 progress for this date
                  };

                  // Initialize G4 progress for this date
                  quizTopicsByGrade.G4.forEach((topic) => {
                    const sanitizedTopic = sanitizeTopicName(topic);
                    progressByGrade[date].G4[sanitizedTopic] = {
                      correct: 0,
                      incorrect: 0,
                    };
                  });

                  // Ensure 'all' exists for both grades
                  if (!progressByGrade[date].G3.all) {
                    progressByGrade[date].G3.all = {
                      correct: 0,
                      incorrect: 0,
                      timeSpent: 0,
                    };
                  }
                  progressByGrade[date].G4.all = {
                    correct: 0,
                    incorrect: 0,
                    timeSpent: 0,
                  };
                });

                data.progressByGrade = progressByGrade;
                updatePayload.progressByGrade = progressByGrade;
                needsUpdate = true;
              }

              // Ensure today exists in progressByGrade for both grades
              if (!data.progressByGrade?.[today]) {
                const initialTodayProgress = {
                  G3: { all: { correct: 0, incorrect: 0, timeSpent: 0 } },
                  G4: { all: { correct: 0, incorrect: 0, timeSpent: 0 } },
                };

                // Initialize topic-specific progress for both grades
                quizTopicsByGrade.G3.forEach((topic) => {
                  const sanitizedTopic = sanitizeTopicName(topic);
                  initialTodayProgress.G3[sanitizedTopic] = {
                    correct: 0,
                    incorrect: 0,
                  };
                });
                quizTopicsByGrade.G4.forEach((topic) => {
                  const sanitizedTopic = sanitizeTopicName(topic);
                  initialTodayProgress.G4[sanitizedTopic] = {
                    correct: 0,
                    incorrect: 0,
                  };
                });

                if (!data.progressByGrade) {
                  data.progressByGrade = {};
                }
                data.progressByGrade[today] = initialTodayProgress;
                updatePayload[`progressByGrade.${today}`] =
                  initialTodayProgress;
                needsUpdate = true;
              }

              // Legacy compatibility: ensure old progress field exists for today if needed
              if (!data.progress?.[today]) {
                const initialTodayProgress = {
                  all: { correct: 0, incorrect: 0, timeSpent: 0 },
                };
                if (!data.progress) {
                  data.progress = {};
                }
                data.progress[today] = initialTodayProgress;
                updatePayload[`progress.${today}`] = initialTodayProgress;
                needsUpdate = true;
              }

              // Ensure we have a stored lastAskedComplexityByTopic map
              if (!data.lastAskedComplexityByTopic) {
                data.lastAskedComplexityByTopic = {};
                updatePayload.lastAskedComplexityByTopic = {};
                needsUpdate = true;
              }

              // Set selectedGrade state from userData
              if (data.selectedGrade) {
                setSelectedGrade(data.selectedGrade);
              }

              setUserData({ ...data });
              // keep local state in sync
              setLastAskedComplexityByTopic(
                data.lastAskedComplexityByTopic || {}
              );

              if (needsUpdate) {
                updateDoc(userDocRef, updatePayload);
              }

              // Ensure ownedBackgrounds exists to prevent crashes
              if (!data.ownedBackgrounds) {
                data.ownedBackgrounds = ['default'];
                updateDoc(userDocRef, { ownedBackgrounds: ['default'] });
              }
            } else {
              const today = getTodayDateString();

              // Initialize goals for both grades
              const dailyGoalsByGrade = {
                G3: {},
                G4: {},
              };
              quizTopicsByGrade.G3.forEach((topic) => {
                dailyGoalsByGrade.G3[topic] = DEFAULT_DAILY_GOAL;
              });
              quizTopicsByGrade.G4.forEach((topic) => {
                dailyGoalsByGrade.G4[topic] = DEFAULT_DAILY_GOAL;
              });

              // Initialize progress for both grades
              const progressByGrade = {
                [today]: {
                  G3: { all: { correct: 0, incorrect: 0, timeSpent: 0 } },
                  G4: { all: { correct: 0, incorrect: 0, timeSpent: 0 } },
                },
              };

              // Initialize topic-specific progress
              quizTopicsByGrade.G3.forEach((topic) => {
                const sanitizedTopic = sanitizeTopicName(topic);
                progressByGrade[today].G3[sanitizedTopic] = {
                  correct: 0,
                  incorrect: 0,
                };
              });
              quizTopicsByGrade.G4.forEach((topic) => {
                const sanitizedTopic = sanitizeTopicName(topic);
                progressByGrade[today].G4[sanitizedTopic] = {
                  correct: 0,
                  incorrect: 0,
                };
              });

              const initialData = {
                coins: 0,
                selectedGrade: "G3", // Default to 3rd grade for new users
                dailyGoalsByGrade,
                progressByGrade,
                // Legacy fields for backward compatibility
                dailyGoals: dailyGoalsByGrade.G3,
                progress: { [today]: progressByGrade[today].G3 },
                pausedQuizzes: {},
                ownedBackgrounds: ["default"],
                activeBackground: "default",
                dailyStories: { [today]: {} },
                answeredQuestions: [],
                lastAskedComplexityByTopic: {},
                createdAt: new Date().toISOString(),
                role: "student",
                displayName: "Young Mathematician",
                // Add other initial fields as needed
                email: currentUser.isAnonymous
                  ? null
                  : currentUser.email || null,
              };
              setDoc(userDocRef, initialData).then(() => {
                setUserData(initialData);
                setSelectedGrade("G3");
              });
              setLastAskedComplexityByTopic({});
            }
          },
          (error) => {
            console.error("Firestore snapshot error:", error);
          }
        );

        // Subscribe to class enrollment using classStudents as the only source of truth
        try {
          const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
          const enrollmentsRef = collection(db, 'artifacts', appId, 'classStudents');
          const q = query(enrollmentsRef, where('studentId', '==', currentUser.uid));
          unsubscribeEnrollment = onSnapshot(
            q,
            (snap) => {
              setIsEnrolled(!snap.empty);
            },
            (err) => {
              console.warn('Enrollment subscription error:', err);
              setIsEnrolled(false);
            }
          );
        } catch (e) {
          console.warn('Failed to subscribe to enrollment:', e);
          setIsEnrolled(false);
        }
      } else {
        setUser(null);
        setUserData(null);
        // Only sign in anonymously if not on a restricted page
        if (!window.location.pathname.includes('/admin') && !window.location.pathname.includes('/teacher')) {
          try {
            if (
              typeof __initial_auth_token !== "undefined" &&
              __initial_auth_token
            ) {
              await signInWithCustomToken(auth, __initial_auth_token);
            } else {
              await signInAnonymously(auth);
            }
          } catch (error) {
            console.error("Firebase sign-in error:", error);
          }
        }
      }
    });

    return () => {
      unsubscribeAuth();
      unsubscribeSnapshot();
      unsubscribeEnrollment();
    };
  }, []);

  // --- Quiz Logic ---
  const handleTopicSelection = async (topic) => {
    const { availableTopics } = getTopicAvailability(userData, selectedGrade);

    if (!availableTopics.includes(topic)) {
      setFeedback({
        message: `Complete other topics first before returning to ${topic}!`,
        type: "error",
      });
      setTimeout(() => setFeedback(null), 3000);
      return;
    }

    if (userData?.pausedQuizzes?.[topic]) {
      navigateApp(`/resume/${encodeTopicForPath(topic)}`);
      return;
    }

    await startNewQuiz(topic);
    navigateApp(`/quiz/${encodeTopicForPath(topic)}`);
  };

  const startNewQuiz = async (topic) => {
    console.log('[startNewQuiz] Starting new quiz for topic:', topic);
    setCurrentTopic(topic);
    
    // Clear any paused quiz for this topic
    if (user && userData?.pausedQuizzes?.[topic]) {
      console.log('[startNewQuiz] Clearing paused quiz');
      const userDocRef = getUserDocRef(user.uid);
      if (userDocRef) {
        try {
          await updateDoc(userDocRef, {
            [`pausedQuizzes.${topic}`]: null,
          });
          console.log('[startNewQuiz] Paused quiz cleared');
        } catch (e) {
          console.warn('Could not clear paused quiz:', e);
        }
      }
    }
    
    console.log('[startNewQuiz] Fetching history');
    const answered = await getQuestionHistory(user.uid);
    const answeredQuestionIds = await getAnsweredQuestionBankQuestions(user.uid);
    
    // Get student's classId, class configuration, and enrollment subtopic restrictions
    let studentClassId = null;
    let questionBankProbability = 0.7; // Default 70%
    let allowedSubtopicsByTopic = null;
    const appIdForQuiz = typeof __app_id !== "undefined" ? __app_id : "default-app-id";
    try {
      const enrollmentsRef = collection(db, 'artifacts', appIdForQuiz, 'classStudents');
      const enrollmentQuery = query(enrollmentsRef, where('studentId', '==', user.uid));
      const enrollmentSnapshot = await getDocs(enrollmentQuery);
      if (!enrollmentSnapshot.empty) {
        const enrollmentData = enrollmentSnapshot.docs[0].data();
        studentClassId = enrollmentData.classId;
        
        // Get subtopic restrictions from enrollment
        if (enrollmentData.allowedSubtopicsByTopic) {
          allowedSubtopicsByTopic = enrollmentData.allowedSubtopicsByTopic;
        }
        
        // Fetch class configuration for question bank probability
        try {
          const classDocRef = doc(db, 'artifacts', appIdForQuiz, 'classes', studentClassId);
          const classDoc = await getDoc(classDocRef);
          if (classDoc.exists()) {
            const classData = classDoc.data();
            // Use class-specific probability if set, otherwise use default
            if (typeof classData.questionBankProbability === 'number') {
              questionBankProbability = Math.max(0, Math.min(1, classData.questionBankProbability));
              console.log(`Using class-configured question bank probability: ${questionBankProbability * 100}%`);
            }
          }
        } catch (classErr) {
          console.warn('Could not fetch class configuration:', classErr);
        }
      } else {
        // Try using deterministic enrollment ID as fallback
        // This handles cases where query might fail but enrollment exists
        // Fallback logic removed: userData.classId is not present in user schema.
        // (No fallback available; student is not enrolled in any class.)
        // Optionally, handle this case as needed (e.g., show a message or prompt).
      }
    } catch (e) {
      console.warn('Could not fetch student class:', e);
    }

    // Adapt and compute per-topic target complexity
    const adapted = adaptAnsweredHistory(answered, user?.uid);
    const lastAsked = lastAskedComplexityByTopic[topic];
    const target = nextTargetComplexity({
      history: adapted,
      topic,
      mode: "progressive",
      lastAskedComplexity: lastAsked,
    });

    // Optional: expose diagnostics in dev
    if (process.env.NODE_ENV === "development") {
      try {
        window.__complexityDiagnostics = {
          target,
          perTopic: computePerTopicComplexity(adapted),
          ranked: rankQuestionsByComplexity(adapted).slice(0, 20),
        };
        // eslint-disable-next-line no-console
        console.log("💡 Complexity target for", topic, "=>", target);
      } catch (e) {}
    }

    // Remember last asked per topic, set difficulty, and persist to Firestore
    setLastAskedComplexityByTopic((prev) => ({ ...prev, [topic]: target }));
    try {
      const userDocRef = getUserDocRef(user.uid);
      if (userDocRef) {
        await updateDoc(userDocRef, {
          [`lastAskedComplexityByTopic.${topic}`]: target,
        });
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn("Could not persist lastAskedComplexityByTopic:", e);
    }
    setDifficulty(target);

    // Get goals for the selected grade
    const dailyGoalsForGrade =
      userData?.dailyGoalsByGrade?.[selectedGrade] ||
      userData?.dailyGoals ||
      {};

    console.log('[startNewQuiz] Generating questions');
    const newQuestions = await generateQuizQuestions(
      topic,
      dailyGoalsForGrade,
      answered,
      target,
      selectedGrade,
      user.uid,
      studentClassId,
      answeredQuestionIds,
      appIdForQuiz,
      questionBankProbability,
      allowedSubtopicsByTopic
    );
    console.log('[startNewQuiz] Questions generated:', newQuestions?.length);
    setCurrentQuiz(newQuestions);
    questionStartTime.current = Date.now();
    setCurrentQuestionIndex(0);
    setScore(0);
    resetQuestionState();
    setStoryCreatedForCurrentQuiz(false); // Reset story creation status for new quiz
    // Reset story state
    setStoryData(null);
    setShowStoryHint(false);
    setShowStoryAnswer(false);
    console.log('[startNewQuiz] Quiz setup complete');
  };

  const resumePausedQuiz = (topic) => {
    const pausedData = userData?.pausedQuizzes?.[topic];
    if (!pausedData) return;

    setCurrentTopic(topic);
    setCurrentQuiz(pausedData.questions);
    setCurrentQuestionIndex(pausedData.index);
    setScore(pausedData.score);
    questionStartTime.current = Date.now();
    setStoryCreatedForCurrentQuiz(false); // Reset story creation status for resumed quiz
    // Reset story state
    setStoryData(null);
    setShowStoryHint(false);
    setShowStoryAnswer(false);
  };

  const pauseQuiz = useCallback(async () => {
    if (!user) return;

    if (!currentTopic || !currentQuiz || currentQuiz.length === 0) {
      return;
    }

    const userDocRef = getUserDocRef(user.uid);
    const pausedQuizData = {
      questions: currentQuiz,
      index: currentQuestionIndex,
      score: score,
    };
    await updateDoc(userDocRef, {
      [`pausedQuizzes.${currentTopic}`]: pausedQuizData,
    });

    // Optimistically update local state to avoid race conditions
    setUserData(prev => ({
      ...prev,
      pausedQuizzes: {
        ...prev?.pausedQuizzes,
        [currentTopic]: pausedQuizData
      }
    }));

    // Reset story UI state
    setStoryData(null);
    setShowStoryHint(false);
    setShowStoryAnswer(false);
  }, [user, currentQuiz, currentQuestionIndex, score, currentTopic]);

  // Pause/persist quiz when navigating away from /quiz/* (but not when going to results)
  const lastPathRef = useRef(location.pathname);
  useEffect(() => {
    const prev = lastPathRef.current;
    const next = location.pathname;
    const stripBase = (p) => (p.startsWith('/app') ? p.slice('/app'.length) || '/' : p);
    const prevPath = stripBase(prev);
    const nextPath = stripBase(next);
    const wasQuiz = prevPath.startsWith('/quiz/');
    const isQuiz = nextPath.startsWith('/quiz/');
    const goingToResults = nextPath.startsWith('/results/');

    if (wasQuiz && !isQuiz && !goingToResults) {
      pauseQuiz();
    }

    lastPathRef.current = next;
  }, [location.pathname, pauseQuiz]);

  const handleAnswer = (option) => {
    if (isAnswered) return;
    setUserAnswer(option);
    setStoryData(null);
    setShowStoryHint(false);
    setShowStoryAnswer(false);
  };

  const checkAnswer = async () => {
    const currentQuestion = currentQuiz[currentQuestionIndex];
    
    // Handle drawing questions differently
    if (currentQuestion.questionType === 'drawing') {
      if (!drawingImageBase64 || !user) return;
      
      setIsValidatingDrawing(true);
      const timeTaken = (Date.now() - questionStartTime.current) / 1000;
      
      try {
        // Call validation endpoint
        const token = await user.getIdToken();
        const response = await fetch('/.netlify/functions/validate-drawing', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            question: currentQuestion.question,
            drawingImageBase64: drawingImageBase64,
            questionId: currentQuestion.id || `drawing_${Date.now()}`
          })
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to validate drawing');
        }
        
        const result = await response.json();
        const isCorrect = result.isCorrect;
        const aiFeedback = result.feedback;
        const imageUrl = result.imageUrl;
        
        setDrawingFeedback(aiFeedback);
        
        // Record the drawing question
        const today = getTodayDateString();
        const userDocRef = getUserDocRef(user.uid);
        if (!userDocRef) return;
        
        const updates = {};
        const sanitizedTopic = sanitizeTopicName(currentTopic);
        
        const questionRecord = {
          id: `${Date.now()}_${currentQuestionIndex}`,
          timestamp: new Date().toISOString(),
          date: today,
          topic: currentTopic,
          grade: selectedGrade,
          question: currentQuestion.question,
          userAnswer: 'drawing',
          isCorrect: isCorrect,
          timeTaken: timeTaken,
          questionType: 'drawing',
          drawingImageUrl: imageUrl,
          aiFeedback: aiFeedback
        };
        
        updates[`answeredQuestions`] = arrayUnion(questionRecord);
        
        // Update progress tracking
        const allProgress_path = `progress.${today}.all`;
        const topicProgress_path = `progress.${today}.${sanitizedTopic}`;
        const gradeAllProgress_path = `progressByGrade.${today}.${selectedGrade}.all`;
        const gradeTopicProgress_path = `progressByGrade.${today}.${selectedGrade}.${sanitizedTopic}`;
        
        updates[`${allProgress_path}.${isCorrect ? 'correct' : 'incorrect'}`] = increment(1);
        updates[`${allProgress_path}.timeSpent`] = increment(timeTaken * 1000);
        updates[`${topicProgress_path}.${isCorrect ? 'correct' : 'incorrect'}`] = increment(1);
        updates[`${topicProgress_path}.timeSpent`] = increment(timeTaken * 1000);
        updates[`${gradeAllProgress_path}.${isCorrect ? 'correct' : 'incorrect'}`] = increment(1);
        updates[`${gradeAllProgress_path}.timeSpent`] = increment(timeTaken * 1000);
        updates[`${gradeTopicProgress_path}.${isCorrect ? 'correct' : 'incorrect'}`] = increment(1);
        updates[`${gradeTopicProgress_path}.timeSpent`] = increment(timeTaken * 1000);
        
        if (isCorrect) {
          setScore(score + 1);
          updates.coins = increment(1);
          setFeedback({
            type: "success",
            message: "Correct! Well done! 🎉"
          });
        } else {
          setFeedback({
            type: "error",
            message: "Not quite right. Try again next time!"
          });
        }
        
        await updateDoc(userDocRef, updates);
        setIsValidatingDrawing(false);
        setIsAnswered(true);
        
      } catch (error) {
        console.error('Error validating drawing:', error);
        setIsValidatingDrawing(false);
        setIsAnswered(true);
        setFeedback({
          type: "error",
          message: error.message || "Failed to validate drawing. Please try again."
        });
      }
      return;
    }
    
    // Handle regular questions (multiple-choice and numeric)
    if (userAnswer === null || !user) return;

    setIsAnswered(true);
    const timeTaken = (Date.now() - questionStartTime.current) / 1000; // in seconds
    
    // Normalize answers for numeric questions
    const normalizedUserAnswer = isNumericQuestion(currentQuestion) 
      ? normalizeNumericAnswer(userAnswer)
      : userAnswer;
    const normalizedCorrectAnswer = isNumericQuestion(currentQuestion)
      ? normalizeNumericAnswer(currentQuestion.correctAnswer)
      : currentQuestion.correctAnswer;
    
    const isCorrect = normalizedUserAnswer === normalizedCorrectAnswer;
    const today = getTodayDateString();
    const userDocRef = getUserDocRef(user.uid);
    if (!userDocRef) return;

    const updates = {};

    // Sanitize topic name for Firestore field paths
    const sanitizedTopic = sanitizeTopicName(currentTopic);

    // Update both legacy and new progress structures
    const allProgress_path = `progress.${today}.all`;
    const topicProgress_path = `progress.${today}.${sanitizedTopic}`;
    const gradeAllProgress_path = `progressByGrade.${today}.${selectedGrade}.all`;
    const gradeTopicProgress_path = `progressByGrade.${today}.${selectedGrade}.${sanitizedTopic}`;

    // Create question record for tracking with grade information
    const questionRecord = {
      id: `${Date.now()}_${currentQuestionIndex}`, // Unique ID
      timestamp: new Date().toISOString(),
      date: today,
      topic: currentTopic,
      grade: selectedGrade, // Add grade field for new questions
      question: currentQuiz[currentQuestionIndex].question,
      correctAnswer: currentQuiz[currentQuestionIndex].correctAnswer,
      userAnswer: userAnswer,
      isCorrect: isCorrect,
      timeTaken: timeTaken,
      options: currentQuiz[currentQuestionIndex].options,
      hint: currentQuiz[currentQuestionIndex].hint,
      standard: currentQuiz[currentQuestionIndex].standard,
      concept: currentQuiz[currentQuestionIndex].concept,
    };

    // Add grade-specific subtopic if available (for 4th grade questions)
    if (currentQuiz[currentQuestionIndex].subtopic) {
      questionRecord.subtopic = currentQuiz[currentQuestionIndex].subtopic;
    }

    // Add question to answered questions array
    updates[`answeredQuestions`] = arrayUnion(questionRecord);

    // Track answered question bank questions
    if (isCorrect && currentQuestion.questionId) {
      // Question is from Firestore question bank
      const currentAnsweredIds = userData?.answeredQuestionBankQuestions || [];
      if (!currentAnsweredIds.includes(currentQuestion.questionId)) {
        updates[`answeredQuestionBankQuestions`] = arrayUnion(currentQuestion.questionId);
      }
    }

    let feedbackMessage;
    let feedbackType = "error";
    let shouldResetProgress = false;

    if (isCorrect) {
      feedbackType = "success";
      setScore(score + 1);
      feedbackMessage = (
        <span className="flex items-center justify-center gap-2">
          Correct! +1 Coin! <Coins className="text-yellow-500" />
        </span>
      );
      updates.coins = increment(1);

      // Check if all topics will be completed after this answer (grade-aware)
      const dailyGoalsForGrade =
        userData?.dailyGoalsByGrade?.[selectedGrade] ||
        userData?.dailyGoals ||
        {};
      const currentTopicsForGrade =
        quizTopicsByGrade[selectedGrade] || quizTopicsByGrade.G3;
      const goalForTopic =
        dailyGoalsForGrade[currentTopic] || DEFAULT_DAILY_GOAL;

      const progressForGrade =
        userData?.progressByGrade?.[today]?.[selectedGrade] ||
        userData?.progress?.[today] ||
        {};
      const sanitizedCurrentTopic = sanitizeTopicName(currentTopic);
      const currentTopicProgress = progressForGrade[sanitizedCurrentTopic] || {
        correct: 0,
        incorrect: 0,
      };
      const newCorrectCount = currentTopicProgress.correct + 1;

      // Check if this makes the current topic completed and if all other topics are already completed
      if (newCorrectCount >= goalForTopic) {
        const allTopicsWillBeCompleted = currentTopicsForGrade.every(
          (topic) => {
            if (topic === currentTopic) {
              return true; // Current topic will be completed with this answer
            }
            const sanitizedTopic = sanitizeTopicName(topic);
            const topicProgress = progressForGrade[sanitizedTopic] || {
              correct: 0,
              incorrect: 0,
            };
            const goalForOtherTopic =
              dailyGoalsForGrade[topic] || DEFAULT_DAILY_GOAL;
            return topicProgress.correct >= goalForOtherTopic;
          }
        );

        // If all topics will be completed, we need to reset
        if (allTopicsWillBeCompleted) {
          shouldResetProgress = true;
          feedbackMessage = (
            <span className="flex flex-col items-center justify-center gap-1">
              <span className="flex items-center justify-center gap-2">
                Correct! +1 Coin! <Coins className="text-yellow-500" />
              </span>
              <span className="flex items-center justify-center gap-2 font-bold text-purple-600">
                🎉 All {selectedGrade === "G3" ? "3rd" : "4th"} Grade Topics
                Mastered! Progress Reset! <Award className="text-purple-500" />
              </span>
            </span>
          );
        }
      }
    } else {
      feedbackMessage = `Not quite. The correct answer is ${formatMathText(currentQuiz[currentQuestionIndex].correctAnswer)}.`;
    }

    // Handle progress updates based on whether we're resetting or not
    if (shouldResetProgress) {
      const currentTopicsForGrade =
        quizTopicsByGrade[selectedGrade] || quizTopicsByGrade.G3;

      // Reset all topic progress counters for this grade
      currentTopicsForGrade.forEach((topic) => {
        const sanitizedTopic = sanitizeTopicName(topic);

        // Update new progress structure
        updates[
          `progressByGrade.${today}.${selectedGrade}.${sanitizedTopic}.correct`
        ] = 0;
        updates[
          `progressByGrade.${today}.${selectedGrade}.${sanitizedTopic}.incorrect`
        ] = 0;
        updates[
          `progressByGrade.${today}.${selectedGrade}.${sanitizedTopic}.timeSpent`
        ] = 0;

        // Update legacy structure if selected grade is G3
        if (selectedGrade === "G3") {
          updates[`progress.${today}.${sanitizedTopic}.correct`] = 0;
          updates[`progress.${today}.${sanitizedTopic}.incorrect`] = 0;
          updates[`progress.${today}.${sanitizedTopic}.timeSpent`] = 0;
        }
      });

      // Set the current topic to 1 since we just answered correctly
      updates[
        `progressByGrade.${today}.${selectedGrade}.${sanitizedTopic}.correct`
      ] = 1;
      updates[
        `progressByGrade.${today}.${selectedGrade}.${sanitizedTopic}.timeSpent`
      ] = timeTaken;

      if (selectedGrade === "G3") {
        updates[`progress.${today}.${sanitizedTopic}.correct`] = 1;
        updates[`progress.${today}.${sanitizedTopic}.timeSpent`] = timeTaken;
      }

      // Update all progress (these don't get reset, they continue accumulating)
      updates[`${gradeAllProgress_path}.correct`] = increment(1);
      updates[`${gradeAllProgress_path}.timeSpent`] = increment(timeTaken);

      if (selectedGrade === "G3") {
        updates[`${allProgress_path}.correct`] = increment(1);
        updates[`${allProgress_path}.timeSpent`] = increment(timeTaken);
      }
    } else {
      // Normal increments for both new and legacy structures
      if (isCorrect) {
        updates[`${gradeAllProgress_path}.correct`] = increment(1);
        updates[`${gradeTopicProgress_path}.correct`] = increment(1);

        if (selectedGrade === "G3") {
          updates[`${allProgress_path}.correct`] = increment(1);
          updates[`${topicProgress_path}.correct`] = increment(1);
        }
      } else {
        updates[`${gradeAllProgress_path}.incorrect`] = increment(1);
        updates[`${gradeTopicProgress_path}.incorrect`] = increment(1);

        if (selectedGrade === "G3") {
          updates[`${allProgress_path}.incorrect`] = increment(1);
          updates[`${topicProgress_path}.incorrect`] = increment(1);
        }
      }

      // Always increment time
      updates[`${gradeAllProgress_path}.timeSpent`] = increment(timeTaken);
      updates[`${gradeTopicProgress_path}.timeSpent`] = increment(timeTaken);

      if (selectedGrade === "G3") {
        updates[`${allProgress_path}.timeSpent`] = increment(timeTaken);
        updates[`${topicProgress_path}.timeSpent`] = increment(timeTaken);
      }
    }

    // Calculate daily goal bonus based on selected grade
    const currentTopicsForGrade =
      quizTopicsByGrade[selectedGrade] || quizTopicsByGrade.G3;
    const dailyGoalsForGrade =
      userData?.dailyGoalsByGrade?.[selectedGrade] ||
      userData?.dailyGoals ||
      {};
    const totalDailyGoal = currentTopicsForGrade.reduce(
      (sum, topic) => sum + (dailyGoalsForGrade[topic] || DEFAULT_DAILY_GOAL),
      0
    );

    const progressForGrade =
      userData?.progressByGrade?.[today]?.[selectedGrade] ||
      userData?.progress?.[today] ||
      {};
    const todaysAllProgress = progressForGrade.all || {
      correct: 0,
      incorrect: 0,
    };
    const totalAnsweredToday =
      todaysAllProgress.correct + todaysAllProgress.incorrect;

    if (process.env.NODE_ENV === "development") {
      console.log(
        "Total answered today: ",
        totalAnsweredToday,
        " , out of: ",
        totalDailyGoal
      );
    }
    if (totalDailyGoal > 0 && (totalAnsweredToday + 1) % totalDailyGoal === 0) {
      if (process.env.NODE_ENV === "development") {
        console.log("🎉 Daily goal met! Awarding bonus coins!");
      }
      feedbackType = "success";
      feedbackMessage = (
        <span className="flex flex-col items-center justify-center gap-1">
          {isCorrect && (
            <span className="flex items-center justify-center gap-2">
              Correct! +1 Coin! <Coins className="text-yellow-500" />
            </span>
          )}
          <span className="flex items-center justify-center gap-2 font-bold">
            Daily Goal Met! +{DAILY_GOAL_BONUS} Bonus Coins!{" "}
            <Award className="text-orange-500" />
          </span>
        </span>
      );
      updates.coins = increment(DAILY_GOAL_BONUS);
    }

    setFeedback({ message: feedbackMessage, type: feedbackType });

    await updateDoc(userDocRef, updates);
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < currentQuiz.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      resetQuestionState();
      questionStartTime.current = Date.now();
    } else {
      finishQuiz();
    }
  };

  const finishQuiz = async () => {
    if (!user) return;
    const userDocRef = getUserDocRef(user.uid);
    // Clear the paused quiz for this topic by setting it to null
    await updateDoc(userDocRef, {
      [`pausedQuizzes.${currentTopic}`]: null,
    });
    updateDifficulty(score, currentQuiz.length);
    navigateApp(`/results/${encodeTopicForPath(currentTopic)}`);
  };

  const resetQuestionState = () => {
    setUserAnswer(null);
    setNumericInput(''); // Clear numeric input
    setShowHint(false);
    setFeedback(null);
    setIsAnswered(false);
    setDrawingImageBase64(null); // Clear drawing
  };

  const returnToTopics = async () => {
    // Pause quiz before leaving if we have an active quiz
    if (currentTopic && currentQuiz?.length > 0) {
      await pauseQuiz();
    }

    navigateApp('/');
    // Don't clear state immediately to avoid triggering QuizRoute logic during unmount
    // State will be reset when starting a new quiz or resuming
    setStoryData(null);
    setShowStoryHint(false);
    setShowStoryAnswer(false);
  };

  const resetAllProgress = async () => {
    if (!user) return;
    const userDocRef = getUserDocRef(user.uid);
    if (!userDocRef) return;

    const today = getTodayDateString();
    const updates = {};

    // Get topics for the current grade
    const currentTopics =
      quizTopicsByGrade[selectedGrade] || quizTopicsByGrade.G3;

    // Reset all topic progress counters for the current grade
    currentTopics.forEach((topic) => {
      const sanitizedTopic = sanitizeTopicName(topic);

      // Update new progress structure
      updates[
        `progressByGrade.${today}.${selectedGrade}.${sanitizedTopic}.correct`
      ] = 0;
      updates[
        `progressByGrade.${today}.${selectedGrade}.${sanitizedTopic}.incorrect`
      ] = 0;
      updates[
        `progressByGrade.${today}.${selectedGrade}.${sanitizedTopic}.timeSpent`
      ] = 0;

      // Update legacy structure only for G3
      if (selectedGrade === "G3") {
        updates[`progress.${today}.${sanitizedTopic}.correct`] = 0;
        updates[`progress.${today}.${sanitizedTopic}.incorrect`] = 0;
        updates[`progress.${today}.${sanitizedTopic}.timeSpent`] = 0;
      }
    });

    await updateDoc(userDocRef, updates);

    setFeedback({
      message: `🎉 ${
        selectedGrade === "G3" ? "3rd" : "4th"
      } Grade progress reset! All topics are now available for a fresh start!`,
      type: "success",
    });
    setTimeout(() => setFeedback(null), 3000);
  };

  // --- Store Logic ---
  const handlePurchase = async (item) => {
    if (userData.coins >= STORE_BACKGROUND_COST) {
      const userDocRef = getUserDocRef(user.uid);
      await updateDoc(userDocRef, {
        coins: increment(-STORE_BACKGROUND_COST),
        ownedBackgrounds: arrayUnion(item.id),
      });
      setPurchaseFeedback({
        type: "success",
        message: `Successfully purchased ${item.name}!`,
      });
    } else {
      setPurchaseFeedback({ type: "error", message: "Not enough coins!" });
    }
    setTimeout(() => setPurchaseFeedback(""), 3000);
  };

  const handleSetBackground = async (itemId) => {
    if (userData.ownedBackgrounds.includes(itemId)) {
      const userDocRef = getUserDocRef(user.uid);
      await updateDoc(userDocRef, { activeBackground: itemId });
    }
  };

  // --- Gemini API Call via Netlify Function ---
  const callGeminiAPI = async (prompt, { parseAsStory = false } = {}) => {
    setIsGenerating(true);
    setGeneratedContent("Generating story problem...");

    try {
      // Get the current user's auth token
      if (!user) {
        console.error("❌ No user found during API call");
        throw new Error("User not authenticated");
      }

      console.log("🔐 Getting auth token for user:", user.uid);
      const token = await user.getIdToken();
      console.log("✅ Got auth token, making API call...");

      const requestBody = {
        prompt: prompt,
        topic: currentTopic,
        grade: selectedGrade, // Add grade parameter
      };
      console.log("📤 Request body:", requestBody);

      const response = await fetch("/.netlify/functions/gemini-proxy", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      console.log("📥 Response status:", response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("❌ API Error:", errorData);
        throw new Error(
          errorData.error || `API call failed with status: ${response.status}`
        );
      }

      const result = await response.json();
      console.log("✅ API Success! Content length:", result.content?.length);
      setGeneratedContent(result.content);

      // Parse story content if requested (avoid relying on modalTitle state timing)
      if (parseAsStory) {
        parseStoryContent(result.content);
      }
    } catch (error) {
      console.error("Gemini API error:", error);
      setGeneratedContent(`There was an error: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  // Function to parse story content and extract components
  const parseStoryContent = (content) => {
    try {
      console.log("🔍 Parsing story content:", content);

      // Use regex to handle variations in newlines from the API
      const questionRegex = /Question:(.*?)(?=Hint:|Answer:|$)/s;
      const hintRegex = /Hint:(.*?)(?=Answer:|$)/s;
      const answerRegex = /Answer:(.*)/s;

      const questionMatch = content.match(questionRegex);
      const hintMatch = content.match(hintRegex);
      const answerMatch = content.match(answerRegex);

      const question = questionMatch ? questionMatch[1].trim() : "";
      const hint = hintMatch ? hintMatch[1].trim() : "";
      const answer = answerMatch ? answerMatch[1].trim() : "";

      // The story is whatever is before "Question:"
      const storyEndIndex = content.indexOf("Question:");
      const story =
        storyEndIndex !== -1
          ? content.substring(0, storyEndIndex).trim()
          : "Story could not be parsed.";

      console.log("✅ Final parsing results:", {
        story,
        question,
        hint,
        answer,
      });

      setStoryData({
        story: story,
        question: question || "Question could not be parsed.",
        hint: hint || "Hint could not be parsed.",
        answer: answer || "Answer could not be parsed.",
      });

      // Reset story UI state
      setShowStoryHint(false);
      setShowStoryAnswer(false);
    } catch (error) {
      console.error("Error parsing story content:", error);
      setStoryData({
        story: "Error parsing story content",
        question: "Error parsing question",
        hint: "Error parsing hint",
        answer: "Error parsing answer",
      });
    }
  };

  const handleExplainConcept = () => {
    const concept = currentQuiz[currentQuestionIndex].concept;
    
    // Check if this concept has a React component in the new content system
    let hasReactComponent = false;
    let ReactComponent = null;
    
    if (concept === TOPICS.GEOMETRY) {
      const geometryTopic = content.getTopic('g4', 'geometry');
      if (geometryTopic && geometryTopic.ExplanationComponent) {
        hasReactComponent = true;
        ReactComponent = geometryTopic.ExplanationComponent;
      }
    } else if (concept === TOPICS.OPERATIONS_ALGEBRAIC_THINKING) {
      const oaTopic = content.getTopic('g4', 'operations-algebraic-thinking');
      if (oaTopic && oaTopic.ExplanationComponent) {
        hasReactComponent = true;
        ReactComponent = oaTopic.ExplanationComponent;
      }
    } else if (concept === TOPICS.BASE_TEN) {
      const baseTenTopic = content.getTopic('g4', 'base-ten');
      if (baseTenTopic && baseTenTopic.ExplanationComponent) {
        hasReactComponent = true;
        ReactComponent = baseTenTopic.ExplanationComponent;
      }
    } else if (concept === TOPICS.FRACTIONS_4TH) {
      const fractionsTopic = content.getTopic('g4', 'fractions');
      if (fractionsTopic && fractionsTopic.ExplanationComponent) {
        hasReactComponent = true;
        ReactComponent = fractionsTopic.ExplanationComponent;
      }
    } else if (concept === TOPICS.MEASUREMENT_DATA_4TH) {
      const measurementDataTopic = content.getTopic('g4', 'measurement-data');
      if (measurementDataTopic && measurementDataTopic.ExplanationComponent) {
        hasReactComponent = true;
        ReactComponent = measurementDataTopic.ExplanationComponent;
      }
    } else if (concept === TOPICS.BINARY_ADDITION) {
      const binaryAdditionTopic = content.getTopic('g4', 'binary-addition');
      if (binaryAdditionTopic && binaryAdditionTopic.ExplanationComponent) {
        hasReactComponent = true;
        ReactComponent = binaryAdditionTopic.ExplanationComponent;
      }
    } else if (concept === TOPICS.MULTIPLICATION) {
      const multiplicationTopic = content.getTopic('g3', 'multiplication');
      if (multiplicationTopic && multiplicationTopic.ExplanationComponent) {
        hasReactComponent = true;
        ReactComponent = multiplicationTopic.ExplanationComponent;
      }
    } else if (concept === TOPICS.DIVISION) {
      const divisionTopic = content.getTopic('g3', 'division');
      if (divisionTopic && divisionTopic.ExplanationComponent) {
        hasReactComponent = true;
        ReactComponent = divisionTopic.ExplanationComponent;
      }
    } else if (concept === TOPICS.FRACTIONS) {
      const g3FractionsTopic = content.getTopic('g3', 'fractions');
      if (g3FractionsTopic && g3FractionsTopic.ExplanationComponent) {
        hasReactComponent = true;
        ReactComponent = g3FractionsTopic.ExplanationComponent;
      }
    } else if (concept === TOPICS.MEASUREMENT_DATA) {
      const g3MeasurementDataTopic = content.getTopic('g3', 'measurement-data');
      if (g3MeasurementDataTopic && g3MeasurementDataTopic.ExplanationComponent) {
        hasReactComponent = true;
        ReactComponent = g3MeasurementDataTopic.ExplanationComponent;
      }
    }
    
    if (hasReactComponent && ReactComponent) {
      // Use the new React component system
      setModalTitle(`✨ Understanding ${concept}`);
      setModalReactComponent(() => ReactComponent);
      setGeneratedContent(null);
      setIsGenerating(false);
      navigateApp(`/quiz/${encodeTopicForPath(currentTopic)}/explain`);
    } else {
      // Fall back to the legacy iframe system
      const explanationFile = conceptExplanationFiles[concept];
      
      if (explanationFile) {
        setModalTitle(`✨ Understanding ${concept}`);
        setModalReactComponent(null);
        setGeneratedContent(
          `<iframe src="${explanationFile}" style="width: 100%; height: 70vh; border: none; border-radius: 8px;" title="${concept} Explanation"></iframe>`
        );
        setIsGenerating(false);
        navigateApp(`/quiz/${encodeTopicForPath(currentTopic)}/explain`);
      } else {
        // Fallback: show modal with basic explanation
        setModalTitle(`✨ What is ${concept}?`);
        setModalReactComponent(null);
        setGeneratedContent(
          "<p>Sorry, no detailed explanation is available for this concept yet!</p>"
        );
        setIsGenerating(false);
        navigateApp(`/quiz/${encodeTopicForPath(currentTopic)}/explain`);
      }
    }
  };
  const handleCreateStoryProblem = async () => {
    if (storyCreatedForCurrentQuiz) {
      setFeedback({
        message: "You've already created a story problem for this quiz!",
        type: "error",
      });
      setTimeout(() => setFeedback(null), 3000);
      return;
    }

    const today = getTodayDateString();
    const todaysStories =
      userData?.dailyStories?.[today]?.[selectedGrade] || {};

    // Check if user has already created a story for this topic today for this grade
    if (todaysStories[currentTopic]) {
      const gradeLabel = selectedGrade === "G3" ? "3rd" : "4th";
      setFeedback({
        message: `You've already created a story problem for ${currentTopic} in ${gradeLabel} grade today! Come back tomorrow for more stories.`,
        type: "error",
      });
      setTimeout(() => setFeedback(null), 3000);
      return;
    }

    const gradeLabel = selectedGrade === "G3" ? "3rd" : "4th";
    const prompt = `Create a fun and short math story problem for a ${gradeLabel} grader based on the topic of "${currentTopic}". Make it one paragraph long.

Then, on a new line, state the question clearly, starting with "Question:".

After the question, on a new line, provide a helpful hint on how to solve it, starting with "Hint:".

At the end, on a new line, provide the answer, starting with "Answer:".

Please structure it exactly like this:
[Story paragraph]
Question: [The question]
Hint: [The hint]
Answer: [The answer]`;
    setModalTitle(`✨ A Fun Story Problem!`);
    setShowStoryHint(false);
    setShowStoryAnswer(false);
    setStoryData(null);

    navigateApp(`/results/${encodeTopicForPath(currentTopic)}/story`);

    // Pass explicit flag to avoid modalTitle timing issues
    await callGeminiAPI(prompt, { parseAsStory: true });
    setStoryCreatedForCurrentQuiz(true); // Mark that a story has been created for this quiz
  };

  // --- UI Rendering ---
  const renderHeader = () => {
    return (
      <div className="absolute top-4 right-4 flex items-center gap-2 bg-white/50 backdrop-blur-sm p-2 rounded-full shadow-md z-10" data-tutorial-id="navigation-menu">
        {/* Login options when no user is authenticated */}
        {!authUser && (
          <div className="flex items-center gap-2">
            <a
              href="/student-login"
              className="px-3 py-1 bg-green-100 hover:bg-green-200 rounded-full text-sm text-green-800 transition"
              title="Student Login"
            >
              Student
            </a>
            <a
              href="/teacher-login"
              className="px-3 py-1 bg-blue-100 hover:bg-blue-200 rounded-full text-sm text-blue-800 transition"
              title="Teacher Login"
            >
              Teacher
            </a>
            <a
              href="/admin-login"
              className="px-3 py-1 bg-purple-100 hover:bg-purple-200 rounded-full text-sm text-purple-800 transition"
              title="Admin Login"
            >
              Admin
            </a>
          </div>
        )}
        
        {/* User info section */}
        {authUser && (
          <div 
            className={`flex items-center gap-2 text-gray-700 bg-gray-100 px-3 py-1 rounded-full ${authUser.isAnonymous ? 'cursor-pointer hover:bg-gray-200 transition' : ''}`}
            onClick={handleUserClick}
            title={authUser.isAnonymous ? "Click to create an account and save your progress!" : (authUser.displayName || authUser.email)}
            data-tutorial-id="settings-menu"
          >
            <User size={16} />
            <span className="text-sm font-medium">
              {authUser.displayName || (authUser.isAnonymous ? 'Guest' : authUser.email?.split('@')[0])}
            </span>
            {userRole && (
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                {userRole}
              </span>
            )}
          </div>
        )}
        
        {/* Coins */}
        <div className="flex items-center gap-2 text-yellow-600 font-bold px-2">
          <Coins size={24} />
          <span>{userData?.coins || 0}</span>
        </div>
        
        {/* Store */}
        <button
          onClick={() => navigateApp('/store')}
          className="p-2 rounded-full hover:bg-gray-200 transition"
          title="Store"
          data-tutorial-id="store-button"
        >
          <Store size={24} className="text-purple-600" />
        </button>
        
        {/* Dashboard */}
        <button
          onClick={() => navigateApp('/dashboard')}
          className="p-2 rounded-full hover:bg-gray-200 transition"
          title="Dashboard"
          data-tutorial-id="dashboard-button"
        >
          <BarChart2 size={24} className="text-blue-600" />
        </button>
        
        {/* Teacher Dashboard - only for teachers and admins */}
        {userRole && [USER_ROLES.TEACHER, USER_ROLES.ADMIN].includes(userRole) && (
          <a
            href="/teacher"
            className="p-2 rounded-full hover:bg-gray-200 transition"
            title="Teacher Dashboard"
          >
            <BookOpen size={24} className="text-indigo-600" />
          </a>
        )}
        
        {/* Admin Portal - only for admins */}
        {userRole === USER_ROLES.ADMIN && (
          <a
            href="/admin"
            className="p-2 rounded-full hover:bg-gray-200 transition"
            title="Admin Portal"
          >
            <Shield size={24} className="text-purple-600" />
          </a>
        )}
        
        {/* Help/Tutorial */}
        <button
          onClick={() => {
            // Show appropriate tutorial based on current page
            switch (quizState) {
              case APP_STATES.DASHBOARD:
                startTutorial('dashboard', dashboardTutorial);
                break;
              case APP_STATES.STORE:
                startTutorial('store', storeTutorial);
                break;
              default:
                startTutorial('mainApp', mainAppTutorial);
                break;
            }
          }}
          className="p-2 rounded-full hover:bg-gray-200 transition"
          title="Show Tutorial"
        >
          <HelpCircle size={24} className="text-green-600" />
        </button>

        {/* Home */}
        <button
          onClick={returnToTopics}
          className="p-2 rounded-full hover:bg-gray-200 transition"
          title="Home"
          data-tutorial-id="return-to-topics-button"
        >
          <Home size={24} className="text-green-600" />
        </button>
        
        {/* Logout - for all authenticated users */}
        {authUser && (
          <button
            onClick={handleLogout}
            className="p-2 rounded-full hover:bg-red-100 transition"
            title={authUser.isAnonymous ? "Switch User" : "Logout"}
            data-tutorial-id="logout-button"
          >
            <LogOut size={24} className="text-red-600" />
          </button>
        )}
      </div>
    );
  };

  const renderDashboard = () => {
    const today = getTodayDateString();
    const currentTopics =
      quizTopicsByGrade[selectedGrade] || quizTopicsByGrade.G3;

    // Determine permissions for editing goals
    const isTeacherOrAdmin =
      userRole && [USER_ROLES.TEACHER, USER_ROLES.ADMIN].includes(userRole);
  const isEnrolledStudent = !isTeacherOrAdmin && isEnrolled;
    const canEditGoals = isTeacherOrAdmin || !isEnrolledStudent;

    // Get today's answered questions for the selected grade
    const todaysQuestions =
      userData?.answeredQuestions?.filter(
        (q) =>
          q.date === today &&
          (q.grade === selectedGrade || (!q.grade && selectedGrade === "G3"))
      ) || [];
    const totalQuestionsAnswered =
      userData?.answeredQuestions?.filter(
        (q) => q.grade === selectedGrade || (!q.grade && selectedGrade === "G3")
      ).length || 0;

    // Calculate overall stats from actual answered questions
    const correctAnswers = todaysQuestions.filter((q) => q.isCorrect).length;
    const totalAnswered = todaysQuestions.length;
    const totalTimeSpent = todaysQuestions.reduce(
      (sum, q) => sum + q.timeTaken,
      0
    );

    const accuracy =
      totalAnswered > 0
        ? Math.round((correctAnswers / totalAnswered) * 100)
        : 0;
    const avgTime =
      totalAnswered > 0 ? (totalTimeSpent / totalAnswered).toFixed(1) : 0;

    // Calculate topic breakdown from actual answered questions
    const topicStats = {};
    todaysQuestions.forEach((q) => {
      if (!topicStats[q.topic]) {
        topicStats[q.topic] = { correct: 0, incorrect: 0, total: 0 };
      }
      if (q.isCorrect) {
        topicStats[q.topic].correct++;
      } else {
        topicStats[q.topic].incorrect++;
      }
      topicStats[q.topic].total++;
    });

    const topicsPracticed = Object.keys(topicStats);

    // Complexity insights for the selected grade only
    const gradeFilteredHistory =
      userData?.answeredQuestions?.filter(
        (q) => q.grade === selectedGrade || (!q.grade && selectedGrade === "G3")
      ) || [];
    const adaptedGradeHistory = adaptAnsweredHistory(
      gradeFilteredHistory,
      user?.uid
    );
    const perTopicComplexity = computePerTopicComplexity(adaptedGradeHistory);
    const rankedGrade = rankQuestionsByComplexity(adaptedGradeHistory);

    // Deduplicate by topic: keep the highest-complexity (and most recent tie-breaker) per topic
    const seenTopicsSet = new Set();
    const topRankedUniqueByTopic = [];
    for (const r of rankedGrade) {
      if (!seenTopicsSet.has(r.topic)) {
        seenTopicsSet.add(r.topic);
        topRankedUniqueByTopic.push(r);
      }
      if (topRankedUniqueByTopic.length >= currentTopics.length) break;
    }

    // Get goals for the selected grade
    const dailyGoalsForGrade =
      userData?.dailyGoalsByGrade?.[selectedGrade] ||
      userData?.dailyGoals ||
      {};

    const handleGradeGoalChange = async (e, topic) => {
      if (!canEditGoals) {
        return; // Enrolled students cannot modify goals
      }
      const newGoal = parseInt(e.target.value, 10);
      if (user && !isNaN(newGoal) && newGoal > 0) {
        const userDocRef = getUserDocRef(user.uid);
        if (!userDocRef) return;

        const updates = {};
        updates[`dailyGoalsByGrade.${selectedGrade}.${topic}`] = newGoal;

        // Also update legacy dailyGoals if this is G3
        if (selectedGrade === "G3") {
          updates[`dailyGoals.${topic}`] = newGoal;
        }

        await updateDoc(userDocRef, updates);
      }
    };

    return (
      <div className="w-full max-w-3xl mx-auto bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-xl mt-20" data-tutorial-id="dashboard-container">
        <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center" data-tutorial-id="dashboard-title">
          {selectedGrade === "G3" ? "3rd" : "4th"} Grade Daily Goals & Progress
        </h2>

        {/* Grade Selector */}
        <div className="mb-6 flex justify-center">
          <div className="bg-white/70 backdrop-blur-sm p-3 rounded-xl shadow-md">
            <div className="flex gap-3">
              <button
                onClick={() => setSelectedGrade("G3")}
                className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${
                  selectedGrade === "G3"
                    ? "bg-blue-600 text-white shadow-lg"
                    : "bg-white text-gray-700 hover:bg-blue-50 border border-gray-300"
                }`}
              >
                3rd Grade
              </button>
              <button
                onClick={() => setSelectedGrade("G4")}
                className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${
                  selectedGrade === "G4"
                    ? "bg-blue-600 text-white shadow-lg"
                    : "bg-white text-gray-700 hover:bg-blue-50 border border-gray-300"
                }`}
              >
                4th Grade
              </button>
            </div>
          </div>
        </div>

        {/* Show a friendly note if goals are managed by a teacher */}
        {!canEditGoals && (
          <div className="mb-4 text-center text-sm text-gray-600">
            Goals are managed by your teacher and can't be changed here.
          </div>
        )}

        <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4" data-tutorial-id="daily-goals">
          {currentTopics.map((topic) => (
            <div key={topic}>
              <label
                htmlFor={`goal-${topic}`}
                className="block text-lg font-bold text-gray-700 mb-1"
              >
                {topic}
              </label>
              {canEditGoals ? (
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    id={`goal-${topic}`}
                    min={GOAL_RANGE_MIN}
                    max={GOAL_RANGE_MAX}
                    step={GOAL_RANGE_STEP}
                    value={dailyGoalsForGrade[topic] || DEFAULT_DAILY_GOAL}
                    onChange={(e) => handleGradeGoalChange(e, topic)}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <span className="font-bold text-blue-600 bg-blue-100 px-3 py-1 rounded-full w-20 text-center">
                    {dailyGoalsForGrade[topic] || DEFAULT_DAILY_GOAL} Qs
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-4">
                  <span className="font-bold text-blue-600 bg-blue-100 px-3 py-1 rounded-full w-24 text-center">
                    {dailyGoalsForGrade[topic] || DEFAULT_DAILY_GOAL} Qs
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>

        <h3 className="text-2xl font-bold text-gray-800 mb-4 text-center border-t pt-6">
          Today's Performance
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center mb-8" data-tutorial-id="progress-stats">
          <div className="bg-blue-100 p-4 rounded-lg">
            <p className="text-lg text-blue-800">Total Answered</p>
            <p className="text-3xl font-bold text-blue-600">{totalAnswered}</p>
          </div>
          <div className="bg-green-100 p-4 rounded-lg">
            <p className="text-lg text-green-800">Overall Accuracy</p>
            <p className="text-3xl font-bold text-green-600">{accuracy}%</p>
          </div>
          <div className="bg-yellow-100 p-4 rounded-lg">
            <p className="text-lg text-yellow-800">Avg. Time</p>
            <p className="text-3xl font-bold text-yellow-600">{avgTime}s</p>
          </div>
          <div className="bg-purple-100 p-4 rounded-lg">
            <p className="text-lg text-purple-800">All Time Total</p>
            <p className="text-3xl font-bold text-purple-600">
              {totalQuestionsAnswered}
            </p>
          </div>
        </div>

        {topicsPracticed.length > 0 && (
          <div className="mt-8">
            <h4 className="text-xl font-bold text-gray-700 mb-4">
              Topic Breakdown:
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left rounded-lg overflow-hidden">
                <thead className="bg-gray-200">
                  <tr>
                    <th className="p-3 font-bold">Topic</th>
                    <th className="p-3 font-bold text-center">Correct</th>
                    <th className="p-3 font-bold text-center">Incorrect</th>
                    <th className="p-3 font-bold text-center">Accuracy</th>
                  </tr>
                </thead>
                <tbody>
                  {topicsPracticed.map((topic) => {
                    const stats = topicStats[topic];
                    const topicAccuracy =
                      stats.total > 0
                        ? Math.round((stats.correct / stats.total) * 100)
                        : 0;
                    return (
                      <tr
                        key={topic}
                        className="border-b bg-white hover:bg-gray-50"
                      >
                        <td className="p-3 font-semibold">{topic}</td>
                        <td className="p-3 text-center text-green-600 font-semibold">
                          {stats.correct}
                        </td>
                        <td className="p-3 text-center text-red-600 font-semibold">
                          {stats.incorrect}
                        </td>
                        <td className="p-3 text-center font-semibold">
                          {topicAccuracy}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Complexity Insights */}
        {perTopicComplexity.length > 0 && (
          <div className="mt-8">
            <h4 className="text-xl font-bold text-gray-700 mb-4">
              Complexity Insights
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white rounded-lg shadow p-4">
                <h5 className="font-semibold text-gray-800 mb-2">
                  Per-Topic Average Complexity
                </h5>
                <ul className="space-y-1">
                  {perTopicComplexity.map((t) => (
                    <li key={t.topic} className="flex justify-between text-sm">
                      <span className="font-medium">{t.topic}</span>
                      <span className="text-gray-600">
                        {Math.round((t.avg || 0) * 100) / 100}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
              {topRankedUniqueByTopic.length > 0 && (
                <div className="bg-white rounded-lg shadow p-4">
                  <h5 className="font-semibold text-gray-800 mb-2">
                    Most Complex Recent Topics
                  </h5>
                  <ul className="space-y-2 max-h-40 overflow-y-auto">
                    {topRankedUniqueByTopic.map((r) => (
                      <li
                        key={r.questionId + String(r.createdAt)}
                        className="text-sm"
                      >
                        <div className="flex justify-between">
                          <span className="font-medium text-gray-700">
                            {r.topic}
                          </span>
                          <span className="text-purple-700 font-semibold">
                            {Math.round((r.complexityScore || 0) * 100) / 100}
                          </span>
                        </div>
                        <div
                          className="text-gray-600 truncate"
                          title={r.question || ""}
                        >
                          {r.question || ""}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {todaysQuestions.length > 0 && (
          <div className="mt-8">
            <h4 className="text-xl font-bold text-gray-700 mb-4">
              Today's Questions:
            </h4>
            <div className="max-h-60 overflow-y-auto">
              {todaysQuestions.map((q, index) => (
                <div
                  key={q.id}
                  className={`p-3 mb-2 rounded-lg border-l-4 ${
                    q.isCorrect
                      ? "bg-green-50 border-green-500"
                      : "bg-red-50 border-red-500"
                  }`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-semibold text-sm text-gray-600">
                      {q.topic}
                    </span>
                    <span className="text-xs text-gray-500">
                      {q.timeTaken.toFixed(1)}s
                    </span>
                  </div>
                  <p className="text-sm text-gray-800 mb-1">{q.question}</p>
                  <div className="text-xs">
                    <span className="text-gray-600">Your answer: </span>
                    <span
                      className={
                        q.isCorrect
                          ? "text-green-600 font-semibold"
                          : "text-red-600 font-semibold"
                      }
                    >
                      {q.userAnswer}
                    </span>
                    {!q.isCorrect && (
                      <>
                        <span className="text-gray-600 ml-2">Correct: </span>
                        <span className="text-green-600 font-semibold">
                          {q.correctAnswer}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="text-center mt-8">
          <button
            onClick={returnToTopics}
            className="bg-blue-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-blue-700 transition"
          >
            Back to Topics
          </button>
        </div>
      </div>
    );
  };

  const renderStore = () => {
    // Dynamically derive themes from storeItems, normalize to lowercase
    const uniqueThemes = [...new Set(storeItems.map((item) => item.theme?.toLowerCase()).filter(Boolean))];
    
    // Format theme names: capitalize first letter
    const formatThemeLabel = (theme) => {
      return theme.charAt(0).toUpperCase() + theme.slice(1);
    };
    
    const themes = uniqueThemes.map((theme) => ({
      key: theme,
      label: formatThemeLabel(theme),
    }));

    const filteredItems = storeItems.filter((it) => it.theme?.toLowerCase() === storeTheme);

    return (
      <div className="w-full max-w-5xl mx-auto bg-white/50 backdrop-blur-sm p-8 rounded-2xl shadow-xl mt-20" data-tutorial-id="store-container">
        <h2 className="text-4xl font-bold text-gray-800 mb-2 text-center" data-tutorial-id="store-title">
          Rewards Store
        </h2>
        <p className="text-lg text-gray-600 mb-6 text-center" data-tutorial-id="store-description">
          Use your coins to buy new backgrounds! Browse by theme.
        </p>

        {/* Theme Tabs */}
        <div className="overflow-x-auto mb-6" data-tutorial-id="store-tabs">
          <div className="flex justify-center gap-3 min-w-max px-4">
            {themes.map((t) => (
              <button
                key={t.key}
                onClick={() => setStoreTheme(t.key)}
                className={`px-4 py-2 rounded-full font-semibold transition whitespace-nowrap ${
                  storeTheme === t.key
                    ? "bg-blue-600 text-white shadow-lg"
                    : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {purchaseFeedback && (
          <div
            className={`p-3 rounded-lg mb-6 text-center font-semibold ${
              purchaseFeedback.type === "success"
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {purchaseFeedback.message}
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6" data-tutorial-id="store-items">
          {filteredItems.length === 0 ? (
            <div className="col-span-full text-center text-gray-500 py-8">
              No items in this theme yet.
            </div>
          ) : (
            filteredItems.map((item) => {
              const isOwned = userData.ownedBackgrounds.includes(item.id);
              const isActive = userData.activeBackground === item.id;

              return (
                <div
                  key={item.id}
                  className="border rounded-lg p-4 flex flex-col items-center justify-between bg-gray-50 shadow-md"
                >
                  <img
                    src={item.url}
                    alt={item.name}
                    loading="lazy"
                    className="w-full h-32 object-cover rounded-md mb-4 bg-gray-200"
                  />
                  <h4 className="font-bold text-lg mb-2">{item.name}</h4>
                  {isOwned ? (
                    <button
                      onClick={() => handleSetBackground(item.id)}
                      disabled={isActive}
                      className={`w-full font-bold py-2 px-4 rounded-lg transition ${
                        isActive
                          ? "bg-green-500 text-white"
                          : "bg-blue-200 text-blue-800 hover:bg-blue-300"
                      }`}
                    >
                      {isActive ? (
                        <span className="flex items-center justify-center gap-2">
                          <CheckCircle size={20} /> Active
                        </span>
                      ) : (
                        "Set Active"
                      )}
                    </button>
                  ) : (
                    <button
                      onClick={() => handlePurchase(item)}
                      className="w-full bg-purple-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-purple-700 transition flex items-center justify-center gap-2"
                      data-tutorial-id="store-buy-button"
                    >
                      <Coins size={16} /> {STORE_BACKGROUND_COST}
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
        <div className="text-center mt-8">
          <button
            onClick={returnToTopics}
            className="bg-blue-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-blue-700 transition"
          >
            Back to Topics
          </button>
        </div>
      </div>
    );
  };

  const renderTopicSelection = () => {
    const { availableTopics, unavailableTopics, allCompleted, topicStats } =
      getTopicAvailability(userData, selectedGrade);
    const currentTopics =
      quizTopicsByGrade[selectedGrade] || quizTopicsByGrade.G3;

    const handleGradeChange = async (newGrade) => {
      setSelectedGrade(newGrade);

      // Update selectedGrade in Firestore and ensure grade-specific data exists
      if (user && userData) {
        const userDocRef = getUserDocRef(user.uid);
        if (userDocRef) {
          try {
            const today = getTodayDateString();
            const updatePayload = { selectedGrade: newGrade };
            
            // Ensure grade-specific daily goals exist
            if (!userData.dailyGoalsByGrade?.[newGrade]) {
              if (!userData.dailyGoalsByGrade) userData.dailyGoalsByGrade = {};
              userData.dailyGoalsByGrade[newGrade] = {};
              
              // Initialize goals for the new grade
              quizTopicsByGrade[newGrade].forEach((topic) => {
                userData.dailyGoalsByGrade[newGrade][topic] = DEFAULT_DAILY_GOAL;
              });
              
              updatePayload.dailyGoalsByGrade = userData.dailyGoalsByGrade;
            }
            
            // Ensure grade-specific progress exists for today
            if (!userData.progressByGrade?.[today]?.[newGrade]) {
              if (!userData.progressByGrade) userData.progressByGrade = {};
              if (!userData.progressByGrade[today]) userData.progressByGrade[today] = {};
              userData.progressByGrade[today][newGrade] = { 
                all: { correct: 0, incorrect: 0, timeSpent: 0 } 
              };
              
              // Initialize topic-specific progress for the new grade
              quizTopicsByGrade[newGrade].forEach((topic) => {
                const sanitizedTopic = sanitizeTopicName(topic);
                userData.progressByGrade[today][newGrade][sanitizedTopic] = {
                  correct: 0,
                  incorrect: 0,
                };
              });
              
              updatePayload.progressByGrade = userData.progressByGrade;
            }
            
            await updateDoc(userDocRef, updatePayload);
            setUserData({...userData});
          } catch (e) {
            console.warn("Could not persist grade change:", e);
          }
        }
      }
    };

    return (
      <div className="text-center mt-20 pb-20">
        <div className="mb-2 flex justify-center items-center" data-tutorial-id="welcome-header">
          {/* Using animated gif for better performance */}
          <img
            src="/math-whiz-title.gif"
            alt="Math Whiz!"
            className="h-16 md:h-20 w-auto mb-4"
            style={{ imageRendering: "auto" }}
          />
        </div>

        {/* Grade Selector */}
        <div className="mb-6 flex justify-center">
          <div className="bg-white/70 backdrop-blur-sm p-4 rounded-xl shadow-md">
            <label className="block text-lg font-bold text-gray-700 mb-2">
              Choose your grade level:
            </label>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => handleGradeChange("G3")}
                className={`px-6 py-3 rounded-lg font-bold transition-all ${
                  selectedGrade === "G3"
                    ? "bg-blue-600 text-white shadow-lg transform scale-105"
                    : "bg-white text-gray-700 hover:bg-blue-50 border-2 border-gray-300"
                }`}
              >
                3rd Grade
              </button>
              <button
                onClick={() => handleGradeChange("G4")}
                className={`px-6 py-3 rounded-lg font-bold transition-all ${
                  selectedGrade === "G4"
                    ? "bg-blue-600 text-white shadow-lg transform scale-105"
                    : "bg-white text-gray-700 hover:bg-blue-50 border-2 border-gray-300"
                }`}
              >
                4th Grade
              </button>
            </div>
          </div>
        </div>

        <p className="text-2xl font-bold text-blue-600 mb-4 text-center pt-6">
          Choose a topic to start your {selectedGrade === "G3" ? "3rd" : "4th"}{" "}
          Grade math adventure!
        </p>

        {/* Feedback message */}
        {feedback && (
          <div
            className={`mb-6 p-3 rounded-lg mx-auto max-w-md text-center font-semibold ${
              feedback.type === "success"
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {feedback.message}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto px-4" data-tutorial-id="topic-selection">
          {currentTopics.map((topic) => {
            const isAvailable = availableTopics.includes(topic);
            const isCompleted =
              topicStats?.find((t) => t.topic === topic)?.completed || false;

            return (
              <button
                key={topic}
                onClick={() => handleTopicSelection(topic)}
                disabled={!isAvailable}
                className={`w-full p-4 rounded-2xl shadow-lg transition-all duration-300 ease-in-out flex flex-col items-center justify-center text-center group min-h-[140px] ${
                  isAvailable
                    ? "bg-white/50 backdrop-blur-sm hover:shadow-xl hover:-translate-y-1 transform cursor-pointer"
                    : "bg-gray-300/50 backdrop-blur-sm cursor-not-allowed opacity-60"
                }`}
              >
                <div
                  className={`p-3 rounded-full mb-3 transition-colors duration-300 ${
                    isAvailable
                      ? "bg-blue-100 group-hover:bg-blue-500"
                      : "bg-gray-200"
                  }`}
                >
                  {isCompleted ? (
                    <Award
                      className={`${
                        isAvailable ? "text-green-500" : "text-gray-400"
                      } transition-colors duration-300`}
                    />
                  ) : (
                    <Sparkles
                      className={`${
                        isAvailable
                          ? "text-blue-500 group-hover:text-white"
                          : "text-gray-400"
                      } transition-colors duration-300`}
                    />
                  )}
                </div>
                <h3
                  className={`text-lg md:text-xl font-bold transition-colors duration-300 ${
                    isAvailable
                      ? "text-gray-800 group-hover:text-blue-600"
                      : "text-gray-500"
                  }`}
                >
                  {topic}
                </h3>
                <p
                  className={`mt-1 text-sm ${
                    isAvailable ? "text-gray-500" : "text-gray-400"
                  }`}
                >
                  {isCompleted && !isAvailable
                    ? "✅ Waiting for others..."
                    : isCompleted && isAvailable
                    ? "✅ Ready to practice!"
                    : isAvailable
                    ? "Practice your skills!"
                    : "Complete other topics first"}
                </p>
              </button>
            );
          })}
        </div>
        {/* Progress Info */}
        <div className="mt-8 mb-8 bg-white/70 backdrop-blur-sm p-4 rounded-xl shadow-md max-w-2xl mx-auto">
          <p className="text-sm text-gray-700 font-medium">
            {allCompleted ? (
              <span className="text-green-600">
                🎉 All {selectedGrade === "G3" ? "3rd" : "4th"} grade topics
                completed! Ready for a fresh start?
              </span>
            ) : unavailableTopics.length > 0 ? (
              <span>
                Complete the goal for each available topic to unlock the others!
              </span>
            ) : (
              <span>
                Answer the required questions correctly per topic. Topics will
                become unavailable once completed until others catch up.
              </span>
            )}
          </p>
          {topicStats && (
            <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
              {topicStats.map((stat) => (
                <div
                  key={stat.topic}
                  className={`p-2 rounded ${
                    stat.completed
                      ? "bg-green-100 text-green-800"
                      : "bg-blue-100 text-blue-800"
                  }`}
                >
                  <div className="font-semibold">{stat.topic}</div>
                  <div>
                    {stat.correctAnswers}/{stat.goal} ✓
                  </div>
                </div>
              ))}

              {/* Reset button when all topics are completed */}
              {allCompleted && (
                <div className="mt-4">
                  <button
                    onClick={resetAllProgress}
                    className="bg-purple-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-purple-700 transition-transform transform hover:scale-105 flex items-center justify-center gap-2 mx-auto"
                  >
                    <Award size={20} /> Start Fresh Cycle
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderQuiz = () => {
    if (currentQuiz.length === 0) {
      return null;
    }
    const currentQuestion = currentQuiz[currentQuestionIndex];
    const progressPercentage =
      ((currentQuestionIndex + 1) / currentQuiz.length) * 100;

    // Filter images by type
    const allQuestionImages = (currentQuestion.images || []).filter(img => !img.type || img.type === 'question' || img.type === 'uploaded');
    const hintImages = (currentQuestion.images || []).filter(img => img.type === 'hint');
    const answerImages = (currentQuestion.images || []).filter(img => img.type === 'answer');

    // Determine if we should use an image as background for drawing
    let drawingBackgroundImage = null;
    let displayQuestionImages = allQuestionImages;

    if (currentQuestion.questionType === 'drawing' && allQuestionImages.length > 0) {
        // Use the first question image as background
        drawingBackgroundImage = allQuestionImages[0].data || allQuestionImages[0].url;
        // Remove it from the display list so it doesn't show up twice
        displayQuestionImages = allQuestionImages.slice(1);
    }

    return (
      <>
        <div
          ref={quizContainerRef}
          className="w-full max-w-3xl mx-auto bg-white/50 backdrop-blur-sm p-6 sm:p-8 rounded-2xl shadow-xl mt-20 flex flex-col"
          style={{ minHeight: 600 }}
          data-tutorial-id="question-interface"
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl md:text-3xl font-bold text-blue-600">
              {currentTopic}
            </h2>
            <button
              onClick={async () => {
                await pauseQuiz();
                navigateApp('/');
              }}
              className="flex items-center gap-2 text-gray-500 font-semibold py-2 px-4 rounded-lg hover:bg-gray-100 transition"
            >
              <Pause size={20} /> Pause
            </button>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5 mb-6">
            <div
              className="bg-green-500 h-2.5 rounded-full"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
          <p 
            key={`${currentQuestionIndex}-${isAnswered}`}
            className="text-lg md:text-xl text-gray-800 mb-6 min-h-[56px]"
          >
            {formatMathText(currentQuestion.question)}
          </p>

          {/* Question Images */}
          {displayQuestionImages.length > 0 && (
            <div className="flex flex-wrap gap-4 mb-6 justify-center">
              {displayQuestionImages.map((img, idx) => (
                <div key={idx} className="flex flex-col items-center">
                  <img 
                    src={img.data || img.url} 
                    alt={img.description || 'Question Image'} 
                    className="max-w-full h-auto max-h-60 rounded-lg shadow-md border border-gray-200"
                  />
                  {img.description && <p className="text-xs text-gray-500 mt-1">{img.description}</p>}
                </div>
              ))}
            </div>
          )}
          
          {/* Conditionally render drawing canvas, number pad, or multiple choice */}
          {currentQuestion.questionType === 'drawing' ? (
            <div className="mb-6">
              {!isAnswered ? (
                <DrawingCanvas
                  onChange={(imageData) => setDrawingImageBase64(imageData)}
                  width={600}
                  height={400}
                  backgroundImage={drawingBackgroundImage}
                />
              ) : (
                <div className="mt-4">
                  {drawingFeedback && (
                    <div className={`p-4 rounded-lg border-2 ${
                      feedback?.type === 'success'
                        ? 'bg-green-50 border-green-500 text-green-800'
                        : 'bg-red-50 border-red-500 text-red-800'
                    }`}>
                      <p className="font-semibold mb-2">AI Feedback:</p>
                      <p>{drawingFeedback}</p>
                    </div>
                  )}
                  {drawingImageBase64 && (
                    <div className="mt-4 text-center">
                      <p className="text-sm text-gray-600 mb-2">Your drawing:</p>
                      <img 
                        src={drawingImageBase64} 
                        alt="Your drawing" 
                        className="max-w-full h-auto border border-gray-300 rounded-lg mx-auto"
                        style={{ maxHeight: '300px' }}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : isNumericQuestion(currentQuestion) ? (
            <div className="mb-6">
              {!isAnswered && (
                <NumberPad 
                  value={numericInput}
                  onChange={(value) => {
                    setNumericInput(value);
                    setUserAnswer(value);
                  }}
                  disabled={isAnswered}
                />
              )}
              {isAnswered && (
                <div className="mt-4 text-center">
                  <p className="text-lg font-semibold">
                    Your answer was: <span className={
                      normalizeNumericAnswer(userAnswer) === normalizeNumericAnswer(currentQuestion.correctAnswer)
                        ? "text-green-600"
                        : "text-red-600"
                    }>{formatMathText(userAnswer)}</span>
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 items-stretch">
              {currentQuestion.options.map((option, index) => {
                const isSelected = userAnswer === option;
                const isCorrect = option === currentQuestion.correctAnswer;
                let buttonClass =
                  "bg-white border-2 border-gray-300 hover:bg-blue-50 hover:border-blue-400";
                if (isAnswered) {
                  if (isCorrect)
                    buttonClass =
                      "bg-green-100 border-2 border-green-500 text-green-800";
                  else if (isSelected && !isCorrect)
                    buttonClass =
                      "bg-red-100 border-2 border-red-500 text-red-800";
                  else
                    buttonClass =
                      "bg-gray-100 border-2 border-gray-300 text-gray-500";
                } else if (isSelected) {
                  buttonClass = "bg-blue-100 border-2 border-blue-500";
                }
                return (
                  <button
                    key={`${index}-${isAnswered}`}
                    onClick={() => handleAnswer(option)}
                    onDoubleClick={() => {
                      if (!isAnswered) {
                        handleAnswer(option);
                        // Use setTimeout to ensure the answer is set before checking
                        setTimeout(() => checkAnswer(), 0);
                      }
                    }}
                    disabled={isAnswered}
                    className={`w-full p-4 rounded-lg text-left text-lg font-medium transition-all duration-200 h-auto whitespace-normal break-words overflow-visible ${buttonClass}`}
                  >
                    {formatMathText(option)}
                  </button>
                );
              })}
            </div>
          )}
          {showHint && !isAnswered && (
            <div 
              onClick={() => setShowHint(false)}
              className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-800 p-4 mb-4 rounded-r-lg cursor-pointer hover:bg-yellow-200 transition-colors"
            >
              <p>
                <span className="font-bold">Hint:</span> {currentQuestion.hint}
              </p>
              {/* Hint Images */}
              {hintImages.length > 0 && (
                <div className="flex flex-wrap gap-4 mt-3 justify-center">
                  {hintImages.map((img, idx) => (
                    <div key={idx} className="flex flex-col items-center">
                      <img 
                        src={img.data || img.url} 
                        alt={img.description || 'Hint Image'} 
                        className="max-w-full h-auto max-h-40 rounded shadow-sm border border-yellow-200"
                      />
                      {img.description && <p className="text-xs text-yellow-700 mt-1">{img.description}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Answer Images - Show only when answered */}
          {isAnswered && answerImages.length > 0 && (
             <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="font-semibold text-blue-800 mb-2">Answer Explanation:</p>
                <div className="flex flex-wrap gap-4 justify-center">
                    {answerImages.map((img, idx) => (
                        <div key={idx} className="flex flex-col items-center">
                            <img 
                                src={img.data || img.url} 
                                alt={img.description || 'Answer Image'} 
                                className="max-w-full h-auto max-h-60 rounded shadow-md border border-blue-200"
                            />
                            {img.description && <p className="text-xs text-blue-600 mt-1">{img.description}</p>}
                        </div>
                    ))}
                </div>
             </div>
          )}

          {/* Bottom layout: two rows, responsive */}
          <div className="mt-auto w-full">
            {/* First row: Explain Concept | Sketch | Show/Hide Hint */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-2">
              <button
                onClick={handleExplainConcept}
                className="w-full flex items-center justify-center gap-2 text-purple-600 font-semibold py-1.5 px-3 rounded-lg hover:bg-purple-100 transition text-sm"
                data-tutorial-id="ai-tutor-button"
              >
                <Sparkles size={18} /> Learn About This
              </button>
              <button
                onClick={() => navigateApp(`/quiz/${encodeTopicForPath(currentTopic)}/sketch`)}
                className="w-full flex items-center justify-center gap-2 text-orange-600 font-semibold py-1.5 px-3 rounded-lg hover:bg-orange-100 transition text-sm"
              >
                <PenTool size={18} /> Sketch
              </button>
              <button
                onClick={() => setShowHint(!showHint)}
                disabled={isAnswered}
                className="w-full flex items-center justify-center gap-2 text-blue-600 font-semibold py-1.5 px-3 rounded-lg hover:bg-blue-100 transition disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                <HelpCircle size={18} />
                {showHint ? "Hide Hint" : "Show Hint"}
              </button>
            </div>
            {/* Second row: Response Field | Check/Next Button */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {/* Response Field: show feedback, selected answer, or prompt to select */}
              <div
                className={`flex items-center justify-center w-full min-h-[40px] rounded-lg border px-3 text-sm font-medium ${
                  feedback
                    ? feedback.type === "success"
                      ? "bg-green-100 border-green-500 text-green-800"
                      : "bg-red-100 border-red-500 text-red-800"
                    : "bg-gray-50 border-gray-200 text-gray-700"
                }`}
              >
                {feedback ? (
                  feedback.message
                ) : userAnswer !== null && userAnswer !== '' ? (
                  <span>
                    {isNumericQuestion(currentQuestion) ? 'Your answer' : 'Selected'}:{" "}
                    <span className="font-bold">
                      {formatMathText(userAnswer)}
                    </span>
                  </span>
                ) : (
                  <span className="italic text-gray-400">
                    {isNumericQuestion(currentQuestion) ? 'Enter a number' : 
                    currentQuestion.questionType === 'multiple-choice' ? 'Select an answer' : 
                    currentQuestion.questionType === 'drawing' ? 'Draw your answer' : ''}
                  </span>
                )}
              </div>
              <div className="flex items-center justify-center w-full">
                {isAnswered ? (
                  <button
                    onClick={nextQuestion}
                    className="w-full bg-blue-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-blue-700 transition-transform transform hover:scale-105 flex items-center justify-center gap-2 text-sm min-h-[40px]"
                  >
                    Next Question <ChevronsRight size={18} />
                  </button>
                ) : (
                  <button
                    onClick={checkAnswer}
                    disabled={
                      isValidatingDrawing ||
                      (currentQuestion.questionType === 'drawing'
                        ? !drawingImageBase64
                        : (userAnswer === null || userAnswer === ''))
                    }
                    className="w-full bg-green-500 text-white font-bold py-2 px-6 rounded-lg hover:bg-green-600 transition-transform transform hover:scale-105 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm min-h-[40px] flex items-center justify-center gap-2"
                  >
                    {isValidatingDrawing && (
                      <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    )}
                    <span>{isValidatingDrawing ? 'Checking drawing...' : 'Check Answer'}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
          <div className="text-center mt-4">
            <p className="text-xs text-gray-400">
              CA Standard: {currentQuestion.standard}
            </p>
          </div>
        </div>
      </>
    );
  };

  const renderResults = () => {
    const percentage = Math.round((score / currentQuiz.length) * 100);
    let message = "";
    let emoji = "";
    if (percentage === 100) {
      message = "Perfect Score! You're a Math Genius!";
      emoji = "🏆";
    } else if (percentage >= 80) {
      message = "Excellent Work! You really know your stuff!";
      emoji = "🎉";
    } else if (percentage >= 60) {
      message = "Good Job! Keep practicing!";
      emoji = "👍";
    } else {
      message = "Nice try! Don't give up, practice makes perfect!";
      emoji = "🧠";
    }

    // Check if user can create a story for this topic today (grade-aware)
    const today = getTodayDateString();
    const todaysStories =
      userData?.dailyStories?.[today]?.[selectedGrade] || {};
    const canCreateStory =
      !todaysStories[currentTopic] && !storyCreatedForCurrentQuiz;

    // Check if current topic has reached daily goal and some topics are still not complete
    const { availableTopics, topicStats } = getTopicAvailability(userData);
    const currentTopicStats = topicStats?.find((t) => t.topic === currentTopic);
    const isCurrentTopicCompleted = currentTopicStats?.completed || false;
    const hasIncompleteTopics = availableTopics.length > 0;
    const shouldGreyOutTryAgain =
      isCurrentTopicCompleted && hasIncompleteTopics;

    return (
      <div className="text-center bg-white/50 backdrop-blur-sm p-8 rounded-2xl shadow-xl max-w-md mx-auto mt-20">
        <h2 className="text-4xl font-bold text-gray-800 mb-4">
          Quiz Complete!
        </h2>
        <div className="text-6xl mb-4">{emoji}</div>
        <p className="text-xl text-gray-600 mb-2">{message}</p>
        <p className="text-2xl font-bold text-blue-600 mb-6">
          You scored {score} out of {currentQuiz.length} ({percentage}%)
        </p>
        {feedback && (
          <div
            className={`p-4 rounded-lg mb-4 text-center font-semibold ${
              feedback.type === "success"
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {feedback.message}
          </div>
        )}
        <div className="flex flex-col gap-4 justify-center">
          {canCreateStory ? (
            <button
              onClick={handleCreateStoryProblem}
              className="bg-purple-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-purple-700 transition-transform transform hover:scale-105 flex items-center justify-center gap-2"
            >
              <Sparkles size={20} /> Create a Story Problem
            </button>
          ) : (
            <div className="bg-gray-100 text-gray-600 font-medium py-3 px-6 rounded-lg flex flex-col items-center justify-center gap-1">
              <div className="flex items-center gap-2">
                <Sparkles size={20} /> Story Problem Unavailable
              </div>
              <div className="text-sm text-gray-500">
                {todaysStories[currentTopic]
                  ? `You've already created a story for ${currentTopic} today!`
                  : "You've already created a story for this quiz!"}
              </div>
            </div>
          )}
          {shouldGreyOutTryAgain ? (
            <div className="bg-gray-300 text-gray-500 font-bold py-3 px-6 rounded-lg cursor-not-allowed flex items-center justify-center gap-2">
              <span>Try Again</span>
              <span className="text-xs">(Complete other topics first)</span>
            </div>
          ) : (
            <button
              onClick={() => {
                startNewQuiz(currentTopic);
              }}
              className="bg-blue-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-blue-700 transition-transform transform hover:scale-105"
            >
              Try Again
            </button>
          )}
          <button
            onClick={returnToTopics}
            className="bg-gray-200 text-gray-800 font-bold py-3 px-6 rounded-lg hover:bg-gray-300 transition"
          >
            Choose New Topic
          </button>
        </div>
      </div>
    );
  };

  const renderModal = () => {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white/50 backdrop-blur-sm rounded-2xl shadow-xl max-w-4xl w-full p-6 relative flex flex-col max-h-[85vh]">
          <div className="flex-shrink-0">
            <button
              onClick={() => {
                navigate(-1);
                // Reset story state when modal is closed
                if (modalTitle === "✨ A Fun Story Problem!") {
                  setShowStoryHint(false);
                  setShowStoryAnswer(false);
                }
                // Reset React component state
                setModalReactComponent(null);
                setGeneratedContent("");
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700"
            >
              <X size={24} />
            </button>
            <h3 className="text-2xl font-bold text-gray-800 mb-4">
              {modalTitle}
            </h3>
          </div>
          <div className="flex-grow overflow-hidden">
            {isGenerating &&
            (!storyData || modalTitle !== "✨ A Fun Story Problem!") ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : storyData ? (
              <div className="space-y-6">
                {/* Story Section */}
                <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
                  <h4 className="font-bold text-blue-800 mb-2">📖 The Story</h4>
                  <p className="text-gray-700">{storyData.story}</p>
                </div>

                {/* Question Section */}
                <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-500">
                  <h4 className="font-bold text-green-800 mb-2">
                    ❓ The Question
                  </h4>
                  <p className="text-gray-700">{storyData.question}</p>
                </div>

                {/* Hint Section */}
                <div className="bg-yellow-50 p-4 rounded-lg border-l-4 border-yellow-500">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-bold text-yellow-800">💡 Hint</h4>
                    <button
                      onClick={() => setShowStoryHint(!showStoryHint)}
                      className="bg-yellow-500 text-white px-3 py-1 rounded text-sm hover:bg-yellow-600 transition"
                    >
                      {showStoryHint ? "Hide Hint" : "Show Hint"}
                    </button>
                  </div>
                  {showStoryHint && (
                    <p className="text-gray-700">{storyData.hint}</p>
                  )}
                </div>

                {/* Answer Section */}
                <div className="bg-purple-50 p-4 rounded-lg border-l-4 border-purple-500">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-bold text-purple-800">✅ Answer</h4>
                    <button
                      onClick={() => setShowStoryAnswer(!showStoryAnswer)}
                      className="bg-purple-500 text-white px-3 py-1 rounded text-sm hover:bg-purple-600 transition"
                    >
                      {showStoryAnswer ? "Hide Answer" : "Check Answer"}
                    </button>
                  </div>
                  {showStoryAnswer && (
                    <p className="text-gray-700 font-semibold">
                      {storyData.answer}
                    </p>
                  )}
                </div>
              </div>
            ) : modalReactComponent ? (
              <div className="text-gray-700 leading-relaxed overflow-auto" style={{ maxHeight: '60vh' }}>
                {React.createElement(modalReactComponent)}
              </div>
            ) : generatedContent ? (
              <div
                className="text-gray-700 whitespace-pre-wrap leading-relaxed h-full"
                dangerouslySetInnerHTML={{ __html: generatedContent }}
              />
            ) : null}
          </div>
        </div>
      </div>
    );
  };

  const QuizRoute = () => {
    const { topic: topicParam } = useParams();
    const t = decodeTopicFromPath(topicParam);
    const fromResumeModal = location.state?.fromResumeModal;
    const cameFromResume = !!fromResumeModal;
    const pausedQuizData = userData?.pausedQuizzes?.[t];
    const hasPausedQuestions = (pausedQuizData?.questions || []).length > 0;

    useEffect(() => {
      if (!t) return;
      if (currentTopic !== t) setCurrentTopic(t);

      console.log('[Resume] QuizRoute effect', {
        topic: t,
        cameFromResume,
        fromResumeModal,
        lastPath: lastPathRef.current,
        pausedExists: !!pausedQuizData,
        pausedQuestions: pausedQuizData?.questions?.length,
        currentQuizLength: currentQuiz?.length,
        initInProgress: quizInitInProgressRef.current,
      });

      // If we have no questions loaded, decide where to pull them from
      if ((!currentQuiz || currentQuiz.length === 0) && !quizInitInProgressRef.current) {
        quizInitInProgressRef.current = true;

        (async () => {
          try {
            if (pausedQuizData && hasPausedQuestions && !cameFromResume) {
              navigateApp(`/resume/${encodeTopicForPath(t)}`, { replace: true });
              return;
            }

            if (cameFromResume && pausedQuizData && hasPausedQuestions) {
              resumePausedQuiz(t);
              return;
            }

            // Either came from resume with empty paused data, or no paused data at all
          } finally {
            quizInitInProgressRef.current = false;
          }
        })();
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [t, currentQuiz, userData, cameFromResume, navigateApp, resumePausedQuiz]);

    return renderQuiz();
  };

  const ResultsRoute = () => {
    const { topic: topicParam } = useParams();
    const t = decodeTopicFromPath(topicParam);

    useEffect(() => {
      if (t && currentTopic !== t) setCurrentTopic(t);
      if (!currentQuiz || currentQuiz.length === 0) {
        navigateApp('/', { replace: true });
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [t]);

    return renderResults();
  };



  const ExplainModalRoute = () => {
    const { topic: topicParam } = useParams();
    const t = decodeTopicFromPath(topicParam);
    useEffect(() => {
      if (t && currentTopic !== t) setCurrentTopic(t);
      if (!modalTitle && !modalReactComponent && !generatedContent && !storyData && !isGenerating) {
        navigateApp(`/quiz/${encodeTopicForPath(t || currentTopic)}` , { replace: true });
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [t]);
    if (!modalTitle && !modalReactComponent && !generatedContent && !storyData && !isGenerating) return null;
    return renderModal();
  };

  const StoryModalRoute = () => {
    const { topic: topicParam } = useParams();
    const t = decodeTopicFromPath(topicParam);
    useEffect(() => {
      if (t && currentTopic !== t) setCurrentTopic(t);
      if (!modalTitle && !modalReactComponent && !generatedContent && !storyData && !isGenerating) {
        navigateApp(`/results/${encodeTopicForPath(t || currentTopic)}` , { replace: true });
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [t]);
    if (!modalTitle && !modalReactComponent && !generatedContent && !storyData && !isGenerating) return null;
    return renderModal();
  };

  const SketchOverlayRoute = () => {
    const { topic: topicParam } = useParams();
    const t = decodeTopicFromPath(topicParam);
    return (
      <SketchOverlay
        isVisible={true}
        onClose={() => navigateApp(`/quiz/${encodeTopicForPath(t || currentTopic)}`)}
      />
    );
  };

  const activeBgUrl =
    userData?.activeBackground && userData.activeBackground !== "default"
      ? storeItems.find((item) => item.id === userData.activeBackground)?.url
      : null;

  if (!user || !userData) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600"></div>
        <p className="ml-4 text-gray-600">Warming up the Math Machine...</p>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-gray-100 font-sans relative transition-all duration-500"
      style={{
        backgroundImage: activeBgUrl ? `url(${activeBgUrl})` : "none",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-0"></div>
      <div className="relative z-10 w-full">
        {renderHeader()}
        <div className="flex justify-center p-4">
          <div className="w-full max-w-6xl">
            <Routes>
              <Route path="dashboard" element={renderDashboard()} />
              <Route path="store" element={renderStore()} />
              <Route path="results/:topic/*" element={<ResultsRoute />} />
              <Route path="quiz/:topic/*" element={<QuizRoute />} />
              <Route path="" element={renderTopicSelection()} />
              <Route path="*" element={renderTopicSelection()} />
            </Routes>
          </div>
        </div>

        {/* Overlays (modals + sketch) are all route-driven */}
        <Routes>
          <Route path="resume/:topic" element={<ResumeModal userData={userData} startNewQuiz={startNewQuiz} resumePausedQuiz={resumePausedQuiz} navigateApp={navigateApp} />} />
          <Route path="quiz/:topic/explain" element={<ExplainModalRoute />} />
          <Route path="quiz/:topic/sketch" element={<SketchOverlayRoute />} />
          <Route path="results/:topic/story" element={<StoryModalRoute />} />
        </Routes>
        <TutorialOverlay />
      </div>
    </div>
  );
};

const App = () => {
  return (
    <TutorialProvider>
      <MainAppContent />
    </TutorialProvider>
  );
};

export default App;
