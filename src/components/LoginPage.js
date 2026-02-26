import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { User, GraduationCap, LogIn, UserPlus } from 'lucide-react';

const LoginPage = () => {
  const [mode, setMode] = useState('signin');

  useEffect(() => {
    document.title = 'Sign In — Math Whiz';
    return () => {
      document.title = 'Math Whiz — Adaptive Math Practice for 3rd & 4th Graders';
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-4xl font-display font-bold text-gray-800 mb-2">
            Math Whiz
          </h2>
          <p className="text-sm text-gray-500">
            {mode === 'signin'
              ? 'Sign in to your account or continue as guest'
              : 'Create your account to get started'
            }
          </p>
        </div>

        {/* Card */}
        <div className="bg-white/80 backdrop-blur-md rounded-card shadow-card border border-white/60 p-6 animate-fade-in">
          {/* Mode Toggle */}
          <div className="flex bg-gray-100 rounded-full p-1 mb-6">
            <button
              onClick={() => setMode('signin')}
              className={`flex-1 py-2 px-4 text-sm font-bold rounded-full transition-all duration-300 flex items-center justify-center gap-2 ${
                mode === 'signin'
                  ? 'bg-white text-gray-800 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <LogIn size={16} /> Sign In
            </button>
            <button
              onClick={() => setMode('signup')}
              className={`flex-1 py-2 px-4 text-sm font-bold rounded-full transition-all duration-300 flex items-center justify-center gap-2 ${
                mode === 'signup'
                  ? 'bg-white text-gray-800 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <UserPlus size={16} /> Sign Up
            </button>
          </div>

          {mode === 'signin' ? (
            <div className="space-y-3">
              <p className="text-center text-sm font-medium text-gray-600 mb-4">Choose how to sign in</p>

              <Link
                to="/student-login"
                className="w-full flex items-center justify-center gap-3 px-6 py-3 text-base font-bold rounded-button text-white bg-brand-mint hover:opacity-90 active:scale-[0.98] transition-all duration-200 shadow-sm"
              >
                <User size={20} />
                Student Sign In
                <span className="text-xs opacity-75">(Guest or Account)</span>
              </Link>

              <Link
                to="/teacher-login"
                className="w-full flex items-center justify-center gap-3 px-6 py-3 text-base font-bold rounded-button text-white bg-brand-blue hover:opacity-90 active:scale-[0.98] transition-all duration-200 shadow-sm"
              >
                <GraduationCap size={20} />
                Teacher Sign In
              </Link>

              {/* Divider */}
              <div className="relative py-3">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-3 bg-white text-gray-400 font-medium">or</span>
                </div>
              </div>

              <Link
                to="/student-login?guest=true"
                className="w-full flex items-center justify-center px-6 py-3 border border-gray-200 text-base font-bold rounded-button text-gray-600 bg-white hover:bg-gray-50 active:scale-[0.98] transition-all duration-200"
              >
                Continue as Guest
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-center text-sm font-medium text-gray-600 mb-4">Create your account</p>

              <Link
                to="/student-login?mode=signup"
                className="w-full flex items-center justify-center gap-3 px-6 py-3 text-base font-bold rounded-button text-green-700 bg-green-50 border border-green-200 hover:bg-green-100 active:scale-[0.98] transition-all duration-200"
              >
                <User size={20} />
                Sign Up as Student
                <span className="text-xs text-green-500">(Free)</span>
              </Link>

              <Link
                to="/teacher-login?mode=signup"
                className="w-full flex items-center justify-center gap-3 px-6 py-3 text-base font-bold rounded-button text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 active:scale-[0.98] transition-all duration-200"
              >
                <GraduationCap size={20} />
                Sign Up as Teacher
                <span className="text-xs text-blue-500">(Classroom)</span>
              </Link>

              <p className="text-center text-xs text-gray-400 mt-4">
                Need admin access? Contact your system administrator.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-sm text-gray-500">
          <p>
            {mode === 'signin' ? "Don't have an account? " : "Already have an account? "}
            <button
              onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
              className="font-bold text-brand-blue hover:underline"
            >
              {mode === 'signin' ? 'Sign up here' : 'Sign in here'}
            </button>
          </p>
          <div className="flex justify-center gap-4 text-xs text-gray-400 mt-3">
            <Link to="/about" className="hover:text-gray-600 transition">About</Link>
            <span>·</span>
            <button className="hover:text-gray-600 transition">Help</button>
            <span>·</span>
            <button className="hover:text-gray-600 transition">Privacy</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
