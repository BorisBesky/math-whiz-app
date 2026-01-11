const { admin, db } = require("./firebase-admin");

// Delete teacher function
exports.handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "DELETE, OPTIONS",
  };

  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers,
      body: "",
    };
  }

  if (event.httpMethod !== "DELETE") {
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
      body: JSON.stringify({
        error: "Internal Server Error: Firebase Admin SDK not initialized.",
      }),
    };
  }

  try {
    const { teacherId, teacherUid, appId } = JSON.parse(event.body);

    // Validate required fields with detailed error messages
    const missingFields = [];
    if (!teacherId) missingFields.push("teacherId");
    if (!teacherUid) missingFields.push("teacherUid");
    if (!appId) missingFields.push("appId");

    if (missingFields.length > 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: `Missing required fields: ${missingFields.join(", ")}`,
          received: { teacherId, teacherUid, appId },
        }),
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
        body: JSON.stringify({
          error: "Forbidden: Only admins can delete teachers.",
        }),
      };
    }

    // Ensure the requester is not trying to delete themselves
    if (decodedToken.uid === teacherUid) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Cannot delete your own account." }),
      };
    }

    console.log(`Deleting teacher account: ${teacherId} (UID: ${teacherUid})`);

    // Step 1: Check if teacher has any assigned classes
    const classesRef = db.collection(`artifacts/${appId}/classes`);
    const teacherClassesQuery = classesRef.where("teacherId", "==", teacherUid);
    const teacherClassesSnapshot = await teacherClassesQuery.get();

    if (!teacherClassesSnapshot.empty) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error:
            "Cannot delete teacher with assigned classes. Please reassign or delete classes first.",
          assignedClasses: teacherClassesSnapshot.size,
        }),
      };
    }

    // Step 2: Delete teacher profile from Firestore
    const teacherRef = db.doc(
      `artifacts/${appId}/users/${teacherId}/math_whiz_data/profile`
    );
    const teacherDoc = await teacherRef.get();

    if (!teacherDoc.exists) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: "Teacher profile not found" }),
      };
    }

    await teacherRef.delete();

    // Delete the parent user document to clean up
    const userRef = db.doc(`artifacts/${appId}/users/${teacherId}`);
    await userRef.delete();

    console.log(`Teacher profile deleted from Firestore: ${teacherId}`);

    // Step 3: Remove admin custom claims from Firebase Auth user
    try {
      await admin.auth().setCustomUserClaims(teacherUid, { admin: null });
      console.log(`Admin claim removed for user ${teacherUid}`);
    } catch (error) {
      console.error(`Error removing admin claim for ${teacherUid}:`, error);
      // Continue with deletion even if claim removal fails
    }

    // Step 4: Delete Firebase Auth user
    // Note: This is optional - you might want to keep the auth user but remove claims/profile
    try {
      await admin.auth().deleteUser(teacherUid);
      console.log(`Firebase Auth user deleted: ${teacherUid}`);
    } catch (authDeleteError) {
      console.error("Error deleting Firebase Auth user:", authDeleteError);
      // Return success even if auth user deletion fails, as the important parts are done
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: "Teacher account deleted successfully",
        deletedTeacherId: teacherId,
        deletedTeacherUid: teacherUid,
      }),
    };
  } catch (error) {
    console.error("Error in delete-teacher function:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: "Internal Server Error",
        details: error.message,
      }),
    };
  }
};
