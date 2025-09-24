import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Shield, Lock, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { USER_ROLES } from '../utils/userRoles';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { loginWithEmail, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/admin';

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');
    try {
      await loginWithGoogle(USER_ROLES.ADMIN);
      navigate(from, { replace: true });
    } catch (error) {
      console.error('Admin Google sign-in error:', error);
      if (error.code === 'auth/popup-closed-by-user') {
        setError('Google sign-in was cancelled.');
      } else {
        setError(getErrorMessage(error.message));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await loginWithEmail(email, password, USER_ROLES.ADMIN);
      navigate(from, { replace: true });
    } catch (error) {
      console.error('Admin login error:', error); // Log the full error for debugging
      setError(getErrorMessage(error.message));
    }
    setLoading(false);
  };

  const getErrorMessage = (errorMessage) => {
    if (errorMessage.includes('user-not-found') || errorMessage.includes('invalid-email')) {
      return 'Invalid email or password.';
    } else if (errorMessage.includes('wrong-password')) {
      return 'Invalid email or password.';
    } else if (errorMessage.includes('operation-not-allowed')) {
      return 'Error: Email/Password sign-in is not enabled.';
    } else if (errorMessage.includes('network-request-failed')) {
      return 'Network error: Please check your internet connection.';
    } else if (errorMessage.includes('not registered as a admin')) {
      return 'This account is not registered as an administrator. Access denied.';
    } else {
      return errorMessage || 'An unexpected error occurred. Please try again.';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-md">
        <div className="p-6">
          <div className="text-center mb-6">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Shield className="w-8 h-8 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Admin Sign In</h2>
            <p className="text-gray-600 mt-2">Use your admin credentials to continue.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Admin Email
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="admin@example.com"
                required
                autoComplete="email"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Admin Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter admin password"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="flex items-center">
                  <Lock className="w-5 h-5 text-red-400 mr-2" />
                  <span className="text-red-700 text-sm">{error}</span>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !password || !email}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading && !password ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Authenticating...
                </div>
              ) : (
                'Sign In as Admin'
              )}
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or sign in with</span>
            </div>
          </div>

          <div>
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full flex justify-center items-center py-2 px-4 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              <svg className="w-5 h-5 mr-2" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
                <path fill="currentColor" d="M488 261.8C488 403.3 381.5 512 244 512 111.8 512 0 399.5 0 256S111.8 0 244 0c69.8 0 133 28.2 178.5 74.4l-68.8 68.8C324.5 112.6 287.3 96 244 96c-88.6 0-160.1 71.8-160.1 160.1s71.5 160.1 160.1 160.1c97.3 0 131.3-72.8 136.8-109.9H244v-85.7h244c2.6 14.7 4.2 30.1 4.2 46.4z"></path>
              </svg>
              Sign in with Google
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
