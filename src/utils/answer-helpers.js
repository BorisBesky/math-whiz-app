/**
 * Checks if a question has purely numeric answers
 * @param {Object} question - The question object
 * @returns {boolean} - True if all options are numeric
 */
export function isNumericQuestion(question) {
  if (!question || !question.options || question.options.length === 0) {
    return false;
  }

  // Check if the correct answer is purely numeric (including negative numbers)
  const correctAnswer = question.correctAnswer?.toString().trim();
  
  // If correct answer contains non-digit characters (except decimal point and negative sign), it's not purely numeric
  if (correctAnswer && !/^-?\d+(\.\d+)?$/.test(correctAnswer)) {
    return false;
  }

  // Need to keep factors as multi-choice even if numeric
  if (question.subtopic && question.subtopic === "factors") {
    return false;
  }

  // Check if all options are purely numeric (including negative numbers)
  return question.options.every(option => {
    const optionStr = option?.toString().trim();
    return /^-?\d+(\.\d+)?$/.test(optionStr);
  });
}

/**
 * Normalizes a numeric answer by removing leading zeros and whitespace
 * Handles positive, negative, integer, and decimal numbers
 * @param {string} answer - The answer to normalize
 * @returns {string} - Normalized answer
 */
export function normalizeNumericAnswer(answer) {
  if (!answer) return '';
  
  const trimmed = answer.toString().trim();
  
  // Handle decimal numbers (both positive and negative)
  if (trimmed.includes('.')) {
    // Split into integer and fractional parts
    const [intPart, fracPart] = trimmed.split('.');
    // Remove leading zeros from integer part, but preserve '0' if intPart is all zeros
    const normInt = intPart.replace(/^0+(?=\d)/, '') || '0';
    // Recombine, preserving fractional part exactly
    return normInt + '.' + fracPart;
  }
  
  // Handle integers - remove leading zeros (preserves negative sign)
  const parsed = parseInt(trimmed, 10);
  return isNaN(parsed) ? trimmed : parsed.toString();
}

