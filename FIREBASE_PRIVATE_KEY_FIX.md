# Firebase Private Key Encoding Fix for Netlify

## Problem
The Netlify function logs show this error:
```
Getting metadata from plugin failed with error: error:1E08010C:DECODER routines::unsupported
```

This indicates that the Firebase private key environment variable is not properly encoded for Netlify's serverless environment.

## Solution Steps

### 1. Check Current Environment Variables in Netlify
Visit your deployed site and go to: `https://your-site.netlify.app/.netlify/functions/firebase-diagnostic`

This will show you the current state of your environment variables without exposing sensitive data.

### 2. Fix the Private Key Encoding

**Option A: Base64 Encode the Private Key**
1. In your Netlify dashboard, go to Site Settings → Environment Variables
2. Find `FIREBASE_PRIVATE_KEY`
3. Take your current private key value and base64 encode it:
   ```bash
   echo "YOUR_CURRENT_PRIVATE_KEY" | base64
   ```
4. Replace the `FIREBASE_PRIVATE_KEY` value with the base64-encoded version

**Option B: Properly Escape the Private Key**
1. Make sure your private key includes the proper `\n` characters
2. The key should look like:
   ```
   -----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n
   ```

### 3. Redeploy
After updating the environment variable in Netlify, trigger a new deployment.

### 4. Test the Fix
1. Try the diagnostic endpoint again: `/.netlify/functions/firebase-diagnostic`
2. Try creating a story in your Math Whiz app
3. Check the Netlify function logs for any remaining errors

## Environment Variables Checklist
Make sure you have all required environment variables set in Netlify:

- ✅ `FIREBASE_PROJECT_ID` - Your Firebase project ID
- ✅ `FIREBASE_CLIENT_EMAIL` - Firebase service account email
- ✅ `FIREBASE_PRIVATE_KEY` - Firebase service account private key (properly encoded)
- ✅ `GEMINI_API_KEY` - Your Google Gemini API key
- ✅ `NODE_VERSION` - Set to 18 or higher

## Testing Commands
After deploying, test these endpoints:

1. **Diagnostic**: `GET /.netlify/functions/firebase-diagnostic`
2. **Story Creation**: `POST /.netlify/functions/gemini-proxy` (with proper auth headers)

## Common Issues
- **Private key has spaces**: Ensure no spaces in the base64 encoded string
- **Missing newlines**: The private key must have proper `\n` characters
- **Wrong encoding**: Try both base64 and escaped newline approaches
- **Environment variable not updated**: Netlify requires a redeploy after env var changes

## If Issues Persist
1. Download a fresh service account key from Firebase Console
2. Try the base64 encoding approach above
3. Check the Netlify build logs for any initialization errors
4. Contact support with the diagnostic output

## Updated Code
The gemini-proxy.js function has been updated to handle multiple private key encoding formats automatically.
