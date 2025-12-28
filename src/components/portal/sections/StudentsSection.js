import React, { useState, useCallback } from 'react';
import { 
  BarChart3, RefreshCw, Download, Target, Trash2, Eye, 
  ChevronUp, ChevronDown, CheckCircle, X
} from 'lucide-react';
import { getFirestore, doc, writeBatch } from 'firebase/firestore';
import { TOPICS } from '../../../constants/topics';

const fieldMap = {
  'grade': 'grade',
  'class': 'className',
  'questionsToday': 'questionsToday',
  'totalQuestions': 'totalQuestions',
  'accuracy': 'accuracy',
  'coins': 'coins'
};

const StudentsSection = ({ students, loading, error, onRefresh, appId }) => {
  const [selectedStudents, setSelectedStudents] = useState(new Set());
  const [isSelectAll, setIsSelectAll] = useState(false);
  const [sortField, setSortField] = useState('questionsToday');
  const [sortDirection, setSortDirection] = useState('desc');
  const [showGoalsModal, setShowGoalsModal] = useState(false);
  const [goalGrade, setGoalGrade] = useState('G3');
  const [goalTargets, setGoalTargets] = useState({});
  const [goalStudentIds, setGoalStudentIds] = useState([]);
  const [viewingStudent, setViewingStudent] = useState(null);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  const db = getFirestore();

  // Helper functions
  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString();
  };

  const normalizeDate = (dateStr) => {
    if (!dateStr) return null;
    if (dateStr instanceof Date) return dateStr.toISOString().split('T')[0];
    if (dateStr.includes('/')) {
      const [m, d, y] = dateStr.split('/');
      return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
    }
    return dateStr.split('T')[0];
  };

  const getTopicsForGrade = (grade) => {
    return grade === 'G3'
      ? [TOPICS.MULTIPLICATION, TOPICS.DIVISION, TOPICS.FRACTIONS, TOPICS.MEASUREMENT_DATA]
      : [TOPICS.OPERATIONS_ALGEBRAIC_THINKING, TOPICS.BASE_TEN, TOPICS.FRACTIONS_4TH, TOPICS.MEASUREMENT_DATA_4TH, TOPICS.GEOMETRY, TOPICS.BINARY_ADDITION];
  };

  const calculateTopicProgressForRange = (student, grade, start, end) => {
    const normalizedStart = normalizeDate(start);
    const normalizedEnd = normalizeDate(end);

    const questionsInRange = student.answeredQuestions?.filter(
      (q) => {
        const qDate = normalizeDate(q.date);
        return qDate >= normalizedStart && qDate <= normalizedEnd;
      }
    ) || [];

    const topics = getTopicsForGrade(grade);
    const activeDays = new Set(questionsInRange.map(q => normalizeDate(q.date))).size;

    return topics.map(topic => {
      const topicQuestions = questionsInRange.filter(q => q.topic === topic);
      const correct = topicQuestions.filter(q => q.isCorrect).length;
      const total = topicQuestions.length;
      
      // Get goal from student settings or default
      const studentGoals = student.dailyGoalsByGrade?.[grade] || {};
      const goal = parseInt(studentGoals[topic] || 4);
      
      // Calculate average correct per active day
      // If no active days, average is 0
      const averageCorrect = activeDays > 0 
        ? Math.round((correct / activeDays) * 10) / 10 
        : 0;

      return {
        topic,
        correct,
        total,
        goal,
        averageCorrect,
        activeDays,
        completed: averageCorrect >= goal
      };
    });
  };

  // Sorting logic
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortedStudents = useCallback(() => {
    if (!sortField) return students;

    return [...students].sort((a, b) => {
      let aValue = a[fieldMap[sortField] || sortField];
      let bValue = b[fieldMap[sortField] || sortField];

      // Handle special cases
      if (sortField === 'student') {
        aValue = a.displayName || a.email || '';
        bValue = b.displayName || b.email || '';
      } else if (sortField === 'lastActivity') {
        aValue = new Date(a.latestActivity || 0).getTime();
        bValue = new Date(b.latestActivity || 0).getTime();
      }

      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [students, sortField, sortDirection]);

  const getSortIcon = (field) => {
    if (sortField !== field) return <div className="w-4 h-4" />;
    return sortDirection === 'asc' 
      ? <ChevronUp className="w-4 h-4 text-blue-600" />
      : <ChevronDown className="w-4 h-4 text-blue-600" />;
  };

  // Selection logic
  const handleSelectStudent = (studentId) => {
    const newSelected = new Set(selectedStudents);
    if (newSelected.has(studentId)) {
      newSelected.delete(studentId);
    } else {
      newSelected.add(studentId);
    }
    setSelectedStudents(newSelected);
    setIsSelectAll(newSelected.size === students.length && students.length > 0);
  };

  const handleSelectAll = () => {
    if (isSelectAll) {
      setSelectedStudents(new Set());
      setIsSelectAll(false);
    } else {
      setSelectedStudents(new Set(students.map(s => s.id)));
      setIsSelectAll(true);
    }
  };

  // Actions
  const exportStudentData = () => {
    if (students.length === 0) return;

    const csvData = students.map(student => ({
      'Name': student.displayName || '',
      'Email': student.email || '',
      'Student ID': student.id,
      'Grade': student.grade,
      'Class': student.className,
      'Total Questions': student.totalQuestions,
      'Questions Today': student.questionsToday,
      'Accuracy (%)': student.accuracy.toFixed(1),
      'Coins': student.coins,
      'Latest Activity': student.latestActivity ? new Date(student.latestActivity).toLocaleDateString() : 'Never',
    }));

    const csvContent = "data:text/csv;charset=utf-8," 
      + Object.keys(csvData[0]).join(",") + "\n"
      + csvData.map(row => Object.values(row).join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `student_data_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleBulkDelete = async () => {
    if (selectedStudents.size === 0) return;
    if (!appId) {
      console.error('App ID is missing');
      return;
    }

    const confirmMessage = `Are you sure you want to delete ${selectedStudents.size} student(s)? This action cannot be undone.`;
    if (!window.confirm(confirmMessage)) return;

    try {
      const batch = writeBatch(db);
      selectedStudents.forEach(studentId => {
        // Use the correct path for the new data model
        const studentRef = doc(db, 'artifacts', appId, 'users', studentId, 'math_whiz_data', 'profile');
        batch.delete(studentRef);
      });

      await batch.commit();
      setSelectedStudents(new Set());
      setIsSelectAll(false);
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error('Error deleting students:', error);
      alert('Failed to delete students. Please try again.');
    }
  };

  // Goals Logic
  const openGoalsModalForStudent = (student) => {
    const grade = student.grade || 'G3';
    const topics = getTopicsForGrade(grade);
    const current = student.dailyGoalsByGrade?.[grade] || {};
    
    // Fill in defaults if missing
    topics.forEach(t => {
      if (current[t] === undefined) current[t] = 4;
    });

    setGoalGrade(grade);
    setGoalTargets(current);
    setGoalStudentIds([student.id]);
    setShowGoalsModal(true);
  };

  const openGoalsModalForSelected = () => {
    const ids = Array.from(selectedStudents);
    const grade = 'G3'; // Default to G3 for bulk
    const topics = getTopicsForGrade(grade);
    const current = {};
    topics.forEach(t => current[t] = 4);
    
    setGoalGrade(grade);
    setGoalTargets(current);
    setGoalStudentIds(ids);
    setShowGoalsModal(true);
  };

  const handleGoalGradeChange = (grade) => {
    const topics = getTopicsForGrade(grade);
    const next = { ...goalTargets };
    topics.forEach(t => {
      if (next[t] === undefined) next[t] = 4;
    });
    setGoalGrade(grade);
    setGoalTargets(next);
  };

  const saveGoals = async () => {
    if (!appId) {
      console.error('App ID is missing');
      return;
    }
    try {
      const batch = writeBatch(db);
      
      goalStudentIds.forEach(studentId => {
        // Use the correct path for the new data model
        const studentRef = doc(db, 'artifacts', appId, 'users', studentId, 'math_whiz_data', 'profile');
        // We need to update the specific grade goals
        const updateData = {
          [`dailyGoalsByGrade.${goalGrade}`]: goalTargets
        };
        batch.update(studentRef, updateData);
      });

      await batch.commit();
      setShowGoalsModal(false);
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error('Error saving goals:', error);
      alert('Failed to save goals.');
    }
  };

  const sortedStudents = getSortedStudents();

  // Render Student Detail View
  if (viewingStudent) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-2xl font-bold text-gray-900">
              {viewingStudent.displayName || viewingStudent.email || 'Student Details'}
            </h3>
            <p className="text-gray-600">ID: {viewingStudent.id}</p>
          </div>
          <div className="flex space-x-2">
             <div className="flex items-center space-x-2 bg-white border rounded-md px-3 py-1">
                <span className="text-sm text-gray-600">Range:</span>
                <input 
                  type="date" 
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="text-sm border-none focus:ring-0"
                />
                <span className="text-gray-400">-</span>
                <input 
                  type="date" 
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="text-sm border-none focus:ring-0"
                />
             </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Overview Card */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h4 className="font-semibold text-gray-900 mb-4">Student Overview</h4>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Grade:</span>
                <span className="font-medium">{viewingStudent.grade}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Class:</span>
                <span className="font-medium">{viewingStudent.className}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Questions:</span>
                <span className="font-medium">{viewingStudent.totalQuestions}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Accuracy:</span>
                <span className={`font-medium ${viewingStudent.accuracy >= 80 ? 'text-green-600' : viewingStudent.accuracy >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                  {viewingStudent.accuracy.toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Coins:</span>
                <span className="font-medium">{viewingStudent.coins}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Last Active:</span>
                <span className="font-medium">{formatDate(viewingStudent.latestActivity)}</span>
              </div>
            </div>
          </div>

          {/* G3 Progress */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
              <Target className="w-4 h-4 mr-2" />
              Grade 3 Progress
            </h4>
            <div className="space-y-3">
              {calculateTopicProgressForRange(viewingStudent, 'G3', startDate, endDate).map(topic => (
                <div key={topic.topic} className="flex flex-col">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-gray-600">{topic.topic}</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-500">
                        {topic.averageCorrect}/{topic.goal}
                        {topic.activeDays > 1 && (
                          <span className="text-xs text-gray-400 ml-1">
                            ({topic.activeDays}d)
                          </span>
                        )}
                      </span>
                      {topic.completed && (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      )}
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${topic.completed ? 'bg-green-500' : 'bg-blue-500'}`}
                      style={{ width: `${Math.min((topic.averageCorrect / topic.goal) * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* G4 Progress */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
              <Target className="w-4 h-4 mr-2" />
              Grade 4 Progress
            </h4>
            <div className="space-y-3">
              {calculateTopicProgressForRange(viewingStudent, 'G4', startDate, endDate).map(topic => (
                <div key={topic.topic} className="flex flex-col">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-gray-600 truncate max-w-[150px]" title={topic.topic}>
                      {topic.topic}
                    </span>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-500">
                        {topic.averageCorrect}/{topic.goal}
                        {topic.activeDays > 1 && (
                          <span className="text-xs text-gray-400 ml-1">
                            ({topic.activeDays}d)
                          </span>
                        )}
                      </span>
                      {topic.completed && (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      )}
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${topic.completed ? 'bg-green-500' : 'bg-blue-500'}`}
                      style={{ width: `${Math.min((topic.averageCorrect / topic.goal) * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Questions by Date Range */}
        {(() => {
          const normalizedStartDate = normalizeDate(startDate);
          const normalizedEndDate = normalizeDate(endDate);

          const questionsInRange = viewingStudent.answeredQuestions?.filter(
            (q) => {
              const normalizedQuestionDate = normalizeDate(q.date);
              return normalizedQuestionDate >= normalizedStartDate && normalizedQuestionDate <= normalizedEndDate;
            }
          ) || [];
          
          return (
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
                <h4 className="text-xl font-bold text-gray-700">
                  Questions {startDate === endDate ? `for ${formatDate(startDate)}` : `from ${formatDate(startDate)} to ${formatDate(endDate)}`}:
                </h4>
              </div>
              {questionsInRange.length > 0 ? (
                <div className="max-h-96 overflow-y-auto">
                  {(() => {
                    // Group questions by date
                    const questionsByDate = questionsInRange.reduce((groups, question) => {
                      const date = question.date;
                      if (!groups[date]) {
                        groups[date] = [];
                      }
                      groups[date].push(question);
                      return groups;
                    }, {});

                    // Sort dates in descending order (most recent first)
                    const sortedDates = Object.keys(questionsByDate).sort((a, b) => new Date(b) - new Date(a));

                    return sortedDates.map(date => (
                      <div key={date} className="mb-6 last:mb-0">
                        <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-200">
                          <h5 className="text-lg font-semibold text-gray-800">
                            {formatDate(date)}
                          </h5>
                          <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                            {questionsByDate[date].length} question{questionsByDate[date].length !== 1 ? 's' : ''}
                          </span>
                        </div>
                        <div className="space-y-2">
                          {questionsByDate[date].map((q, index) => (
                            <div
                              key={q.id || `${date}-${index}`}
                              className={`p-3 rounded-lg border-l-4 ${
                                q.isCorrect
                                  ? "bg-green-50 border-green-500"
                                  : "bg-red-50 border-red-500"
                              }`}
                            >
                              <div className="flex justify-between items-start mb-1">
                                <span className="font-semibold text-sm text-gray-600">
                                  {q.topic}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {q.timeTaken ? `${q.timeTaken.toFixed(1)}s` : 'N/A'}
                                </span>
                              </div>
                              <p className="text-sm text-gray-800 mb-1">{q.question}</p>
                              <div className="text-xs">
                                <span className="text-gray-600">Your answer: </span>
                                <span
                                  className={
                                    q.isCorrect
                                      ? "text-green-600 font-semibold"
                                      : "text-red-600 font-semibold"
                                  }
                                >
                                  {q.userAnswer || 'N/A'}
                                </span>
                                {!q.isCorrect && (
                                  <>
                                    <span className="text-gray-600 ml-2">Correct: </span>
                                    <span className="text-green-600 font-semibold">
                                      {q.correctAnswer || 'N/A'}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              ) : (
                <div className="text-center py-12">
                  <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">
                    No questions answered {startDate === endDate ? `on ${formatDate(startDate)}` : `in the selected date range`}
                  </p>
                </div>
              )}
            </div>
          );
            })()}
        
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Students</h3>
          <p className="text-sm text-gray-500">Manage your students and track progress</p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={onRefresh}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            title="Refresh"
          >
            <RefreshCw className="h-5 w-5" />
          </button>
          <button
            onClick={exportStudentData}
            disabled={students.length === 0}
            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
            title="Export CSV"
          >
            <Download className="w-5 h-5" />
          </button>
          <button
            onClick={openGoalsModalForSelected}
            disabled={selectedStudents.size === 0}
            className="relative p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors disabled:opacity-50"
            title="Set Goals"
          >
            <Target className="w-5 h-5" />
            {selectedStudents.size > 0 && (
              <span className="absolute -top-1 -right-1 bg-purple-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {selectedStudents.size}
              </span>
            )}
          </button>
          <button
            onClick={handleBulkDelete}
            disabled={selectedStudents.size === 0}
            className="relative p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
            title="Delete Selected"
          >
            <Trash2 className="w-5 h-5" />
            {selectedStudents.size > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {selectedStudents.size}
              </span>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3 text-sm text-red-800">
          {error}
        </div>
      )}

      <div className="overflow-x-auto border border-gray-200 rounded-lg">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left">
                <input
                  type="checkbox"
                  checked={isSelectAll}
                  onChange={handleSelectAll}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </th>
              <th 
                className="px-4 py-3 text-left font-semibold text-gray-600 cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('student')}
              >
                <div className="flex items-center space-x-1">
                  <span>Student</span>
                  {getSortIcon('student')}
                </div>
              </th>
              <th 
                className="px-4 py-3 text-left font-semibold text-gray-600 cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('class')}
              >
                <div className="flex items-center space-x-1">
                  <span>Class</span>
                  {getSortIcon('class')}
                </div>
              </th>
              <th 
                className="px-4 py-3 text-left font-semibold text-gray-600 cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('grade')}
              >
                <div className="flex items-center space-x-1">
                  <span>Grade</span>
                  {getSortIcon('grade')}
                </div>
              </th>
              <th 
                className="px-4 py-3 text-left font-semibold text-gray-600 cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('totalQuestions')}
              >
                <div className="flex items-center space-x-1">
                  <span>Questions</span>
                  {getSortIcon('totalQuestions')}
                </div>
              </th>
              <th 
                className="px-4 py-3 text-left font-semibold text-gray-600 cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('accuracy')}
              >
                <div className="flex items-center space-x-1">
                  <span>Accuracy</span>
                  {getSortIcon('accuracy')}
                </div>
              </th>
              <th 
                className="px-4 py-3 text-left font-semibold text-gray-600 cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('questionsToday')}
              >
                <div className="flex items-center space-x-1">
                  <span>Today</span>
                  {getSortIcon('questionsToday')}
                </div>
              </th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {loading ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
                    <span>Loading students...</span>
                  </div>
                </td>
              </tr>
            ) : sortedStudents.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                  No students found.
                </td>
              </tr>
            ) : (
              sortedStudents.map((student) => (
                <tr key={student.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedStudents.has(student.id)}
                      onChange={() => handleSelectStudent(student.id)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-gray-900">{student.displayName || 'Unknown'}</p>
                      {student.email && (
                        <p className="text-xs text-gray-500">{student.email}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      student.className === 'Unassigned' 
                        ? 'bg-gray-100 text-gray-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {student.className}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                      {student.grade}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-900 font-medium">{student.totalQuestions}</td>
                  <td className="px-4 py-3 text-gray-700">
                    <span className={`${student.accuracy >= 80 ? 'text-green-600' : student.accuracy >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                      {student.accuracy.toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    <div className="flex items-center">
                      {student.questionsToday}
                      {student.questionsToday > 0 && (
                        <div className="ml-2 w-2 h-2 bg-green-400 rounded-full"></div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm font-medium space-x-2">
                    <button
                      onClick={() => setViewingStudent(student)}
                      className="text-blue-600 hover:text-blue-900 inline-flex items-center"
                      title="View Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => openGoalsModalForStudent(student)}
                      className="text-purple-600 hover:text-purple-900 inline-flex items-center"
                      title="Set Goals"
                    >
                      <Target className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Goals Modal */}
      {showGoalsModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Set Daily Goals</h3>
              <button onClick={() => setShowGoalsModal(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="mb-4 flex items-center space-x-4">
              <label className="text-sm text-gray-700">Grade:</label>
              <select
                value={goalGrade}
                onChange={(e) => handleGoalGradeChange(e.target.value)}
                className="border rounded px-2 py-1"
              >
                <option value="G3">G3</option>
                <option value="G4">G4</option>
              </select>
              <span className="text-sm text-gray-500">Applying to {goalStudentIds.length} student(s)</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto">
              {getTopicsForGrade(goalGrade).map(topic => (
                <div key={topic} className="flex items-center justify-between border rounded px-3 py-2">
                  <span className="text-sm text-gray-700 mr-3 truncate" title={topic}>{topic}</span>
                  <input
                    type="number"
                    min="0"
                    value={goalTargets[topic] ?? 4}
                    onChange={(e) => setGoalTargets(prev => ({ ...prev, [topic]: parseInt(e.target.value, 10) || 0 }))}
                    className="w-20 border rounded px-2 py-1 text-sm"
                  />
                </div>
              ))}
            </div>
            <div className="mt-6 text-right space-x-2">
              <button onClick={() => setShowGoalsModal(false)} className="px-4 py-2 rounded border hover:bg-gray-50">Cancel</button>
              <button onClick={saveGoals} className="px-4 py-2 rounded bg-purple-600 text-white hover:bg-purple-700">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentsSection;
