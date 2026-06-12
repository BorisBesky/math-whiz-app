const { admin, db } = require('./firebase-admin');
const { getTeacherIds, isTeacherOnClass, reconcileEnrolledStudentTeachers } = require('./class-helpers');

const resolveAppId = (queryStringParameters, body) => (
  body.appId || queryStringParameters?.appId || process.env.APP_ID || 'default-app-id'
);

exports.handler = async (event, context) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const { httpMethod, body: requestBody, queryStringParameters } = event;
    const body = requestBody ? JSON.parse(requestBody) : {};

    // Verify the caller's Firebase ID token. Every operation below is gated on the
    // resulting identity — without this the endpoint would let any caller create,
    // edit (including reassigning teacherIds), or delete arbitrary classes.
    const authHeader = event.headers.authorization || event.headers.Authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { statusCode: 401, headers, body: JSON.stringify({ error: 'Unauthorized' }) };
    }

    let user;
    try {
      user = await admin.auth().verifyIdToken(authHeader.substring('Bearer '.length));
    } catch (authError) {
      console.error('classes: token verification failed', authError);
      return { statusCode: 401, headers, body: JSON.stringify({ error: 'Invalid or expired token' }) };
    }
    const isAdmin = user.admin === true;
    const appId = resolveAppId(queryStringParameters, body);

    switch (httpMethod) {
      case 'GET':
        return await handleGetClasses(queryStringParameters, headers, { user, isAdmin, appId });

      case 'POST':
        return await handleCreateClass(body, headers, { user, isAdmin, appId });

      case 'PUT':
        return await handleUpdateClass(queryStringParameters, body, headers, { user, isAdmin, appId });

      case 'DELETE':
        return await handleDeleteClass(queryStringParameters, headers, { user, isAdmin, appId });

      default:
        return {
          statusCode: 405,
          headers,
          body: JSON.stringify({ error: 'Method not allowed' })
        };
    }
  } catch (error) {
    console.error('Function error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};

async function handleGetClasses(params, headers, { user, isAdmin, appId }) {
  try {
    const teacherId = params?.teacherId;
    if (!teacherId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Teacher ID is required' })
      };
    }

    // A teacher may only list their own classes; admins may list any teacher's.
    if (!isAdmin && teacherId !== user.uid) {
      return { statusCode: 403, headers, body: JSON.stringify({ error: 'Forbidden' }) };
    }

    const classesRef = db.collection('artifacts').doc(appId).collection('classes');
    const query = classesRef.where('teacherIds', 'array-contains', teacherId);
    const snapshot = await query.get();

    const classes = [];
    snapshot.forEach(doc => {
      classes.push({
        id: doc.id,
        ...doc.data()
      });
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(classes)
    };
  } catch (error) {
    console.error('Error getting classes:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to get classes' })
    };
  }
}

async function handleCreateClass(classData, headers, { user, isAdmin, appId }) {
  try {
    const { teacherId, teacherIds: inputTeacherIds, name, subject, gradeLevel, description, period } = classData;
    const resolvedTeacherIds = Array.isArray(inputTeacherIds) && inputTeacherIds.length > 0
      ? inputTeacherIds
      : (teacherId ? [teacherId] : []);

    if (!resolvedTeacherIds.length || !name || !subject || !gradeLevel) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing required fields' })
      };
    }

    // A non-admin may only create a class they themselves teach (no creating classes for,
    // or assigning, other teachers). Admins may assign any teacher set.
    if (!isAdmin && !resolvedTeacherIds.includes(user.uid)) {
      return { statusCode: 403, headers, body: JSON.stringify({ error: 'Forbidden' }) };
    }

    const newClass = {
      teacherIds: resolvedTeacherIds,
      // Ownership is the verified caller for non-admins; admins may attribute creation.
      createdBy: isAdmin ? (classData.createdBy || resolvedTeacherIds[0]) : user.uid,
      teacherId: resolvedTeacherIds[0], // backward compat
      name,
      subject,
      gradeLevel,
      description: description || '',
      period: period || '',
      createdAt: new Date(),
      updatedAt: new Date(),
      studentCount: 0
    };

    const docRef = await db.collection('artifacts').doc(appId).collection('classes').add(newClass);

    return {
      statusCode: 201,
      headers,
      body: JSON.stringify({
        id: docRef.id,
        ...newClass
      })
    };
  } catch (error) {
    console.error('Error creating class:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to create class' })
    };
  }
}

// Only these fields may be set through the generic update path. Spreading the raw body
// would let a caller clobber server-managed fields (studentCount, createdBy, joinCode…).
const UPDATABLE_CLASS_FIELDS = ['name', 'subject', 'gradeLevel', 'description', 'period'];

async function handleUpdateClass(params, classData, headers, { user, isAdmin, appId }) {
  try {
    const classId = params?.id;
    if (!classId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Class ID is required' })
      };
    }

    const classRef = db.collection('artifacts').doc(appId).collection('classes').doc(classId);
    const classSnap = await classRef.get();
    if (!classSnap.exists) {
      return { statusCode: 404, headers, body: JSON.stringify({ error: 'Class not found' }) };
    }

    // Authorize: admin, or a teacher already on this class.
    if (!isAdmin && !isTeacherOnClass(classSnap.data(), user.uid)) {
      return { statusCode: 403, headers, body: JSON.stringify({ error: 'Forbidden' }) };
    }

    const updateData = { updatedAt: new Date() };
    for (const field of UPDATABLE_CLASS_FIELDS) {
      if (classData[field] !== undefined) updateData[field] = classData[field];
    }

    // Teacher-membership changes must propagate to enrolled students' profile.teacherIds
    // (the read-authorization key). Compute the diff and reconcile, rather than writing
    // teacherIds blindly and leaving students unreadable by a newly-assigned teacher.
    const membershipProvided = classData.teacherIds !== undefined || classData.teacherId !== undefined;
    let added = [];
    let removed = [];
    if (membershipProvided) {
      const oldTeacherIds = getTeacherIds(classSnap.data());
      const newTeacherIds = getTeacherIds({ teacherIds: classData.teacherIds, teacherId: classData.teacherId });
      if (newTeacherIds.length === 0) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'A class must have at least one teacher' }) };
      }
      added = newTeacherIds.filter((tid) => !oldTeacherIds.includes(tid));
      removed = oldTeacherIds.filter((tid) => !newTeacherIds.includes(tid));
      updateData.teacherIds = newTeacherIds;
      updateData.teacherId = newTeacherIds[0]; // backward compat
    }

    await classRef.update(updateData);

    if (added.length > 0 || removed.length > 0) {
      await reconcileEnrolledStudentTeachers({ db, admin, appId, classId, added, removed });
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: 'Class updated successfully' })
    };
  } catch (error) {
    console.error('Error updating class:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to update class' })
    };
  }
}

async function handleDeleteClass(params, headers, { user, isAdmin, appId }) {
  try {
    const classId = params?.id;
    if (!classId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Class ID is required' })
      };
    }

    const classesCol = db.collection('artifacts').doc(appId).collection('classes');
    const enrollmentsCol = db.collection('artifacts').doc(appId).collection('classStudents');

    const classDoc = await classesCol.doc(classId).get();
    if (!classDoc.exists) {
      return { statusCode: 404, headers, body: JSON.stringify({ error: 'Class not found' }) };
    }

    // Authorize: admin, or a teacher already on this class.
    if (!isAdmin && !isTeacherOnClass(classDoc.data(), user.uid)) {
      return { statusCode: 403, headers, body: JSON.stringify({ error: 'Forbidden' }) };
    }

    const classTeachers = getTeacherIds(classDoc.data());

    // Find all students in the class
    const studentsSnapshot = await enrollmentsCol.where('classId', '==', classId).get();
    const studentIds = studentsSnapshot.docs.map(doc => doc.data().studentId);

    const batch = db.batch();

    // Delete all enrollments for this class
    studentsSnapshot.forEach(doc => {
      batch.delete(doc.ref);
    });

    // Batch-fetch all other enrollments for affected students (instead of per-student queries)
    if (studentIds.length > 0) {
      const allOtherEnrollments = [];
      for (let i = 0; i < studentIds.length; i += 30) {
        const chunk = studentIds.slice(i, i + 30);
        const snap = await enrollmentsCol.where('studentId', 'in', chunk).get();
        snap.forEach(d => {
          const data = d.data();
          if (data.classId !== classId) {
            allOtherEnrollments.push(data);
          }
        });
      }

      // Batch-fetch all other class docs to get their teacher lists
      const otherClassIds = [...new Set(allOtherEnrollments.map(e => e.classId))];
      const otherClassTeacherMap = new Map();
      for (let i = 0; i < otherClassIds.length; i += 30) {
        const chunk = otherClassIds.slice(i, i + 30);
        const snap = await classesCol
          .where(admin.firestore.FieldPath.documentId(), 'in', chunk)
          .get();
        snap.forEach(d => {
          otherClassTeacherMap.set(d.id, getTeacherIds(d.data()));
        });
      }

      // For each student, determine which teachers to remove
      for (const studentId of studentIds) {
        const retainedTeachers = new Set();
        allOtherEnrollments
          .filter(e => e.studentId === studentId)
          .forEach(e => {
            (otherClassTeacherMap.get(e.classId) || []).forEach(tid => retainedTeachers.add(tid));
          });

        const teachersToRemove = classTeachers.filter(tid => !retainedTeachers.has(tid));
        if (teachersToRemove.length > 0) {
          const profileRef = db.collection('artifacts').doc(appId)
            .collection('users').doc(studentId)
            .collection('math_whiz_data').doc('profile');
          batch.update(profileRef, {
            teacherIds: admin.firestore.FieldValue.arrayRemove(...teachersToRemove)
          });
        }
      }
    }

    // Delete the class
    batch.delete(classesCol.doc(classId));
    await batch.commit();

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: 'Class deleted successfully' })
    };
  } catch (error) {
    console.error('Error deleting class:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to delete class' })
    };
  }
}
