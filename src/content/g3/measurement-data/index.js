// 3rd Grade Measurement & Data Topic Module
import { generateQuestion } from './questions';
import MeasurementDataExplanation from './Explanation';

export const measurementData = {
  id: 'measurement-data',
  name: 'Measurement & Data',
  description: 'Understanding area, perimeter, and volume through hands-on measurement',
  grade: 'G3',
  standards: ['3.MD.C.5', '3.MD.C.6', '3.MD.C.7.a', '3.MD.C.7.b', '3.MD.C.7.c', '3.MD.D.8'],
  generateQuestion,
  ExplanationComponent: MeasurementDataExplanation,
  subtopics: ['area', 'perimeter', 'volume'],
  objectives: [
    'Find area by counting unit squares',
    'Calculate area using length × width',
    'Find perimeter by adding all sides',
    'Understand volume as space inside 3D objects',
    'Solve real-world measurement problems'
  ]
};

export default measurementData;
