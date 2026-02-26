import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { User, GraduationCap, LogIn, UserPlus } from 'lucide-react';

const LoginPage = () => {
  const [mode, setMode] = useState('signin'); // 'signin' or 'signup'

  useEffect(() => {
    document.title = 'Sign In — Math Whiz';
    return () => {
      document.title = 'Math Whiz — Adaptive Math Practice for 3rd & 4th Graders';
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-100 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Welcome to Math Whiz
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {mode === 'signin' 
              ? 'Sign in to your account or continue as guest'
              : 'Create your account to get started'
            }
          </p>
        </div>

        {/* Mode Toggle */}
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setMode('signin')}
            className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
              mode === 'signin'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <LogIn size={16} className="inline mr-2" />
            Sign In
          </button>
          <button
            onClick={() => setMode('signup')}
            className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
              mode === 'signup'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <UserPlus size={16} className="inline mr-2" />
            Sign Up
          </button>
        </div>

        <div className="space-y-4">
          {mode === 'signin' ? (
            <>
              {/* Sign In Options */}
              <div className="space-y-3">
                <h3 className="text-lg font-medium text-gray-900 text-center">Choose how to sign in</h3>
                
                {/* Student Sign In */}
                <Link
                  to="/student-login"
                  className="w-full flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-green-600 hover:bg-green-700 transition-colors"
                >
                  <User size={20} className="mr-3" />
                  Student Sign In
                  <span className="ml-2 text-green-200 text-sm">(Guest or Account)</span>
                </Link>

                {/* Teacher Sign In */}
                <Link
                  to="/teacher-login"
                  className="w-full flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                >
                  <GraduationCap size={20} className="mr-3" />
                  Teacher Sign In
                </Link>

              </div>
            </>
          ) : (
            <>
              {/* Sign Up Options */}
              <div className="space-y-3">
                <h3 className="text-lg font-medium text-gray-900 text-center">Create your account</h3>
                
                {/* Student Sign Up */}
                <Link
                  to="/student-login?mode=signup"
                  className="w-full flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-green-800 bg-green-100 hover:bg-green-200 transition-colors"
                >
                  <User size={20} className="mr-3" />
                  Sign Up as Student
                  <span className="ml-2 text-green-600 text-sm">(Free Account)</span>
                </Link>

                {/* Teacher Sign Up */}
                <Link
                  to="/teacher-login?mode=signup"
                  className="w-full flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-blue-800 bg-blue-100 hover:bg-blue-200 transition-colors"
                >
                  <GraduationCap size={20} className="mr-3" />
                  Sign Up as Teacher
                  <span className="ml-2 text-blue-600 text-sm">(Classroom Management)</span>
                </Link>

                <div className="text-center text-sm text-gray-500 mt-4">
                  <p>Need admin access? Admin accounts are managed by system administrators.</p>
                  <p className="text-xs text-gray-400 mt-1">Contact your system administrator for admin privileges.</p>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Quick Guest Access */}
        {mode === 'signin' && (
          <div className="text-center">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-gradient-to-br from-blue-50 to-purple-100 text-gray-500">
                  or
                </span>
              </div>
            </div>
            <Link
              to="/student-login?guest=true"
              className="mt-4 w-full flex items-center justify-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              Continue as Guest
            </Link>
          </div>
        )}

        {/* Footer Links */}
        <div className="text-center text-sm text-gray-600 space-y-2">
          <p>
            {mode === 'signin' ? "Don't have an account? " : "Already have an account? "}
            <button
              onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              {mode === 'signin' ? 'Sign up here' : 'Sign in here'}
            </button>
          </p>
          <div className="flex justify-center space-x-4 text-xs text-gray-500">
            <Link to="/about" className="hover:text-gray-700">About</Link>
            <span>•</span>
            <button className="hover:text-gray-700">Help</button>
            <span>•</span>
            <button className="hover:text-gray-700">Privacy</button>
            <span>•</span>
            <button className="hover:text-gray-700">Terms</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
