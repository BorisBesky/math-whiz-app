# User Profile Migration Script

This script migrates user profile data from the legacy location to the standardized location in the Math Whiz app's Firestore database.

## Migration Path

**FROM:** `artifacts/${appId}/users/${userId}/profile/main`  
**TO:** `artifacts/${appId}/users/${userId}/math_whiz_data/profile`

## Features

- ✅ **Safe Migration**: Creates backups before deletion
- ✅ **Data Merging**: Preserves existing data in target location
- ✅ **Dry Run Mode**: Preview changes without modifying database
- ✅ **Detailed Logging**: Comprehensive progress and error reporting
- ✅ **Error Handling**: Continues processing even if individual users fail

## Prerequisites

1. **Environment Variables**: Ensure these are set in your `.env` file:
   ```bash
   FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}
   FIREBASE_PROJECT_ID=your-project-id
   APP_ID=default-app-id
   ```

2. **Firebase Admin Access**: The service account must have Firestore read/write permissions

## Usage

### 1. Preview Migration (Recommended First Step)

```bash
npm run migrate:preview
```

This will analyze your database and show:
- How many users would be migrated
- Which users have data in both locations (merge scenarios)
- Which users would be skipped (no source data)

### 2. Execute Migration

```bash
npm run migrate:execute
```

**⚠️ WARNING**: This will permanently modify your database! Backups are created, but ensure you have a full database backup first.

### Direct Node.js Execution

You can also run the script directly:

```bash
# Dry run
node scripts/migrate-user-profiles.js --dry-run

# Execute migration
node scripts/migrate-user-profiles.js --execute
```

## Migration Logic

### Data Merging Strategy

When a user has data in both locations:

1. **Existing data** in `math_whiz_data/profile` is preserved
2. **Source data** from `profile/main` is merged in
3. **Conflicts resolved** with `profile/main` taking precedence
4. **Migration metadata** is added (`migratedAt`, `migrationSource`)

### Backup Strategy

Before deleting the source data, the script:

1. Creates a backup document at `profile/main_backup_{timestamp}`
2. Includes original data + backup metadata
3. Only deletes source after successful backup creation

### Error Handling

- Individual user failures don't stop the migration
- Detailed error logging for troubleshooting
- Migration continues with remaining users

## Example Output

### Dry Run
```
DRY RUN: Preview migration for app: default-app-id
Migration direction: profile/main → math_whiz_data/profile
=====================================

user123:
  📄 profile/main: 8 fields
  📁 math_whiz_data/profile: does not exist
  🔄 Action: WOULD MIGRATE

user456:
  📄 profile/main: 6 fields
  📁 math_whiz_data/profile: 12 fields (would merge)
  🔄 Action: WOULD MIGRATE

=====================================
DRY RUN SUMMARY
=====================================
Total users: 25
Would migrate: 15
Would skip: 10
```

### Migration Execution
```
Processing user: user123
  ✅ Successfully migrated data to math_whiz_data/profile
  💾 Created backup at profile/main_backup_1642534567890
  🗑️  Deleted original profile/main document

=====================================
MIGRATION SUMMARY
=====================================
Total users processed: 25
Successfully migrated: 15
Skipped (no data): 10
Errors: 0

MIGRATED USERS:
  - user123: 8 fields
  - user456: 6 fields (merged with existing data)
  ...

Migration completed successfully! 🎉
```

## Post-Migration Steps

1. **Verify Migration**: Check a few users manually in the Firebase console
2. **Test Application**: Ensure the app still works correctly
3. **Clean Up Backups**: After verification, optionally delete backup documents
4. **Update Code**: Remove any references to the old `profile/main` path

## Rollback

If needed, you can rollback by:

1. Copying data from the backup documents back to `profile/main`
2. Optionally removing the `math_whiz_data/profile` documents
3. Running the script in reverse (would require modification)

## Safety Notes

- The script includes a 3-second delay before execution to allow cancellation
- Backups are created for all migrated profiles
- The script can be run multiple times safely (idempotent)
- Users without source data are safely skipped

## Troubleshooting

### Common Issues

1. **"Firebase Admin initialization error"**
   - Check your `FIREBASE_SERVICE_ACCOUNT_KEY` environment variable
   - Ensure the service account has proper permissions

2. **"No users found in the collection"**
   - Verify your `APP_ID` environment variable
   - Check that users exist in the expected Firestore path

3. **Individual user errors**
   - Check the detailed error log in the migration summary
   - Users with errors can be migrated manually or the script re-run

### Getting Help

Check the migration logs for specific error messages and verify:
- Environment variables are correctly set
- Firebase permissions are adequate
- Network connectivity to Firebase