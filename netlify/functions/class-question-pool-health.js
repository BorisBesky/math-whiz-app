// Netlify Function: report per-(topic, subtopic) repeat pressure for a class, so the
// teacher portal can flag where the question pool is too small and prompt the teacher to
// generate (LLM) or import more questions.
//
// Reads every enrolled student's answered-question history (Admin SDK) — teachers cannot
// read that client-side — aggregates it, and runs the repeat-pressure analyzer.
const { admin, db } = require('./firebase-admin');
const { isTeacherOnClass } = require('./class-helpers');
const { analyzeRepeatPressure, DEFAULT_REPEAT_THRESHOLD } = require('./question-pool-health-utils');

const json = (status, body) => ({
  statusCode: status,
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  },
  body: JSON.stringify(body),
});

const parseBody = (event) => {
  try { return event.body ? JSON.parse(event.body) : {}; } catch { return {}; }
};

const requireAuth = async (event) => {
  const authHeader = event.headers.authorization || event.headers.Authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) throw new Error('Missing Authorization');
  return admin.auth().verifyIdToken(authHeader.slice('Bearer '.length));
};

// One student's answered history: prefer the attempts subcollection, fall back to the
// profile's answeredQuestions array (mirrors services/questionService.getQuestionHistory).
const readStudentHistory = async (artifact, studentId) => {
  const attemptsSnap = await artifact.collection('users').doc(studentId).collection('attempts').get();
  if (!attemptsSnap.empty) {
    return attemptsSnap.docs.map((d) => d.data() || {});
  }
  const profileSnap = await artifact.collection('users').doc(studentId)
    .collection('math_whiz_data').doc('profile').get();
  const answered = profileSnap.exists ? profileSnap.data().answeredQuestions : null;
  return Array.isArray(answered) ? answered : [];
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return json(204, {});
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method not allowed' });

  try {
    const user = await requireAuth(event);
    const body = parseBody(event);
    const appId = body.appId || process.env.APP_ID || 'default-app-id';
    const { classId } = body;
    const repeatThreshold = Number.isFinite(body.repeatThreshold) ? body.repeatThreshold : DEFAULT_REPEAT_THRESHOLD;

    if (!classId) return json(400, { error: 'Missing classId' });

    const artifact = db.collection('artifacts').doc(appId);
    const classSnap = await artifact.collection('classes').doc(classId).get();
    if (!classSnap.exists) return json(404, { error: 'Class not found' });

    // Authorize: platform admin, or a teacher on this class.
    if (user.admin !== true && !isTeacherOnClass(classSnap.data(), user.uid)) {
      return json(403, { error: 'Forbidden' });
    }

    const enrollmentSnap = await artifact.collection('classStudents').where('classId', '==', classId).get();
    const studentIds = [...new Set(enrollmentSnap.docs.map((d) => d.data().studentId).filter(Boolean))];

    const histories = await Promise.all(studentIds.map((sid) => readStudentHistory(artifact, sid)));
    const records = histories.flat();

    const { flags, totalAnswers } = analyzeRepeatPressure(records, { repeatThreshold });

    return json(200, {
      classId,
      gradeLevel: classSnap.data().gradeLevel || classSnap.data().grade || null,
      studentsAnalyzed: studentIds.length,
      totalAnswers,
      repeatThreshold,
      flags,
    });
  } catch (error) {
    const statusCode = error.message === 'Missing Authorization' ? 401 : 500;
    console.error('[class-question-pool-health] Error:', error);
    return json(statusCode, { error: statusCode === 401 ? error.message : 'Failed to analyze question pool.' });
  }
};
