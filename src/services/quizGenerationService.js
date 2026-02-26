import {
  adaptAnsweredHistory,
  rankQuestionsByComplexity,
} from "../utils/complexityEngine";
import { DEFAULT_DAILY_GOAL, TOPIC_CONTENT_MAP } from "../constants/appConstants";
import { isSubtopicAllowed } from "../utils/subtopicUtils";
import { fetchQuestionsFromFirestore } from "./questionService";
import content from "../content";

// --- Dynamic Quiz Generation ---
export const generateQuizQuestions = async (
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
  if (typeof window !== 'undefined' && Array.isArray(window.__PW_MOCK_QUIZ_QUESTIONS) && window.__PW_MOCK_QUIZ_QUESTIONS.length > 0) {
    return window.__PW_MOCK_QUIZ_QUESTIONS.map((question) => ({ ...question }));
  }

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
      // Always increment the index to avoid getting stuck on duplicates
      firestoreQuestionIndex++;
      // Check if question is unique using signature
      const questionSig = getQuestionSignature(firestoreQ);
      if (!usedQuestions.has(questionSig)) {
        question = {
          ...firestoreQ,
          concept: firestoreQ.topic || firestoreQ.concept || topic,
        };
        useFirestoreQuestion = true;
      }
    }

    // If not using Firestore question, generate one
    if (!useFirestoreQuestion) {
      const contentEntry = TOPIC_CONTENT_MAP[topic];
      if (contentEntry) {
        const [gradeId, topicId] = contentEntry;
        const topicContent = content.getTopic(gradeId, topicId);
        if (topicContent) {
          const allowedSubtopicsForThisTopic = allowedSubtopicsByTopic?.[topic] ?? null;
          question = topicContent.generateQuestion(difficulty, allowedSubtopicsForThisTopic);
          if (question) {
            question.concept = topic;
          }
        }
      } else {
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

      // Gradually increase acceptance probability as we approach the attempt limit
      // This ensures we can still generate questions even with limited variety
      const progressRatio = attempts / maxAttempts;
      if (progressRatio > 0.3) {
        // Start relaxing constraints after 30% of attempts
        // At 30% attempts: boost by 0, at 100% attempts: boost to 1.0 (always accept)
        const relaxFactor = Math.min(1, (progressRatio - 0.3) / 0.7);
        acceptProb = acceptProb + (1 - acceptProb) * relaxFactor;
      }

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
