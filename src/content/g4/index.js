// 4th Grade Topics Configuration
import geometry from './geometry';
import operationsAlgebraicThinking from './operations-algebraic-thinking';
import baseTen from './base-ten';
import fractions from './fractions';
import measurementData from './measurement-data';
import binaryOperations from './binary-operations';

export const grade4 = {
  id: 'g4',
  name: '4th Grade',
  description: 'Fourth grade mathematics topics',
  
  topics: [
    geometry,
    operationsAlgebraicThinking,
    baseTen,
    fractions,
    measurementData,
    binaryOperations,
    // All 4th-grade topics have been migrated!
  ],
  
  // Grade-level standards
  standards: {
    'Operations & Algebraic Thinking': ['4.OA.A.1', '4.OA.A.2', '4.OA.A.3', '4.OA.B.4', '4.OA.C.5'],
    'Number & Operations in Base Ten': ['4.NBT.A.1', '4.NBT.A.2', '4.NBT.A.3', '4.NBT.B.4', '4.NBT.B.5', '4.NBT.B.6'],
    'Number & Operations—Fractions': ['4.NF.A.1', '4.NF.A.2', '4.NF.B.3', '4.NF.B.4', '4.NF.C.5', '4.NF.C.6', '4.NF.C.7'],
    'Measurement & Data': ['4.MD.A.1', '4.MD.A.2', '4.MD.A.3', '4.MD.B.4', '4.MD.C.5', '4.MD.C.6', '4.MD.C.7'],
    'Geometry': ['4.G.A.1', '4.G.A.2', '4.G.A.3'],
    'Binary Operations': ['4.NBT.A.1', '4.NBT.B.4', '4.NBT.B.5', '4.NBT.B.6', '4.OA.A.3']
  },
  
  // Helper method to get a topic by ID
  getTopic: (topicId) => {
    return grade4.topics.find(topic => topic.id === topicId);
  },
  
  // Helper method to get all topic names
  getTopicNames: () => {
    return grade4.topics.map(topic => topic.name);
  }
};

export default grade4;
