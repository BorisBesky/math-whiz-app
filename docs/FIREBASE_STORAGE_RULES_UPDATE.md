# Firebase Storage Rules Update

> **Current rules live in [`storage.rules`](../storage.rules)** at the repo root and are deployed with
> `npm run storage:deploy-rules`. They add `pdf-uploads/{uid}/` for the portal's "Upload PDF Questions"
> flow (owner-only, PDF content type, max 10 MB). The snippet below is the older version, kept for reference.

To support question image uploads, please update your Firebase Storage Security Rules to the following:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Allow authenticated users to upload drawings to their own folder
    match /drawings/{userId}/{fileName} {
      allow read: if true; // Public read access for displaying drawings
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Allow authenticated users to upload question images to their own folder
    match /question-images/{userId}/{fileName} {
      allow read: if true; // Public read access for displaying images
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Deny all other access
    match /{allPaths=**} {
      allow read, write: if false;
    }
  }
}
```

This adds the `question-images` path which is used by the new image upload feature in the Question Review Modal.
