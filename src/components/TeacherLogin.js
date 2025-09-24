import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useSearchParams, Link } from 'react-router-dom';
import { BookOpen, LogIn, UserPlus, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { USER_ROLES } from '../utils/userRoles';

const TeacherLogin = () => {
  const [searchParams] = useSearchParams();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);

  const { loginWithEmail, registerWithEmail, loginWithGoogle, resetPassword } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/teacher';

  // Check URL parameters for mode
  useEffect(() => {
    const mode = searchParams.get('mode');
    if (mode === 'signup') {
      setIsSignUp(true);
    }
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (isSignUp && password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      if (isSignUp) {
        await registerWithEmail(email, password, USER_ROLES.TEACHER, {
          displayName: email.split('@')[0] // Use email prefix as display name
        });
      } else {
        await loginWithEmail(email, password, USER_ROLES.TEACHER);
      }
      navigate(from, { replace: true });
    } catch (error) {
      console.error('Authentication error:', error);
      setError(getErrorMessage(error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');
    try {
      await loginWithGoogle(USER_ROLES.TEACHER);
      navigate(from, { replace: true });
    } catch (error) {
      console.error('Google sign-in error:', error);
      setError(getErrorMessage(error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your email address first');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      await resetPassword(email);
      setResetEmailSent(true);
      setShowForgotPassword(false);
    } catch (error) {
      console.error('Password reset error:', error);
      setError(getErrorMessage(error.message));
    } finally {
      setLoading(false);
    }
  };

  const getErrorMessage = (errorMessage) => {
    if (errorMessage.includes('user-not-found')) {
      return 'No teacher account found with this email address.';
    } else if (errorMessage.includes('wrong-password')) {
      return 'Incorrect password.';
    } else if (errorMessage.includes('invalid-email')) {
      return 'Invalid email address.';
    } else if (errorMessage.includes('email-already-in-use')) {
      return 'An account with this email already exists.';
    } else if (errorMessage.includes('weak-password')) {
      return 'Password is too weak. Please choose a stronger password.';
    } else if (errorMessage.includes('not registered as a teacher')) {
      return 'This account is not registered as a teacher. Please contact your administrator.';
    } else {
      return errorMessage || 'An error occurred. Please try again.';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center">
            <BookOpen className="h-12 w-12 text-blue-600" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            {isSignUp ? 'Create Teacher Account' : 'Teacher Login'}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {isSignUp 
              ? 'Sign up to create and manage your classes'
              : 'Access your teacher dashboard'
            }
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
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
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
                autoComplete={isSignUp ? "new-password" : "current-password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Enter your password"
              />
              {!isSignUp && (
                <div className="flex justify-end mt-2">
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(true)}
                    className="text-sm text-blue-600 hover:text-blue-500"
                  >
                    Forgot your password?
                  </button>
                </div>
              )}
            </div>

            {isSignUp && (
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Confirm your password"
                />
              </div>
            )}
          </div>

          {error && (
            <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-md">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <span className="text-sm text-red-700">{error}</span>
            </div>
          )}

          {resetEmailSent && (
            <div className="flex items-center space-x-2 p-3 bg-green-50 border border-green-200 rounded-md">
              <div className="h-5 w-5 text-green-500">✓</div>
              <span className="text-sm text-green-700">
                Password reset email sent! Check your inbox and follow the instructions to reset your password.
              </span>
            </div>
          )}

          {showForgotPassword && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
              <h3 className="text-sm font-medium text-blue-900 mb-2">Reset Password</h3>
              <p className="text-sm text-blue-700 mb-3">
                Enter your email address and we'll send you a link to reset your password.
              </p>
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  disabled={loading || !email}
                  className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Sending...' : 'Send Reset Email'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotPassword(false);
                    setError('');
                  }}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : isSignUp ? (
                  <UserPlus className="h-5 w-5 text-blue-500 group-hover:text-blue-400" />
                ) : (
                  <LogIn className="h-5 w-5 text-blue-500 group-hover:text-blue-400" />
                )}
              </span>
              {loading ? 'Please wait...' : (isSignUp ? 'Create Account' : 'Sign In')}
            </button>
          </div>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center" aria-hidden="true">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">Or</span>
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
            {isSignUp ? 'Sign up with Google' : 'Sign in with Google'}
          </button>
        </div>

        <div className="text-center">
          <p className="text-sm text-gray-600">
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError('');
                setEmail('');
                setPassword('');
                setConfirmPassword('');
              }}
              className="text-blue-600 hover:text-blue-500"
            >
              {isSignUp ? 'Sign in' : 'Sign up'}
            </button>
          </p>
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
              to="/admin-login"
              className="text-sm text-purple-600 hover:text-purple-500"
            >
              Admin Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherLogin;
