import React, { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getAppId } from '../utils/common_utils';
import { LogIn, UserPlus } from 'lucide-react';

const JoinClass = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [code, setCode] = useState((params.get('code') || '').toUpperCase());
  const [status, setStatus] = useState('idle'); // idle | working | success | error
  const [error, setError] = useState('');
  const appId = getAppId();

  // A user must be logged in with a real account (not anonymous) to join a class
  const isAuthenticated = user && !user.isAnonymous;

  const redirectParam = encodeURIComponent(`/join?code=${code}`);

  const redeem = async () => {
    if (!isAuthenticated) return;
    setStatus('working');
    setError('');
    try {
      const token = await user.getIdToken();
      const res = await fetch('/.netlify/functions/join-class', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ action: 'redeem', code: code.trim(), appId }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 410) throw new Error('This code has expired. Ask your teacher for a new code.');
        throw new Error(data.error || 'Failed to join class');
      }
      setStatus('success');
      setTimeout(() => navigate('/'), 1200);
    } catch (e) {
      setError(e.message);
      setStatus('error');
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="w-10 h-10 border-4 border-blue-300 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="bg-white rounded-lg shadow p-6 w-full max-w-md">
        <h1 className="text-xl font-semibold mb-2">Join a Class</h1>
        <p className="text-sm text-gray-600 mb-4">Enter the class code provided by your teacher.</p>
        <input
          className="w-full border rounded px-3 py-2 mb-3"
          placeholder="Enter code"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
        />

        {isAuthenticated ? (
          <>
            <p className="text-sm text-gray-500 mb-3">
              Joining as <span className="font-medium text-gray-700">{user.email || user.displayName}</span>
            </p>
            <button
              onClick={redeem}
              disabled={!code || status === 'working'}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {status === 'working' ? 'Joining…' : 'Join Class'}
            </button>
          </>
        ) : (
          <div className="space-y-3">
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-md">
              <p className="text-sm text-amber-800 font-medium">Sign in required</p>
              <p className="text-xs text-amber-700 mt-1">
                You need to sign in with a student account to join a class. Guest accounts cannot join classes.
              </p>
            </div>
            <Link
              to={`/student-login?redirect=${redirectParam}`}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium"
            >
              <LogIn size={16} />
              Sign In to Join
            </Link>
            <Link
              to={`/student-login?mode=signup&redirect=${redirectParam}`}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 text-sm font-medium"
            >
              <UserPlus size={16} />
              Create Account &amp; Join
            </Link>
          </div>
        )}

        {status === 'success' && <p className="mt-3 text-green-700 text-sm">Joined! Redirecting…</p>}
        {status === 'error' && <p className="mt-3 text-red-700 text-sm">{error}</p>}
      </div>
    </div>
  );
};

export default JoinClass;
