import React, { useState, useEffect } from 'react';
import { getAuth, signOut, onAuthStateChanged } from "firebase/auth";
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import AdminLogin from './AdminLogin';
import AdminPortal from './AdminPortal';

// Firebase configuration - same as in App.js
let firebaseConfig = {};

try {
  if (process.env.REACT_APP_FIREBASE_API_KEY) {
    firebaseConfig = {
      apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
      authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
      storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.REACT_APP_FIREBASE_APP_ID,
    };
  } else {
    console.error("Firebase configuration not found in environment variables");
  }
} catch (error) {
  console.error("Error reading Firebase configuration:", error);
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

const AdminPage = () => {
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const idTokenResult = await firebaseUser.getIdTokenResult();
          if (idTokenResult.claims.admin === true) {
            setIsAdminAuthenticated(true);
            setUser(firebaseUser);
          } else {
            setIsAdminAuthenticated(false);
            setUser(null);
          }
        } catch (error) {
          console.error('Error checking admin claims:', error);
          setIsAdminAuthenticated(false);
          setUser(null);
        }
      } else {
        setIsAdminAuthenticated(false);
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLoginSuccess = () => {
    setIsAdminAuthenticated(true);
  };

  const handleClose = async () => {
    try {
      await signOut(auth);
      console.log("Admin user signed out.");
      // The onAuthStateChanged listener will automatically set isAdminAuthenticated to false
      // and show the login screen again
    } catch (error) {
      console.error('Error signing out:', error);
      // Force logout state even if sign out fails
      setIsAdminAuthenticated(false);
      setUser(null);
    }
  };

  if (loading) {
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
      {!isAdminAuthenticated ? (
        <div className="min-h-screen flex items-center justify-center p-4">
          <AdminLogin onLoginSuccess={handleLoginSuccess} />
        </div>
      ) : (
        <AdminPortal 
          db={db} 
          appId={typeof window.__app_id !== "undefined" ? window.__app_id : "default-app-id"}
          currentUser={user}
          onClose={handleClose}
        />
      )}
    </div>
  );
};

export default AdminPage;
