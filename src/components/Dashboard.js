import React, { useEffect, useState } from "react";
import { updateDoc } from "firebase/firestore";
import { getTodayDateString, getUserDocRef } from "../utils/firebaseHelpers";
import {
  adaptAnsweredHistory,
  computePerTopicComplexity,
  rankQuestionsByComplexity,
} from "../utils/complexityEngine";
import { USER_ROLES } from "../utils/userRoles";
import { fetchStudentHistory } from "../services/studentHistoryService";
import { getQuestionHistory } from "../services/questionService";
import {
  DEFAULT_DAILY_GOAL,
  GOAL_RANGE_MIN,
  GOAL_RANGE_MAX,
  GOAL_RANGE_STEP,
} from "../constants/appConstants";
import { getAllGrades, getDefaultGradeKey, getGrade } from "../content/registry";
import { getTopicsForGrade } from "../utils/common_utils";

// Legacy pre-grades data model: top-level dailyGoals mirrors G3 (see MainApp).
const LEGACY_GRADE_KEY = "G3";

// Active-pill colors cycle per grade position (G3 blue, G4 purple, ...).
const GRADE_PILL_ACTIVE_CLASSES = ["bg-brand-blue", "bg-brand-purple"];

const Dashboard = ({
  userData,
  selectedGrade,
  setSelectedGrade,
  user,
  userRole,
  isEnrolled,
  returnToTopics,
}) => {
  const [attemptHistory, setAttemptHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const today = getTodayDateString();
  const currentTopics = getTopicsForGrade(selectedGrade);
  const gradeShort =
    getGrade(selectedGrade)?.shortLabel ||
    getGrade(getDefaultGradeKey())?.shortLabel;

  useEffect(() => {
    if (!user?.uid) return undefined;

    let cancelled = false;
    const loadHistory = async () => {
      setHistoryLoading(true);
      try {
        const history = await fetchStudentHistory({ studentId: user.uid });
        if (!cancelled) {
          setAttemptHistory(history);
        }
      } catch (error) {
        console.warn("[Dashboard] Failed to load attempt history:", error);
        try {
          const cachedHistory = await getQuestionHistory(user.uid);
          if (!cancelled) {
            setAttemptHistory(cachedHistory);
          }
        } catch (cachedError) {
          console.warn("[Dashboard] Failed to load cached attempt history:", cachedError);
          if (!cancelled) {
            setAttemptHistory(userData?.answeredQuestions || []);
          }
        }
      } finally {
        if (!cancelled) {
          setHistoryLoading(false);
        }
      }
    };

    loadHistory();
    return () => {
      cancelled = true;
    };
  }, [user?.uid, userData?.answeredQuestions]);

  const answeredQuestions = attemptHistory.length > 0
    ? attemptHistory
    : (userData?.answeredQuestions || []);

  // Determine permissions for editing goals
  const isTeacherOrAdmin =
    userRole && [USER_ROLES.TEACHER, USER_ROLES.ADMIN].includes(userRole);
  const isEnrolledStudent = !isTeacherOrAdmin && isEnrolled;
  const canEditGoals = isTeacherOrAdmin || !isEnrolledStudent;

  // Get today's answered questions for the selected grade
  const todaysQuestions =
    answeredQuestions.filter(
      (q) =>
        q.date === today &&
        (q.grade === selectedGrade || (!q.grade && selectedGrade === LEGACY_GRADE_KEY))
    ) || [];
  const totalQuestionsAnswered =
    answeredQuestions.filter(
      (q) => q.grade === selectedGrade || (!q.grade && selectedGrade === LEGACY_GRADE_KEY)
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
    answeredQuestions.filter(
      (q) => q.grade === selectedGrade || (!q.grade && selectedGrade === LEGACY_GRADE_KEY)
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

      // Also update legacy dailyGoals if this is the legacy grade
      if (selectedGrade === LEGACY_GRADE_KEY) {
        updates[`dailyGoals.${topic}`] = newGoal;
      }

      await updateDoc(userDocRef, updates);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto bg-white/80 backdrop-blur-md p-6 sm:p-8 rounded-card shadow-card border border-white/60 mt-16 animate-fade-in" data-tutorial-id="dashboard-container">
      <h2 className="text-2xl md:text-3xl font-display font-bold text-gray-800 mb-5 text-center" data-tutorial-id="dashboard-title">
        {gradeShort} Grade Progress
      </h2>
      {historyLoading && (
        <p className="text-center text-sm text-gray-500 mb-4">Loading progress history...</p>
      )}

      {/* Grade Selector */}
      <div className="mb-6 flex justify-center">
        <div className="inline-flex bg-gray-100 rounded-full p-1">
          {getAllGrades().map((grade, index) => (
            <button
              key={grade.key}
              onClick={() => setSelectedGrade(grade.key)}
              className={`px-5 py-2 rounded-full font-display font-bold text-sm transition-all duration-300 ${
                selectedGrade === grade.key
                  ? `${GRADE_PILL_ACTIVE_CLASSES[index % GRADE_PILL_ACTIVE_CLASSES.length]} text-white shadow-sm`
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {grade.label}
            </button>
          ))}
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

      <h3 className="text-lg font-display font-bold text-gray-700 mb-3 text-center border-t border-gray-100 pt-6">
        Today's Performance
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8" data-tutorial-id="progress-stats">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-card border border-blue-100 text-center">
          <p className="text-xs font-bold text-blue-500 uppercase tracking-wide">Answered</p>
          <p className="text-3xl font-display font-bold text-blue-600 mt-1">{totalAnswered}</p>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-emerald-100 p-4 rounded-card border border-green-100 text-center">
          <p className="text-xs font-bold text-green-500 uppercase tracking-wide">Accuracy</p>
          <p className="text-3xl font-display font-bold text-green-600 mt-1">{accuracy}%</p>
        </div>
        <div className="bg-gradient-to-br from-amber-50 to-yellow-100 p-4 rounded-card border border-amber-100 text-center">
          <p className="text-xs font-bold text-amber-500 uppercase tracking-wide">Avg. Time</p>
          <p className="text-3xl font-display font-bold text-amber-600 mt-1">{avgTime}s</p>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-violet-100 p-4 rounded-card border border-purple-100 text-center">
          <p className="text-xs font-bold text-purple-500 uppercase tracking-wide">All Time</p>
          <p className="text-3xl font-display font-bold text-purple-600 mt-1">{totalQuestionsAnswered}</p>
        </div>
      </div>

      {topicsPracticed.length > 0 && (
        <div className="mt-8">
          <h4 className="text-lg font-display font-bold text-gray-700 mb-3">
            Topic Breakdown
          </h4>
          <div className="overflow-x-auto rounded-card border border-gray-100">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="p-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Topic</th>
                  <th className="p-3 text-xs font-bold text-gray-500 uppercase tracking-wide text-center">Correct</th>
                  <th className="p-3 text-xs font-bold text-gray-500 uppercase tracking-wide text-center">Incorrect</th>
                  <th className="p-3 text-xs font-bold text-gray-500 uppercase tracking-wide text-center">Accuracy</th>
                </tr>
              </thead>
              <tbody>
                {topicsPracticed.map((topic, idx) => {
                  const stats = topicStats[topic];
                  const topicAccuracy =
                    stats.total > 0
                      ? Math.round((stats.correct / stats.total) * 100)
                      : 0;
                  return (
                    <tr
                      key={topic}
                      className={`border-b border-gray-50 transition-colors hover:bg-gray-50 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}
                    >
                      <td className="p-3 font-bold text-sm text-gray-700">{topic}</td>
                      <td className="p-3 text-center text-green-600 font-bold text-sm">
                        {stats.correct}
                      </td>
                      <td className="p-3 text-center text-red-500 font-bold text-sm">
                        {stats.incorrect}
                      </td>
                      <td className="p-3 text-center font-bold text-sm">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs ${
                          topicAccuracy >= 80 ? 'bg-green-100 text-green-700' :
                          topicAccuracy >= 50 ? 'bg-amber-100 text-amber-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {topicAccuracy}%
                        </span>
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
          className="bg-brand-blue text-white font-display font-bold py-2.5 px-8 rounded-button hover:opacity-90 active:scale-95 transition-all duration-200 shadow-sm"
        >
          Back to Topics
        </button>
      </div>
    </div>
  );
};

export default Dashboard;
