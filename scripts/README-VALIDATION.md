# User Profile Validation Script

This script validates that all users have the required fields in their `math_whiz_data/profile` document and fills in missing fields with appropriate default values.

## Required Fields

The script ensures all users have these fields with proper defaults:

| Field | Default Value | Description |
|-------|---------------|-------------|
| `createdAt` | `new Date()` | Account creation timestamp |
| `displayName` | `userId` | Display name for UI |
| `email` | `""` (empty string) | User email address |
| `name` | `userId` | User name |
| `role` | `"student"` | User role (student/teacher/admin) |

## Usage

### 1. Preview Validation (Recommended First Step)

```bash
npm run validate:preview
```

This will analyze your database and show:
- How many users have missing fields
- Which specific fields are missing for each user
- How many users would be updated vs already valid
- Statistics for each required field

### 2. Execute Validation

```bash
npm run validate:execute
```

**⚠️ WARNING**: This will modify user profiles in your database! Missing fields will be added with default values.

### Direct Node.js Execution

You can also run the script directly:

```bash
# Dry run
node scripts/validate-user-profiles.js --dry-run

# Execute validation
node scripts/validate-user-profiles.js --execute
```

## What the Script Does

### For Users Without Profiles

If a user has no `math_whiz_data/profile` document:
1. Creates a new profile document
2. Adds all required fields with default values
3. Adds `updatedAt` and `validatedAt` timestamps

### For Users With Existing Profiles

If a user has an existing profile but is missing required fields:
1. Preserves all existing data
2. Adds only the missing required fields with defaults
3. Updates `updatedAt` and `validatedAt` timestamps

### Field Default Logic

- **`createdAt`**: Set to current timestamp
- **`displayName`**: Set to the user's ID (e.g., "user123")
- **`email`**: Set to empty string (can be updated later)
- **`name`**: Set to the user's ID (e.g., "user123")
- **`role`**: Set to "student" (can be changed to "teacher" or "admin" later)

## Example Output

### Dry Run
```
DRY RUN: Preview user profile validation for app: default-app-id
Required fields: createdAt, displayName, email, name, role
=====================================

user123: Missing fields [email, role] - WOULD UPDATE
user456: All fields present - OK
user789: No profile found - WOULD CREATE with all defaults

=====================================
DRY RUN SUMMARY
=====================================
Total users: 96
Already valid: 45
Would update: 38
Would create: 13

FIELD ANALYSIS:
  createdAt: 25/96 users missing this field
  displayName: 18/96 users missing this field
  email: 51/96 users missing this field
  name: 12/96 users missing this field
  role: 67/96 users missing this field
```

### Validation Execution
```
Validating user: user123
  📋 Found existing profile with 8 fields
    ✅ createdAt: present
    ✅ displayName: present
    ➕ email: missing, adding default ("")
    ✅ name: present
    ➕ role: missing, adding default ("student")
  ✅ Updated profile with 2 missing field(s)

=====================================
VALIDATION SUMMARY
=====================================
Total users processed: 96
Already valid: 45
Updated with missing fields: 51
Errors: 0

FIELD STATISTICS:
  createdAt:
    Present: 71/96 (74%)
    Missing/Added: 25
  displayName:
    Present: 78/96 (81%)
    Missing/Added: 18
  email:
    Present: 45/96 (47%)
    Missing/Added: 51
  name:
    Present: 84/96 (88%)
    Missing/Added: 12
  role:
    Present: 29/96 (30%)
    Missing/Added: 67

UPDATED USERS:
  - user123: updated (added: email, role)
  - user456: created (added: createdAt, displayName, email, name, role)
  ...

Validation completed successfully! 🎉
```

## Safety Features

- **Non-destructive**: Only adds missing fields, never modifies existing data
- **Idempotent**: Can be run multiple times safely
- **Dry run mode**: Preview changes before execution
- **Error handling**: Continues processing even if individual users fail
- **Detailed logging**: Shows exactly what changes are made

## Post-Validation

After running the validation:

1. **Verify Results**: Check a few user profiles in the Firebase console
2. **Test Application**: Ensure the app works correctly with the new fields
3. **Update Default Values**: If needed, you can modify the script and re-run to update defaults

## Integration with Application

This validation ensures that:
- All users have consistent profile structure
- Default values are properly set for new required fields
- The application can safely assume these fields exist
- Role-based access control has proper defaults

## Customizing Defaults

To modify default values, edit the `REQUIRED_FIELDS` object in the script:

```javascript
const REQUIRED_FIELDS = {
  createdAt: {
    default: () => new Date(),
    description: 'Account creation timestamp'
  },
  role: {
    default: () => "student", // Change this to modify default role
    description: 'User role (student/teacher/admin)'
  },
  // ... other fields
};
```

## Troubleshooting

### Common Issues

1. **"Firebase Admin initialization error"**
   - Run `npm run migrate:test-env` to check your environment
   - Ensure Firebase credentials are properly configured

2. **"No users found in the collection"**
   - Verify your `APP_ID` is correct
   - Check that users exist in the expected Firestore path

3. **Individual user errors**
   - Check the detailed error log in the validation summary
   - Users with errors can be fixed manually or the script re-run

The validation script ensures data consistency and provides a solid foundation for your user management system.