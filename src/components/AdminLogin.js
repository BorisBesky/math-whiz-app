import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Shield, LogIn, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { USER_ROLES } from '../utils/userRoles';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { loginWithEmail } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/admin';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await loginWithEmail(email, password, USER_ROLES.ADMIN);
      navigate(from, { replace: true });
    } catch (error) {
      console.error('Admin login error:', error);
      setError(getErrorMessage(error.message));
    } finally {
      setLoading(false);
    }
  };

  const getErrorMessage = (errorMessage) => {
    if (errorMessage.includes('user-not-found')) {
      return 'No admin account found with this email address.';
    } else if (errorMessage.includes('wrong-password')) {
      return 'Incorrect password.';
    } else if (errorMessage.includes('invalid-email')) {
      return 'Invalid email address.';
    } else if (errorMessage.includes('email-already-in-use')) {
      return 'An account with this email already exists.';
    } else if (errorMessage.includes('weak-password')) {
      return 'Password is too weak. Please choose a stronger password.';
    } else if (errorMessage.includes('not registered as a admin')) {
      return 'This account is not registered as an administrator. Access denied.';
    } else {
      return errorMessage || 'An error occurred. Please try again.';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center">
            <Shield className="h-12 w-12 text-purple-600" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Administrator Login
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Access the admin portal
          </p>
          <p className="mt-1 text-xs text-gray-500">
            Admin accounts are managed by system administrators
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500 focus:z-10 sm:text-sm"
                placeholder="Enter your email"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500 focus:z-10 sm:text-sm"
                placeholder="Enter your password"
              />
            </div>
          </div>

          {error && (
            <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-md">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <span className="text-sm text-red-700">{error}</span>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <LogIn className="h-5 w-5 text-purple-500 group-hover:text-purple-400" />
                )}
              </span>
              {loading ? 'Please wait...' : 'Sign In'}
            </button>
          </div>

          <div className="text-center space-y-2">
            <p className="text-sm text-gray-600">Need a different account type?</p>
            <div className="flex justify-center space-x-4">
              <Link
                to="/student-login"
                className="text-sm text-green-600 hover:text-green-500"
              >
                Student Login
              </Link>
              <Link
                to="/teacher-login"
                className="text-sm text-indigo-600 hover:text-indigo-500"
              >
                Teacher Login
              </Link>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
