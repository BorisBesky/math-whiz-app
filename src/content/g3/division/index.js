// 3rd Grade Division Topic Module
import { generateQuestion } from './questions';
import DivisionExplanation from './Explanation';

export const division = {
  id: 'division',
  name: 'Division',
  description: 'Understanding division through equal sharing, grouping, and fact families',
  grade: 'G3',
  standards: ['3.OA.A.2', '3.OA.A.3', '3.OA.B.6', '3.OA.C.7'],
  
  // Question generation function
  generateQuestion,
  
  // React component for explanations
  ExplanationComponent: DivisionExplanation,
  
  // Topic metadata
  subtopics: [
    'basic division',
    'equal sharing',
    'grouping',
    'fact families',
    'remainders',
    'arrays'
  ],
  
  // Learning objectives
  objectives: [
    'Understand division as equal sharing and grouping',
    'Solve division problems using various strategies',
    'Connect division to multiplication through fact families',
    'Solve word problems involving division',
    'Understand remainders in division',
    'Use arrays to model division problems'
  ]
};

export default division;
