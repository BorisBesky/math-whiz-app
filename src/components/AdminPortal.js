import React, { useState, useEffect, useCallback } from 'react';
import { 
  Users, 
  BarChart3, 
  Trophy, 
  Clock, 
  Download,
  Trash2,
  Eye,
  TrendingUp,
  GraduationCap,
  Target,
  CheckCircle,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown
} from 'lucide-react';
import { getAuth } from "firebase/auth";
import { TOPICS } from '../constants/topics';
import { doc, deleteDoc } from 'firebase/firestore';

const AdminPortal = ({ db, onClose, appId }) => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({
    totalStudents: 0,
    activeToday: 0,
    totalQuestions: 0,
    averageAccuracy: 0
  });
  const [view, setView] = useState('overview'); // 'overview', 'students', 'student-detail'
  const [sortField, setSortField] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc'); // 'asc' or 'desc'
  const [selectedStudents, setSelectedStudents] = useState(new Set());
  const [isSelectAll, setIsSelectAll] = useState(false);

  const fetchStudentData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const auth = getAuth();
      const user = auth.currentUser;

      if (!user) {
        throw new Error("No authenticated user found.");
      }

      const token = await user.getIdToken();
      
      const response = await fetch('/.netlify/functions/get-all-students', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ appId })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Request failed with status ${response.status}`);
      }
      
      const rawStudentData = await response.json();

      const today = new Date().toISOString().split('T')[0];
      let totalQuestions = 0;
      let totalCorrect = 0;
      let activeToday = 0;

      const processedStudentData = rawStudentData.map(data => {
        const answeredQuestions = data.answeredQuestions || [];
        const questionsToday = answeredQuestions.filter(q => q.date === today);
        const totalStudentQuestions = answeredQuestions.length;
        const correctAnswers = answeredQuestions.filter(q => q.isCorrect).length;
        const accuracy = totalStudentQuestions > 0 ? (correctAnswers / totalStudentQuestions * 100) : 0;
        
        if (questionsToday.length > 0) {
          activeToday++;
        }
        
        const latestActivity = answeredQuestions.length > 0 
          ? new Date(answeredQuestions[answeredQuestions.length - 1].timestamp)
          : null;
        
        const progressG3 = data.progressByGrade?.[today]?.G3 || data.progress?.[today] || {};
        const progressG4 = data.progressByGrade?.[today]?.G4 || {};
        
        totalQuestions += totalStudentQuestions;
        totalCorrect += correctAnswers;

        return {
          id: data.id,
          selectedGrade: data.selectedGrade || 'G3',
          coins: data.coins || 0,
          totalQuestions: totalStudentQuestions,
          questionsToday: questionsToday.length,
          accuracy: accuracy,
          latestActivity: latestActivity,
          progressG3: progressG3,
          progressG4: progressG4,
          answeredQuestions: answeredQuestions,
          dailyGoalsByGrade: data.dailyGoalsByGrade || {},
          isActiveToday: questionsToday.length > 0
        };
      });

      const averageAccuracy = totalQuestions > 0 ? (totalCorrect / totalQuestions * 100) : 0;

      setStudents(processedStudentData);
      setStats({
        totalStudents: processedStudentData.length,
        activeToday: activeToday,
        totalQuestions: totalQuestions,
        averageAccuracy: averageAccuracy
      });
      
    } catch (error) {
      console.error('Error fetching student data:', error);
      setError(`Failed to fetch student data: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [appId]);

  useEffect(() => {
    fetchStudentData();
  }, [fetchStudentData]);

  const exportStudentData = () => {
    const csvData = students.map(student => ({
      'Student ID': student.id,
      'Selected Grade': student.selectedGrade,
      'Total Questions': student.totalQuestions,
      'Questions Today': student.questionsToday,
      'Accuracy (%)': student.accuracy.toFixed(1),
      'Coins': student.coins,
      'Latest Activity': student.latestActivity ? student.latestActivity.toLocaleDateString() : 'Never',
      'Active Today': student.isActiveToday ? 'Yes' : 'No'
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

  const deleteStudent = async (studentId) => {
    if (window.confirm('Are you sure you want to delete this student? This action cannot be undone.')) {
      try {
        const profileDocRef = doc(db, 'artifacts', appId, 'users', studentId, 'math_whiz_data', 'profile');
        await deleteDoc(profileDocRef);
        setStudents(students.filter(s => s.id !== studentId));
        if (selectedStudent?.id === studentId) {
          setSelectedStudent(null);
          setView('students');
        }
      } catch (error) {
        console.error('Error deleting student:', error);
        alert('Error deleting student. Please try again.');
      }
    }
  };

  const formatDate = (date) => {
    return date ? new Date(date).toLocaleDateString() : 'Never';
  };

  const formatTime = (date) => {
    return date ? new Date(date).toLocaleTimeString() : 'Never';
  };

  const calculateTopicProgress = (student, grade) => {
    const progress = grade === 'G3' ? student.progressG3 : student.progressG4;
    const topics = grade === 'G3' 
      ? [TOPICS.MULTIPLICATION, TOPICS.DIVISION, TOPICS.FRACTIONS, TOPICS.MEASUREMENT_DATA]
      : [TOPICS.OPERATIONS_ALGEBRAIC_THINKING, TOPICS.BASE_TEN, TOPICS.FRACTIONS_4TH, TOPICS.MEASUREMENT_DATA_4TH, TOPICS.GEOMETRY];
    
    return topics.map(topic => {
      const sanitizedTopic = topic.replace(/[^a-zA-Z0-9]/g, '_');
      const topicProgress = progress[sanitizedTopic] || progress[topic] || { correct: 0, incorrect: 0 };
      const goal = student.dailyGoalsByGrade?.[grade]?.[topic] || 4;
      
      return {
        topic,
        correct: topicProgress.correct || 0,
        incorrect: topicProgress.incorrect || 0,
        goal,
        completed: (topicProgress.correct || 0) >= goal
      };
    });
  };

  const handleSort = (field) => {
    if (sortField === field) {
      // If clicking the same field, toggle direction
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // If clicking a new field, default to ascending
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortedStudents = () => {
    if (!sortField) return students;

    return [...students].sort((a, b) => {
      let aValue, bValue;

      switch (sortField) {
        case 'student':
          aValue = a.id.toLowerCase();
          bValue = b.id.toLowerCase();
          break;
        case 'grade':
          aValue = a.selectedGrade;
          bValue = b.selectedGrade;
          break;
        case 'questionsToday':
          aValue = a.questionsToday;
          bValue = b.questionsToday;
          break;
        case 'totalQuestions':
          aValue = a.totalQuestions;
          bValue = b.totalQuestions;
          break;
        case 'accuracy':
          aValue = a.accuracy;
          bValue = b.accuracy;
          break;
        case 'coins':
          aValue = a.coins;
          bValue = b.coins;
          break;
        case 'lastActivity':
          aValue = a.latestActivity ? new Date(a.latestActivity).getTime() : 0;
          bValue = b.latestActivity ? new Date(b.latestActivity).getTime() : 0;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) {
        return sortDirection === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortDirection === 'asc' ? 1 : -1;
      }
      return 0;
    });
  };

  const getSortIcon = (field) => {
    if (sortField !== field) {
      return <ChevronsUpDown className="w-4 h-4 text-gray-400" />;
    }
    return sortDirection === 'asc' 
      ? <ChevronUp className="w-4 h-4 text-blue-600" />
      : <ChevronDown className="w-4 h-4 text-blue-600" />;
  };

  const handleSelectStudent = (studentId) => {
    const newSelected = new Set(selectedStudents);
    if (newSelected.has(studentId)) {
      newSelected.delete(studentId);
    } else {
      newSelected.add(studentId);
    }
    setSelectedStudents(newSelected);
    setIsSelectAll(newSelected.size === getSortedStudents().length);
  };

  const handleSelectAll = () => {
    if (isSelectAll) {
      setSelectedStudents(new Set());
      setIsSelectAll(false);
    } else {
      const allStudentIds = new Set(getSortedStudents().map(student => student.id));
      setSelectedStudents(allStudentIds);
      setIsSelectAll(true);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedStudents.size === 0) return;

    const confirmMessage = `Are you sure you want to delete ${selectedStudents.size} student(s)? This action cannot be undone.`;
    if (!window.confirm(confirmMessage)) return;

    try {
      const deletePromises = Array.from(selectedStudents).map(async (studentId) => {
        const profileDocRef = doc(db, 'artifacts', appId, 'users', studentId, 'math_whiz_data', 'profile');
        await deleteDoc(profileDocRef);
        return studentId;
      });

      await Promise.all(deletePromises);
      
      // Update local state
      setStudents(students.filter(s => !selectedStudents.has(s.id)));
      setSelectedStudents(new Set());
      setIsSelectAll(false);
      
      // Clear selected student if it was deleted
      if (selectedStudent && selectedStudents.has(selectedStudent.id)) {
        setSelectedStudent(null);
        setView('students');
      }
    } catch (error) {
      console.error('Error deleting students:', error);
      alert('Error deleting students. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading student data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-7xl h-full max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <GraduationCap className="w-8 h-8 text-blue-600" />
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Admin Portal</h2>
              <p className="text-gray-600">Student Progress Dashboard</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={fetchStudentData}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Refresh</span>
            </button>
            <button
              onClick={exportStudentData}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              disabled={students.length === 0}
            >
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </button>
            {view === 'students' && (
              <button
                onClick={handleBulkDelete}
                className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={selectedStudents.size === 0}
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete Selected ({selectedStudents.size})</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              ×
            </button>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setView('overview')}
            className={`px-6 py-3 font-medium ${view === 'overview' 
              ? 'text-blue-600 border-b-2 border-blue-600' 
              : 'text-gray-600 hover:text-gray-900'}`}
          >
            Overview
          </button>
          <button
            onClick={() => setView('students')}
            className={`px-6 py-3 font-medium ${view === 'students' 
              ? 'text-blue-600 border-b-2 border-blue-600' 
              : 'text-gray-600 hover:text-gray-900'}`}
          >
            Students ({students.length})
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {error && (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4" role="alert">
              <p className="font-bold">Error</p>
              <p>{error}</p>
            </div>
          )}
          
          {/* Overview */}
          {view === 'overview' && (
            <div className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-600 text-sm font-medium">Total Students</p>
                      <p className="text-3xl font-bold text-blue-900">{stats.totalStudents}</p>
                    </div>
                    <Users className="w-12 h-12 text-blue-600" />
                  </div>
                </div>
                
                <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-600 text-sm font-medium">Active Today</p>
                      <p className="text-3xl font-bold text-green-900">{stats.activeToday}</p>
                    </div>
                    <TrendingUp className="w-12 h-12 text-green-600" />
                  </div>
                </div>
                
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-600 text-sm font-medium">Total Questions</p>
                      <p className="text-3xl font-bold text-purple-900">{stats.totalQuestions}</p>
                    </div>
                    <BarChart3 className="w-12 h-12 text-purple-600" />
                  </div>
                </div>
                
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-orange-600 text-sm font-medium">Average Accuracy</p>
                      <p className="text-3xl font-bold text-orange-900">{stats.averageAccuracy.toFixed(1)}%</p>
                    </div>
                    <Trophy className="w-12 h-12 text-orange-600" />
                  </div>
                </div>
              </div>

              {/* Debug Information */}
              {process.env.NODE_ENV === 'development' && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="p-6 border-b border-yellow-200">
                    <h3 className="text-lg font-semibold text-yellow-900 flex items-center">
                      🔍 Debug Information
                    </h3>
                  </div>
                  <div className="p-6">
                    <div className="space-y-2 text-sm">
                      <p><strong>App ID:</strong> {appId}</p>
                      <p><strong>Firebase Path:</strong> artifacts/{appId}/users</p>
                      <p><strong>Students Found:</strong> {students.length}</p>
                      <p><strong>Loading:</strong> {loading ? 'Yes' : 'No'}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Recent Activity */}
              <div className="bg-white border border-gray-200 rounded-lg">
                <div className="p-6 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <Clock className="w-5 h-5 mr-2" />
                    Recent Activity
                  </h3>
                </div>
                <div className="p-6">
                  {students
                    .filter(s => s.latestActivity)
                    .sort((a, b) => new Date(b.latestActivity) - new Date(a.latestActivity))
                    .slice(0, 10)
                    .map(student => (
                      <div key={student.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-blue-600 text-sm font-medium">
                              {student.id.slice(0, 2).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">Student {student.id.slice(0, 8)}</p>
                            <p className="text-sm text-gray-600">Grade {student.selectedGrade.slice(1)}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-900">{formatDate(student.latestActivity)}</p>
                          <p className="text-sm text-gray-600">{formatTime(student.latestActivity)}</p>
                        </div>
                      </div>
                    ))}
                  {students.filter(s => s.latestActivity).length === 0 && (
                    <p className="text-gray-500 text-center py-8">No recent activity</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Students List */}
          {view === 'students' && (
            <div className="space-y-4">
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          <input
                            type="checkbox"
                            checked={isSelectAll}
                            onChange={handleSelectAll}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                        </th>
                        <th 
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                          onClick={() => handleSort('student')}
                        >
                          <div className="flex items-center justify-between">
                            Student
                            {getSortIcon('student')}
                          </div>
                        </th>
                        <th 
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                          onClick={() => handleSort('grade')}
                        >
                          <div className="flex items-center justify-between">
                            Grade
                            {getSortIcon('grade')}
                          </div>
                        </th>
                        <th 
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                          onClick={() => handleSort('questionsToday')}
                        >
                          <div className="flex items-center justify-between">
                            Questions Today
                            {getSortIcon('questionsToday')}
                          </div>
                        </th>
                        <th 
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                          onClick={() => handleSort('totalQuestions')}
                        >
                          <div className="flex items-center justify-between">
                            Total Questions
                            {getSortIcon('totalQuestions')}
                          </div>
                        </th>
                        <th 
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                          onClick={() => handleSort('accuracy')}
                        >
                          <div className="flex items-center justify-between">
                            Accuracy
                            {getSortIcon('accuracy')}
                          </div>
                        </th>
                        <th 
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                          onClick={() => handleSort('coins')}
                        >
                          <div className="flex items-center justify-between">
                            Coins
                            {getSortIcon('coins')}
                          </div>
                        </th>
                        <th 
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                          onClick={() => handleSort('lastActivity')}
                        >
                          <div className="flex items-center justify-between">
                            Last Activity
                            {getSortIcon('lastActivity')}
                          </div>
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {getSortedStudents().map(student => (
                        <tr key={student.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <input
                              type="checkbox"
                              checked={selectedStudents.has(student.id)}
                              onChange={() => handleSelectStudent(student.id)}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                                <span className="text-blue-600 text-sm font-medium">
                                  {student.id.slice(0, 2).toUpperCase()}
                                </span>
                              </div>
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  Student {student.id.slice(0, 8)}
                                </div>
                                <div className="text-sm text-gray-500">ID: {student.id}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                              {student.selectedGrade}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <div className="flex items-center">
                              {student.questionsToday}
                              {student.isActiveToday && (
                                <div className="ml-2 w-2 h-2 bg-green-400 rounded-full"></div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {student.totalQuestions}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <div className="flex items-center">
                              <span className={`${student.accuracy >= 80 ? 'text-green-600' : student.accuracy >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                                {student.accuracy.toFixed(1)}%
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <div className="flex items-center">
                              <span className="text-yellow-500 mr-1">🪙</span>
                              {student.coins}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(student.latestActivity)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                            <button
                              onClick={() => {
                                setSelectedStudent(student);
                                setView('student-detail');
                              }}
                              className="text-blue-600 hover:text-blue-900 inline-flex items-center"
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              View
                            </button>
                            <button
                              onClick={() => deleteStudent(student.id)}
                              className="text-red-600 hover:text-red-900 inline-flex items-center"
                            >
                              <Trash2 className="w-4 h-4 mr-1" />
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {students.length === 0 && (
                  <div className="text-center py-12">
                    <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No students found</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Student Detail */}
          {view === 'student-detail' && selectedStudent && (
            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setView('students')}
                  className="text-blue-600 hover:text-blue-800 flex items-center"
                >
                  ← Back to Students
                </button>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    Student {selectedStudent.id.slice(0, 8)}
                  </h3>
                  <p className="text-gray-600">ID: {selectedStudent.id}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Student Stats */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h4 className="font-semibold text-gray-900 mb-4">Student Overview</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Selected Grade:</span>
                      <span className="font-medium">{selectedStudent.selectedGrade}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Questions:</span>
                      <span className="font-medium">{selectedStudent.totalQuestions}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Accuracy:</span>
                      <span className={`font-medium ${selectedStudent.accuracy >= 80 ? 'text-green-600' : selectedStudent.accuracy >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                        {selectedStudent.accuracy.toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Coins:</span>
                      <span className="font-medium">{selectedStudent.coins}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Last Active:</span>
                      <span className="font-medium">{formatDate(selectedStudent.latestActivity)}</span>
                    </div>
                  </div>
                </div>

                {/* Grade 3 Progress */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                    <Target className="w-4 h-4 mr-2" />
                    Grade 3 Progress (Today)
                  </h4>
                  <div className="space-y-3">
                    {calculateTopicProgress(selectedStudent, 'G3').map(topic => (
                      <div key={topic.topic} className="flex flex-col">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm text-gray-600">{topic.topic}</span>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs text-gray-500">
                              {topic.correct}/{topic.goal}
                            </span>
                            {topic.completed && (
                              <CheckCircle className="w-4 h-4 text-green-500" />
                            )}
                          </div>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${topic.completed ? 'bg-green-500' : 'bg-blue-500'}`}
                            style={{ width: `${Math.min((topic.correct / topic.goal) * 100, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Grade 4 Progress */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                    <Target className="w-4 h-4 mr-2" />
                    Grade 4 Progress (Today)
                  </h4>
                  <div className="space-y-3">
                    {calculateTopicProgress(selectedStudent, 'G4').map(topic => (
                      <div key={topic.topic} className="flex flex-col">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm text-gray-600">{topic.topic.length > 20 ? topic.topic.substring(0, 20) + '...' : topic.topic}</span>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs text-gray-500">
                              {topic.correct}/{topic.goal}
                            </span>
                            {topic.completed && (
                              <CheckCircle className="w-4 h-4 text-green-500" />
                            )}
                          </div>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${topic.completed ? 'bg-green-500' : 'bg-blue-500'}`}
                            style={{ width: `${Math.min((topic.correct / topic.goal) * 100, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Recent Questions */}
              <div className="bg-white border border-gray-200 rounded-lg">
                <div className="p-6 border-b border-gray-200">
                  <h4 className="font-semibold text-gray-900">Recent Questions (Last 20)</h4>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date/Time
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Grade
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Topic
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Question
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Student Answer
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Correct Answer
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Result
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Time
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {selectedStudent.answeredQuestions
                        .slice(-20)
                        .reverse()
                        .map((question, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {new Date(question.timestamp).toLocaleDateString()}
                              <br />
                              <span className="text-gray-500">
                                {new Date(question.timestamp).toLocaleTimeString()}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                                {question.grade || 'G3'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {question.topic}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                              {question.question}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900">
                              <span className={`font-medium ${
                                question.isCorrect 
                                  ? 'text-green-600' 
                                  : 'text-red-600'
                              }`}>
                                {question.userAnswer || 'N/A'}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900">
                              <span className="font-medium text-blue-600">
                                {question.correctAnswer || 'N/A'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                question.isCorrect 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {question.isCorrect ? 'Correct' : 'Incorrect'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {question.timeTaken ? `${question.timeTaken.toFixed(1)}s` : 'N/A'}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
                {selectedStudent.answeredQuestions.length === 0 && (
                  <div className="text-center py-12">
                    <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No questions answered yet</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPortal;
