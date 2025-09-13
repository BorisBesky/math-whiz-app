import React from 'react';
import { getFirestore } from "firebase/firestore";
import { useAuth } from '../contexts/AuthContext';
import AdminPortal from './AdminPortal';

const AdminPage = () => {
  const { user, logout } = useAuth();
  const db = getFirestore();

  const handleClose = async () => {
    try {
      await logout();
      console.log("Admin user signed out.");
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading admin portal...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <AdminPortal 
        db={db} 
        appId={typeof window.__app_id !== "undefined" ? window.__app_id : "default-app-id"}
        currentUser={user}
        onClose={handleClose}
      />
    </div>
  );
};

export default AdminPage;
