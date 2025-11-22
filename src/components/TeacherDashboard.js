import React, { useState, useEffect, useCallback } from 'react';
import { getFirestore, collection, query, where, onSnapshot, addDoc, deleteDoc, doc, updateDoc, getDoc } from "firebase/firestore";
import { 
  Users, 
  Plus, 
  Edit3, 
  Trash2, 
  BookOpen, 
  LogOut, 
  Home,
  BarChart3, 
  Trophy, 
  Clock, 
  Download,
  Eye,
  TrendingUp,
  Target,
  CheckCircle,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  LayoutDashboard,
  HelpCircle,
  ClipboardList,
  RefreshCw,
  Upload,
} from 'lucide-react';
import { getAuth } from "firebase/auth";
import { useAuth } from '../contexts/AuthContext';
import { useTutorial } from '../contexts/TutorialContext';
import TutorialOverlay from './TutorialOverlay';
import { teacherDashboardTutorial } from '../tutorials/teacherDashboardTutorial';
import { TOPICS } from '../constants/topics';
import ClassDetail from './ClassDetail';
import CreateClassForm from './CreateClassForm';
import UploadQuestionsPDF from './UploadQuestionsPDF';
import QuestionBankManager from './QuestionBankManager';

const TeacherDashboard = () => {
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [classStudentCounts, setClassStudentCounts] = useState({});
  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({
    totalStudents: 0,
    activeToday: 0,
    totalQuestions: 0,
    averageAccuracy: 0
  });
  const [view, setView] = useState('overview'); // 'overview', 'students', 'classes', 'student-detail', 'questions'
  const [sortField, setSortField] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc'); // 'asc' or 'desc'
  const [selectedStudents, setSelectedStudents] = useState(new Set());
  const [isSelectAll, setIsSelectAll] = useState(false);
  const [showGoalsModal, setShowGoalsModal] = useState(false);
  const [goalGrade, setGoalGrade] = useState('G3');
  const [goalTargets, setGoalTargets] = useState({});
  const [goalStudentIds, setGoalStudentIds] = useState([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadClassId, setUploadClassId] = useState(null);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  const { user, logout } = useAuth();
  const { startTutorial, getCurrentStep, currentStep: tutorialCurrentStep } = useTutorial();
  const db = getFirestore();
  const appId = typeof window.__app_id !== "undefined" ? window.__app_id : "default-app-id";

  // Utility function to normalize date formats
  const normalizeDate = (dateStr) => {
    if (!dateStr) return null;
    // Handle different date formats
    if (dateStr.includes('/')) {
      // MM/DD/YYYY format
      const [month, day, year] = dateStr.split('/');
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    // Assume YYYY-MM-DD format or already normalized
    return dateStr;
  };

  // Debug logging
  useEffect(() => {
    console.log('TeacherDashboard mounted - VERSION 2.0. User:', !!user, 'DB:', !!db, 'AppId:', appId);
    console.log('No fetchTeachers calls should appear after this message');
  }, [user, db, appId]);

  const fetchStudentData = useCallback(async () => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError('');
      const auth = getAuth();
      const currentUser = auth.currentUser;

      if (!currentUser) {
        throw new Error("No authenticated user found.");
      }

      const token = await currentUser.getIdToken();
      // check if user token has role claim
      const tokenClaims = await currentUser.getIdTokenResult();
      const userRole = tokenClaims.claims.role;

      if (process.env.NODE_ENV === 'development') {

        console.log('User ID: ', user.uid);
        console.log('userRole: ', userRole);
      }

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

        const className = classes.find(c => c.id === data.classId)?.name || 'Unassigned';

        return {
          id: data.id,
          email: data.email || null,
          selectedGrade: data.selectedGrade || 'G3',
          coins: data.coins || 0,
          class: className,
          classId: data.classId,
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
  }, [appId, classes, user?.uid]);

  const loadClasses = useCallback(() => {
    if (!user?.uid || !db) {
      console.log('loadClasses: Missing user or db', { user: !!user, db: !!db });
      return;
    }
    
    try {
      const classesRef = collection(db, 'artifacts', appId, 'classes');
      const q = query(classesRef, where('teacherId', '==', user.uid));
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const classesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setClasses(classesData);
        console.log('Classes loaded:', classesData.length);
      }, (error) => {
        console.error('Error loading classes:', error);
        setError('Failed to load classes');
      });

      return unsubscribe;
    } catch (error) {
      console.error('Error in loadClasses:', error);
      setError('Error initializing classes');
    }
  }, [db, user, appId]);

  // Load student counts for all classes
  const loadStudentCounts = useCallback(() => {
    if (!db) {
      console.log('loadStudentCounts: Missing db');
      return;
    }
    
    try {
      const studentsRef = collection(db, 'artifacts', appId, 'classStudents');
      
      const unsubscribe = onSnapshot(studentsRef, async (snapshot) => {
        const studentCounts = {};
        
        // Filter enrollments to only count students (not teachers)
        for (const docSnapshot of snapshot.docs) {
          const data = docSnapshot.data();
          if (data.classId && data.studentId) {
            // Check the user's role
            const profileRef = doc(db, 'artifacts', appId, 'users', data.studentId, 'math_whiz_data', 'profile');
            try {
              const profileSnap = await getDoc(profileRef);
              if (profileSnap.exists()) {
                const profileData = profileSnap.data();
                // Only count users with role 'student'
                if (profileData.role === 'student') {
                  studentCounts[data.classId] = (studentCounts[data.classId] || 0) + 1;
                }
              }
            } catch (error) {
              console.error(`Error checking role for user ${data.studentId}:`, error);
            }
          }
        }
        
        setClassStudentCounts(studentCounts);
        console.log('Student counts loaded:', Object.keys(studentCounts).length);
      }, (error) => {
        console.error('Error loading student counts:', error);
      });

      return unsubscribe;
    } catch (error) {
      console.error('Error in loadStudentCounts:', error);
    }
  }, [db, appId]);

  useEffect(() => {
    console.log('TeacherDashboard useEffect called', { 
      user: !!user, 
      db: !!db,
      userUid: user?.uid 
    });
    
    if (user && db) {
      console.log('Initializing TeacherDashboard with valid user and db');
      const unsubscribeClasses = loadClasses();
      const unsubscribeStudentCounts = loadStudentCounts();
      
      return () => {
        console.log('Cleaning up TeacherDashboard subscriptions');
        if (unsubscribeClasses) unsubscribeClasses();
        if (unsubscribeStudentCounts) unsubscribeStudentCounts();
      };
    } else {
      console.log('TeacherDashboard waiting for user/db initialization');
    }
  }, [user, db, loadClasses, loadStudentCounts]);

  useEffect(() => {
    if (classes.length > 0 && user) {
      fetchStudentData();
    }
  }, [fetchStudentData, classes, user]);

  // Set loading to false when user and db are available, even if no classes
  useEffect(() => {
    if (user && db) {
      // Small delay to ensure all initialization is complete
      const timer = setTimeout(() => {
        if (classes.length === 0) {
          setLoading(false);
        }
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [user, db, classes.length]);

  // Auto-switch views during tutorial to ensure elements are visible
  useEffect(() => {
    const currentStep = getCurrentStep();
    if (currentStep && currentStep.requiredView && currentStep.requiredView !== view) {
      // Delay to ensure tutorial overlay is ready and DOM is updated
      // Longer delay for export button which is conditionally rendered
      const delay = currentStep.targetSelector?.includes('export-button') ? 400 : 200;
      const timer = setTimeout(() => {
        setView(currentStep.requiredView);
      }, delay);
      return () => clearTimeout(timer);
    }
  }, [getCurrentStep, view, tutorialCurrentStep]);

  const handleCreateClass = async (classData) => {
    try {
      await addDoc(collection(db, 'artifacts', appId, 'classes'), {
        ...classData,
        teacherId: user.uid,
        teacherEmail: user.email,
        createdAt: new Date()
      });
      setShowCreateForm(false);
    } catch (error) {
      console.error('Error creating class:', error);
      setError('Failed to create class');
    }
  };

  const handleDeleteClass = async (classId) => {
    if (window.confirm('Are you sure you want to delete this class? This action cannot be undone.')) {
      try {
        // Get auth token for the API call
        const auth = getAuth();
        const token = await auth.currentUser?.getIdToken();
        
        if (token) {
          try {
            // Remove all student enrollments for this class
            const response = await fetch(`/.netlify/functions/class-students?classId=${classId}`, {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });

            if (response.ok) {
              const enrollments = await response.json();
              
              // Delete all enrollments for this class
              const deletePromises = enrollments.map(enrollment => 
                fetch(`/.netlify/functions/class-students?id=${enrollment.id}`, {
                  method: 'DELETE',
                  headers: {
                    'Authorization': `Bearer ${token}`
                  }
                })
              );
              
              await Promise.all(deletePromises);
            }
          } catch (error) {
            console.warn('Could not clean up class enrollments, but continuing with class deletion:', error);
          }
        }
        
        // Delete the class document
        await deleteDoc(doc(db, 'artifacts', appId, 'classes', classId));
        
      } catch (error) {
        console.error('Error deleting class:', error);
        setError('Failed to delete class');
      }
    }
  };

  const handleEditClass = async (classId, updatedData) => {
    try {
      await updateDoc(doc(db, 'artifacts', appId, 'classes', classId), updatedData);
    } catch (error) {
      console.error('Error updating class:', error);
      setError('Failed to update class');
    }
  };

  const exportStudentData = () => {
    if (students.length === 0) {
      setError('No student data to export');
      return;
    }

    const csvData = students.map(student => ({
      'Email': student.email || '',
      'Student ID': student.id,
      'Selected Grade': student.selectedGrade,
      'Class': student.class,
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

  const formatDate = (date) => {
    if (!date) return 'Never';
    try {
      console.log("Formatting date:", date);

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

  const calculateTopicProgressForRange = (student, grade, startDate, endDate) => {
    const normalizedStartDate = normalizeDate(startDate);
    const normalizedEndDate = normalizeDate(endDate);

    const questionsInRange = student.answeredQuestions?.filter(
      (q) => {
        const normalizedQuestionDate = normalizeDate(q.date);
        return normalizedQuestionDate >= normalizedStartDate && normalizedQuestionDate <= normalizedEndDate;
      }
    ) || [];

    const topics = grade === 'G3'
      ? [TOPICS.MULTIPLICATION, TOPICS.DIVISION, TOPICS.FRACTIONS, TOPICS.MEASUREMENT_DATA]
      : [TOPICS.OPERATIONS_ALGEBRAIC_THINKING, TOPICS.BASE_TEN, TOPICS.FRACTIONS_4TH, TOPICS.MEASUREMENT_DATA_4TH, TOPICS.GEOMETRY, TOPICS.BINARY_ADDITION];

    // Count unique active days (days when student answered at least one question)
    const activeDays = new Set(questionsInRange.map(q => normalizeDate(q.date))).size;

    return topics.map(topic => {
      // Filter questions for this topic
      const topicQuestions = questionsInRange.filter(q => q.topic === topic);

      // Group by date to calculate per-day averages
      const questionsByDate = {};
      topicQuestions.forEach(q => {
        const date = normalizeDate(q.date);
        if (!questionsByDate[date]) {
          questionsByDate[date] = [];
        }
        questionsByDate[date].push(q);
      });

      // Calculate total correct/incorrect across all active days
      const totalCorrect = topicQuestions.filter(q => q.isCorrect).length;
      const totalIncorrect = topicQuestions.filter(q => !q.isCorrect).length;

      // Calculate average per active day (only days when this topic was practiced)
      const topicActiveDays = Object.keys(questionsByDate).length;
      const averageCorrect = topicActiveDays > 0 ? (totalCorrect / topicActiveDays) : 0;
      const averageIncorrect = topicActiveDays > 0 ? (totalIncorrect / topicActiveDays) : 0;

      const goal = student.dailyGoalsByGrade?.[grade]?.[topic] || 4;

      return {
        topic,
        totalCorrect,
        totalIncorrect,
        averageCorrect: Math.round(averageCorrect * 10) / 10, // Round to 1 decimal
        averageIncorrect: Math.round(averageIncorrect * 10) / 10,
        activeDays: topicActiveDays,
        totalActiveDays: activeDays,
        goal,
        completed: averageCorrect >= goal
      };
    });
  };

  const getTopicsForGrade = (grade) => {
    return grade === 'G3'
      ? [TOPICS.MULTIPLICATION, TOPICS.DIVISION, TOPICS.FRACTIONS, TOPICS.MEASUREMENT_DATA]
      : [TOPICS.OPERATIONS_ALGEBRAIC_THINKING, TOPICS.BASE_TEN, TOPICS.FRACTIONS_4TH, TOPICS.MEASUREMENT_DATA_4TH, TOPICS.GEOMETRY, TOPICS.BINARY_ADDITION];
  };

  const openGoalsModalForStudent = (student) => {
    const grade = student.selectedGrade || 'G3';
    const topics = getTopicsForGrade(grade);
    const current = {};
    topics.forEach(t => {
      current[t] = student.dailyGoalsByGrade?.[grade]?.[t] || 4;
    });
    setGoalGrade(grade);
    setGoalTargets(current);
    setGoalStudentIds([student.id]);
    setShowGoalsModal(true);
  };

  const openGoalsModalForSelected = () => {
    const ids = Array.from(selectedStudents);
    const grade = 'G3';
    const topics = getTopicsForGrade(grade);
    const current = {};
    topics.forEach(t => { current[t] = 4; });
    setGoalGrade(grade);
    setGoalTargets(current);
    setGoalStudentIds(ids);
    setShowGoalsModal(true);
  };

  const handleGoalGradeChange = (grade) => {
    const topics = getTopicsForGrade(grade);
    const next = { ...goalTargets };
    // Ensure all topics exist
    topics.forEach(t => { if (typeof next[t] === 'undefined') next[t] = 4; });
    // Remove topics not in this grade
    Object.keys(next).forEach(k => { if (!topics.includes(k)) delete next[k]; });
    setGoalGrade(grade);
    setGoalTargets(next);
  };

  const saveGoals = async () => {
    if (!db || goalStudentIds.length === 0) return;
    try {
      const topics = getTopicsForGrade(goalGrade);
      const updatesBase = {};
      topics.forEach(t => {
        const val = parseInt(goalTargets[t], 10);
        updatesBase[`dailyGoalsByGrade.${goalGrade}.${t}`] = isNaN(val) ? 0 : val;
      });

      await Promise.all(goalStudentIds.map(async (sid) => {
        const profileDocRef = doc(db, 'artifacts', appId, 'users', sid, 'math_whiz_data', 'profile');
        await updateDoc(profileDocRef, updatesBase);
      }));

      // Update local state
      setStudents(prev => prev.map(s => {
        if (!goalStudentIds.includes(s.id)) return s;
        const nextGoals = { ...(s.dailyGoalsByGrade || {}) };
        nextGoals[goalGrade] = { ...(nextGoals[goalGrade] || {}) };
        Object.entries(goalTargets).forEach(([k, v]) => {
          nextGoals[goalGrade][k] = parseInt(v, 10) || 0;
        });
        return { ...s, dailyGoalsByGrade: nextGoals };
      }));

      setShowGoalsModal(false);
      setGoalStudentIds([]);
    } catch (e) {
      console.error('Failed to save goals', e);
      setError('Failed to save goals');
    }
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
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
      // Get auth token for the API call
      const auth = getAuth();
      const token = await auth.currentUser?.getIdToken();
      
      const deletePromises = Array.from(selectedStudents).map(async (studentId) => {
        // Remove class enrollment if exists
        if (token) {
          try {
            const student = students.find(s => s.id === studentId);
            if (student && student.classId) {
              const response = await fetch(`/.netlify/functions/class-students?classId=${student.classId}&studentId=${studentId}`, {
                method: 'GET',
                headers: {
                  'Authorization': `Bearer ${token}`
                }
              });

              if (response.ok) {
                const enrollments = await response.json();
                const enrollment = enrollments.find(e => e.studentId === studentId && e.classId === student.classId);
                
                if (enrollment) {
                  await fetch(`/.netlify/functions/class-students?id=${enrollment.id}`, {
                    method: 'DELETE',
                    headers: {
                      'Authorization': `Bearer ${token}`
                    }
                  });
                }
              }
            }
          } catch (error) {
            console.warn(`Could not remove class enrollment for student ${studentId}, but continuing with deletion:`, error);
          }
        }
        
        // Delete student profile
        const profileDocRef = doc(db, 'artifacts', appId, 'users', studentId, 'math_whiz_data', 'profile');
        await deleteDoc(profileDocRef);
        return studentId;
      });

      await Promise.all(deletePromises);
      
      setStudents(students.filter(s => !selectedStudents.has(s.id)));
      setSelectedStudents(new Set());
      setIsSelectAll(false);
      
      if (selectedStudent && selectedStudents.has(selectedStudent.id)) {
        setSelectedStudent(null);
        setView('students');
      }
    } catch (error) {
      console.error('Error deleting students:', error);
      setError('Error deleting students. Please try again.');
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      setSelectedClass(null);
      setSelectedStudent(null);
      setShowCreateForm(false);
      // Redirect to unified login page regardless of current route
      window.location.assign('/login');
    } catch (error) {
      console.error('Error logging out:', error);
      try { window.location.assign('/login'); } catch (_) {}
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard data...</p>
          {user && <p className="text-sm text-gray-500 mt-2">User: {user.email}</p>}
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (selectedClass && view === 'classes') {
    return (
      <ClassDetail 
        classData={selectedClass}
        onBack={() => setSelectedClass(null)}
        onUpdateClass={handleEditClass}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <BookOpen className="h-8 w-8 text-blue-600" />
              <div data-tutorial-id="dashboard-header">
                <h1 className="text-2xl font-bold text-gray-900">Teacher Dashboard</h1>
                <p className="text-sm text-gray-600">Welcome back, {user?.email}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => startTutorial('teacherDashboard', teacherDashboardTutorial)}
                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                title="Help - Show tutorial"
              >
                <HelpCircle className="w-5 h-5" />
              </button>
              <button
                onClick={fetchStudentData}
                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="Refresh - Reload student data"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
              {view === 'students' && (
                <>
                  <button
                    onClick={exportStudentData}
                    disabled={students.length === 0}
                    className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    data-tutorial-id="export-button"
                    title={students.length > 0 ? "Export CSV - Download student data" : "Export CSV - No students to export"}
                  >
                    <Download className="w-5 h-5" />
                  </button>
                  <button
                    onClick={openGoalsModalForSelected}
                    className="relative p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={selectedStudents.size === 0}
                    title={`Set Goals - Set daily goals for ${selectedStudents.size} selected student(s)`}
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
                    className="relative p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={selectedStudents.size === 0}
                    title={`Delete Selected - Delete ${selectedStudents.size} selected student(s)`}
                  >
                    <Trash2 className="w-5 h-5" />
                    {selectedStudents.size > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {selectedStudents.size}
                      </span>
                    )}
                  </button>
                </>
              )}
              <a
                href="/"
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                title="Main App - Go to main application"
              >
                <Home className="w-5 h-5" />
              </a>
              <button
                onClick={handleLogout}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                data-tutorial-id="teacher-settings"
                title="Logout - Sign out of your account"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex border-b border-gray-200" data-tutorial-id="navigation-tabs">
            <button
              onClick={() => setView('overview')}
              className={`relative px-6 py-3 flex items-center justify-center ${view === 'overview' 
                ? 'text-blue-600 border-b-2 border-blue-600' 
                : 'text-gray-600 hover:text-gray-900'}`}
              title="Overview - View dashboard statistics and recent activity"
            >
              <LayoutDashboard className="w-5 h-5" />
            </button>
            <button
              onClick={() => setView('students')}
              className={`relative px-6 py-3 flex items-center justify-center ${view === 'students' 
                ? 'text-blue-600 border-b-2 border-blue-600' 
                : 'text-gray-600 hover:text-gray-900'}`}
              title={`Students - Manage ${students.length} student(s)`}
            >
              <Users className="w-5 h-5" />
              <span className="ml-2 text-xs font-medium">{students.length}</span>
            </button>
            <button
              onClick={() => setView('classes')}
              className={`relative px-6 py-3 flex items-center justify-center ${view === 'classes' 
                ? 'text-blue-600 border-b-2 border-blue-600' 
                : 'text-gray-600 hover:text-gray-900'}`}
              title={`Classes - Manage ${classes.length} class(es)`}
            >
              <BookOpen className="w-5 h-5" />
              <span className="ml-2 text-xs font-medium">{classes.length}</span>
            </button>
            <button
              onClick={() => setView('questions')}
              className={`relative px-6 py-3 flex items-center justify-center ${view === 'questions' 
                ? 'text-blue-600 border-b-2 border-blue-600' 
                : 'text-gray-600 hover:text-gray-900'}`}
              title="Questions - Manage your question bank"
            >
              <ClipboardList className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-red-800">{error}</p>
            <button
              onClick={() => setError('')}
              className="mt-2 text-sm text-red-600 hover:text-red-800"
            >
              Dismiss
            </button>
          </div>
        )}

        
        {/* Overview */}
        {view === 'overview' && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6" data-tutorial-id="overview-stats">
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
                            {student.email ? student.email.slice(0, 2).toUpperCase() : student.id.slice(0, 2).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{student.email || `Student ${student.id.slice(0, 8)}`}</p>
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
          <div className="space-y-4" data-tutorial-id="students-tab">
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200" data-tutorial-id="student-progress">
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
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Class
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
                      <tr 
                        key={student.id} 
                        className="hover:bg-gray-50 cursor-pointer"
                        onDoubleClick={() => {
                          setSelectedStudent(student);
                          setView('student-detail');
                        }}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={selectedStudents.has(student.id)}
                            onChange={() => handleSelectStudent(student.id)}
                            onDoubleClick={(e) => e.stopPropagation()}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                              <span className="text-blue-600 text-sm font-medium">
                                {student.email ? student.email.slice(0, 2).toUpperCase() : student.id.slice(0, 2).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {student.email || `Student ${student.id.slice(0, 8)}`}
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
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            student.class === 'Unassigned' 
                              ? 'bg-gray-100 text-gray-800' 
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {student.class}
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
                            onDoubleClick={(e) => e.stopPropagation()}
                            className="text-blue-600 hover:text-blue-900 inline-flex items-center"
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </button>
                          <button
                            onClick={() => openGoalsModalForStudent(student)}
                            onDoubleClick={(e) => e.stopPropagation()}
                            className="text-purple-600 hover:text-purple-900 inline-flex items-center"
                          >
                            <Target className="w-4 h-4 mr-1" />
                            Set Goals
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
                  <p className="text-gray-500">No students found in your classes</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Classes Overview */}
        {view === 'classes' && (
          <div className="mb-8">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Your Classes</h2>
                <p className="text-gray-600">Manage your classes and students</p>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  data-tutorial-id="create-class-button"
                >
                  <Plus className="h-4 w-4" />
                  <span>Create Class</span>
                </button>
              </div>
            </div>

            {/* Classes Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-tutorial-id="classes-list">
              {classes.map((classItem) => (
                <div
                  key={classItem.id}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
                >
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          {classItem.name}
                        </h3>
                        <p className="text-sm text-gray-600 mb-2">{classItem.subject}</p>
                        <p className="text-xs text-gray-500">{classItem.description}</p>
                      </div>
                      <div className="flex space-x-1">
                        <button
                          onClick={() => setSelectedClass(classItem)}
                          className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                          title="View Details"
                          data-tutorial-id="class-analytics"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteClass(classItem.id)}
                          className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                          title="Delete Class"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-1 text-gray-600">
                        <Users className="h-4 w-4" />
                        <span>{classStudentCounts[classItem.id] || 0} students</span>
                      </div>
                      <button
                        onClick={() => setSelectedClass(classItem)}
                        className="text-blue-600 hover:text-blue-800 font-medium"
                      >
                        View Details →
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {classes.length === 0 && (
              <div className="text-center py-12">
                <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No classes yet</h3>
                <p className="text-gray-600 mb-4">Get started by creating your first class</p>
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  <span>Create Your First Class</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Questions View */}
        {view === 'questions' && (
          <div className="space-y-6">
            {/* Upload Questions Section */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Question Bank</h3>
                  <p className="text-sm text-gray-600">Upload PDF files to extract quiz questions</p>
                </div>
                <button
                  onClick={() => {
                    setUploadClassId(null);
                    setShowUploadModal(true);
                  }}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  <Upload className="h-4 w-4" />
                  <span>Upload Questions</span>
                </button>
              </div>
            </div>

            <QuestionBankManager
              classes={classes}
              appId={appId}
              userId={user?.uid}
            />
          </div>
        )}

        {/* Student Detail */}
        {view === 'student-detail' && selectedStudent && (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-bold text-gray-900">
                {selectedStudent.email || `Student ${selectedStudent.id.slice(0, 8)}`}
              </h3>
              <p className="text-gray-600">ID: {selectedStudent.id}</p>
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
                    <span className="text-gray-600">Class:</span>
                    <span className="font-medium">{selectedStudent.class}</span>
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
                  Grade 3 Progress {startDate === endDate ? `(for ${formatDate(startDate)})` : `(from ${formatDate(startDate)} to ${formatDate(endDate)})`}
                </h4>
                <div className="space-y-3">
                  {calculateTopicProgressForRange(selectedStudent, 'G3', startDate, endDate).map(topic => (
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

              {/* Grade 4 Progress */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                  <Target className="w-4 h-4 mr-2" />
                  Grade 4 Progress {startDate === endDate ? `(for ${formatDate(startDate)})` : `(from ${formatDate(startDate)} to ${formatDate(endDate)})`}
                </h4>
                <div className="space-y-3">
                  {calculateTopicProgressForRange(selectedStudent, 'G4', startDate, endDate).map(topic => (
                    <div key={topic.topic} className="flex flex-col">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm text-gray-600">{topic.topic.length > 20 ? topic.topic.substring(0, 20) + '...' : topic.topic}</span>
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

              const questionsInRange = selectedStudent.answeredQuestions?.filter(
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
                    <div className="flex flex-col sm:flex-row gap-2 mt-2 sm:mt-0">
                      <div className="flex items-center gap-2">
                        <label className="text-sm text-gray-600">From:</label>
                        <input
                          type="date"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          className="border rounded px-2 py-1 text-sm"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="text-sm text-gray-600">To:</label>
                        <input
                          type="date"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          className="border rounded px-2 py-1 text-sm"
                        />
                      </div>
                      <button
                        onClick={() => {
                          const today = new Date().toISOString().split('T')[0];
                          setStartDate(today);
                          setEndDate(today);
                        }}
                        className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                      >
                        Today
                      </button>
                    </div>
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
        )}
      </div>

      {/* Set Goals Modal */}
      {showGoalsModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Set Daily Goals</h3>
              <button onClick={() => setShowGoalsModal(false)} className="text-gray-500 hover:text-gray-700">✕</button>
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {getTopicsForGrade(goalGrade).map(topic => (
                <div key={topic} className="flex items-center justify-between border rounded px-3 py-2">
                  <span className="text-sm text-gray-700 mr-3 truncate">{topic}</span>
                  <input
                    type="number"
                    min="0"
                    value={goalTargets[topic] ?? 4}
                    onChange={(e) => setGoalTargets(prev => ({ ...prev, [topic]: e.target.value }))}
                    className="w-20 border rounded px-2 py-1 text-sm"
                  />
                </div>
              ))}
            </div>
            <div className="mt-6 text-right space-x-2">
              <button onClick={() => setShowGoalsModal(false)} className="px-4 py-2 rounded border">Cancel</button>
              <button onClick={saveGoals} className="px-4 py-2 rounded bg-purple-600 text-white hover:bg-purple-700">Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Create Class Modal */}
      {showCreateForm && (
        <CreateClassForm
          onSubmit={handleCreateClass}
          onCancel={() => setShowCreateForm(false)}
        />
      )}

      {showUploadModal && (
        <UploadQuestionsPDF
          classId={uploadClassId}
          appId={appId}
          onClose={() => {
            setShowUploadModal(false);
            setUploadClassId(null);
          }}
          onQuestionsSaved={() => {
            // Questions saved successfully
            setShowUploadModal(false);
            setUploadClassId(null);
          }}
        />
      )}

      {/* Tutorial Overlay */}
      <TutorialOverlay />
    </div>
  );
};

export default TeacherDashboard;
