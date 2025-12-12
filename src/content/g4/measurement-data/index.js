// 4th Grade Measurement & Data Topic Module
import { generateQuestion } from './questions';
import MeasurementDataExplanation from './Explanation';

export const measurementData = {
  id: 'measurement-data',
  name: 'Measurement & Data 4th',
  description: 'Unit conversions, area, perimeter, angles, and data representation',
  grade: 'G4',
  standards: ['4.MD.A.1', '4.MD.A.2', '4.MD.A.3', '4.MD.B.4', '4.MD.C.5', '4.MD.C.6', '4.MD.C.7'],
  
  // Question generation function
  generateQuestion,
  
  // React component for explanations
  ExplanationComponent: MeasurementDataExplanation,
  
  // Topic metadata
  subtopics: [
    'length conversion',
    'weight and capacity conversion',
    'time conversion',
    'clock reading',
    'area',
    'perimeter',
    'angles',
    'data interpretation',
    'line plots'
  ],
  
  // Learning objectives
  objectives: [
    'Convert between different units of measurement',
    'Solve problems involving measurement and conversion',
    'Read and interpret analog clocks',
    'Find area and perimeter of rectangles',
    'Understand angle measurement and classification',
    'Create and interpret line plots',
    'Solve problems using measurement data',
    'Apply measurement concepts to real-world problems'
  ]
};

export default measurementData;
