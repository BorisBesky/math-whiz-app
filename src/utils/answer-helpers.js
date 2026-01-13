import { QUESTION_TYPES } from '../constants/shared-constants';

/**
 * Checks if a question has purely numeric answers
 * @param {Object} question - The question object
 * @returns {boolean} - True if all options are numeric
 */
export function isNumericQuestion(question) {
  if (!question) {
    return false;
  }

  // Check if the correct answer is purely numeric (including negative numbers)
  const correctAnswer = question.correctAnswer?.toString().trim();
  const isCorrectNumeric = correctAnswer && /^-?\d+(\.\d+)?$/.test(correctAnswer);
  
  // If correct answer contains non-digit characters (except decimal point and negative sign), it's not purely numeric
  if (!isCorrectNumeric) {
    return false;
  }

  // Need to keep factors as multi-choice even if numeric
  if (question.subtopic && question.subtopic === "factors") {
    return false;
  }

  // If options exist, check if they are all numeric
  if (question.options && question.options.length > 0) {
    return question.options.every(option => {
      const optionStr = option?.toString().trim();
      return /^-?\d+(\.\d+)?$/.test(optionStr);
    });
  }

  // If no options exist but correct answer is numeric, treat as numeric question
  // This allows AI generated questions without options to use the number pad
  return true;
}

/**
 * Checks if a question is a write-in (written answer) type
 * @param {Object} question - The question object
 * @returns {boolean} - True if the question is write-in type
 */
export function isWriteInQuestion(question) {
  return question?.questionType === QUESTION_TYPES.WRITE_IN;
}

/**
 * Checks if a question is a drawing-with-text (combined drawing + written) type
 * @param {Object} question - The question object
 * @returns {boolean} - True if the question is drawing-with-text type
 */
export function isDrawingWithTextQuestion(question) {
  return question?.questionType === 'drawing-with-text';
}

/**
 * Checks if a question requires AI evaluation (drawing, write-in, or drawing-with-text)
 * @param {Object} question - The question object
 * @returns {boolean} - True if AI evaluation is needed
 */
export function isAIEvaluatedQuestion(question) {
  const aiTypes = [QUESTION_TYPES.DRAWING, QUESTION_TYPES.WRITE_IN, QUESTION_TYPES.DRAWING_WITH_TEXT];
  return aiTypes.includes(question?.questionType);
}

/**
 * Checks if a question is a fill-in-the-blanks type
 * @param {Object} question - The question object
 * @returns {boolean} - True if the question is fill-in-the-blanks type
 */
export function isFillInTheBlanksQuestion(question) {
  if (question?.questionType === QUESTION_TYPES.FILL_IN_THE_BLANKS) {
    return true;
  }

  // Fallback: also detect if the question text contains blanks (_____),
  // provided it's not explicitly marked as another type that shouldn't be overridden.
  // Note: MainApp checking order usually handles explicit types first.
  return (
    question?.question && 
    /_{2,}/.test(question.question)
  );
}

/**
 * Parses a question text to find all blanks (sequences of 2+ underscores)
 * @param {string} questionText - The question text
 * @returns {Array} - Array of objects with {start, end, length} for each blank
 */
export function parseBlanks(questionText) {
  if (!questionText) return [];
  
  const blanks = [];
  const regex = /_{2,}/g;
  let match;
  
  while ((match = regex.exec(questionText)) !== null) {
    blanks.push({
      start: match.index,
      end: match.index + match[0].length,
      length: match[0].length
    });
  }
  
  return blanks;
}

/**
 * Splits the question text into segments around blanks
 * @param {string} questionText - The question text
 * @param {Array} blanks - Array of blank positions from parseBlanks()
 * @returns {Array} - Array of text segments (strings) and blank indicators (objects)
 */
export function splitQuestionByBlanks(questionText, blanks) {
  if (!questionText) return [];
  if (blanks.length === 0) return [questionText];
  
  const segments = [];
  let lastEnd = 0;
  
  blanks.forEach((blank, index) => {
    // Add text before the blank
    if (blank.start > lastEnd) {
      segments.push(questionText.substring(lastEnd, blank.start));
    }
    // Add blank indicator
    segments.push({ blankIndex: index });
    lastEnd = blank.end;
  });
  
  // Add remaining text after last blank
  if (lastEnd < questionText.length) {
    segments.push(questionText.substring(lastEnd));
  }
  
  return segments;
}

/**
 * Parses the correctAnswer string to extract individual answers for each blank
 * @param {string} correctAnswer - The correct answer string with ;; delimiters
 * @returns {Array<string>} - Array of correct answers for each blank
 */
export function parseCorrectAnswers(correctAnswer) {
  if (!correctAnswer) return [];
  return correctAnswer.split(';;').map(ans => ans.trim());
}

/**
 * Validates that the number of blanks matches the number of correct answers
 * @param {Array} blanks - Array of blanks from parseBlanks()
 * @param {Array<string>} correctAnswers - Array of correct answers
 * @returns {boolean} - True if counts match
 */
export function validateBlankAnswerCount(blanks, correctAnswers) {
  return blanks.length === correctAnswers.length && blanks.length > 0;
}

/**
 * Validates a fill-in-the-blanks answer set
 * @param {Array<string>} userAnswers - Array of user's answers
 * @param {Array<string>} correctAnswers - Array of correct answers
 * @param {Array<string>} inputTypes - Optional array of input types per blank
 * @returns {Object} - {allCorrect: boolean, results: Array<boolean>}
 */
export function validateFillInAnswers(userAnswers, correctAnswers, inputTypes = []) {
  if (userAnswers.length !== correctAnswers.length) {
    return { allCorrect: false, results: [] };
  }
  
  const results = userAnswers.map((userAnswer, index) => {
    const correct = correctAnswers[index];
    const inputType = inputTypes[index];
    
    let userTrimmed = (userAnswer || '').trim();
    let correctTrimmed = (correct || '').trim();
    
    // For numeric inputs, normalize both answers for comparison
    if (inputType === 'numeric') {
      userTrimmed = normalizeNumericAnswer(userTrimmed);
      correctTrimmed = normalizeNumericAnswer(correctTrimmed);
    } else {
      // For non-numeric, normalize mathematical expressions and convert to lowercase
      userTrimmed = normalizeMathExpression(userTrimmed).toLowerCase();
      correctTrimmed = normalizeMathExpression(correctTrimmed).toLowerCase();
    }
    
    return userTrimmed === correctTrimmed;
  });
  
  return {
    allCorrect: results.every(r => r === true),
    results: results
  };
}

/**
 * Normalizes a numeric answer by removing commas, leading zeros, and standardizing decimal representation
 * Handles positive, negative, integer, and decimal numbers
 * @param {string} answer - The answer to normalize
 * @returns {string} - Normalized answer
 */
export function normalizeNumericAnswer(answer) {
  if (!answer) return '';
  
  let trimmed = answer.toString().trim();
  
  // Remove commas
  trimmed = trimmed.replace(/,/g, '');
  
  // Handle decimal numbers (both positive and negative)
  if (trimmed.includes('.')) {
    // Parse as float and back to string to normalize (e.g., 4700.0 -> 4700)
    const parsed = parseFloat(trimmed);
    if (!isNaN(parsed)) {
      // Convert back to string, removing trailing .0 for integers
      const asString = parsed.toString();
      return asString;
    }
    return trimmed; // fallback if parsing fails
  }
  
  // Handle integers - remove leading zeros (preserves negative sign)
  const parsed = parseInt(trimmed, 10);
  return isNaN(parsed) ? trimmed : parsed.toString();
}

/**
 * Normalizes mathematical expressions for comparison by standardizing common symbols
 * @param {string} expression - The mathematical expression to normalize
 * @returns {string} - Normalized expression
 */
export function normalizeMathExpression(expression) {
  if (!expression) return '';
  
  let normalized = expression.toString().trim();
  
  // Standardize multiplication symbols
  normalized = normalized.replace(/[×*]/g, 'x');
  
  // Standardize division symbols  
  normalized = normalized.replace(/[÷]/g, '/');
  
  // Normalize whitespace around operators
  normalized = normalized.replace(/\s*([+\-x/=])\s*/g, ' $1 ');
  
  // Remove extra whitespace
  normalized = normalized.replace(/\s+/g, ' ').trim();
  
  return normalized;
}

