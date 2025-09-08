// Main Content Configuration - All Grades and Topics
import grade4 from './g4';

export const content = {
  grades: [
    grade4,
    // Additional grades will be added here as they are created
    // grade3,
    // grade5,
  ],
  
  // Helper method to get a grade by ID
  getGrade: (gradeId) => {
    return content.grades.find(grade => grade.id === gradeId);
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
    content.grades.forEach(grade => {
      grade.topics.forEach(topic => {
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

// Export individual grades for direct import
export { grade4 };

export default content;
