import { DEFAULT_DAILY_GOAL, quizTopicsByGrade } from "../constants/appConstants";
import { getTodayDateString, sanitizeTopicName } from "../utils/firebaseHelpers";

// --- Helper function to check topic availability ---
export const getTopicAvailability = (userData, selectedGrade = "G3") => {
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
    const rawStats = progressForGrade[sanitizedTopic];
    const stats = (rawStats && typeof rawStats === 'object') ? rawStats : {
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
