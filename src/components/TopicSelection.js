import React, { useState } from "react";
import { Award } from "lucide-react";
import { updateDoc } from "firebase/firestore";
import { getTodayDateString, getUserDocRef, sanitizeTopicName } from "../utils/firebaseHelpers";
import { getTopicAvailability } from "../services/topicAvailability";
import { DEFAULT_DAILY_GOAL } from "../constants/appConstants";
import { getAllGrades, getDefaultGradeKey, getGrade } from "../content/registry";
import { getTopicsForGrade } from "../utils/common_utils";
import { getTopicTheme } from "./topicThemes";

// Active-pill colors cycle per grade position (G3 blue, G4 purple, ...).
const GRADE_PILL_ACTIVE_CLASSES = ["bg-brand-blue", "bg-brand-purple"];

const TITLE_LETTERS = [
  { char: "M", color: "#2563eb", delay: "0s", hasHat: true },
  { char: "a", color: "#f56565", delay: "0.08s" },
  { char: "t", color: "#f6c844", delay: "0.16s" },
  { char: "h", color: "#48d1a5", delay: "0.24s" },
  { char: " ", isSpace: true },
  { char: "W", color: "#7c3aed", delay: "0.36s" },
  { char: "h", color: "#38bdf8", delay: "0.44s" },
  { char: "i", color: "#ec4899", delay: "0.52s" },
  { char: "z", color: "#fb923c", delay: "0.60s" },
  { char: "!", color: "#eab308", delay: "0.68s" },
];

const FLOATING_MATH_SPARKS = [
  {
    symbol: "×",
    delay: "0s",
    className:
      "-left-2 -top-1 w-7 h-7 rounded-xl bg-blue-100 text-blue-600 text-sm border-blue-200",
  },
  {
    symbol: "+",
    delay: "0.7s",
    className:
      "-right-3 -top-1 w-7 h-7 rounded-xl bg-amber-100 text-amber-600 text-sm border-amber-200",
  },
  {
    symbol: "÷",
    delay: "1.3s",
    className:
      "left-5 -bottom-2 w-6 h-6 rounded-lg bg-emerald-100 text-emerald-600 text-xs border-emerald-200",
  },
  {
    symbol: "½",
    delay: "1.9s",
    className:
      "right-7 -bottom-2 w-6 h-6 rounded-lg bg-pink-100 text-pink-600 text-xs border-pink-200",
  },
];

const AnimatedTitle = () => {
  const [poppedIndex, setPoppedIndex] = useState(null);

  const handleLetterClick = (index) => {
    setPoppedIndex(index);
    setTimeout(() => {
      setPoppedIndex((prev) => (prev === index ? null : prev));
    }, 550);
  };

  return (
    <div className="relative inline-flex items-center justify-center px-9 py-2">
      {/* Floating Math Sparks */}
      {FLOATING_MATH_SPARKS.map((spark) => (
        <span
          key={spark.symbol}
          aria-hidden="true"
          className={`math-whiz-spark absolute font-display font-bold flex items-center justify-center shadow-sm border pointer-events-none select-none ${spark.className}`}
          style={{ animationDelay: spark.delay }}
        >
          {spark.symbol}
        </span>
      ))}

      {/* Main Animated Heading */}
      <h1
        aria-label="Math Whiz!"
        className="font-display text-5xl md:text-6xl font-extrabold tracking-tight flex items-center select-none m-0 leading-none"
      >
        {TITLE_LETTERS.map((item, idx) => {
          if (item.isSpace) {
            return <span key={`space-${idx}`} className="w-3.5 md:w-4" aria-hidden="true" />;
          }

          return (
            <span key={`${item.char}-${idx}`} className="relative inline-block" aria-hidden="true">
              {item.hasHat && (
                <svg
                  className="math-whiz-hat absolute -top-6 -left-2.5 md:-top-7 md:-left-3 w-9 h-9 md:w-11 md:h-11 pointer-events-none z-10"
                  viewBox="0 0 64 64"
                >
                  <ellipse cx="32" cy="50" rx="26" ry="7" fill="#1e1b4b" />
                  <path
                    d="M32 6 L14 48 L50 48 Z"
                    fill="#4338ca"
                    stroke="#1e1b4b"
                    strokeWidth="3"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M17 42 Q32 47 47 42 L49 47 Q32 52 15 47 Z"
                    fill="#f59e0b"
                  />
                  <polygon
                    points="32,20 34,26 40,26 35,30 37,36 32,32 27,36 29,30 24,26 30,26"
                    fill="#fde047"
                  />
                </svg>
              )}
              <span
                onClick={() => handleLetterClick(idx)}
                className={`math-whiz-letter ${
                  poppedIndex === idx ? "math-whiz-letter-popped" : ""
                }`}
                style={{
                  color: item.color,
                  animationDelay: item.delay,
                }}
              >
                {item.char}
              </span>
            </span>
          );
        })}
      </h1>
    </div>
  );
};

const TopicSelection = ({
  userData,
  selectedGrade,
  setSelectedGrade,
  setUserData,
  user,
  gradeChangeInProgressRef,
  handleTopicSelection,
  startSecretMessageQuiz,
  feedback,
  resetAllProgress,
}) => {
  const { availableTopics, unavailableTopics, allCompleted, topicStats } =
    getTopicAvailability(userData, selectedGrade);
  const currentTopics = getTopicsForGrade(selectedGrade);
  const gradeShort =
    getGrade(selectedGrade)?.shortLabel ||
    getGrade(getDefaultGradeKey())?.shortLabel;

  const handleGradeChange = async (newGrade) => {
    // Optimistically set the UI state and mark change as in-progress so snapshots don't flip us back
    setSelectedGrade(newGrade);
    gradeChangeInProgressRef.current = true;
    setUserData(prev => ({ ...(prev || {}), selectedGrade: newGrade }));

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
            getTopicsForGrade(newGrade).forEach((topic) => {
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
            getTopicsForGrade(newGrade).forEach((topic) => {
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
        } finally {
          // Allow a short grace period for Firestore snapshot to settle before accepting snapshot-driven changes
          setTimeout(() => {
            gradeChangeInProgressRef.current = false;
          }, 1000);
        }
      } else {
        // No user doc found — clear the in-progress flag shortly so it doesn't stay set
        setTimeout(() => {
          gradeChangeInProgressRef.current = false;
        }, 1000);
      }
    } else {
      // No user data available (e.g., not signed in) — clear the in-progress flag shortly
      setTimeout(() => {
        gradeChangeInProgressRef.current = false;
      }, 1000);
    }
  };

  return (
    <div className="text-center mt-16 pb-20 px-4">
      {/* Title */}
      <div className="mb-4 flex justify-center items-center" data-tutorial-id="welcome-header">
        <AnimatedTitle />
      </div>

      {/* Grade and class source selector */}
      <div className="mb-8 flex justify-center">
        <div className="inline-flex bg-white rounded-full p-1.5 shadow-card border border-gray-100">
          {getAllGrades().map((grade, index) => (
            <button
              key={grade.key}
              onClick={() => handleGradeChange(grade.key)}
              className={`px-6 py-2.5 rounded-full font-display font-bold text-base transition-all duration-300 ${
                selectedGrade === grade.key
                  ? `${GRADE_PILL_ACTIVE_CLASSES[index % GRADE_PILL_ACTIVE_CLASSES.length]} text-white shadow-glow-blue`
                  : "text-gray-700 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              {grade.label}
            </button>
          ))}
        </div>
      </div>

      <p className="font-display text-2xl md:text-3xl font-bold text-gray-800 mb-6">
        Pick a topic to practice{' '}
        <span className="text-gradient-brand">
          {gradeShort} Grade
        </span>{' '}
        math!
      </p>

      {/* Feedback message */}
      {feedback && (
        <div
          className={`mb-6 p-3 rounded-button mx-auto max-w-md text-center font-semibold animate-slide-up ${
            feedback.type === "success"
              ? "bg-green-100 text-green-800 border border-green-200"
              : "bg-red-100 text-red-800 border border-red-200"
          }`}
        >
          {feedback.message}
        </div>
      )}

      {/* Topic Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-4xl mx-auto" data-tutorial-id="topic-selection">
        {currentTopics.map((topic, index) => {
          const isAvailable = availableTopics.includes(topic);
          const isCompleted =
            topicStats?.find((t) => t.topic === topic)?.completed || false;
          const colors = getTopicTheme(topic);
          const stat = topicStats?.find((t) => t.topic === topic);
          const progressPct = stat ? Math.min(100, (stat.correctAnswers / Math.max(stat.goal, 1)) * 100) : 0;

          return (
            <button
              key={topic}
              onClick={() => handleTopicSelection(topic)}
              disabled={!isAvailable}
              className={`w-full p-5 rounded-card border-2 transition-all duration-300 ease-out flex items-center gap-4 text-left group min-h-[100px] animate-slide-up ${
                isAvailable
                  ? `${colors.bg} ${colors.border} shadow-card hover:shadow-card-hover hover:-translate-y-1 cursor-pointer`
                  : "bg-gray-100 border-gray-200 cursor-not-allowed opacity-50"
              }`}
              style={{ animationDelay: `${index * 0.06}s`, animationFillMode: 'both' }}
            >
              {/* Topic Icon */}
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shrink-0 transition-all duration-300 ${
                  isAvailable
                    ? `${colors.lightBg} group-hover:${colors.accent} group-hover:text-white group-hover:scale-110`
                    : "bg-gray-200"
                }`}
              >
                {isCompleted ? (
                  <Award
                    size={28}
                    className={`${
                      isAvailable ? "text-green-500" : "text-gray-400"
                    } transition-colors duration-300`}
                  />
                ) : (
                  <span>{colors.icon}</span>
                )}
              </div>

              {/* Topic Info */}
              <div className="flex-1 min-w-0">
                <h3
                  className={`text-lg font-display font-bold transition-colors duration-300 ${
                    isAvailable
                      ? `text-gray-800 group-hover:${colors.text}`
                      : "text-gray-600"
                  }`}
                >
                  {topic}
                </h3>
                <p
                  className={`text-sm mt-0.5 ${
                    isAvailable ? "text-gray-600" : "text-gray-500"
                  }`}
                >
                  {isCompleted && !isAvailable
                    ? "Waiting for others..."
                    : isCompleted && isAvailable
                    ? "Ready to practice!"
                    : isAvailable
                    ? "Practice your skills!"
                    : "Complete other topics first"}
                </p>
                {/* Mini progress bar */}
                {stat && isAvailable && (
                  <div className="mt-2 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${isCompleted ? 'bg-green-400' : colors.accent.replace('bg-', 'bg-')}`}
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                )}
              </div>

              {/* Progress badge */}
              {stat && (
                <div className={`text-xs font-bold px-2.5 py-1 rounded-full shrink-0 ${
                  isCompleted
                    ? "bg-green-100 text-green-700"
                    : isAvailable
                    ? `${colors.lightBg} ${colors.text}`
                    : "bg-gray-200 text-gray-600"
                }`}>
                  {stat.correctAnswers}/{stat.goal}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Progress Info */}
      <div className="mt-8 mb-8 bg-white/80 backdrop-blur-sm p-5 rounded-card shadow-card max-w-2xl mx-auto border border-gray-100">
        <p className="text-sm text-gray-600 font-medium">
          {allCompleted ? (
            <span className="text-green-600 font-display font-bold">
              {'\uD83C\uDF89'} All {gradeShort} grade topics
              completed! Ready for a fresh start?
            </span>
          ) : unavailableTopics.length > 0 ? (
            <span>
              Complete the goal for each available topic to unlock the others!
            </span>
          ) : (
            <span>
              Answer the required questions correctly per topic to progress.
            </span>
          )}
        </p>

        {/* Reset button when all topics are completed */}
        {allCompleted && (
          <div className="mt-4">
            <button
              onClick={resetAllProgress}
              className="bg-brand-purple text-white font-display font-bold py-2.5 px-6 rounded-button hover:opacity-90 transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2 mx-auto shadow-card"
            >
              <Award size={20} /> Start Fresh Cycle
            </button>
          </div>
        )}
      </div>

      {startSecretMessageQuiz && (
        <button onClick={startSecretMessageQuiz} className="max-w-4xl mx-auto mt-8 mb-6 w-full border-2 border-teal-300 bg-teal-50 rounded-card p-5 flex items-center gap-4 text-left hover:bg-teal-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-700">
          <span className="text-3xl" aria-hidden="true">🔐</span>
          <span>
            <span className="block font-display text-xl font-bold text-teal-900">Secret Message</span>
            <span className="block text-sm text-teal-800">Solve math clues, decode letters, and discover an inspiring message.</span>
            <span className="block text-xs text-teal-700 mt-1">Bonus arithmetic practice</span>
          </span>
        </button>
      )}
    </div>
  );
};

export default TopicSelection;
