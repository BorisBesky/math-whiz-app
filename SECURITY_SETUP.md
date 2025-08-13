# Math Whiz App - Security Setup Guide

## Overview

The Netlify Gemini proxy has been enhanced with the following security features:

1. **Authentication**: Only authenticated users can access the API
2. **Rate Limiting**: Users can only make 4 queries per day (1 per topic)
3. **Topic Filtering**: Only math-related queries for the 4 specific topics are allowed

## Required Environment Variables

### Netlify Function Environment Variables

You need to add these environment variables to your Netlify deployment:

#### Firebase Admin SDK (Server-side only)
- `FIREBASE_PROJECT_ID` - Your Firebase project ID
- `FIREBASE_CLIENT_EMAIL` - Service account client email
- `FIREBASE_PRIVATE_KEY` - Service account private key (with newlines)

#### Gemini API
- `GEMINI_API_KEY` - Your Google Gemini API key

### How to Get Firebase Admin Credentials

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to **Project Settings** → **Service Accounts**
4. Click **Generate New Private Key**
5. Download the JSON file
6. Extract the following values:
   - `project_id` → Use for `FIREBASE_PROJECT_ID`
   - `client_email` → Use for `FIREBASE_CLIENT_EMAIL`
   - `private_key` → Use for `FIREBASE_PRIVATE_KEY`

### Setting Environment Variables in Netlify

1. Go to your Netlify site dashboard
2. Navigate to **Site Settings** → **Environment Variables**
3. Add each variable with its value
4. **Important**: For `FIREBASE_PRIVATE_KEY`, make sure to include the full key including `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----` lines

## Valid Topics

The system only accepts story problems for these 4 topics:

1. **Multiplication** - Focus on repeated addition, groups, arrays, skip counting (2-12 times tables)
2. **Division** - Focus on equal sharing, grouping, relationship with multiplication
3. **Fractions** - Focus on parts of whole, equivalent fractions, comparing, simple addition/subtraction
4. **Measurement & Data** - Focus on area (length × width), perimeter (adding all sides), volume (counting cubes)

## Rate Limiting

- **Daily Limit**: 4 story problems per day per user
- **Topic Limit**: 1 story problem per topic per day
- **Reset**: Limits reset at midnight UTC

## Security Benefits

1. **API Key Protection**: Gemini API key is never exposed to client-side code
2. **User Authentication**: Only authenticated Firebase users can access the API
3. **Content Filtering**: AI responses are constrained to educational math content appropriate for 3rd graders
4. **Rate Limiting**: Prevents abuse and controls API usage costs
5. **Topic Validation**: Ensures only math-related content is generated

## Testing

### Local Development

1. Install Netlify CLI: `npm install -g netlify-cli`
2. Create `.env` file with your environment variables
3. Run: `netlify dev`

### Production Testing

After deploying, test with authenticated requests including:
- Valid Firebase auth token in Authorization header
- Valid topic in request body
- Proper prompt content

## Error Handling

The API returns specific error messages:

- **401**: Authentication failed
- **400**: Missing prompt/topic or invalid topic
- **429**: Rate limit exceeded
- **500**: Internal server error

## Troubleshooting

### Common Issues

1. **Authentication Errors**: Check Firebase Admin SDK credentials
2. **Rate Limit Issues**: Check user's daily usage in Firestore
3. **Topic Validation**: Ensure topic matches exactly: "Multiplication", "Division", "Fractions", "Measurement & Data"
4. **CORS Errors**: Verify Authorization header is included in CORS settings

### Debugging

Check Netlify function logs for detailed error messages:
1. Go to Netlify Dashboard
2. Navigate to **Functions** tab
3. Click on the gemini-proxy function
4. View logs for debugging information
