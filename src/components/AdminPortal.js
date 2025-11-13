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
  ChevronsUpDown,
  UserPlus,
  Edit,
  UserCheck,
  LayoutDashboard,
  BookOpen,
  RefreshCw,
  X
} from 'lucide-react';
import { getAuth } from "firebase/auth";
import { useAuth } from '../contexts/AuthContext';
import { TOPICS } from '../constants/topics';
import { doc, deleteDoc, collection, getDocs, updateDoc } from 'firebase/firestore';

const AdminPortal = ({ db, onClose, appId }) => {
  const { user } = useAuth();
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({
    totalStudents: 0,
    activeToday: 0,
    totalQuestions: 0,
    averageAccuracy: 0
  });
  const [view, setView] = useState('overview'); // 'overview', 'students', 'teachers', 'student-detail', 'classes', 'class-detail'
  const [sortField, setSortField] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc'); // 'asc' or 'desc'
  const [selectedStudents, setSelectedStudents] = useState(new Set());
  const [isSelectAll, setIsSelectAll] = useState(false);
  const [showBulkClassAssignment, setShowBulkClassAssignment] = useState(false);
  const [selectedBulkClass, setSelectedBulkClass] = useState('');
  const [selectedTeachers, setSelectedTeachers] = useState(new Set());
  const [isSelectAllTeachers, setIsSelectAllTeachers] = useState(false);
  
  // Class management states
  const [selectedClasses, setSelectedClasses] = useState(new Set());
  const [isSelectAllClasses, setIsSelectAllClasses] = useState(false);
  const [showAddClass, setShowAddClass] = useState(false);
  const [showEditClass, setShowEditClass] = useState(false);
  const [newClass, setNewClass] = useState({ name: '', teacherId: '', subject: '', gradeLevel: '', description: '', period: '' });
  const [editingClass, setEditingClass] = useState(null);
  const [selectedClassForDetail, setSelectedClassForDetail] = useState(null);
  const [classStudents, setClassStudents] = useState([]);
  
  // Teacher management states
  const [showAddTeacher, setShowAddTeacher] = useState(false);
  const [newTeacher, setNewTeacher] = useState({ name: '', email: '' });
  
  // Class assignment states
  const [showClassAssignment, setShowClassAssignment] = useState(false);
  const [selectedStudentForClass, setSelectedStudentForClass] = useState(null);
  const [selectedClass, setSelectedClass] = useState('');

  const fetchStudentData = useCallback(async () => {
    try {
      console.log('fetchStudentData: starting');
      setLoading(true);
      setError('');
      const auth = getAuth();
      const user = auth.currentUser;

      if (!user) {
        throw new Error("No authenticated user found.");
      }

      const token = await user.getIdToken();
      console.log('fetchStudentData: calling get-all-students API');
      
      const response = await fetch('/.netlify/functions/get-all-students', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ appId })
      });

      console.log('fetchStudentData: API response status', response.status);
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

        const classNames = data.teacherIds?.length > 0 
          ? classes.filter(c => data.teacherIds.includes(c.teacherId)).map(c => c.name).join(', ') || 'Unassigned'
          : 'Unassigned';

        return {
          id: data.id,
          email: data.email || null,
          selectedGrade: data.selectedGrade || 'G3',
          coins: data.coins || 0,
          class: classNames,
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
  }, [appId, classes]);

  const fetchTeachers = useCallback(async () => {
    try {
      const auth = getAuth();
      const user = auth.currentUser;

      if (!user) {
        throw new Error("No authenticated user found.");
      }

      const token = await user.getIdToken();
      
      const response = await fetch('/.netlify/functions/get-all-teachers', {
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
      
      const teachersList = await response.json();
      setTeachers(teachersList);
    } catch (error) {
      console.error('Error fetching teachers:', error);
      setError(`Failed to fetch teachers: ${error.message}`);
    }
  }, [appId]);

  const fetchClasses = useCallback(async () => {
    try {
      console.log('fetchClasses: starting');
      const classesRef = collection(db, 'artifacts', appId, 'classes');
      const snapshot = await getDocs(classesRef);
      console.log('fetchClasses: got', snapshot.docs.length, 'classes');
      const classesList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setClasses(classesList);
      console.log('fetchClasses: classes set', classesList);
    } catch (error) {
      console.error('Error fetching classes:', error);
      setError(`Failed to fetch classes: ${error.message}`);
    }
  }, [db, appId]);

  useEffect(() => {
    console.log('AdminPortal useEffect: fetchTeachers and fetchClasses');
    fetchTeachers();
    fetchClasses();
  }, [fetchTeachers, fetchClasses]);

  useEffect(() => {
    console.log('AdminPortal useEffect: calling fetchStudentData');
    // Always fetch student data, regardless of classes
    fetchStudentData();
  }, [fetchStudentData]);

  const addTeacher = async () => {
    if (!newTeacher.name || !newTeacher.email) {
      alert('Please enter both name and email');
      return;
    }

    try {
      const token = await user.getIdToken();
      
      const response = await fetch('/.netlify/functions/create-teacher', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: newTeacher.name,
          email: newTeacher.email,
          appId: appId
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create teacher');
      }

      console.log('Teacher created successfully:', result);
      
      // Show appropriate message based on reset email status
      const message = `Teacher account created successfully!\n\n` +
        `${result.resetMessage}\n\n` +
        `Teacher Email: ${result.teacherEmail}\n\n` +
        `Instructions: The teacher can now go to the login page and click "Forgot Password" ` +
        `to receive a password reset email, or you can manually send them reset instructions.`;
      
      alert(message);
      
      setNewTeacher({ name: '', email: '' });
      setShowAddTeacher(false);
      fetchTeachers();
    } catch (error) {
      console.error('Error adding teacher:', error);
      alert(`Error adding teacher: ${error.message}`);
    }
  };

  const deleteTeacher = async (teacher) => {
    const teacherName = teacher.displayName || teacher.name || teacher.email || 'Unknown Teacher';
    const confirmMessage = `Are you sure you want to delete teacher "${teacherName}" (${teacher.email})?\n\nThis will:\n- Remove their account and admin access\n- Delete their profile\n- Prevent them from logging in\n\nThis action cannot be undone.`;
    
    if (window.confirm(confirmMessage)) {
      try {
        // Debug logging
        console.log('Teacher object:', teacher);
        console.log('AppId:', appId);
        
        const requestBody = {
          teacherId: teacher.id,
          teacherUid: teacher.uid,
          appId: appId
        };
        
        console.log('Request body:', requestBody);
        
        const token = await user.getIdToken();
        
        const response = await fetch('/.netlify/functions/delete-teacher', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(requestBody)
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Failed to delete teacher');
        }

        console.log('Teacher deleted successfully:', result);
        alert(`Teacher "${teacherName}" has been deleted successfully.`);
        fetchTeachers();
      } catch (error) {
        console.error('Error deleting teacher:', error);
        alert(`Error deleting teacher: ${error.message}`);
      }
    }
  };

  const assignStudentToClass = async () => {
    if (!selectedStudentForClass || !selectedClass) {
      alert('Please select both a student and a class');
      return;
    }

    try {
      // Get auth token for the API call
      const auth = getAuth();
      const token = await auth.currentUser?.getIdToken();
      
      if (!token) {
        throw new Error('User not authenticated');
      }

      // Handle unassignment (removing from class)
      if (selectedClass === 'Unassigned') {
        // First, find and remove existing enrollment if any
        if (selectedStudentForClass.classId) {
          // Query to find the enrollment record
          const response = await fetch(`/.netlify/functions/class-students?classId=${selectedStudentForClass.classId}&studentId=${selectedStudentForClass.id}&appId=${appId}`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          if (response.ok) {
            const enrollments = await response.json();
            const enrollment = enrollments.find(e => e.studentId === selectedStudentForClass.id && e.classId === selectedStudentForClass.classId);
            
            if (enrollment) {
              // Remove the enrollment
              const deleteResponse = await fetch(`/.netlify/functions/class-students?id=${enrollment.id}&appId=${appId}`, {
                method: 'DELETE',
                headers: {
                  'Authorization': `Bearer ${token}`
                }
              });

              if (!deleteResponse.ok) {
                const errorData = await deleteResponse.json();
                throw new Error(errorData.error || 'Failed to remove student from class');
              }
            }
          }
        }

        // Update the student's profile to remove classId
        const profileDocRef = doc(db, 'artifacts', appId, 'users', selectedStudentForClass.id, 'math_whiz_data', 'profile');
        await updateDoc(profileDocRef, {
          classId: null,
          updatedAt: new Date().toISOString()
        });

        // Update local state
        setStudents(students.map(student => 
          student.id === selectedStudentForClass.id 
            ? { ...student, class: 'Unassigned', classId: null }
            : student
        ));

        alert('Student successfully unassigned from class');
      } else {
        // Handle assignment to a specific class
        
        // First, remove from current class if enrolled
        if (selectedStudentForClass.classId) {
          const response = await fetch(`/.netlify/functions/class-students?classId=${selectedStudentForClass.classId}&studentId=${selectedStudentForClass.id}&appId=${appId}`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          if (response.ok) {
            const enrollments = await response.json();
            const enrollment = enrollments.find(e => e.studentId === selectedStudentForClass.id && e.classId === selectedStudentForClass.classId);
            
            if (enrollment) {
              await fetch(`/.netlify/functions/class-students?id=${enrollment.id}&appId=${appId}`, {
                method: 'DELETE',
                headers: {
                  'Authorization': `Bearer ${token}`
                }
              });
            }
          }
        }

        // Add to new class
        const response = await fetch('/.netlify/functions/class-students', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            classId: selectedClass,
            studentId: selectedStudentForClass.id,
            studentEmail: selectedStudentForClass.email || '',
            studentName: selectedStudentForClass.displayName || selectedStudentForClass.email || 'Unknown',
            appId
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to assign student to class');
        }

        // Update the student's profile with the classId for backward compatibility
        const profileDocRef = doc(db, 'artifacts', appId, 'users', selectedStudentForClass.id, 'math_whiz_data', 'profile');
        await updateDoc(profileDocRef, {
          classId: selectedClass,
          updatedAt: new Date().toISOString()
        });

        // Update local state
        const assignedClassName = classes.find(c => c.id === selectedClass)?.name || 'Unassigned';
        setStudents(students.map(student => 
          student.id === selectedStudentForClass.id 
            ? { ...student, class: assignedClassName, classId: selectedClass }
            : student
        ));

        alert(`Student successfully assigned to ${assignedClassName}`);
      }
      
      setShowClassAssignment(false);
      setSelectedStudentForClass(null);
      setSelectedClass('');
    } catch (error) {
      console.error('Error managing student class assignment:', error);
      alert(`Error managing student class assignment: ${error.message}`);
    }
  };

  const bulkAssignStudentsToClass = async () => {
    if (selectedStudents.size === 0) {
      alert('Please select at least one student.');
      return;
    }
    if (!selectedBulkClass) {
      alert('Please select a class.');
      return;
    }

    try {
      const auth = getAuth();
      const token = await auth.currentUser?.getIdToken();
      if (!token) {
        alert('Authentication required. Please sign in again.');
        return;
      }

      const selectedIds = Array.from(selectedStudents);
      const assignedClassName = selectedBulkClass === 'Unassigned'
        ? 'Unassigned'
        : (classes.find(c => c.id === selectedBulkClass)?.name || 'Unassigned');

      if (selectedBulkClass === 'Unassigned') {
        // Unassign all selected students from their current class if any
        await Promise.all(selectedIds.map(async (studentId) => {
          const student = students.find(s => s.id === studentId);
          if (!student?.classId) return; // nothing to remove

          try {
            const resp = await fetch(`/.netlify/functions/class-students?classId=${student.classId}&studentId=${student.id}&appId=${appId}`, {
              headers: { 'Authorization': `Bearer ${token}` }
            });
            if (resp.ok) {
              const enrollments = await resp.json();
              const enrollment = enrollments.find(e => e.studentId === student.id && e.classId === student.classId);
              if (enrollment) {
                await fetch(`/.netlify/functions/class-students?id=${enrollment.id}&appId=${appId}`, {
                  method: 'DELETE',
                  headers: { 'Authorization': `Bearer ${token}` }
                });
              }
            }
          } catch (e) {
            console.warn('Could not remove class enrollment for student:', studentId, e);
          }

          // Update profile to remove classId
          const profileDocRef = doc(db, 'artifacts', appId, 'users', studentId, 'math_whiz_data', 'profile');
          await updateDoc(profileDocRef, { classId: null, updatedAt: new Date().toISOString() });
        }));

        // Update local state
        setStudents(prev => prev.map(s => selectedStudents.has(s.id) ? { ...s, class: 'Unassigned', classId: null } : s));
      } else {
        // Assign all selected students to the chosen class
        await Promise.all(selectedIds.map(async (studentId) => {
          const student = students.find(s => s.id === studentId);
          try {
            await fetch('/.netlify/functions/class-students', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({
                classId: selectedBulkClass,
                studentId,
                studentEmail: student?.email || '',
                studentName: student?.displayName || student?.email || 'Unknown',
                appId
              })
            });
          } catch (e) {
            console.warn('Failed to assign student to class:', studentId, e);
          }

          // Update the student's profile with the classId
          const profileDocRef = doc(db, 'artifacts', appId, 'users', studentId, 'math_whiz_data', 'profile');
          await updateDoc(profileDocRef, { classId: selectedBulkClass, updatedAt: new Date().toISOString() });
        }));

        // Update local state
        setStudents(prev => prev.map(s => selectedStudents.has(s.id) ? { ...s, class: assignedClassName, classId: selectedBulkClass } : s));
      }

      alert(`Updated ${selectedStudents.size} student(s): ${assignedClassName}`);
      setShowBulkClassAssignment(false);
      setSelectedBulkClass('');
      setSelectedStudents(new Set());
      setIsSelectAll(false);
    } catch (error) {
      console.error('Error in bulk class assignment:', error);
      alert(`Error in bulk class assignment: ${error.message}`);
    }
  };

  const exportStudentData = () => {
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

  const deleteStudent = async (studentId) => {
    if (window.confirm('Are you sure you want to delete this student? This action cannot be undone.')) {
      try {
        // Get auth token for the API call
        const auth = getAuth();
        const token = await auth.currentUser?.getIdToken();
        
        if (token) {
          // Find and remove any class enrollments for this student
          const student = students.find(s => s.id === studentId);
          if (student && student.classId) {
            try {
              const response = await fetch(`/.netlify/functions/class-students?classId=${student.classId}&studentId=${studentId}&appId=${appId}`, {
                method: 'GET',
                headers: {
                  'Authorization': `Bearer ${token}`
                }
              });

              if (response.ok) {
                const enrollments = await response.json();
                const enrollment = enrollments.find(e => e.studentId === studentId && e.classId === student.classId);
                
                if (enrollment) {
                  await fetch(`/.netlify/functions/class-students?id=${enrollment.id}&appId=${appId}`, {
                    method: 'DELETE',
                    headers: {
                      'Authorization': `Bearer ${token}`
                    }
                  });
                }
              }
            } catch (error) {
              console.warn('Could not remove class enrollment, but continuing with student deletion:', error);
            }
          }
        }

        // Delete the student's profile
        const profileDocRef = doc(db, 'artifacts', appId, 'users', studentId, 'math_whiz_data', 'profile');
        await deleteDoc(profileDocRef);
        
        // Update local state
        setStudents(students.filter(s => s.id !== studentId));
        if (selectedStudent?.id === studentId) {
          setSelectedStudent(null);
          setView('students');
        }
        
        alert('Student successfully deleted');
      } catch (error) {
        console.error('Error deleting student:', error);
        alert(`Error deleting student: ${error.message}`);
      }
    }
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    try {
      const parsedDate = new Date(date);
      return isNaN(parsedDate.getTime()) ? 'N/A' : parsedDate.toLocaleDateString();
    } catch {
      return 'N/A';
    }
  };

  const formatTime = (date) => {
    if (!date) return 'Never';
    try {
      const parsedDate = new Date(date);
      return isNaN(parsedDate.getTime()) ? 'Never' : parsedDate.toLocaleTimeString();
    } catch {
      return 'Never';
    }
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
        case 'class':
          aValue = (a.class || 'Unassigned').toLowerCase();
          bValue = (b.class || 'Unassigned').toLowerCase();
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

  const getSortedTeachers = () => {
    if (!['teacher', 'email', 'createdAt'].includes(sortField)) return teachers;
    return [...teachers].sort((a, b) => {
      let aValue, bValue;
      switch (sortField) {
        case 'teacher':
          aValue = (a.displayName || a.name || '').toLowerCase();
          bValue = (b.displayName || b.name || '').toLowerCase();
          break;
        case 'email':
          aValue = (a.email || '').toLowerCase();
          bValue = (b.email || '').toLowerCase();
          break;
        case 'createdAt':
          aValue = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          bValue = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          break;
        default:
          return 0;
      }
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  };

  const getSortedClasses = () => {
    if (!['name', 'teacher', 'gradeLevel', 'subject', 'studentCount', 'createdAt'].includes(sortField)) return classes;
    return [...classes].sort((a, b) => {
      let aValue, bValue;
      switch (sortField) {
        case 'name':
          aValue = (a.name || '').toLowerCase();
          bValue = (b.name || '').toLowerCase();
          break;
        case 'teacher':
          // Find teacher name from teachers array
          const teacherA = teachers.find(t => t.id === a.teacherId);
          const teacherB = teachers.find(t => t.id === b.teacherId);
          aValue = (teacherA?.displayName || teacherA?.name || teacherA?.email || '').toLowerCase();
          bValue = (teacherB?.displayName || teacherB?.name || teacherB?.email || '').toLowerCase();
          break;
        case 'gradeLevel':
          aValue = (a.gradeLevel || '').toLowerCase();
          bValue = (b.gradeLevel || '').toLowerCase();
          break;
        case 'subject':
          aValue = (a.subject || '').toLowerCase();
          bValue = (b.subject || '').toLowerCase();
          break;
        case 'studentCount':
          aValue = a.studentCount || 0;
          bValue = b.studentCount || 0;
          break;
        case 'createdAt':
          aValue = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          bValue = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          break;
        default:
          return 0;
      }
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
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
      
      setStudents(students.filter(s => !selectedStudents.has(s.id)));
      setSelectedStudents(new Set());
      setIsSelectAll(false);
      
      if (selectedStudent && selectedStudents.has(selectedStudent.id)) {
        setSelectedStudent(null);
        setView('students');
      }
    } catch (error) {
      console.error('Error deleting students:', error);
      alert('Error deleting students. Please try again.');
    }
  };
  
  const handleSelectTeacher = (teacherId) => {
    const newSelected = new Set(selectedTeachers);
    if (newSelected.has(teacherId)) {
      newSelected.delete(teacherId);
    } else {
      newSelected.add(teacherId);
    }
    setSelectedTeachers(newSelected);
  setIsSelectAllTeachers(newSelected.size === getSortedTeachers().length);
  };
  
  const handleSelectAllTeachers = () => {
    if (isSelectAllTeachers) {
      setSelectedTeachers(new Set());
      setIsSelectAllTeachers(false);
    } else {
  const allIds = new Set(getSortedTeachers().map(t => t.id));
      setSelectedTeachers(allIds);
      setIsSelectAllTeachers(true);
    }
  };
  
  const handleBulkDeleteTeachers = async () => {
    if (selectedTeachers.size === 0) {
      alert('No teachers selected.');
      return;
    }
    const count = selectedTeachers.size;
    const confirmMessage = `Are you sure you want to delete ${count} teacher(s)?\n\nThis will remove their accounts and profiles. This action cannot be undone.`;
    if (!window.confirm(confirmMessage)) return;

    try {
      const token = await user.getIdToken();
      const selectedIds = Array.from(selectedTeachers);

      await Promise.all(selectedIds.map(async (id) => {
        const t = teachers.find(tt => tt.id === id);
        if (!t) return;
        const requestBody = { teacherId: t.id, teacherUid: t.uid, appId };
        const resp = await fetch('/.netlify/functions/delete-teacher', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(requestBody)
        });
        if (!resp.ok) {
          let message = 'Failed to delete teacher';
          try { const j = await resp.json(); message = j.error || message; } catch {}
          throw new Error(`${t.email || t.id}: ${message}`);
        }
      }));

      alert(`Deleted ${count} teacher(s) successfully.`);
      setSelectedTeachers(new Set());
      setIsSelectAllTeachers(false);
      fetchTeachers();
    } catch (error) {
      console.error('Bulk delete teachers error:', error);
      alert(`Error deleting some teachers: ${error.message}`);
      // Still refresh to reflect partial progress
      fetchTeachers();
    }
  };

  // Class management functions
  const handleCreateClass = async () => {
    if (!newClass.name || !newClass.teacherId || !newClass.subject || !newClass.gradeLevel) {
      alert('Please fill in all required fields (Name, Teacher, Subject, Grade Level)');
      return;
    }

    try {
      const token = await user.getIdToken();
      
      const response = await fetch('/.netlify/functions/classes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...newClass,
          appId: appId
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create class');
      }

      console.log('Class created successfully:', result);
      alert('Class created successfully!');
      
      setNewClass({ name: '', teacherId: '', subject: '', gradeLevel: '', description: '', period: '' });
      setShowAddClass(false);
      fetchClasses();
    } catch (error) {
      console.error('Error creating class:', error);
      alert(`Error creating class: ${error.message}`);
    }
  };

  const handleUpdateClass = async () => {
    if (!editingClass || !editingClass.name || !editingClass.teacherId || !editingClass.subject || !editingClass.gradeLevel) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const token = await user.getIdToken();
      
      const response = await fetch(`/.netlify/functions/classes?id=${editingClass.id}&appId=${appId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: editingClass.name,
          teacherId: editingClass.teacherId,
          subject: editingClass.subject,
          gradeLevel: editingClass.gradeLevel,
          description: editingClass.description || '',
          period: editingClass.period || ''
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update class');
      }

      console.log('Class updated successfully:', result);
      alert('Class updated successfully!');
      
      setEditingClass(null);
      setShowEditClass(false);
      fetchClasses();
    } catch (error) {
      console.error('Error updating class:', error);
      alert(`Error updating class: ${error.message}`);
    }
  };

  const handleDeleteClass = async (classToDelete) => {
    const confirmMessage = `Are you sure you want to delete class "${classToDelete.name}"?\n\nThis will:\n- Remove all student enrollments\n- Delete the class permanently\n\nThis action cannot be undone.`;
    
    if (!window.confirm(confirmMessage)) return;

    try {
      const token = await user.getIdToken();
      
      const response = await fetch(`/.netlify/functions/classes?id=${classToDelete.id}&appId=${appId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete class');
      }

      console.log('Class deleted successfully:', result);
      alert(`Class "${classToDelete.name}" has been deleted successfully.`);
      fetchClasses();
      fetchStudentData(); // Refresh student data to update class assignments
    } catch (error) {
      console.error('Error deleting class:', error);
      alert(`Error deleting class: ${error.message}`);
    }
  };

  const handleBulkDeleteClasses = async () => {
    if (selectedClasses.size === 0) {
      alert('No classes selected.');
      return;
    }
    
    const count = selectedClasses.size;
    const confirmMessage = `Are you sure you want to delete ${count} class(es)?\n\nThis will remove all student enrollments and delete the classes permanently. This action cannot be undone.`;
    if (!window.confirm(confirmMessage)) return;

    try {
      const token = await user.getIdToken();
      const selectedIds = Array.from(selectedClasses);

      await Promise.all(selectedIds.map(async (id) => {
        const cls = classes.find(c => c.id === id);
        if (!cls) return;
        
        const resp = await fetch(`/.netlify/functions/classes?id=${id}&appId=${appId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!resp.ok) {
          let message = 'Failed to delete class';
          try { const j = await resp.json(); message = j.error || message; } catch {}
          throw new Error(`${cls.name}: ${message}`);
        }
      }));

      alert(`Deleted ${count} class(es) successfully.`);
      setSelectedClasses(new Set());
      setIsSelectAllClasses(false);
      fetchClasses();
      fetchStudentData();
    } catch (error) {
      console.error('Bulk delete classes error:', error);
      alert(`Error deleting some classes: ${error.message}`);
      // Still refresh to reflect partial progress
      fetchClasses();
      fetchStudentData();
    }
  };

  const handleSelectClass = (classId) => {
    const newSelected = new Set(selectedClasses);
    if (newSelected.has(classId)) {
      newSelected.delete(classId);
    } else {
      newSelected.add(classId);
    }
    setSelectedClasses(newSelected);
    setIsSelectAllClasses(newSelected.size === getSortedClasses().length);
  };

  const handleSelectAllClasses = () => {
    if (isSelectAllClasses) {
      setSelectedClasses(new Set());
      setIsSelectAllClasses(false);
    } else {
      const allIds = new Set(getSortedClasses().map(c => c.id));
      setSelectedClasses(allIds);
      setIsSelectAllClasses(true);
    }
  };

  const fetchClassStudents = async (classId) => {
    try {
      const auth = getAuth();
      const token = await auth.currentUser?.getIdToken();
      
      if (!token) {
        throw new Error('User not authenticated');
      }

      const response = await fetch(`/.netlify/functions/class-students?classId=${classId}&appId=${appId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch class students');
      }

      const enrollments = await response.json();
      setClassStudents(enrollments);
    } catch (error) {
      console.error('Error fetching class students:', error);
      setError(`Failed to fetch class students: ${error.message}`);
      setClassStudents([]);
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
          <div className="flex items-center space-x-3">
            <button
              onClick={fetchStudentData}
              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="Refresh - Reload data"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
            <button
              onClick={exportStudentData}
              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={students.length === 0}
              title="Export CSV - Download data"
            >
              <Download className="w-5 h-5" />
            </button>
            {view === 'students' && (
              <>
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
                <button
                  onClick={() => setShowBulkClassAssignment(true)}
                  className="relative p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={selectedStudents.size === 0}
                  title={`Assign To Class - Assign ${selectedStudents.size} selected student(s) to a class`}
                >
                  <Edit className="w-5 h-5" />
                  {selectedStudents.size > 0 && (
                    <span className="absolute -top-1 -right-1 bg-indigo-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {selectedStudents.size}
                    </span>
                  )}
                </button>
              </>
            )}
            {view === 'teachers' && (
              <button
                onClick={handleBulkDeleteTeachers}
                className="relative p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={selectedTeachers.size === 0}
                title={`Delete Selected - Delete ${selectedTeachers.size} selected teacher(s)`}
              >
                <Trash2 className="w-5 h-5" />
                {selectedTeachers.size > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {selectedTeachers.size}
                  </span>
                )}
              </button>
            )}
            {view === 'classes' && (
              <button
                onClick={handleBulkDeleteClasses}
                className="relative p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={selectedClasses.size === 0}
                title={`Delete Selected - Delete ${selectedClasses.size} selected class(es)`}
              >
                <Trash2 className="w-5 h-5" />
                {selectedClasses.size > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {selectedClasses.size}
                  </span>
                )}
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
              title="Close - Exit admin portal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex border-b border-gray-200">
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
            onClick={() => setView('teachers')}
            className={`relative px-6 py-3 flex items-center justify-center ${view === 'teachers' 
              ? 'text-blue-600 border-b-2 border-blue-600' 
              : 'text-gray-600 hover:text-gray-900'}`}
            title={`Teachers - Manage ${teachers.length} teacher(s)`}
          >
            <GraduationCap className="w-5 h-5" />
            <span className="ml-2 text-xs font-medium">{teachers.length}</span>
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
                          onClick={() => handleSort('class')}
                        >
                          <div className="flex items-center justify-between">
                            Class
                            {getSortIcon('class')}
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
                            <div className="flex items-center justify-between">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                student.class === 'Unassigned' 
                                  ? 'bg-gray-100 text-gray-800' 
                                  : 'bg-green-100 text-green-800'
                              }`}>
                                {student.class}
                              </span>
                              <button
                                onClick={() => {
                                  setSelectedStudentForClass(student);
                                  setShowClassAssignment(true);
                                }}
                                className="ml-2 text-blue-600 hover:text-blue-900"
                                title="Assign to class"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                            </div>
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

          {/* Teachers List */}
          {view === 'teachers' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">Teachers Management</h3>
                <button
                  onClick={() => setShowAddTeacher(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Add Teacher</span>
                </button>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-4 text-left">
                          <input
                            type="checkbox"
                            checked={isSelectAllTeachers}
                            onChange={handleSelectAllTeachers}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                        </th>
                        <th 
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                          onClick={() => handleSort('teacher')}
                        >
                          <div className="flex items-center justify-between">
                            Teacher
                            {getSortIcon('teacher')}
                          </div>
                        </th>
                        <th 
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                          onClick={() => handleSort('email')}
                        >
                          <div className="flex items-center justify-between">
                            Email
                            {getSortIcon('email')}
                          </div>
                        </th>
                        <th 
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                          onClick={() => handleSort('createdAt')}
                        >
                          <div className="flex items-center justify-between">
                            Created At
                            {getSortIcon('createdAt')}
                          </div>
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {getSortedTeachers().map(teacher => (
                        <tr key={teacher.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <input
                              type="checkbox"
                              checked={selectedTeachers.has(teacher.id)}
                              onChange={() => handleSelectTeacher(teacher.id)}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                          </td>
                          <td className="p-3 text-sm text-gray-700 whitespace-nowrap">{teacher.displayName || teacher.name}</td>
                          <td className="p-3 text-sm text-gray-700 whitespace-nowrap">{teacher.email}</td>
                          <td className="p-3 text-sm text-gray-700 whitespace-nowrap">
                            {formatDate(teacher.createdAt)}
                          </td>
                          <td className="p-3 text-sm whitespace-nowrap">
                            <button
                              onClick={() => deleteTeacher(teacher)}
                              className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200"
                              title="Delete Teacher"
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {teachers.length === 0 && (
                  <div className="text-center py-12">
                    <UserCheck className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No teachers found</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Classes List */}
          {view === 'classes' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">Classes Management</h3>
                <button
                  onClick={() => setShowAddClass(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Add Class</span>
                </button>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-4 text-left">
                          <input
                            type="checkbox"
                            checked={isSelectAllClasses}
                            onChange={handleSelectAllClasses}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                        </th>
                        <th 
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                          onClick={() => handleSort('name')}
                        >
                          <div className="flex items-center justify-between">
                            Name
                            {getSortIcon('name')}
                          </div>
                        </th>
                        <th 
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                          onClick={() => handleSort('teacher')}
                        >
                          <div className="flex items-center justify-between">
                            Teacher
                            {getSortIcon('teacher')}
                          </div>
                        </th>
                        <th 
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                          onClick={() => handleSort('gradeLevel')}
                        >
                          <div className="flex items-center justify-between">
                            Grade Level
                            {getSortIcon('gradeLevel')}
                          </div>
                        </th>
                        <th 
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                          onClick={() => handleSort('subject')}
                        >
                          <div className="flex items-center justify-between">
                            Subject
                            {getSortIcon('subject')}
                          </div>
                        </th>
                        <th 
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                          onClick={() => handleSort('studentCount')}
                        >
                          <div className="flex items-center justify-between">
                            Students
                            {getSortIcon('studentCount')}
                          </div>
                        </th>
                        <th 
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                          onClick={() => handleSort('createdAt')}
                        >
                          <div className="flex items-center justify-between">
                            Created
                            {getSortIcon('createdAt')}
                          </div>
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {getSortedClasses().map(classItem => {
                        const teacher = teachers.find(t => t.id === classItem.teacherId);
                        return (
                          <tr key={classItem.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <input
                                type="checkbox"
                                checked={selectedClasses.has(classItem.id)}
                                onChange={() => handleSelectClass(classItem.id)}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                              />
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">{classItem.name}</div>
                              {classItem.period && (
                                <div className="text-sm text-gray-500">{classItem.period}</div>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {teacher?.displayName || teacher?.name || teacher?.email || 'Unknown'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                                {classItem.gradeLevel}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {classItem.subject}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {classItem.studentCount || 0}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {(() => {
                                if (!classItem.createdAt) return 'N/A';
                                try {
                                  const date = new Date(classItem.createdAt.seconds ? classItem.createdAt.seconds * 1000 : classItem.createdAt);
                                  return isNaN(date.getTime()) ? 'N/A' : date.toLocaleDateString();
                                } catch {
                                  return 'N/A';
                                }
                              })()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                              <button
                                onClick={() => {
                                  setSelectedClassForDetail(classItem);
                                  fetchClassStudents(classItem.id);
                                  setView('class-detail');
                                }}
                                className="text-blue-600 hover:text-blue-900 inline-flex items-center"
                              >
                                <Eye className="w-4 h-4 mr-1" />
                                View
                              </button>
                              <button
                                onClick={() => {
                                  setEditingClass(classItem);
                                  setShowEditClass(true);
                                }}
                                className="text-indigo-600 hover:text-indigo-900 inline-flex items-center"
                              >
                                <Edit className="w-4 h-4 mr-1" />
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteClass(classItem)}
                                className="text-red-600 hover:text-red-900 inline-flex items-center"
                              >
                                <Trash2 className="w-4 h-4 mr-1" />
                                Delete
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {classes.length === 0 && (
                  <div className="text-center py-12">
                    <GraduationCap className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No classes found</p>
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
                  {selectedStudent.email || `Student ${selectedStudent.id.slice(0, 8)}`}
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
                              {formatDate(question.timestamp)}
                              <br />
                              <span className="text-gray-500">
                                {formatTime(question.timestamp)}
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

          {/* Class Detail */}
          {view === 'class-detail' && selectedClassForDetail && (
            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setView('classes')}
                  className="text-blue-600 hover:text-blue-800 flex items-center"
                >
                  ← Back to Classes
                </button>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    {selectedClassForDetail.name}
                  </h3>
                  <p className="text-gray-600">{selectedClassForDetail.subject} - {selectedClassForDetail.gradeLevel}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Class Information */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h4 className="font-semibold text-gray-900 mb-4">Class Information</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Class Name:</span>
                      <span className="font-medium">{selectedClassForDetail.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Teacher:</span>
                      <span className="font-medium">
                        {teachers.find(t => t.id === selectedClassForDetail.teacherId)?.displayName || 
                         teachers.find(t => t.id === selectedClassForDetail.teacherId)?.name || 
                         'Unknown'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Subject:</span>
                      <span className="font-medium">{selectedClassForDetail.subject}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Grade Level:</span>
                      <span className="font-medium">{selectedClassForDetail.gradeLevel}</span>
                    </div>
                    {selectedClassForDetail.period && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Period:</span>
                        <span className="font-medium">{selectedClassForDetail.period}</span>
                      </div>
                    )}
                    {selectedClassForDetail.description && (
                      <div className="flex flex-col">
                        <span className="text-gray-600 mb-1">Description:</span>
                        <span className="font-medium">{selectedClassForDetail.description}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Students:</span>
                      <span className="font-medium">{selectedClassForDetail.studentCount || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Created:</span>
                      <span className="font-medium">
                        {(() => {
                          if (!selectedClassForDetail.createdAt) return 'N/A';
                          try {
                            const date = new Date(selectedClassForDetail.createdAt.seconds ? selectedClassForDetail.createdAt.seconds * 1000 : selectedClassForDetail.createdAt);
                            return isNaN(date.getTime()) ? 'N/A' : date.toLocaleDateString();
                          } catch {
                            return 'N/A';
                          }
                        })()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Class Statistics */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h4 className="font-semibold text-gray-900 mb-4">Class Statistics</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Enrolled Students:</span>
                      <span className="font-medium">{classStudents.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Active Students:</span>
                      <span className="font-medium">
                        {classStudents.filter(s => {
                          const student = students.find(st => st.id === s.studentId);
                          return student?.isActiveToday;
                        }).length}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Enrolled Students */}
              <div className="bg-white border border-gray-200 rounded-lg">
                <div className="p-6 border-b border-gray-200">
                  <h4 className="font-semibold text-gray-900">Enrolled Students</h4>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Student
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Email
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Joined Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Questions Today
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total Questions
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Accuracy
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {classStudents.map(enrollment => {
                        const student = students.find(s => s.id === enrollment.studentId);
                        return (
                          <tr key={enrollment.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                                  <span className="text-blue-600 text-sm font-medium">
                                    {student?.email ? student.email.slice(0, 2).toUpperCase() : enrollment.studentId.slice(0, 2).toUpperCase()}
                                  </span>
                                </div>
                                <div>
                                  <div className="text-sm font-medium text-gray-900">
                                    {student?.email || enrollment.studentName || `Student ${enrollment.studentId.slice(0, 8)}`}
                                  </div>
                                  <div className="text-sm text-gray-500">ID: {enrollment.studentId}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {student?.email || 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {(() => {
                                if (!enrollment.joinedAt) return 'N/A';
                                try {
                                  const date = new Date(enrollment.joinedAt.seconds ? enrollment.joinedAt.seconds * 1000 : enrollment.joinedAt);
                                  return isNaN(date.getTime()) ? 'N/A' : date.toLocaleDateString();
                                } catch {
                                  return 'N/A';
                                }
                              })()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {student?.questionsToday || 0}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {student?.totalQuestions || 0}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {student ? (
                                <span className={`${student.accuracy >= 80 ? 'text-green-600' : student.accuracy >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                                  {student.accuracy.toFixed(1)}%
                                </span>
                              ) : (
                                <span className="text-gray-500">N/A</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {classStudents.length === 0 && (
                  <div className="text-center py-12">
                    <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No students enrolled in this class</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Teacher Modal */}
      {showAddTeacher && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Teacher</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Teacher Name
                </label>
                <input
                  type="text"
                  value={newTeacher.name}
                  onChange={(e) => setNewTeacher({...newTeacher, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter teacher name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={newTeacher.email}
                  onChange={(e) => setNewTeacher({...newTeacher, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter email address"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowAddTeacher(false);
                  setNewTeacher({ name: '', email: '' });
                }}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={addTeacher}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Add Teacher
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Class Assignment Modal */}
      {showClassAssignment && selectedStudentForClass && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Assign Student to Class</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Student
                </label>
                <div className="px-3 py-2 bg-gray-100 rounded-md">
                  <div className="flex items-center">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-2">
                      <span className="text-blue-600 text-xs font-medium">
                        {selectedStudentForClass.email ? selectedStudentForClass.email.slice(0, 2).toUpperCase() : selectedStudentForClass.id.slice(0, 2).toUpperCase()}
                      </span>
                    </div>
                    <span className="text-sm font-medium">{selectedStudentForClass.email || `Student ${selectedStudentForClass.id.slice(0, 8)}`}</span>
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Class
                </label>
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a class...</option>
                  {classes.map(cls => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name} ({cls.teacher})
                    </option>
                  ))}
                  <option value="Unassigned">Unassigned</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowClassAssignment(false);
                  setSelectedStudentForClass(null);
                  setSelectedClass('');
                }}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={assignStudentToClass}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Assign to Class
              </button>
            </div>
          </div>
        </div>
      )}

      {showBulkClassAssignment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Assign Selected Students to Class</h3>
            <div className="space-y-4">
              <div className="text-sm text-gray-700">Selected: {selectedStudents.size} student(s)</div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Class</label>
                <select
                  value={selectedBulkClass}
                  onChange={(e) => setSelectedBulkClass(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a class...</option>
                  {classes.map(cls => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name} ({cls.teacher})
                    </option>
                  ))}
                  <option value="Unassigned">Unassigned</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => { setShowBulkClassAssignment(false); setSelectedBulkClass(''); }}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={bulkAssignStudentsToClass}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={selectedStudents.size === 0 || !selectedBulkClass}
              >
                Assign
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Class Modal */}
      {showAddClass && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Class</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Class Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newClass.name}
                  onChange={(e) => setNewClass({...newClass, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Math 4A"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Teacher <span className="text-red-500">*</span>
                </label>
                <select
                  value={newClass.teacherId}
                  onChange={(e) => setNewClass({...newClass, teacherId: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a teacher...</option>
                  {teachers.map(teacher => (
                    <option key={teacher.id} value={teacher.id}>
                      {teacher.displayName || teacher.name || teacher.email}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subject <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newClass.subject}
                  onChange={(e) => setNewClass({...newClass, subject: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Mathematics"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Grade Level <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newClass.gradeLevel}
                  onChange={(e) => setNewClass({...newClass, gradeLevel: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., 4th Grade"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Period
                </label>
                <input
                  type="text"
                  value={newClass.period}
                  onChange={(e) => setNewClass({...newClass, period: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., 1st Period"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={newClass.description}
                  onChange={(e) => setNewClass({...newClass, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Optional class description"
                  rows="3"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowAddClass(false);
                  setNewClass({ name: '', teacherId: '', subject: '', gradeLevel: '', description: '', period: '' });
                }}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateClass}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Add Class
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Class Modal */}
      {showEditClass && editingClass && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Edit Class</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Class Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editingClass.name}
                  onChange={(e) => setEditingClass({...editingClass, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Math 4A"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Teacher <span className="text-red-500">*</span>
                </label>
                <select
                  value={editingClass.teacherId}
                  onChange={(e) => setEditingClass({...editingClass, teacherId: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a teacher...</option>
                  {teachers.map(teacher => (
                    <option key={teacher.id} value={teacher.id}>
                      {teacher.displayName || teacher.name || teacher.email}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subject <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editingClass.subject}
                  onChange={(e) => setEditingClass({...editingClass, subject: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Mathematics"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Grade Level <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editingClass.gradeLevel}
                  onChange={(e) => setEditingClass({...editingClass, gradeLevel: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., 4th Grade"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Period
                </label>
                <input
                  type="text"
                  value={editingClass.period || ''}
                  onChange={(e) => setEditingClass({...editingClass, period: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., 1st Period"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={editingClass.description || ''}
                  onChange={(e) => setEditingClass({...editingClass, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Optional class description"
                  rows="3"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowEditClass(false);
                  setEditingClass(null);
                }}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateClass}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPortal;
