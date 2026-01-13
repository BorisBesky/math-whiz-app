# Fill-in-the-Blanks Question Type

## Overview

The fill-in-the-blanks question type allows students to complete sentences or equations by filling in missing values. Each blank is represented by a sequence of 2 or more underscores (`__`) in the question text.

## Question Structure

```javascript
{
  question: "5 × ____ = 20",          // Question with blanks (use __ for blanks)
  questionType: 'fill-in-the-blanks', // Required
  correctAnswer: "4",                  // Answers separated by ;; for multiple blanks
  inputTypes: ['numeric'],             // Optional: 'numeric', 'letters', or 'mixed' per blank
  options: [],                         // Empty array (not used)
  hint: "What number times 5 equals 20?",
  standard: "3.OA.C.7",
  concept: "Multiplication",
  grade: "G3",
  subtopic: "fill in blanks"
}
```

## Multiple Blanks Example

```javascript
{
  question: "The product of ____ and ____ is 24",
  questionType: 'fill-in-the-blanks',
  correctAnswer: "4 ;; 6",            // Separate answers with ;;
  inputTypes: ['numeric', 'numeric'], // One input type per blank
  options: [],
  hint: "Think of factor pairs of 24",
  standard: "3.OA.C.7",
  concept: "Multiplication",
  grade: "G3",
  subtopic: "fill in blanks"
}
```

## Features

### 1. Blank Detection
- Blanks are detected by patterns of 2 or more underscores: `__`, `___`, `____`, etc.
- The number of blanks must match the number of answers provided

### 2. Answer Validation
- **Normalization for numeric answers**: Numeric answers are normalized (commas removed, decimals standardized) for accurate comparison (e.g., "4,700", "4700", and "4700.0" are equivalent)
- **Normalization for text answers**: Mathematical expressions are normalized (standardizing symbols like ×→x, ÷→/, and whitespace) for case-insensitive comparison (e.g., "63 × 9 = 567" and "63 x 9 = 567" are equivalent)
- **No partial credit**: All blanks must be correct for the question to be marked as correct
- Individual blanks are color-coded after submission:
  - ✅ Green border: Correct answer
  - ❌ Red border: Incorrect answer

### 3. Input Types (Optional)
Specify `inputTypes` array to control input behavior per blank:
- `'numeric'`: Sets inputMode to 'decimal' for mobile keyboards
- `'letters'`: Standard text input
- `'mixed'`: Standard text input (default if not specified)

```javascript
inputTypes: ['numeric', 'numeric', 'letters']
```

### 4. Correct Answer Format
Multiple answers are separated by double semicolons (` ;; `):
```javascript
correctAnswer: "answer1 ;; answer2 ;; answer3"
```

### 5. Visual Feedback
- Before answering: Shows "Fill in all N blanks" or "N/N blanks filled"
- After submission:
  - All correct: Success message with 🎉 emoji
  - Some incorrect: Shows which blanks were wrong with correct answers displayed
  - Color-coded input fields (green = correct, red = incorrect)

## Implementation Example

See `/src/content/g3/multiplication/questions.js` for the `generateFillInTheBlanksQuestion()` function.

### Simple Example
```javascript
{
  question: "6 × 7 = ____",
  questionType: 'fill-in-the-blanks',
  correctAnswer: "42",
  inputTypes: ['numeric'],
  options: [],
  hint: "Multiply 6 by 7",
  standard: "3.OA.C.7",
  concept: "Multiplication",
  grade: "G3",
  subtopic: "fill in blanks"
}
```

### Complex Example (Mixed Types)
```javascript
{
  question: "The ____ of 3 and 4 is ____, which can also be written as 3 × ____ = ____",
  questionType: 'fill-in-the-blanks',
  correctAnswer: "product ;; 12 ;; 4 ;; 12",
  inputTypes: ['letters', 'numeric', 'numeric', 'numeric'],
  options: [],
  hint: "Think about multiplication vocabulary and the answer to 3 × 4",
  standard: "3.OA.C.7",
  concept: "Multiplication",
  grade: "G3",
  subtopic: "fill in blanks"
}
```

## Validation Rules

1. **Exact Match**: No case-insensitive matching, no normalization
2. **Whitespace**: Leading/trailing whitespace is trimmed automatically
3. **All or Nothing**: All blanks must be correct (no partial credit)
4. **Count Validation**: Number of blanks must equal number of answers

## Helper Functions

Located in `/src/utils/answer-helpers.js`:

- `isFillInTheBlanksQuestion(question)` - Detect if question is fill-in-the-blanks type
- `parseBlanks(questionText)` - Find all blank positions in text
- `splitQuestionByBlanks(questionText, blanks)` - Split text into segments around blanks
- `parseCorrectAnswers(correctAnswer)` - Extract individual answers from ;; delimited string
- `validateBlankAnswerCount(blanks, correctAnswers)` - Ensure counts match
- `validateFillInAnswers(userAnswers, correctAnswers, inputTypes)` - Validate all answers

## UI Behavior

### During Answer Entry
- Input fields appear inline with question text
- Width adjusts based on expected answer length (4-12rem)
- Empty fields: gray border
- Filled fields: blue border
- Placeholder shows "blank 1", "blank 2", etc.

### After Submission
- Correct blanks: green background with green border
- Incorrect blanks: red background with red border
- Correct answers displayed below for any incorrect blanks
- Shows what the user entered vs. correct answer

### Submit Button
- Disabled until all blanks are filled
- Response field shows progress: "N/M blanks filled"
- Changes to green checkmark when all filled: "✓ All N blanks filled"

## Data Storage

Stored in Firestore `answeredQuestions` with:
```javascript
{
  questionType: 'fill-in-the-blanks',
  userAnswer: "answer1 ;; answer2 ;; answer3", // Combined string
  fillInResults: [true, false, true],          // Boolean array of individual results
  // ... other standard fields
}
```

## Testing

To test fill-in-the-blanks questions:

1. Ensure the question bank includes fill-in-the-blanks questions
2. Start a quiz in the multiplication topic
3. Look for questions with input fields inline with the text
4. Fill in all blanks and submit
5. Verify color-coding and feedback

## Notes

- Questions with mismatched blank/answer counts will show an error message
- Input fields resize based on expected answer length for better UX
- Mobile users get appropriate keyboard types based on `inputTypes`
- All validation happens client-side (no AI evaluation needed)
