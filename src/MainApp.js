/* global __app_id, __initial_auth_token */
import React, { useState, useEffect, useRef, useCallback } from "react";
import { Routes, Route, useLocation, useNavigate, useParams } from "react-router-dom";
import "katex/dist/katex.min.css";
import renderMathInElement from "katex/contrib/auto-render";
import {
  Award,
  Coins,
  Play,
} from "lucide-react";
import {
  signInAnonymously,
  onAuthStateChanged,
  signInWithCustomToken,
} from "firebase/auth";
import {
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
import { auth, db } from './firebase';
import { useAuth } from './contexts/AuthContext';
import { TutorialProvider, useTutorial } from './contexts/TutorialContext';
import TutorialOverlay from './components/TutorialOverlay';
import { mainAppTutorial } from './tutorials/mainAppTutorial';
import { dashboardTutorial } from './tutorials/dashboardTutorial';
import { storeTutorial } from './tutorials/storeTutorial';
import SketchOverlay from './components/SketchCanvas';
import AdBanner from './components/AdBanner';
import { isNumericQuestion, normalizeNumericAnswer, isAIEvaluatedQuestion, isFillInTheBlanksQuestion, parseBlanks, parseCorrectAnswers, validateBlankAnswerCount, validateFillInAnswers } from './utils/answer-helpers';
import {
  adaptAnsweredHistory,
  nextTargetComplexity,
  computePerTopicComplexity,
  rankQuestionsByComplexity,
} from "./utils/complexityEngine";
import { APP_STATES } from "./constants/topics";
import {
  DEFAULT_DAILY_GOAL,
  DAILY_GOAL_BONUS,
  STORE_BACKGROUND_COST,
  DEFAULT_BACKGROUND_IMAGE,
  conceptExplanationFiles,
  quizTopicsByGrade,
  TOPIC_CONTENT_MAP,
} from "./constants/appConstants";
import {
  getTodayDateString,
  getUserDocRef,
  sanitizeTopicName,
  sanitizeObject,
  encodeTopicForPath,
  decodeTopicFromPath,
} from "./utils/firebaseHelpers";
import content from "./content";
import { loadStoreImages, getCachedStoreImages } from "./utils/storeImages";
import { resetTransientQuizState } from './utils/quizStateHelpers';
import QuizResults from './components/QuizResults';
import ContentModal from './components/ContentModal';
import QuizView from './components/QuizView';
import AppHeader from './components/AppHeader';
import Dashboard from './components/Dashboard';
import RewardsStore from './components/RewardsStore';
import TopicSelection from './components/TopicSelection';
import { getQuestionHistory, getAnsweredQuestionBankQuestions } from "./services/questionService";
import { generateQuizQuestions } from "./services/quizGenerationService";
import { getTopicAvailability } from "./services/topicAvailability";

// Re-export db and storage for backward compatibility
export { db, storage } from './firebase';

// Store items are now loaded dynamically from Firebase Storage

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
            onClick={async () => {
              if (isStarting) return;
              setIsStarting(true);
              console.log('[Resume] Resume paused button clicked', { topic: t, hasPausedQuestions });
              try {
                if (hasPausedQuestions) {
                  resumePausedQuiz(t);
                } else {
                  await startNewQuiz(t);
                }
                navigateApp(`/quiz/${encodeTopicForPath(t)}`, {
                  state: { fromResumeModal: true },
                });
              } catch (error) {
                console.error('[Resume] Error resuming quiz:', error);
                setIsStarting(false);
              }
            }}
            className={`w-full bg-blue-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2 ${isStarting ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <Play size={20} /> {isStarting ? 'Resuming...' : 'Resume Paused Quiz'}
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

  // Determine base app path once per mount; remains constant ("/app" or "").
  const appBasePathRef = useRef(location.pathname.startsWith('/app') ? '/app' : '');

  const navigateApp = useCallback(
    (to, options) => {
      const normalized = to.startsWith('/') ? to : `/${to}`;
      navigate(`${appBasePathRef.current}${normalized}`, options);
    },
    [navigate]
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
  // Image popup state
  const [popupImage, setPopupImage] = useState(null);
  const storeContainerRef = useRef(null);
  // Enrollment state derived solely from artifacts/{appId}/classStudents
  const [isEnrolled, setIsEnrolled] = useState(false);
  // Prevent repeated quiz initialization loops when resuming/starting
  const quizInitInProgressRef = useRef(false);
  // Track whether the current quiz has been completed (to prevent re-pausing on navigation)
  const quizFinishedRef = useRef(false);
  // Guard to prevent snapshot-driven grade reverts immediately after a user-initiated grade change
  const gradeChangeInProgressRef = useRef(false);

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

  const handleStoreImageClick = useCallback((item) => {
    setPopupImage(item);
  }, []);

  const handleClosePopupImage = useCallback(() => {
    setPopupImage(null);
  }, []);

  // Memoized callbacks for child components to prevent re-renders
  const handleDrawingChange = useCallback((imageData) => {
    setDrawingImageBase64(imageData);
  }, []);

  const handleWriteInChange = useCallback((text) => {
    setWriteInAnswer(text);
  }, []);

  const handleNumericChange = useCallback((value) => {
    setNumericInput(value);
    setUserAnswer(value);
  }, []);

  // New state variables for story problem functionality
  const [showStoryHint, setShowStoryHint] = useState(false);
  const [showStoryAnswer, setShowStoryAnswer] = useState(false);
  const [storyData, setStoryData] = useState(null);

  // Drawing question state
  const [drawingImageBase64, setDrawingImageBase64] = useState(null);
  const [isValidatingDrawing, setIsValidatingDrawing] = useState(false);
  const [drawingFeedback, setDrawingFeedback] = useState(null);
  
  // Write-in answer state
  const [writeInAnswer, setWriteInAnswer] = useState('');
  
  // Fill-in-the-blanks answer state
  const [fillInAnswers, setFillInAnswers] = useState([]);
  const [fillInResults, setFillInResults] = useState([]); // Array of booleans for each blank

  const [difficulty, setDifficulty] = useState(0.5);
  const [lastAskedComplexityByTopic, setLastAskedComplexityByTopic] = useState(
    {}
  );

  const questionStartTime = useRef(null);
  const quizContainerRef = useRef(null);

  // Utility: convert simple a/b patterns to TeX fractions for display
  const formatMathText = (text) => {
    if (typeof text !== "string") return text;
    const normalizedText = text
      .replace(/\\\\\(/g, "\\(")
      .replace(/\\\\\)/g, "\\)")
      .replace(/\\\\\[/g, "\\[")
      .replace(/\\\\\]/g, "\\]")
      .replace(/\\\\(frac|times|div|cdot|pi|theta|alpha|beta|gamma|sqrt|left|right|text|degree)/g, "\\$1");

    // Replace bare fractions with TeX inline form \(\frac{a}{b}\)
    return normalizedText.replace(
      /(?<![\\\d])\b(\d+)\s*\/\s*(\d+)\b/g,
      (_, a, b) => `\\(\\frac{${a}}{${b}}\\)`
    );
  };

  const resumePausedQuiz = useCallback((topic) => {
    const pausedData = userData?.pausedQuizzes?.[topic];
    if (!pausedData) return;

    quizFinishedRef.current = false;
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

    // Clear transient quiz state so previous feedback/answers don't carry over
    // Use helper to centralize logic and make it testable
    resetTransientQuizState({
      setFeedback,
      setIsAnswered,
      setUserAnswer,
      setWriteInAnswer,
      setFillInAnswers,
      setFillInResults,
      setDrawingFeedback,
      setShowHint,
    });
  }, [userData]);

  // Load store images from Firebase Storage on component mount
  // Skip or delay in test environments to speed up tests
  useEffect(() => {
    const loadImages = async () => {
      // Check if we're in a test environment (Playwright sets window.navigator.webdriver)
      const isTestEnv = typeof window !== 'undefined' && (
        window.navigator?.webdriver || 
        window.__playwright || 
        window.__PW_internal ||
        document.documentElement.getAttribute('webdriver')
      );
      
      // In test environments, use cached data immediately or skip loading
      if (isTestEnv) {
        // Try to get cached data first
        const cached = getCachedStoreImages();
        if (cached !== null && cached.length > 0) {
          const normalizedImages = cached.map(item => ({
            ...item,
            theme: item.theme?.toLowerCase()
          }));
          setStoreItems(normalizedImages);
          console.log(`[MainApp] Using cached store images (${normalizedImages.length} items) in test mode`);
          return;
        }
        // If no cache, set empty array to avoid blocking tests
        setStoreItems([]);
        console.log('[MainApp] Skipping store images load in test mode');
        return;
      }
      
      // Normal loading for non-test environments
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
  }, [quizState, currentQuestionIndex, currentQuiz, isAnswered, feedback, userAnswer, drawingFeedback, fillInAnswers]); // eslint-disable-line react-hooks/exhaustive-deps

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

  // Handle routing logic (Quiz, Results, Modals) to avoid component-in-component re-mounting issues
  useEffect(() => {
    const effectivePath = location.pathname.startsWith('/app')
      ? location.pathname.slice('/app'.length) || '/'
      : location.pathname;

    // 1. Quiz Route Logic
    if (effectivePath.startsWith('/quiz/')) {
      const parts = effectivePath.split('/');
      // /quiz/:topic or /quiz/:topic/explain or /quiz/:topic/sketch
      const topicParam = parts[2];
      if (topicParam) {
        const t = decodeTopicFromPath(topicParam);
        
        // Sync topic
        if (currentTopic !== t) setCurrentTopic(t);

        // Handle Explain/Sketch sub-routes
        const isExplain = parts[3] === 'explain';
        const isSketch = parts[3] === 'sketch';

        if (isExplain) {
          if (!modalTitle && !modalReactComponent && !generatedContent && !storyData && !isGenerating) {
            navigateApp(`/quiz/${encodeTopicForPath(t)}`, { replace: true });
          }
        } else if (!isSketch) {
          // Main Quiz Route Logic
          const fromResumeModal = location.state?.fromResumeModal;
          const cameFromResume = !!fromResumeModal;
          const pausedQuizData = userData?.pausedQuizzes?.[t];
          const hasPausedQuestions = (pausedQuizData?.questions || []).length > 0;

          // Check if we have questions for the CORRECT topic
          // We need to check both currentTopic AND that currentQuiz questions match the topic
          // Note: currentTopic may be stale (set by setCurrentTopic but not yet applied)
          // So we also check if currentQuiz[0] has a matching topic/concept if available
          const quizMatchesTopic = currentQuiz && currentQuiz.length > 0 && (
            currentTopic === t || 
            // Fallback: check if the first question's topic matches (for generated questions)
            currentQuiz[0]?.topic === t ||
            currentQuiz[0]?.concept === t
          );

          // If quiz matches topic, clear the init flag (quiz was loaded successfully)
          if (quizMatchesTopic && quizInitInProgressRef.current) {
            quizInitInProgressRef.current = false;
          }

          // If we have no questions loaded for this topic and not currently loading, decide where to pull them from
          if (!quizMatchesTopic && !quizInitInProgressRef.current) {
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
                
                // If we get here with no quiz for this topic and didn't come from resume,
                // it means direct URL navigation without quiz data - redirect to topic selection
                // The user should select a topic to start a quiz properly
                if (!quizMatchesTopic && !hasPausedQuestions) {
                  navigateApp('/', { replace: true });
                }
              } finally {
                quizInitInProgressRef.current = false;
              }
            })();
          }
        }
      }
    } 
    // 2. Results Route Logic
    else if (effectivePath.startsWith('/results/')) {
      const parts = effectivePath.split('/');
      const topicParam = parts[2];
      if (topicParam) {
        const t = decodeTopicFromPath(topicParam);
        if (t && currentTopic !== t) setCurrentTopic(t);
        
        // Handle Story sub-route
        const isStory = parts[3] === 'story';
        if (isStory) {
           if (!modalTitle && !modalReactComponent && !generatedContent && !storyData && !isGenerating) {
            navigateApp(`/results/${encodeTopicForPath(t)}`, { replace: true });
          }
        } else {
          if (!currentQuiz || currentQuiz.length === 0) {
            navigateApp('/', { replace: true });
          }
        }
      }
    }
  }, [location.pathname, location.state, currentQuiz, userData, currentTopic, navigateApp, resumePausedQuiz, modalTitle, modalReactComponent, generatedContent, storyData, isGenerating]);

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
              // When a local grade change is in progress, ignore snapshot-driven changes briefly to avoid UI flip-flop
              if (data.selectedGrade) {
                if (!gradeChangeInProgressRef.current) {
                  setSelectedGrade(data.selectedGrade);
                } else {
                  // Ignore incoming selectedGrade while a user-initiated change is pending
                  console.debug('Ignoring incoming selectedGrade update while local grade change in progress');
                }
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
              setDoc(userDocRef, initialData)
                .then(() => {
                  setUserData(initialData);
                  setSelectedGrade("G3");
                })
                .catch((error) => {
                  console.error("Failed to create user document:", error);
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

    // Only show resume modal if there are actually paused questions for this topic
    const pausedQuizData = userData?.pausedQuizzes?.[topic];
    const hasPausedQuestions = pausedQuizData && (pausedQuizData.questions || []).length > 0;
    
    if (hasPausedQuestions) {
      navigateApp(`/resume/${encodeTopicForPath(topic)}`);
      return;
    }

    // Set flag before starting quiz to prevent useEffect from interfering
    // The flag will be cleared by the useEffect once it sees the quiz is properly loaded
    quizInitInProgressRef.current = true;
    await startNewQuiz(topic);
    navigateApp(`/quiz/${encodeTopicForPath(topic)}`);
  };

  const startNewQuiz = async (topic) => {
    console.log('[startNewQuiz] Starting new quiz for topic:', topic);
    quizFinishedRef.current = false;
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
    
    // Handle AI-evaluated questions (drawing, write-in, drawing-with-text)
    if (isAIEvaluatedQuestion(currentQuestion)) {
      // Clear any previous AI feedback to avoid showing stale content
      setDrawingFeedback(null);

      // For drawing and drawing-with-text, we need drawingImageBase64
      const needsDrawing = currentQuestion.questionType === 'drawing' || currentQuestion.questionType === 'drawing-with-text';
      // For write-in and drawing-with-text, we need writeInAnswer
      const needsWriteIn = currentQuestion.questionType === 'write-in' || currentQuestion.questionType === 'drawing-with-text';
      
      // Validate required inputs
      if (needsDrawing && !drawingImageBase64) return;
      if (needsWriteIn && !writeInAnswer.trim()) return;
      if (!user) return;
      
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
            questionType: currentQuestion.questionType,
            drawingImageBase64: needsDrawing ? drawingImageBase64 : null,
            userWrittenAnswer: needsWriteIn ? writeInAnswer.trim() : null,
            expectedAnswer: currentQuestion.expectedAnswer || null,
            questionId: currentQuestion.id || `${currentQuestion.questionType}_${Date.now()}`
          })
        });
        
        if (!response.ok) {
          let errorMessage = `Validation request failed (${response.status})`;
          try {
            const errorData = await response.json();
            if (errorData?.error) {
              errorMessage = errorData.error;
            }
          } catch (parseJsonError) {
            try {
              const errorText = await response.text();
              if (errorText) {
                errorMessage = `${errorMessage}: ${errorText}`;
              }
            } catch (parseTextError) {
              // Keep fallback message
            }
          }
          throw new Error(errorMessage);
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
        
        // Build user answer representation based on question type
        let userAnswerRecord = currentQuestion.questionType;
        if (currentQuestion.questionType === 'drawing-with-text') {
          userAnswerRecord = 'drawing + written answer';
        } else if (currentQuestion.questionType === 'write-in') {
          userAnswerRecord = writeInAnswer.trim();
        }
        
        const questionRecord = {
          id: `${Date.now()}_${currentQuestionIndex}`,
          timestamp: new Date().toISOString(),
          date: today,
          topic: currentTopic,
          grade: selectedGrade,
          question: currentQuestion.question,
          userAnswer: userAnswerRecord,
          isCorrect: isCorrect,
          timeTaken: timeTaken,
          questionType: currentQuestion.questionType,
          ...(needsDrawing && { drawingImageUrl: imageUrl }),
          ...(needsWriteIn && { userWrittenAnswer: writeInAnswer.trim() }),
          aiFeedback: aiFeedback
        };
        
        // Sanitize questionRecord to remove undefined values
        const sanitizedQuestionRecord = sanitizeObject(questionRecord);
        
        updates[`answeredQuestions`] = arrayUnion(sanitizedQuestionRecord);
        
        // Track answered question bank questions to avoid repeating them
        if (isCorrect && currentQuestion.questionId) {
          // Question is from Firestore question bank
          const currentAnsweredIds = userData?.answeredQuestionBankQuestions || [];
          if (!currentAnsweredIds.includes(currentQuestion.questionId)) {
            updates[`answeredQuestionBankQuestions`] = arrayUnion(currentQuestion.questionId);
          }
        }
        
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
        console.error('Error validating AI answer:', {
          questionType: currentQuestion.questionType,
          error
        });
        setIsValidatingDrawing(false);
        setIsAnswered(true);
        setFeedback({
          type: "error",
          message: error.message || "Failed to validate AI answer. Please try again."
        });
      }
      return;
    }
    
    // Handle fill-in-the-blanks questions
    if (isFillInTheBlanksQuestion(currentQuestion)) {
      if (!user) return;
      
      // Parse blanks and correct answers
      const blanks = parseBlanks(currentQuestion.question);
      const correctAnswers = parseCorrectAnswers(currentQuestion.correctAnswer);
      
      // Validate blank count matches answer count
      if (!validateBlankAnswerCount(blanks, correctAnswers)) {
        setFeedback({
          message: '⚠️ Question configuration error',
          type: 'error'
        });
        return;
      }
      
      // Check if all blanks are filled
      const allFilled = fillInAnswers.length === blanks.length && 
                       fillInAnswers.every(ans => ans && ans.trim() !== '');
      
      if (!allFilled) {
        setFeedback({
          message: '⚠️ Please fill in all blanks',
          type: 'error'
        });
        return;
      }
      
      setIsAnswered(true);
      const timeTaken = (Date.now() - questionStartTime.current) / 1000;
      
      // Validate answers
      const validation = validateFillInAnswers(
        fillInAnswers, 
        correctAnswers, 
        currentQuestion.inputTypes
      );
      
      // Store results for color-coding
      setFillInResults(validation.results);
      
      const isCorrect = validation.allCorrect;
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
      
      // Create combined answer string for storage
      const userAnswerString = fillInAnswers.join(' ;; ');
      
      // Create question record for tracking with grade information
      const questionRecord = {
        id: `${Date.now()}_${currentQuestionIndex}`,
        timestamp: new Date().toISOString(),
        date: today,
        topic: currentTopic,
        grade: selectedGrade,
        question: currentQuestion.question,
        userAnswer: userAnswerString,
        isCorrect: isCorrect,
        timeTaken: timeTaken,
        questionType: currentQuestion.questionType,
        correctAnswer: currentQuestion.correctAnswer,
        options: [],
        hint: currentQuestion.hint,
        standard: currentQuestion.standard,
        concept: currentQuestion.concept,
        subtopic: currentQuestion.subtopic,
        fillInResults: validation.results, // Store individual blank results
      };
      
      // Sanitize questionRecord to remove undefined values
      const sanitizedQuestionRecord = sanitizeObject(questionRecord);
      
      updates.answeredQuestions = arrayUnion(sanitizedQuestionRecord);

      // Update progress counters (matching the structure used by regular questions)
      if (isCorrect) {
        updates.coins = increment(1);
        updates[`${gradeAllProgress_path}.correct`] = increment(1);
        updates[`${gradeTopicProgress_path}.correct`] = increment(1);

        if (selectedGrade === "G3") {
          updates[`${allProgress_path}.correct`] = increment(1);
          updates[`${topicProgress_path}.correct`] = increment(1);
        }

        setScore(score + 1);

        // Track answered question bank questions to avoid repeating them
        if (currentQuestion.questionId) {
          // Question is from Firestore question bank
          const currentAnsweredIds = userData?.answeredQuestionBankQuestions || [];
          if (!currentAnsweredIds.includes(currentQuestion.questionId)) {
            updates[`answeredQuestionBankQuestions`] = arrayUnion(currentQuestion.questionId);
          }
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
      
      // Determine feedback
      let feedbackMessage = '';
      let feedbackType = 'error';
      
      if (isCorrect) {
        const correctMessages = [
          '🎉 Perfect! All answers are correct!',
          '✨ Excellent work! Every blank is right!',
          '🌟 Outstanding! You got them all!',
          '👏 Fantastic! All correct!',
          '🎯 Bulls-eye! Perfect answers!',
        ];
        feedbackMessage = (
          <span className="flex items-center justify-center gap-2">
            {correctMessages[Math.floor(Math.random() * correctMessages.length)]} +1 Coin! <Coins className="text-yellow-500" />
          </span>
        );
        feedbackType = 'success';
      } else {
        const numCorrect = validation.results.filter(r => r).length;
        const numIncorrect = validation.results.length - numCorrect;
        feedbackMessage = `Not quite! ${numCorrect} correct, ${numIncorrect} incorrect. Try again!`;
        feedbackType = 'error';
      }
      
      setFeedback({ message: feedbackMessage, type: feedbackType });
      
      await updateDoc(userDocRef, updates);
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

    // Sanitize questionRecord to remove undefined values
    const sanitizedQuestionRecord = sanitizeObject(questionRecord);

    // Add question to answered questions array
    updates[`answeredQuestions`] = arrayUnion(sanitizedQuestionRecord);

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
    quizFinishedRef.current = true;
    updateDifficulty(score, currentQuiz.length);
    navigateApp(`/results/${encodeTopicForPath(currentTopic)}`);
  };

  const resetQuestionState = () => {
    setUserAnswer(null);
    setNumericInput(''); // Clear numeric input
    setWriteInAnswer(''); // Clear write-in answer
    setFillInAnswers([]); // Clear fill-in-the-blanks answers
    setFillInResults([]); // Clear fill-in-the-blanks results
    setDrawingFeedback(null); // Clear AI drawing/write-in feedback
    setShowHint(false);
    setFeedback(null);
    setIsAnswered(false);
    setDrawingImageBase64(null); // Clear drawing
  };

  const returnToTopics = async () => {
    // Pause quiz before leaving if we have an active (unfinished) quiz
    if (currentTopic && currentQuiz?.length > 0 && !quizFinishedRef.current) {
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
    if (userData?.ownedBackgrounds?.includes(itemId)) {
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

    // Use TOPIC_CONTENT_MAP for data-driven lookup instead of per-topic if/else
    const contentEntry = TOPIC_CONTENT_MAP[concept];
    let ReactComponent = null;
    if (contentEntry) {
      const [gradeId, topicId] = contentEntry;
      const topicContent = content.getTopic(gradeId, topicId);
      if (topicContent?.ExplanationComponent) {
        ReactComponent = topicContent.ExplanationComponent;
      }
    }

    if (ReactComponent) {
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
  const activeBgUrl =
    userData?.activeBackground && userData.activeBackground !== "default"
      ? storeItems.find((item) => item.id === userData.activeBackground)?.url
      : DEFAULT_BACKGROUND_IMAGE;

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
        <AppHeader
          authUser={authUser}
          userData={userData}
          userRole={userRole}
          navigateApp={navigateApp}
          handleUserClick={handleUserClick}
          handleLogout={handleLogout}
          quizState={quizState}
          startTutorial={startTutorial}
          returnToTopics={returnToTopics}
          dashboardTutorial={dashboardTutorial}
          storeTutorial={storeTutorial}
          mainAppTutorial={mainAppTutorial}
        />
        <div className="flex justify-center p-4 pb-20">
          <div className="w-full max-w-6xl">
            <Routes>
              <Route path="dashboard" element={
                <Dashboard
                  userData={userData}
                  selectedGrade={selectedGrade}
                  setSelectedGrade={setSelectedGrade}
                  user={user}
                  userRole={userRole}
                  isEnrolled={isEnrolled}
                  returnToTopics={returnToTopics}
                />
              } />
              <Route path="store" element={
                <RewardsStore
                  storeItems={storeItems}
                  storeTheme={storeTheme}
                  setStoreTheme={setStoreTheme}
                  purchaseFeedback={purchaseFeedback}
                  userData={userData}
                  storeContainerRef={storeContainerRef}
                  handlePurchase={handlePurchase}
                  handleSetBackground={handleSetBackground}
                  handleStoreImageClick={handleStoreImageClick}
                  handleClosePopupImage={handleClosePopupImage}
                  popupImage={popupImage}
                  returnToTopics={returnToTopics}
                />
              } />
              <Route path="results/:topic/*" element={
                <QuizResults
                  score={score}
                  currentQuiz={currentQuiz}
                  userData={userData}
                  selectedGrade={selectedGrade}
                  currentTopic={currentTopic}
                  storyCreatedForCurrentQuiz={storyCreatedForCurrentQuiz}
                  feedback={feedback}
                  handleCreateStoryProblem={handleCreateStoryProblem}
                  startNewQuiz={startNewQuiz}
                  navigateApp={navigateApp}
                  returnToTopics={returnToTopics}
                />
              } />
              <Route path="quiz/:topic/*" element={
                <QuizView
                  currentQuiz={currentQuiz}
                  currentQuestionIndex={currentQuestionIndex}
                  currentTopic={currentTopic}
                  userAnswer={userAnswer}
                  numericInput={numericInput}
                  feedback={feedback}
                  isAnswered={isAnswered}
                  showHint={showHint}
                  drawingImageBase64={drawingImageBase64}
                  isValidatingDrawing={isValidatingDrawing}
                  drawingFeedback={drawingFeedback}
                  writeInAnswer={writeInAnswer}
                  fillInAnswers={fillInAnswers}
                  fillInResults={fillInResults}
                  quizContainerRef={quizContainerRef}
                  pauseQuiz={pauseQuiz}
                  navigateApp={navigateApp}
                  handleAnswer={handleAnswer}
                  checkAnswer={checkAnswer}
                  nextQuestion={nextQuestion}
                  handleExplainConcept={handleExplainConcept}
                  handleNumericChange={handleNumericChange}
                  handleDrawingChange={handleDrawingChange}
                  handleWriteInChange={handleWriteInChange}
                  setFillInAnswers={setFillInAnswers}
                  setShowHint={setShowHint}
                  setUserAnswer={setUserAnswer}
                  formatMathText={formatMathText}
                />
              } />
              <Route path="" element={
                <TopicSelection
                  userData={userData}
                  selectedGrade={selectedGrade}
                  setSelectedGrade={setSelectedGrade}
                  setUserData={setUserData}
                  user={user}
                  gradeChangeInProgressRef={gradeChangeInProgressRef}
                  handleTopicSelection={handleTopicSelection}
                  feedback={feedback}
                  resetAllProgress={resetAllProgress}
                />
              } />
              <Route path="*" element={
                <TopicSelection
                  userData={userData}
                  selectedGrade={selectedGrade}
                  setSelectedGrade={setSelectedGrade}
                  setUserData={setUserData}
                  user={user}
                  gradeChangeInProgressRef={gradeChangeInProgressRef}
                  handleTopicSelection={handleTopicSelection}
                  feedback={feedback}
                  resetAllProgress={resetAllProgress}
                />
              } />
            </Routes>
          </div>
        </div>

        {/* Overlays (modals + sketch) are all route-driven */}
        <Routes>
          <Route path="resume/:topic" element={<ResumeModal userData={userData} startNewQuiz={startNewQuiz} resumePausedQuiz={resumePausedQuiz} navigateApp={navigateApp} />} />
          <Route path="quiz/:topic/explain" element={<ContentModal
                modalTitle={modalTitle}
                modalReactComponent={modalReactComponent}
                generatedContent={generatedContent}
                storyData={storyData}
                isGenerating={isGenerating}
                showStoryHint={showStoryHint}
                setShowStoryHint={setShowStoryHint}
                showStoryAnswer={showStoryAnswer}
                setShowStoryAnswer={setShowStoryAnswer}
                setModalReactComponent={setModalReactComponent}
                setGeneratedContent={setGeneratedContent}
                navigate={navigate}
              />} />
          <Route path="quiz/:topic/sketch" element={
            <SketchOverlay
              isVisible={true}
              onClose={() => navigateApp(`/quiz/${encodeTopicForPath(currentTopic)}`)}
            />
          } />
          <Route path="results/:topic/story" element={<ContentModal
                modalTitle={modalTitle}
                modalReactComponent={modalReactComponent}
                generatedContent={generatedContent}
                storyData={storyData}
                isGenerating={isGenerating}
                showStoryHint={showStoryHint}
                setShowStoryHint={setShowStoryHint}
                showStoryAnswer={showStoryAnswer}
                setShowStoryAnswer={setShowStoryAnswer}
                setModalReactComponent={setModalReactComponent}
                setGeneratedContent={setGeneratedContent}
                navigate={navigate}
              />} />
        </Routes>
        <TutorialOverlay />

        {/* Sticky bottom ad — hidden during active quizzes to avoid accidental clicks */}
        {!location.pathname.includes('/quiz/') && (
          <div className="fixed bottom-0 left-0 right-0 z-20 bg-white border-t border-gray-200">
            <AdBanner adSlot="YOUR_AD_SLOT_ID" format="horizontal" />
          </div>
        )}
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
