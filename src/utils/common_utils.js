  /* global __app_id */
  const formatDate = (date) => {
    if (!date) return 'Never';
    try {
      if (process.env.NODE_ENV === 'development') {
        console.log("Formatting date:", date);
      }

      // Handle Firestore Timestamp objects
      if (date && typeof date === 'object' && 'seconds' in date && 'nanoseconds' in date) {
        const timestampDate = new Date(date.seconds * 1000);
        if (Number.isNaN(timestampDate.getTime())) {
          throw new Error('Invalid Firestore Timestamp');
        }
        return timestampDate.toLocaleDateString();
      }

      if (date instanceof Date) {
        if (Number.isNaN(date.getTime())) {
          throw new Error('Invalid Date instance');
        }
        return date.toLocaleDateString();
      }

      const dateString = typeof date === 'string' ? date : String(date);

      // Handle YYYY-MM-DD format directly to avoid timezone issues
      if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const [year, month, day] = dateString.split('-');
        const dateObj = new Date(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10));
        return dateObj.toLocaleDateString();
      }
      // Handle MM/DD/YYYY format
      if (dateString.match(/^\d{1,2}\/\d{1,2}\/\d{4}$/)) {
        const [month, day, year] = dateString.split('/');
        const dateObj = new Date(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10));
        return dateObj.toLocaleDateString();
      }
      // Fallback to original parsing
      const parsedDate = new Date(dateString);
      if (Number.isNaN(parsedDate.getTime())) {
        throw new Error('Unable to parse date string');
      }
      return parsedDate.toLocaleDateString();
    } catch (error) {
      console.warn("Failed to format date:", date, " because of error:", error);
      return '';
    }
  };

  const formatTime = (date) => {
    if (!date) return 'Never';
    try {
      const parsedDate = new Date(date);
      return parsedDate.toLocaleTimeString();
    } catch {
      return date;
    }
  };

  /**
   * Resolves the application ID from global config or falls back to default.
   * Replaces 12+ duplicated appId resolution patterns across the codebase.
   * @returns {string} The resolved app ID
   */
  const getAppId = () => {
    // Check global __app_id (set by Canvas/hosting environment)
    if (typeof __app_id !== 'undefined') return __app_id;
    // Check window.__app_id (browser context)
    if (typeof window !== 'undefined' && window.__app_id) return window.__app_id;
    return 'default-app-id';
  };

  /**
   * Returns today's date as a YYYY-MM-DD string.
   * Replaces 10+ inline `new Date().toISOString().split('T')[0]` expressions.
   * @returns {string} Today's date in YYYY-MM-DD format
   */
  const getTodayDateString = () => {
    return new Date().toISOString().split('T')[0];
  };

  /**
   * Normalizes a date value to YYYY-MM-DD string format.
   * Handles Date objects, ISO strings, and MM/DD/YYYY formatted strings.
   * Replaces 3 duplicated normalizeDate functions in TeacherDashboard and StudentsSection.
   * @param {string|Date|null} dateStr - The date to normalize
   * @returns {string|null} Normalized YYYY-MM-DD string, or null if input is falsy
   */
  const normalizeDate = (dateStr) => {
    if (!dateStr) return null;
    if (dateStr instanceof Date) return dateStr.toISOString().split('T')[0];
    // Handle MM/DD/YYYY format
    if (dateStr.includes('/')) {
      const [month, day, year] = dateStr.split('/');
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    // Handle ISO strings or YYYY-MM-DD — strip time portion if present
    return dateStr.split('T')[0];
  };

  /**
   * Returns the array of topic constants for a given grade.
   * Replaces 4+ duplicated getTopicsForGrade functions across TeacherDashboard,
   * StudentsSection, ClassDetailPanel, and MainApp.
   * @param {string} grade - The grade identifier (e.g., 'G3', 'G4')
   * @returns {string[]} Array of topic name strings for the grade
   */
  const getTopicsForGrade = (grade) => {
    // Inline the mapping to avoid a circular dependency on shared-constants
    // (shared-constants uses CommonJS, and this file uses ES modules)
    const GRADE_TOPICS = {
      G3: ['Multiplication', 'Division', 'Fractions', 'Measurement & Data'],
      G4: ['Operations & Algebraic Thinking', 'Base Ten', 'Fractions 4th', 'Measurement & Data 4th', 'Geometry', 'Binary Operations'],
    };
    return GRADE_TOPICS[grade] || GRADE_TOPICS.G3;
  };

  /**
   * Calculate per-topic progress for a student over a date range.
   * Replaces duplicated calculateTopicProgressForRange in TeacherDashboard and StudentsSection.
   * @param {Object} student - Student object with answeredQuestions and dailyGoalsByGrade
   * @param {string} grade - Grade identifier ('G3' or 'G4')
   * @param {string} startDate - Range start (any format normalizeDate accepts)
   * @param {string} endDate - Range end (any format normalizeDate accepts)
   * @returns {Array<Object>} Per-topic progress objects
   */
  const calculateTopicProgressForRange = (student, grade, startDate, endDate) => {
    const normalizedStart = normalizeDate(startDate);
    const normalizedEnd = normalizeDate(endDate);

    const questionsInRange = (student.answeredQuestions || []).filter((q) => {
      const qDate = normalizeDate(q.date);
      return qDate >= normalizedStart && qDate <= normalizedEnd;
    });

    const topics = getTopicsForGrade(grade);
    const activeDays = new Set(questionsInRange.map(q => normalizeDate(q.date))).size;

    return topics.map(topic => {
      const topicQuestions = questionsInRange.filter(q => q.topic === topic);
      const totalCorrect = topicQuestions.filter(q => q.isCorrect).length;
      const totalIncorrect = topicQuestions.filter(q => !q.isCorrect).length;
      const topicActiveDays = [...new Set(topicQuestions.map(q => normalizeDate(q.date)))].length;
      const goal = parseInt(student.dailyGoalsByGrade?.[grade]?.[topic] || 4, 10);
      const averageCorrect = topicActiveDays > 0
        ? Math.round((totalCorrect / topicActiveDays) * 10) / 10
        : 0;
      const averageIncorrect = topicActiveDays > 0
        ? Math.round((totalIncorrect / topicActiveDays) * 10) / 10
        : 0;

      return {
        topic,
        totalCorrect,
        totalIncorrect,
        averageCorrect,
        averageIncorrect,
        activeDays: topicActiveDays,
        totalActiveDays: activeDays,
        goal,
        completed: averageCorrect >= goal,
      };
    });
  };

  export {
    formatDate,
    formatTime,
    getAppId,
    getTodayDateString,
    normalizeDate,
    getTopicsForGrade,
    calculateTopicProgressForRange,
  };