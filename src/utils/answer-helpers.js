/**
 * Checks if a question has purely numeric answers
 * @param {Object} question - The question object
 * @returns {boolean} - True if all options are numeric
 */
export function isNumericQuestion(question) {
  if (!question || !question.options || question.options.length === 0) {
    return false;
  }

  // Check if the correct answer is purely numeric
  const correctAnswer = question.correctAnswer?.toString().trim();
  
  // If correct answer contains non-digit characters (except decimal point), it's not purely numeric
  if (correctAnswer && !/^\d+(\.\d+)?$/.test(correctAnswer)) {
    return false;
  }

  // Check if all options are purely numeric
  return question.options.every(option => {
    const optionStr = option?.toString().trim();
    return /^\d+(\.\d+)?$/.test(optionStr);
  });
}

/**
 * Normalizes a numeric answer by removing leading zeros and whitespace
 * @param {string} answer - The answer to normalize
 * @returns {string} - Normalized answer
 */
export function normalizeNumericAnswer(answer) {
  if (!answer) return '';
  
  const trimmed = answer.toString().trim();
  
  // Handle decimal numbers
  if (trimmed.includes('.')) {
    const parsed = parseFloat(trimmed);
    return isNaN(parsed) ? trimmed : parsed.toString();
  }
  
  // Handle integers - remove leading zeros
  const parsed = parseInt(trimmed, 10);
  return isNaN(parsed) ? trimmed : parsed.toString();
}

