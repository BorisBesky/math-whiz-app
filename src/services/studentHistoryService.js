import { getAuth } from 'firebase/auth';

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
