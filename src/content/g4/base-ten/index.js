// 4th Grade Base Ten Topic Module
import { generateQuestion } from './questions';
import BaseTenExplanation from './Explanation';

export const baseTen = {
  id: 'base-ten',
  name: 'Base Ten',
  description: 'Place value, rounding, and multi-digit operations',
  grade: 'G4',
  standards: ['4.NBT.A.1', '4.NBT.A.2', '4.NBT.A.3', '4.NBT.B.4', '4.NBT.B.5', '4.NBT.B.6'],
  
  // Question generation function
  generateQuestion,
  
  // React component for explanations
  ExplanationComponent: BaseTenExplanation,
  
  // Topic metadata
  subtopics: [
    'place value',
    'rounding',
    'addition',
    'subtraction',
    'multiplication',
    'division',
    'comparison'
  ],
  
  // Learning objectives
  objectives: [
    'Understand place value to 1,000,000',
    'Compare and order multi-digit numbers',
    'Round numbers to any place value',
    'Add and subtract multi-digit numbers',
    'Multiply and divide multi-digit numbers',
    'Use number patterns and properties'
  ]
};

export default baseTen;
