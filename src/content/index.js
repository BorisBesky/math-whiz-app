// Main Content Configuration - All Grades and Topics
//
// Grades and topics are discovered from the folder structure by
// scripts/build-content-registry.js (a grade is a folder with grade.json; a
// topic is a folder with manifest.json). Adding content means adding a folder
// and regenerating — nothing to edit here. See docs/PLUGGABLE_CONTENT_PLAN.md.
import { grades as generatedGrades } from './registry.generated';

const grades = generatedGrades.map(({ manifest, topics }) => ({
  ...manifest,
  // Legacy field: the pre-manifest grade objects exposed "name" (e.g. "3rd Grade").
  name: manifest.label,
  topics,
  getTopic: (topicId) => topics.find((topic) => topic.id === topicId),
  getTopicNames: () => topics.map((topic) => topic.name),
}));

export const content = {
  grades,

  // Helper method to get a grade by ID
  getGrade: (gradeId) => {
    return content.grades.find((grade) => grade.id === gradeId);
  },

  // Helper method to get a topic by grade and topic ID
  getTopic: (gradeId, topicId) => {
    const grade = content.getGrade(gradeId);
    return grade ? grade.getTopic(topicId) : null;
  },

  // Helper method to get all grades
  getAllGrades: () => {
    return content.grades;
  },

  // Helper method to get all topics for a grade
  getTopicsForGrade: (gradeId) => {
    const grade = content.getGrade(gradeId);
    return grade ? grade.topics : [];
  },

  // Helper method to search for topics across all grades
  searchTopics: (searchTerm) => {
    const results = [];
    content.grades.forEach((grade) => {
      grade.topics.forEach((topic) => {
        if (topic.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            topic.description.toLowerCase().includes(searchTerm.toLowerCase())) {
          results.push({
            grade: grade.name,
            gradeId: grade.id,
            topic: topic
          });
        }
      });
    });
    return results;
  }
};

// Legacy named exports for direct import
export const grade3 = content.getGrade('g3');
export const grade4 = content.getGrade('g4');

export default content;
