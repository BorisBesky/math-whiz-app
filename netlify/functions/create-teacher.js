const { admin, db } = require("./firebase-admin");

exports.handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }
  
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: "Method Not Allowed" }),
    };
  }

  if (admin.apps.length === 0) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Internal Server Error: Firebase Admin SDK not initialized." }),
    };
  }

  try {
    const { name, email, appId } = JSON.parse(event.body);
    
    // Validate required fields
    if (!name || !email || !appId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Missing required fields: name, email, and appId" }),
      };
    }

    // Verify the requester is an admin
    const authHeader = event.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: "Missing authorization token" }),
      };
    }

    const token = authHeader.split("Bearer ")[1];
    const decodedToken = await admin.auth().verifyIdToken(token);
    
    if (decodedToken.admin !== true) {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({ error: "Forbidden: Only admins can create teachers." }),
      };
    }

    console.log(`Creating teacher account for ${email}...`);

    // Step 1: Create Firebase Auth user without password
    let firebaseUser;
    try {
      firebaseUser = await admin.auth().createUser({
        email: email,
        displayName: name,
        emailVerified: false
      });
      console.log(`Firebase user created with UID: ${firebaseUser.uid}`);
    } catch (authError) {
      if (authError.code === 'auth/email-already-exists') {
        // Try to get existing user
        try {
          firebaseUser = await admin.auth().getUserByEmail(email);
          console.log(`Using existing Firebase user with UID: ${firebaseUser.uid}`);
        } catch (getUserError) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ 
              error: "Email already exists but user could not be retrieved",
              details: getUserError.message 
            }),
          };
        }
      } else {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ 
            error: "Failed to create Firebase user",
            details: authError.message 
          }),
        };
      }
    }

    // Step 2: Set admin custom claim for the teacher
    try {
      await admin.auth().setCustomUserClaims(firebaseUser.uid, { admin: true });
      console.log(`Admin claim set for user ${firebaseUser.uid}`);
    } catch (claimError) {
      console.error("Error setting admin claim:", claimError);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: "Failed to set admin claim",
          details: claimError.message 
        }),
      };
    }

    // Step 2.5: Prepare password reset instructions
    console.log(`Teacher account created for ${email} - password reset via login page`);
    
    const resetMessage = `Account created successfully! The teacher can now:
1. Go to the login page
2. Click "Forgot Password" 
3. Enter their email: ${email}
4. Check their email for password reset instructions
5. Set up their new password and login`;

    console.log(`✅ Teacher account setup instructions prepared for ${email}`);

    // Step 3: Create teacher profile in Firestore
    const teacherId = email.replace(/[@.]/g, '_');
    const teacherRef = db.doc(`artifacts/${appId}/teachers/${teacherId}`);
    
    const teacherData = {
      uid: firebaseUser.uid,
      name: name,
      email: email,
      classes: [],
      createdAt: new Date().toISOString(),
      role: 'teacher'
    };

    await teacherRef.set(teacherData);
    console.log(`Teacher profile created in Firestore for ${teacherId}`);

    // Step 4: Create user profile document
    const userProfileRef = db.doc(`artifacts/${appId}/users/${firebaseUser.uid}/profile/main`);
    const userProfileData = {
      name: name,
      displayName: name,
      email: email,
      role: 'teacher',
      needsPasswordReset: true,
      createdAt: new Date().toISOString()
    };

    await userProfileRef.set(userProfileData);
    console.log(`User profile created for ${firebaseUser.uid}`);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        teacher: {
          id: teacherId,
          uid: firebaseUser.uid,
          ...teacherData
        },
        resetMessage: resetMessage,
        message: "Teacher created successfully. Password setup via 'Forgot Password' on login page.",
        instructions: resetMessage,
        teacherEmail: email
      }),
    };

  } catch (error) {
    console.error("Error in create-teacher function:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: "Internal Server Error", 
        details: error.message 
      }),
    };
  }
};