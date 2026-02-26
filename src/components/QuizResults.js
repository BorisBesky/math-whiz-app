import React from "react";
import { Sparkles } from "lucide-react";
import { getTodayDateString } from "../utils/firebaseHelpers";
import { encodeTopicForPath } from "../utils/firebaseHelpers";
import { getTopicAvailability } from "../services/topicAvailability";

const QuizResults = ({
  score,
  currentQuiz,
  userData,
  selectedGrade,
  currentTopic,
  storyCreatedForCurrentQuiz,
  feedback,
  handleCreateStoryProblem,
  startNewQuiz,
  navigateApp,
  returnToTopics,
}) => {
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
    <div className="text-center bg-white/80 backdrop-blur-md p-8 rounded-card shadow-card border border-white/60 max-w-md mx-auto mt-16 animate-bounce-in">
      <h2 className="text-3xl font-display font-bold text-gray-800 mb-3">
        Quiz Complete!
      </h2>
      <div className="text-6xl mb-3 animate-celebrate">{emoji}</div>
      <p className="text-lg text-gray-600 mb-2 font-medium">{message}</p>
      <p className="text-2xl font-display font-bold text-brand-blue mb-6">
        {score}/{currentQuiz.length} <span className="text-lg text-gray-500">({percentage}%)</span>
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
            className="bg-brand-purple text-white font-display font-bold py-3 px-6 rounded-button hover:opacity-90 active:scale-95 transition-all duration-200 flex items-center justify-center gap-2 shadow-sm"
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
            onClick={async () => {
              await startNewQuiz(currentTopic);
              navigateApp(`/quiz/${encodeTopicForPath(currentTopic)}`);
            }}
            className="bg-brand-blue text-white font-display font-bold py-3 px-6 rounded-button hover:opacity-90 active:scale-95 transition-all duration-200 shadow-sm"
          >
            Try Again
          </button>
        )}
        <button
          onClick={returnToTopics}
          className="bg-gray-100 text-gray-700 font-bold py-3 px-6 rounded-button hover:bg-gray-200 active:scale-95 transition-all duration-200"
        >
          Choose New Topic
        </button>
      </div>
    </div>
  );
};

export default QuizResults;
