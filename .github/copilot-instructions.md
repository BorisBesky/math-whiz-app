# Math Whiz App - AI Coding Agent Instructions

This document provides essential guidance for AI coding agents to effectively contribute to the Math Whiz App codebase.

## 1. Architecture Overview

The application follows a modern JAMstack architecture:

-   **Frontend**: A React single-page application (SPA) located in the `src` directory. It's built with Create React App and uses React Router for navigation.
-   **Backend**: Serverless functions powered by Netlify Functions, located in `netlify/functions`. These handle secure operations and communication with external services.
-   **Database & Auth**: Google Firebase is the primary service for user authentication (Firebase Auth) and data storage (Firestore).
-   **AI Content**: Google Gemini AI is used for dynamically generating math problems. This is accessed through a dedicated serverless function.

**Key Data Flow**: The React frontend communicates with Firebase services directly for most data operations. For sensitive actions or interactions with the Gemini AI, it calls the Netlify serverless functions, which then interact with the respective services.

## 2. Core Components & Directories

-   `src/components`: Contains all reusable React components. Components are organized by feature.
-   `src/contexts`: Holds React Context providers for managing global state, such as the currently logged-in user (`AuthContext.js`).
-   `src/content`: Contains static content and explanations for various math topics.
-   `netlify/functions`: Each file is a serverless function.
    -   `gemini-proxy.js`: Securely proxies requests to the Google Gemini AI API. This is the primary interface for generating dynamic content.
    -   `firebase-admin.js`: Initializes the Firebase Admin SDK for backend operations. Other functions use this to interact with Firestore with elevated privileges.
    -   `class-students.js`, `classes.js`: Handle teacher and class management logic.

## 3. Developer Workflow

### Local Development

1.  **Setup**: Ensure you have a `.env` file in the root directory with the necessary Firebase and Google Gemini API keys. Refer to the `README.md` for the required variables.
2.  **Installation**: Run `npm install` to install all dependencies.
3.  **Running the App**: Use `npm start` to run the React development server. The Netlify functions are automatically served as well.

### Testing

-   Always write unit tests for new components and functions using Jest and React Testing Library.
-   Always run 'npm run build' to ensure the production build compiles without errors.
-   The project is set up for end-to-end testing with Playwright. Test files are located in the `tests/` directory.
-   Run tests using the `npx playwright test` command.

### Deployment

-   The application is deployed on Netlify.
-   A production build is created with `npm run build`.
-   Deployment is handled by Netlify, which automatically deploys the `build` directory and the serverless functions in `netlify/functions`.

## 4. Project Conventions & Patterns

-   **State Management**: Global state is managed via React Context (`src/contexts`). For component-level state, use the `useState` and `useReducer` hooks.
-   **Styling**: The project uses Tailwind CSS for utility-first styling. Custom styles are in `src/MainApp.css`.
-   **Mathematical Notation**: KaTeX is used to render mathematical formulas. You'll often see strings formatted for KaTeX.
-   **Firebase Interaction**:
    -   Client-side interaction with Firebase is done using the Firebase JS SDK.
    -   Server-side logic in Netlify Functions uses the Firebase Admin SDK for secure access to data.
-   **API Calls**: Use the `fetch` API to communicate with the Netlify serverless functions from the React application.

## 5. External Dependencies & Integration Points

-   **Firebase**: The most critical integration. Understand the Firestore data model for users, classes, and student progress.
-   **Google Gemini AI**: All interactions are routed through the `netlify/functions/gemini-proxy.js` function. The frontend should not directly call the Gemini API.
-   **Netlify**: Provides hosting, serverless functions, and environment variable management for production.
