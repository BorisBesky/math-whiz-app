// Use the shared Firebase Admin wrapper to standardize env handling
const { admin, db } = require('./firebase-admin');

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
  const appId = body.appId || queryStringParameters?.appId || process.env.APP_ID || 'default-app-id';

    // Extract authorization token
    const authHeader = event.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Unauthorized' })
      };
    }

    switch (httpMethod) {
      case 'GET':
        return await handleGetClassStudents(queryStringParameters, appId, headers);
      
      case 'POST':
        return await handleAddStudent(body, appId, headers);
      
      case 'DELETE':
        return await handleRemoveStudent(queryStringParameters, appId, headers);
      
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

async function handleGetClassStudents(params, appId, headers) {
  try {
    const classId = params?.classId;
    if (!classId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Class ID is required' })
      };
    }

    const studentsRef = db.collection('artifacts').doc(appId).collection('classStudents');
    let query = studentsRef.where('classId', '==', classId);
    if (params?.studentId) {
      query = query.where('studentId', '==', params.studentId);
    }
    const snapshot = await query.get();

    const students = [];
    snapshot.forEach(doc => {
      students.push({
        id: doc.id,
        ...doc.data()
      });
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(students)
    };
  } catch (error) {
    console.error('Error getting class students:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to get students' })
    };
  }
}

async function handleAddStudent(studentData, appId, headers) {
  try {
    const { classId, studentId, studentEmail, studentName } = studentData;

    if (!classId || !studentId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Class ID and Student ID are required' })
      };
    }

    // Check if student is already in the class
    const existingRef = db.collection('artifacts').doc(appId).collection('classStudents');
    const existingQuery = existingRef
      .where('classId', '==', classId)
      .where('studentId', '==', studentId);
    const existingSnapshot = await existingQuery.get();

    if (!existingSnapshot.empty) {
      console.log('[class-students] Duplicate enrollment detected', {
        appId,
        classId,
        studentId,
        count: existingSnapshot.size,
        docs: existingSnapshot.docs.map(d => ({ id: d.id, ...d.data() }))
      });
      const existing = existingSnapshot.docs[0];
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ id: existing.id, ...existing.data(), duplicate: true })
      };
    }

    const newEnrollment = {
      classId,
      studentId,
      studentEmail: studentEmail || '',
      studentName: studentName || '',
      joinedAt: new Date(),
      progress: 0
    };

    // Use deterministic doc ID to prevent duplicates: classId__studentId
    const enrollmentId = `${classId}__${studentId}`;
    const enrollmentRef = db.collection('artifacts').doc(appId).collection('classStudents').doc(enrollmentId);
    const enrollmentExisting = await enrollmentRef.get();
    if (enrollmentExisting.exists) {
      console.log('[class-students] Enrollment doc already exists with deterministic ID', { appId, classId, studentId, enrollmentId });
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ id: enrollmentId, ...enrollmentExisting.data(), duplicate: true })
      };
    }

    await enrollmentRef.set(newEnrollment, { merge: false });

    // Update student count in class
    const classRef = db.collection('artifacts').doc(appId).collection('classes').doc(classId);
    await classRef.update({
      studentCount: admin.firestore.FieldValue.increment(1)
    });

    return {
      statusCode: 201,
      headers,
      body: JSON.stringify({ id: enrollmentId, ...newEnrollment })
    };
  } catch (error) {
    console.error('Error adding student:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to add student' })
    };
  }
}

async function handleRemoveStudent(params, appId, headers) {
  try {
    const enrollmentId = params?.id;
    if (!enrollmentId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Enrollment ID is required' })
      };
    }

    // Get the enrollment data first
    const enrollmentDoc = await db.collection('artifacts').doc(appId).collection('classStudents').doc(enrollmentId).get();
    if (!enrollmentDoc.exists) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Student enrollment not found' })
      };
    }

    const enrollmentData = enrollmentDoc.data();
    const { classId, studentId } = enrollmentData;

    // Delete the enrollment
    await db.collection('artifacts').doc(appId).collection('classStudents').doc(enrollmentId).delete();

    // Update student's teacherIds array
    const classDoc = await db.collection('artifacts').doc(appId).collection('classes').doc(classId).get();
    if (classDoc.exists) {
      const teacherId = classDoc.data().teacherId;
      if (teacherId) {
        const enrollmentsCol = db.collection('artifacts').doc(appId).collection('classStudents');
        const otherEnrollments = await enrollmentsCol
          .where('studentId', '==', studentId)
          .get();

        let otherClassesWithSameTeacher = false;
        if (!otherEnrollments.empty) {
          const otherClassIds = otherEnrollments.docs.map(doc => doc.data().classId);
          if (otherClassIds.length > 0) {
            const otherClasses = await db.collection('artifacts').doc(appId).collection('classes')
              .where(admin.firestore.FieldPath.documentId(), 'in', otherClassIds)
              .where('teacherId', '==', teacherId)
              .get();
            if (!otherClasses.empty) {
              otherClassesWithSameTeacher = true;
            }
          }
        }

        if (!otherClassesWithSameTeacher) {
          const profileRef = db.collection('artifacts').doc(appId)
            .collection('users').doc(studentId)
            .collection('math_whiz_data').doc('profile');
          
          await profileRef.update({
            teacherIds: admin.firestore.FieldValue.arrayRemove(teacherId)
          });
        }
      }
    }

    // Update student count in class
    const classRef = db.collection('artifacts').doc(appId).collection('classes').doc(classId);
    await classRef.update({
      studentCount: admin.firestore.FieldValue.increment(-1)
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: 'Student removed successfully' })
    };
  } catch (error) {
    console.error('Error removing student:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to remove student' })
    };
  }
}
