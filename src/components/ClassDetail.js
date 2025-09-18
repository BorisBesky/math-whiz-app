import React, { useState, useEffect, useCallback } from 'react';
import { getFirestore, collection, query, where, onSnapshot, doc, updateDoc, getDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { ArrowLeft, Users, Edit3, UserMinus, Mail, Calendar, BookOpen, Plus } from 'lucide-react';
import EditClassForm from './EditClassForm';

const ClassDetail = ({ classData, onBack, onUpdateClass }) => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showEditForm, setShowEditForm] = useState(false);

  const db = getFirestore();
  const appId = typeof window.__app_id !== "undefined" ? window.__app_id : "default-app-id";

  const loadStudents = useCallback(() => {
    const enrollmentsRef = collection(db, 'artifacts', appId, 'classStudents');
    const qEnrollments = query(enrollmentsRef, where('classId', '==', classData.id));

    const unsubscribe = onSnapshot(qEnrollments, async (snapshot) => {
      try {
        const enrollments = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));

        const studentsData = await Promise.all(enrollments.map(async (enr) => {
          const userId = enr.studentId;
          const profileRef = doc(db, 'artifacts', appId, 'users', userId, 'math_whiz_data', 'profile');
          const profileSnap = await getDoc(profileRef);
          const data = profileSnap.exists() ? profileSnap.data() : {};

          const answeredQuestions = Array.isArray(data.answeredQuestions) ? data.answeredQuestions : [];

          return {
            id: userId,
            profileDocId: profileSnap.id,
            name: data.name || data.displayName || enr.studentName || `Student ${userId.slice(-6)}`,
            email: data.email || enr.studentEmail || '',
            classId: classData.id,
            selectedGrade: data.selectedGrade || 'G3',
            coins: data.coins || 0,
            joinedAt: data.updatedAt || data.createdAt || enr.joinedAt || new Date(),
            lastActivity: getLastActivity(data),
            totalQuestions: answeredQuestions.length,
            dailyGoalsByGrade: data.dailyGoalsByGrade || {},
            ownedBackgrounds: data.ownedBackgrounds || [],
            activeBackground: data.activeBackground || 'default'
          };
        }));

        setStudents(studentsData);
        setLoading(false);
      } catch (err) {
        console.error('Error building student list:', err);
        setError('Failed to load students');
        setLoading(false);
      }
    }, (error) => {
      console.error('Error loading students:', error);
      setError('Failed to load students');
      setLoading(false);
    });

    return unsubscribe;
  }, [db, appId, classData.id]);

  // Helper function to get last activity
  const getLastActivity = (userData) => {
    if (!userData.answeredQuestions || userData.answeredQuestions.length === 0) {
      return null;
    }
    
    const lastQuestion = userData.answeredQuestions[userData.answeredQuestions.length - 1];
    return lastQuestion.timestamp ? new Date(lastQuestion.timestamp) : null;
  };

  useEffect(() => {
    const unsubscribe = loadStudents();
    return () => unsubscribe && unsubscribe();
  }, [loadStudents]);

  const handleRemoveStudent = async (student) => {
    if (window.confirm(`Are you sure you want to remove ${student.name} from the class?`)) {
      try {
        // Get auth token for the API call
        const auth = getAuth();
        const token = await auth.currentUser?.getIdToken();
        
        if (token) {
          try {
            // Find and remove the enrollment from classStudents collection
            const response = await fetch(`/.netlify/functions/class-students?classId=${classData.id}&studentId=${student.id}`, {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });

            if (response.ok) {
              const enrollments = await response.json();
              const enrollment = enrollments.find(e => e.studentId === student.id && e.classId === classData.id);
              
              if (enrollment) {
                const deleteResponse = await fetch(`/.netlify/functions/class-students?id=${enrollment.id}`, {
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
          } catch (error) {
            console.warn('Could not remove class enrollment, but continuing with profile update:', error);
          }
        }
        
  const profileDocRef = doc(db, 'artifacts', appId, 'users', student.id, 'math_whiz_data', 'profile');
        
        // Remove classId from student profile
        await updateDoc(profileDocRef, {
          classId: null,
          updatedAt: new Date()
        });
        
        // Note: We don't need to manually update studentCount since TeacherDashboard will calculate it dynamically
      } catch (error) {
        console.error('Error removing student:', error);
        setError('Failed to remove student');
      }
    }
  };

  const handleEditClass = async (updatedData) => {
    try {
      await onUpdateClass(classData.id, updatedData);
      setShowEditForm(false);
      // Update local classData
      Object.assign(classData, updatedData);
    } catch (error) {
      console.error('Error updating class:', error);
      setError('Failed to update class');
    }
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    if (date.toDate) {
      return date.toDate().toLocaleDateString();
    }
    return new Date(date).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading class details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={onBack}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="h-5 w-5" />
                <span>Back to Dashboard</span>
              </button>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowEditForm(true)}
                className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-blue-700 bg-blue-100 rounded-md hover:bg-blue-200 transition-colors"
              >
                <Edit3 className="h-4 w-4" />
                <span>Edit Class</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-red-800">{error}</p>
            <button
              onClick={() => setError(null)}
              className="mt-2 text-sm text-red-600 hover:text-red-800"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Class Info */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
          <div className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">{classData.name}</h1>
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <div className="flex items-center space-x-1">
                    <BookOpen className="h-4 w-4" />
                    <span>{classData.subject}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Users className="h-4 w-4" />
                    <span>{students.length} students</span>
                  </div>
                  {classData.period && (
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-4 w-4" />
                      <span>{classData.period}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="text-right text-sm text-gray-500">
                <p>Grade Level: {classData.gradeLevel}</p>
                <p>Created: {formatDate(classData.createdAt)}</p>
              </div>
            </div>
            
            {classData.description && (
              <p className="text-gray-700">{classData.description}</p>
            )}
          </div>
        </div>

        {/* Students Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Students</h2>
                <p className="text-gray-600">Manage students enrolled in this class</p>
              </div>
              <button className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors">
                <Plus className="h-4 w-4" />
                <span>Add Student</span>
              </button>
            </div>

            {students.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No students enrolled</h3>
                <p className="text-gray-600 mb-4">Start by adding students to your class</p>
                <button className="inline-flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors">
                  <Plus className="h-4 w-4" />
                  <span>Add Your First Student</span>
                </button>
              </div>
            ) : (
              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Student
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Joined
                      </th>
                      
                      <th className="relative px-6 py-3">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {students.map((student) => (
                      <tr key={student.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                              <span className="text-sm font-medium text-blue-600">
                                {student.name ? student.name.charAt(0).toUpperCase() : 'S'}
                              </span>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {student.name || 'Student'}
                              </div>
                              <div className="text-sm text-gray-500">
                                ID: {student.id.slice(-6)} | Grade: {student.selectedGrade}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {student.email || 'No email'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(student.joinedAt)}
                        </td>
                        
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            {student.email && (
                              <button
                                className="text-green-600 hover:text-green-900"
                                title="Send Email"
                              >
                                <Mail className="h-4 w-4" />
                              </button>
                            )}
                            <button
                              onClick={() => handleRemoveStudent(student)}
                              className="text-red-600 hover:text-red-900"
                              title="Remove from Class"
                            >
                              <UserMinus className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Class Modal */}
      {showEditForm && (
        <EditClassForm
          classData={classData}
          onSubmit={handleEditClass}
          onCancel={() => setShowEditForm(false)}
        />
      )}
    </div>
  );
};

export default ClassDetail;
