import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { getAuth } from 'firebase/auth';

const JoinClass = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [code, setCode] = useState((params.get('code') || '').toUpperCase());
  const [status, setStatus] = useState('idle'); // idle | working | success | error
  const [error, setError] = useState('');
  const appId = typeof window.__app_id !== 'undefined' ? window.__app_id : 'default-app-id';

  const redeem = async () => {
    setStatus('working');
    setError('');
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) {
        navigate(`/login?redirect=${encodeURIComponent(`/join?code=${code}`)}`);
        return;
      }
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
      if (!res.ok) throw new Error(data.error || 'Failed to join class');
      setStatus('success');
      setTimeout(() => navigate('/teacher'), 1200);
    } catch (e) {
      setError(e.message);
      setStatus('error');
    }
  };

  useEffect(() => {
    // optionally auto-redeem when code present
  }, [code]);

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
        <button
          onClick={redeem}
          disabled={!code || status === 'working'}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          {status === 'working' ? 'Joining…' : 'Join Class'}
        </button>
        {status === 'success' && <p className="mt-3 text-green-700 text-sm">Joined! Redirecting…</p>}
        {status === 'error' && <p className="mt-3 text-red-700 text-sm">{error}</p>}
      </div>
    </div>
  );
};

export default JoinClass;
