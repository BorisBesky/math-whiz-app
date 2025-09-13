const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// Initialize Firebase Admin
let app;
try {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY || '{}');
  app = initializeApp({
    credential: cert(serviceAccount),
    projectId: process.env.FIREBASE_PROJECT_ID
  });
} catch (error) {
  console.error('Firebase Admin initialization error:', error);
}

const db = getFirestore(app);

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
        return await handleGetClassStudents(queryStringParameters, headers);
      
      case 'POST':
        return await handleAddStudent(body, headers);
      
      case 'DELETE':
        return await handleRemoveStudent(queryStringParameters, headers);
      
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

async function handleGetClassStudents(params, headers) {
  try {
    const classId = params?.classId;
    if (!classId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Class ID is required' })
      };
    }

    const appId = process.env.APP_ID || 'default-app-id';
    const studentsRef = db.collection('artifacts').doc(appId).collection('classStudents');
    const query = studentsRef.where('classId', '==', classId);
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

async function handleAddStudent(studentData, headers) {
  try {
    const { classId, studentId, studentEmail, studentName } = studentData;

    if (!classId || !studentId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Class ID and Student ID are required' })
      };
    }

    const appId = process.env.APP_ID || 'default-app-id';
    
    // Check if student is already in the class
    const existingRef = db.collection('artifacts').doc(appId).collection('classStudents');
    const existingQuery = existingRef
      .where('classId', '==', classId)
      .where('studentId', '==', studentId);
    const existingSnapshot = await existingQuery.get();

    if (!existingSnapshot.empty) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Student is already in this class' })
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

    const docRef = await db.collection('artifacts').doc(appId).collection('classStudents').add(newEnrollment);

    // Update student count in class
    const classRef = db.collection('artifacts').doc(appId).collection('classes').doc(classId);
    await classRef.update({
      studentCount: db.FieldValue.increment(1)
    });

    return {
      statusCode: 201,
      headers,
      body: JSON.stringify({
        id: docRef.id,
        ...newEnrollment
      })
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

async function handleRemoveStudent(params, headers) {
  try {
    const enrollmentId = params?.id;
    if (!enrollmentId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Enrollment ID is required' })
      };
    }

    const appId = process.env.APP_ID || 'default-app-id';
    
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
    const classId = enrollmentData.classId;

    // Delete the enrollment
    await db.collection('artifacts').doc(appId).collection('classStudents').doc(enrollmentId).delete();

    // Update student count in class
    const classRef = db.collection('artifacts').doc(appId).collection('classes').doc(classId);
    await classRef.update({
      studentCount: db.FieldValue.increment(-1)
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
