# Teacher Role Validation Script

This script validates that all teacher accounts in the Math Whiz App have the correct 'teacher' role claim in Firebase Auth. It scans user profiles in Firestore and ensures corresponding Firebase Auth custom claims are set properly.

## What it does

1. **Scans all user profiles**: Looks through `/artifacts/{app-id}/users/{userid}/math_whiz_data/profile` documents
2. **Identifies teachers**: Finds users where the `role` field is set to `'teacher'`
3. **Validates Auth claims**: Checks if each teacher has the `role: 'teacher'` custom claim in Firebase Auth
4. **Updates missing claims**: Sets the teacher role claim for users who are missing it

## Prerequisites

- Firebase Admin SDK credentials configured in `.env` file
- Proper permissions to read Firestore and modify Firebase Auth custom claims

## Usage

```bash
node scripts/validate-teacher-roles.js
```

## Environment Variables Required

Same as other scripts in this project:

### Option 1: Service Account JSON

```env
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}
APP_ID=default-app-id
```

### Option 2: Individual Fields

```env
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n
APP_ID=default-app-id
```

## Output

The script provides detailed logging showing:

- Total users scanned
- Teachers found in profiles
- Current Firebase Auth claims for each teacher
- Claims that were updated
- Any errors encountered

## Error Handling

Common issues the script handles:

- **Users without profiles**: Skips users who don't have `math_whiz_data/profile` documents
- **Orphaned data**: Reports users who exist in Firestore but not in Firebase Auth
- **Permission errors**: Reports if the service account lacks proper permissions
- **Invalid credentials**: Validates environment configuration before running

## Safety Features

- **Read-first approach**: Always checks existing claims before making changes
- **Idempotent**: Safe to run multiple times - won't overwrite correct claims
- **Detailed logging**: Shows exactly what changes are made
- **Error isolation**: Continues processing other users if one fails

## Example Output

```text
🚀 Starting teacher role validation...
Using APP_ID: default-app-id
✅ Firebase Admin initialized successfully

👨‍🏫 Scanning all user profiles for teachers...
📊 Found 150 user documents to scan.

[1/150] Checking user: user123
   - 👤 User role: student

[2/150] Checking user: teacher456
   - ✅ Found teacher profile: jane.doe@school.edu

...

📈 Profile scan complete:
   - Total users scanned: 150
   - Teachers found: 12

🔍 Validating Firebase Auth claims for teachers...

[1/12] Validating claims for teacher: teacher456
   - Current claims: { role: 'teacher' }
   - ✅ Teacher claim already set correctly

[2/12] Validating claims for teacher: teacher789
   - Current claims: {}
   - 🔄 Setting teacher claim...
   - ✅ Teacher claim set successfully

...

🎉 Teacher role validation complete!
📊 Summary:
   - Total teachers found: 12
   - Claims already set correctly: 8
   - Claims updated: 4
   - Errors encountered: 0
```