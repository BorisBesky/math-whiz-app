import { getAuth } from 'firebase/auth';

export const mergeStudentHistory = (...historyGroups) => {
  const attemptsByKey = new Map();

  historyGroups.forEach((history) => {
    if (!Array.isArray(history)) return;
    history.forEach((attempt, index) => {
      if (!attempt) return;
      const key = attempt.id || [
        attempt.timestamp || attempt.date || '',
        attempt.question || '',
        attempt.userAnswer ?? '',
        index,
      ].join('|');
      attemptsByKey.set(key, attempt);
    });
  });

  return [...attemptsByKey.values()].sort((a, b) =>
    String(a.timestamp || a.date || '').localeCompare(String(b.timestamp || b.date || ''))
  );
};

export const fetchStudentHistory = async ({
  appId = 'default-app-id',
  studentId,
  classId = '',
  startDate,
  endDate,
}) => {
  const auth = getAuth();
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('No authenticated user found');
  }
  if (!studentId) {
    throw new Error('studentId is required');
  }

  const token = await currentUser.getIdToken();
  const response = await fetch('/.netlify/functions/get-student-history', {
    method: 'POST',
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      appId,
      studentId,
      classId,
      startDate,
      endDate,
    }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || `Request failed with status ${response.status}`);
  }

  return Array.isArray(data.answeredQuestions) ? data.answeredQuestions : [];
};
