// 3rd Grade Topics Configuration
import multiplication from './multiplication';
import division from './division';
import fractions from './fractions';
import measurementData from './measurement-data';

export const grade3 = {
  id: 'g3',
  name: '3rd Grade',
  description: 'Third grade mathematics topics',
  
  topics: [
    multiplication,
    division,
    fractions,
    measurementData,
    // All 3rd-grade topics have been migrated!
  ],
  
  // Grade-level standards
  standards: {
    'Operations & Algebraic Thinking': ['3.OA.A.1', '3.OA.A.2', '3.OA.A.3', '3.OA.B.4', '3.OA.B.5', '3.OA.B.6', '3.OA.C.7', '3.OA.D.8'],
    'Number & Operations—Fractions': ['3.NF.A.1', '3.NF.A.2', '3.NF.A.3'],
    'Measurement & Data': ['3.MD.A.1', '3.MD.A.2', '3.MD.B.3', '3.MD.B.4', '3.MD.C.5', '3.MD.C.6', '3.MD.C.7', '3.MD.D.8'],
    'Geometry': ['3.G.A.1', '3.G.A.2']
  },
  
  // Helper method to get a topic by ID
  getTopic: (topicId) => {
    return grade3.topics.find(topic => topic.id === topicId);
  },
  
  // Helper method to get all topic names
  getTopicNames: () => {
    return grade3.topics.map(topic => topic.name);
  }
};

export default grade3;
