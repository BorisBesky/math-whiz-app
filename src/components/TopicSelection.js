import React from "react";
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

const AnimatedTitle = () => (
  <img
    src="/math-whiz-animated.svg"
    alt="Math Whiz!"
    className="h-16 md:h-20 w-auto"
    width={400}
    height={88}
    fetchPriority="high"
  />
);

const TopicSelection = ({
  userData,
  selectedGrade,
  setSelectedGrade,
  setUserData,
  user,
  gradeChangeInProgressRef,
  handleTopicSelection,
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
    </div>
  );
};

export default TopicSelection;
