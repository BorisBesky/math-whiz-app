// 4th Grade Binary Addition Topic Module
import { generateQuestion } from './questions';
import BinaryAdditionExplanation from './Explanation';

export const binaryAddition = {
  id: 'binary-addition',
  name: 'Binary Addition',
  description: 'Understanding binary numbers and addition in base-2',
  grade: 'G4',
  standards: ['4.NBT.A.1', '4.NBT.B.4', '4.OA.A.3'], // Related to place value and operations
  
  // Question generation function
  generateQuestion,
  
  // React component for explanations
  ExplanationComponent: BinaryAdditionExplanation,
  
  // Topic metadata
  subtopics: [
    'binary to decimal conversion',
    'decimal to binary conversion',
    'binary addition',
    'place value in binary',
    'comparing binary numbers'
  ],
  
  // Learning objectives
  objectives: [
    'Understand what binary numbers are',
    'Convert between binary and decimal numbers',
    'Understand place value in binary (powers of 2)',
    'Add binary numbers using the binary addition rules',
    'Compare binary numbers by value',
    'Recognize patterns in binary counting'
  ]
};

export default binaryAddition;
