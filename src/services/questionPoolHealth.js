import { getAuth } from 'firebase/auth';

/**
 * Fetch per-(topic, subtopic) repeat-pressure flags for a class so the portal can warn a
 * teacher where the question pool is too small. Backed by the Admin-SDK function
 * netlify/functions/class-question-pool-health.js (teachers can't read student histories
 * client-side).
 *
 * @returns {Promise<{ flags: Array, studentsAnalyzed: number, totalAnswers: number,
 *                      gradeLevel: string|null, repeatThreshold: number }>}
 */
export const fetchClassQuestionPoolHealth = async ({ appId = 'default-app-id', classId, repeatThreshold } = {}) => {
  if (!classId) throw new Error('classId is required');

  const auth = getAuth();
  const token = await auth.currentUser?.getIdToken();
  if (!token) throw new Error('Authentication required.');

  const response = await fetch('/.netlify/functions/class-question-pool-health', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ appId, classId, ...(repeatThreshold != null ? { repeatThreshold } : {}) }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || `Request failed with status ${response.status}`);
  }

  return {
    flags: Array.isArray(data.flags) ? data.flags : [],
    studentsAnalyzed: data.studentsAnalyzed || 0,
    totalAnswers: data.totalAnswers || 0,
    gradeLevel: data.gradeLevel || null,
    repeatThreshold: data.repeatThreshold,
  };
};
