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
    const { httpMethod, path, body: requestBody, queryStringParameters } = event;
    const body = requestBody ? JSON.parse(requestBody) : {};

    // Extract authorization token
    const authHeader = event.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Unauthorized' })
      };
    }

    const token = authHeader.substring(7);
    // In a real implementation, you would verify the Firebase token here
    // For now, we'll skip token verification

    switch (httpMethod) {
      case 'GET':
        return await handleGetClasses(queryStringParameters, headers);
      
      case 'POST':
        return await handleCreateClass(body, headers);
      
      case 'PUT':
        return await handleUpdateClass(queryStringParameters, body, headers);
      
      case 'DELETE':
        return await handleDeleteClass(queryStringParameters, headers);
      
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

async function handleGetClasses(params, headers) {
  try {
    const teacherId = params?.teacherId;
    if (!teacherId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Teacher ID is required' })
      };
    }

    const appId = process.env.APP_ID || 'default-app-id';
    const classesRef = db.collection('artifacts').doc(appId).collection('classes');
    const query = classesRef.where('teacherId', '==', teacherId);
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

async function handleCreateClass(classData, headers) {
  try {
    const { teacherId, name, subject, gradeLevel, description, period } = classData;

    if (!teacherId || !name || !subject || !gradeLevel) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing required fields' })
      };
    }

    const newClass = {
      teacherId,
      name,
      subject,
      gradeLevel,
      description: description || '',
      period: period || '',
      createdAt: new Date(),
      updatedAt: new Date(),
      studentCount: 0
    };

    const appId = process.env.APP_ID || 'default-app-id';
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

async function handleUpdateClass(params, classData, headers) {
  try {
    const classId = params?.id;
    if (!classId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Class ID is required' })
      };
    }

    const updateData = {
      ...classData,
      updatedAt: new Date()
    };

    const appId = process.env.APP_ID || 'default-app-id';
    await db.collection('artifacts').doc(appId).collection('classes').doc(classId).update(updateData);

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

async function handleDeleteClass(params, headers) {
  try {
    const classId = params?.id;
    if (!classId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Class ID is required' })
      };
    }

    const appId = process.env.APP_ID || 'default-app-id';
    const classesCol = db.collection('artifacts').doc(appId).collection('classes');
    const enrollmentsCol = db.collection('artifacts').doc(appId).collection('classStudents');

    const classDoc = await classesCol.doc(classId).get();
    if (!classDoc.exists) {
      return { statusCode: 404, headers, body: JSON.stringify({ error: 'Class not found' }) };
    }
    const { teacherId } = classDoc.data();

    // Find all students in the class
    const studentsSnapshot = await enrollmentsCol.where('classId', '==', classId).get();
    const studentIds = studentsSnapshot.docs.map(doc => doc.data().studentId);

    const batch = db.batch();

    // Delete all enrollments for this class
    studentsSnapshot.forEach(doc => {
      batch.delete(doc.ref);
    });

    // For each student, check if they are in other classes with the same teacher
    for (const studentId of studentIds) {
      const otherEnrollments = await enrollmentsCol
        .where('studentId', '==', studentId)
        .where('classId', '!=', classId)
        .get();

      let otherClassesWithSameTeacher = false;
      if (!otherEnrollments.empty) {
        const otherClassIds = otherEnrollments.docs.map(doc => doc.data().classId);
        if (otherClassIds.length > 0) {
          const otherClasses = await classesCol
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
        batch.update(profileRef, {
          teacherIds: admin.firestore.FieldValue.arrayRemove(teacherId)
        });
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
