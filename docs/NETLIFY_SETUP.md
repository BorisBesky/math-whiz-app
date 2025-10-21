# Netlify Setup Guide

## Environment Variables Configuration

After implementing the security improvements, you need to update your Netlify environment variables:

### Remove These Variables (if they exist):
- `REACT_APP_FIREBASE_CONFIG` (the bundled JSON config)
- `REACT_APP_GEMINI_API_KEY`

### Add These New Variables:

#### Firebase Configuration (Public - Safe to expose):
- `REACT_APP_FIREBASE_API_KEY` - Your Firebase API key
- `REACT_APP_FIREBASE_AUTH_DOMAIN` - Your Firebase auth domain (e.g., `your-project.firebaseapp.com`)
- `REACT_APP_FIREBASE_PROJECT_ID` - Your Firebase project ID
- `REACT_APP_FIREBASE_STORAGE_BUCKET` - Your Firebase storage bucket (e.g., `your-project.appspot.com`)
- `REACT_APP_FIREBASE_MESSAGING_SENDER_ID` - Your Firebase messaging sender ID
- `REACT_APP_FIREBASE_APP_ID` - Your Firebase app ID

#### Gemini API (Server-side only):
- `GEMINI_API_KEY` - Your Gemini API key (without REACT_APP_ prefix)

## How to Update in Netlify:

1. Go to your Netlify dashboard
2. Navigate to **Site settings** → **Environment variables**
3. Remove the old variables mentioned above
4. Add the new variables with their respective values

## Getting Firebase Configuration Values:

1. Go to your Firebase Console
2. Select your project
3. Go to **Project settings** (gear icon)
4. Scroll down to **Your apps** section
5. Click on your web app
6. Copy the values from the config object

Example Firebase config object:
```javascript
{
  apiKey: "AIzaSyC...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
}
```

## Testing Locally:

To test the Netlify functions locally:

```bash
# Install Netlify CLI globally
npm install -g netlify-cli

# Start the development server with functions
npm run dev
```

## Security Benefits:

1. **Gemini API Key**: Now stored server-side and never exposed to the client
2. **Firebase Config**: Split into individual variables for better security practices
3. **Secret Scanning**: Will no longer detect secrets in the build output
4. **CORS Handling**: Proper CORS headers for cross-origin requests

## Troubleshooting:

- If you get CORS errors, make sure the Netlify function is properly deployed
- If Firebase doesn't work, verify all the individual environment variables are set correctly
- If Gemini API calls fail, check that `GEMINI_API_KEY` is set in Netlify (not in the client-side environment) 