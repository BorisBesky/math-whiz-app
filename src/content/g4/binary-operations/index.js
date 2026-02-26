// 4th Grade Binary Operations Topic Module
import { generateQuestion } from './questions';
import BinaryOperationsExplanation from './Explanation';

export const binaryOperations = {
  id: 'binary-operations',
  name: 'Binary Operations',
  description: 'Understanding binary numbers and performing operations in base-2',
  grade: 'G4',
  standards: ['4.NBT.A.1', '4.NBT.B.4', '4.NBT.B.5', '4.NBT.B.6', '4.OA.A.3'],

  // Question generation function
  generateQuestion,

  // React component for explanations
  ExplanationComponent: BinaryOperationsExplanation,

  // Topic metadata
  subtopics: [
    'binary to decimal conversion',
    'decimal to binary conversion',
    'binary addition',
    'binary subtraction',
    'binary multiplication',
    'binary division',
    'place value in binary',
    'comparing binary numbers'
  ],

  // Learning objectives
  objectives: [
    'Understand what binary numbers are',
    'Convert between binary and decimal numbers',
    'Understand place value in binary (powers of 2)',
    'Add binary numbers using the binary addition rules',
    'Subtract binary numbers using borrowing in binary',
    'Multiply binary numbers using shift and add',
    'Divide binary numbers to find quotients',
    'Compare binary numbers by value',
    'Recognize patterns in binary counting'
  ]
};

export default binaryOperations;
