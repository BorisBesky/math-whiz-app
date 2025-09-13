import React, { useState, useEffect, useCallback } from 'react';
import { getFirestore, collection, query, where, onSnapshot, addDoc, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { Users, Plus, Edit3, Trash2, BookOpen, LogOut, Home } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import ClassDetail from './ClassDetail';
import CreateClassForm from './CreateClassForm';

const TeacherDashboard = () => {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [error, setError] = useState(null);

  const { user, logout } = useAuth();
  const db = getFirestore();

  const loadClasses = useCallback((teacherId) => {
    const appId = 'default-app-id'; // Should match the app structure
    const classesRef = collection(db, 'artifacts', appId, 'classes');
    const q = query(classesRef, where('teacherId', '==', teacherId));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const classesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setClasses(classesData);
    }, (error) => {
      console.error('Error loading classes:', error);
      setError('Failed to load classes');
    });

    return unsubscribe;
  }, [db]);

  useEffect(() => {
    if (user) {
      loadClasses(user.uid);
    }
  }, [user, loadClasses]);

  const handleCreateClass = async (classData) => {
    try {
      const appId = 'default-app-id'; // Should match the app structure
      await addDoc(collection(db, 'artifacts', appId, 'classes'), {
        ...classData,
        teacherId: user.uid,
        teacherEmail: user.email,
        createdAt: new Date(),
        studentCount: 0
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
        const appId = 'default-app-id'; // Should match the app structure
        await deleteDoc(doc(db, 'artifacts', appId, 'classes', classId));
      } catch (error) {
        console.error('Error deleting class:', error);
        setError('Failed to delete class');
      }
    }
  };

  const handleEditClass = async (classId, updatedData) => {
    try {
      const appId = 'default-app-id'; // Should match the app structure
      await updateDoc(doc(db, 'artifacts', appId, 'classes', classId), updatedData);
    } catch (error) {
      console.error('Error updating class:', error);
      setError('Failed to update class');
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      setSelectedClass(null);
      setShowCreateForm(false);
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

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

  if (selectedClass) {
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
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Teacher Dashboard</h1>
                <p className="text-sm text-gray-600">Welcome back, {user?.email}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <a
                href="/"
                className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              >
                <Home className="h-4 w-4" />
                <span>Main App</span>
              </a>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-red-700 bg-red-100 rounded-md hover:bg-red-200 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
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

        {/* Classes Overview */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Your Classes</h2>
              <p className="text-gray-600">Manage your classes and students</p>
            </div>
            <button
              onClick={() => setShowCreateForm(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Create Class</span>
            </button>
          </div>

          {/* Classes Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                      <span>{classItem.studentCount || 0} students</span>
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
      </div>

      {/* Create Class Modal */}
      {showCreateForm && (
        <CreateClassForm
          onSubmit={handleCreateClass}
          onCancel={() => setShowCreateForm(false)}
        />
      )}
    </div>
  );
};

export default TeacherDashboard;
