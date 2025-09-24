# Admin Account Management

## Overview

Admin accounts in Math Whiz App are managed exclusively through a secure server-side script for enhanced security. Regular users cannot create admin accounts through the web interface.

## How to Grant Admin Privileges

### Prerequisites

1. Ensure your `.env` file contains the required Firebase Admin SDK credentials:

   ```env
   FIREBASE_PROJECT_ID=your-project-id
   FIREBASE_CLIENT_EMAIL=your-service-account-email
   FIREBASE_PRIVATE_KEY=your-private-key
   ```

2. The user must already exist in Firebase Authentication. You can:
   - Have them create a teacher account first, or
   - Create the user manually in the Firebase Console

### Grant Admin Access

Run the following command from the project root:

```bash
node set-admin.js <user-email@domain.com>
```

**Example:**

```bash
node set-admin.js john.doe@school.edu
```

### Expected Output

- **Success:** `✅ Success! Custom claim { admin: true } has been set for user john.doe@school.edu (UID: xxxxx). They will have admin privileges on their next login.`
- **Already Admin:** `User john.doe@school.edu (UID: xxxxx) is already an admin.`
- **User Not Found:** `Error: User with email "john.doe@school.edu" not found in Firebase Authentication.`

## How Users Access Admin Features

1. **Admin Login:** Users with admin privileges can sign in at `/admin-login`
2. **Role-Based Access:** Once authenticated, they can access:
   - `/admin` - Admin dashboard
   - `/teacher` - Teacher portal (admins have teacher privileges too)
   - All student features

## Security Features

- ✅ **No Public Signup:** Admin accounts cannot be created through the web interface
- ✅ **Server-Side Management:** Admin privileges are granted server-side only
- ✅ **Role Verification:** System verifies admin status on each login
- ✅ **Access Control:** Protected routes check user roles before granting access

## Removing Admin Access

To remove admin privileges, you can use Firebase Admin SDK:

```javascript
// Remove admin claim
await admin.auth().setCustomUserClaims(uid, { admin: false });
```

Or create a separate script similar to `set-admin.js` for removing privileges.

## Troubleshooting

### Common Issues

1. **"User not found" error:**
   - Verify the email address is correct
   - Ensure the user exists in Firebase Authentication
   - Check if the user has verified their email

2. **Permission errors:**
   - Verify your `.env` file contains correct Firebase Admin SDK credentials
   - Ensure the service account has proper permissions

3. **User still can't access admin features:**
   - User needs to sign out and sign back in for new privileges to take effect
   - Check browser cache/cookies

### Environment Variables Setup

Your `.env` file should look like:

```env
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour-Private-Key-Here\n-----END PRIVATE KEY-----\n"
```

**Note:** The private key should include literal `\n` characters, not actual newlines.
