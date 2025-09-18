# Deletion Utility: Remove Users Without math_whiz_data

This utility deletes Firestore user documents under `artifacts/${APP_ID}/users` that do NOT have a `math_whiz_data` subcollection (e.g., no `profile` document).

## Safety Features

- Dry run mode to preview deletions
- 3-second confirmation delay before execution
- Optional recursive delete of subcollections (enabled by default)
- Detailed logging and error summary

## Prerequisites

Ensure `.env` includes either a service account JSON or individual Firebase Admin creds, and `APP_ID`:

```bash
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}
# OR
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n
APP_ID=default-app-id
```

## Usage

- Preview deletions:

```bash
npm run delete:preview
```

- Execute deletions:

```bash
npm run delete:execute
```

### Flags

- `--dry-run`: Preview without modifying data (default)
- `--execute`: Perform deletions
- `--no-recursive`: Delete only the user doc; do not traverse subcollections

## What qualifies for deletion?

- A user document at `artifacts/${APP_ID}/users/{userId}` is considered for deletion if:
  - `artifacts/${APP_ID}/users/{userId}/math_whiz_data/profile` does not exist, and
  - The `math_whiz_data` subcollection has zero documents (checked via `listDocuments()`).

If either condition indicates presence of data, the user doc is kept.

## Output Example

```
DRY RUN: scanning 42 user doc(s) in app "default-app-id"
 - userA: NO math_whiz_data -> WOULD DELETE
 - userB: has math_whiz_data -> KEEP

SUMMARY
=======
Total users: 42
Would delete: 12
Errors: 0
```

## Notes

- The script is idempotent. Running again after deletions will skip non-existing docs.
- If you want to keep certain accounts regardless, filter by a whitelist before deletion (can be added on request).
