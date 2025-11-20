# Firebase Storage Setup for Drawing Questions

## Required Configuration

To enable drawing question image uploads, you need to configure Firebase Storage:

## 1. Enable Firebase Storage

In your Firebase Console:
1. Go to **Storage** in the left sidebar
2. Click **Get Started**
3. Choose **Start in production mode** (we'll add rules next)
4. Select your Cloud Storage location (same region as Firestore)

## 2. Update Storage Security Rules

Replace the default rules with:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Allow authenticated users to upload drawings to their own folder
    match /drawings/{userId}/{fileName} {
      allow read: if true; // Public read access for displaying drawings
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Deny all other access
    match /{allPaths=**} {
      allow read, write: if false;
    }
  }
}
```

These rules:
- ✅ Allow **any user** to read drawing images (for displaying in UI)
- ✅ Allow **authenticated users** to write only to their own `/drawings/{userId}/` folder
- ❌ Deny all other storage access

## 3. Update netlify/functions/firebase-admin.js

Make sure Firebase Admin SDK initializes Storage:

```javascript
const { getStorage } = require('firebase-admin/storage');

// After initializing admin
const storage = getStorage();

// Export for use in other functions
module.exports = { admin, db, storage };
```

## 4. Environment Variables

Ensure your Firebase Storage bucket is configured in `.env`:

```bash
REACT_APP_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
```

This should already be set from your Firebase config.

## 5. Test the Setup

1. Create a test drawing question
2. Attempt the question as a student
3. Draw something and click "Check Answer"
4. Verify the image uploads to Firebase Storage
5. Check Storage console: `drawings/{userId}/{questionId}_{timestamp}.png`
6. Verify the image URL is publicly accessible

## Storage Costs

Firebase Storage pricing (as of 2024):
- **Storage**: $0.026/GB/month
- **Downloads**: $0.12/GB
- **Uploads**: Free

**Estimated costs for drawing questions:**
- Average PNG: ~50-200 KB per drawing
- 1000 drawings/month: ~50-200 MB storage = **$0.001-$0.005/month**
- Viewing drawings: Minimal cost (images are small)

Very cost-effective for typical usage!

## Troubleshooting

### "Failed to upload drawing image"
- Check Storage is enabled in Firebase Console
- Verify Storage security rules are deployed
- Check `.env` has correct `REACT_APP_FIREBASE_STORAGE_BUCKET`
- Ensure Firebase Admin SDK has Storage permissions

### "Permission denied"
- Verify user is authenticated (auth token is valid)
- Check storage rules allow writing to `/drawings/{userId}/`
- Ensure user ID in path matches authenticated user

### Images not displaying
- Verify file was uploaded (check Firebase Storage console)
- Check the file is marked as public (makePublic() in code)
- Verify the URL format: `https://storage.googleapis.com/{bucket}/drawings/...`

## Alternative: Use Firebase Storage with SignedURLs

For more security, you can use signed URLs instead of public access:

```javascript
// In validate-drawing.js
const [url] = await file.getSignedUrl({
  action: 'read',
  expires: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
});
return url;
```

This generates temporary URLs that expire, providing better security but requiring URL regeneration periodically.
