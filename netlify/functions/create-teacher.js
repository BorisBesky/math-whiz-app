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

    // Step 2.5: Generate password reset link for first-time setup
    let resetLink;
    try {
      console.log(`Attempting to generate password reset link for ${email}...`);
      resetLink = await admin.auth().generatePasswordResetLink(email, {
        url: `${process.env.URL || 'http://localhost:3000'}/login`
      });
      console.log(`✅ Password reset link generated successfully for ${email}`);
      console.log(`Reset link length: ${resetLink.length} characters`);
    } catch (resetLinkError) {
      console.error("❌ Error generating password reset link:", resetLinkError.message);
      console.error("Full error:", resetLinkError);
      // Continue without reset link - admin can generate one later
      resetLink = null;
    }

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
        resetLink: resetLink,
        message: resetLink 
          ? "Teacher created successfully. Share the password reset link with the teacher."
          : "Teacher created successfully. Please generate a password reset link for the teacher.",
        instructions: resetLink 
          ? `Share this password reset link with ${email} to set up their account: ${resetLink}`
          : `Password reset link could not be generated automatically. Please use Firebase console to send password reset email to ${email}.`,
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