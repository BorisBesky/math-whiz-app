# Math Whiz App — Codebase Guide

## Stack

React 19 (Create React App / react-scripts 5), React Router DOM 7, Tailwind CSS 3, Firebase 11 (Auth + Firestore), Netlify (functions + edge functions). Node 20. Testing: Jest + React Testing Library (unit), Playwright (E2E), Lighthouse CI (perf).

## Directory layout

```
src/
  App.js                    # Root routing (student / portal / about split)
  MainApp.js                # Full student quiz experience (~85 KB)
  firebase.js               # Firebase init; emulator support
  components/
    portal/                 # Teacher / admin portal components
      sections/             # One file per portal tab (Classes, Students, etc.)
      sections/__tests__/   # Section unit tests
      __tests__/            # Modal & shared-portal tests
    messaging/              # InternalInbox, MessageComposer, StudentInbox
    ui/                     # ModalWrapper, ConfirmationModal
    about/                  # Marketing / SEO pages
    __tests__/              # Component-level unit & snapshot tests
  hooks/                    # Custom hooks (usePortalClasses, usePortalStudents, …)
  services/                 # Business logic: internalMessages, questionService, quizGenerationService
  utils/                    # Pure helpers (common_utils, studentName, subtopicUtils, …)
  contexts/                 # AuthContext (roles + custom claims)
  content/
    g3/                     # 4 topics: Multiplication, Division, Fractions, Measurement & Data
    g4/                     # 6 topics: Operations, Base Ten, Fractions, Measurement, Geometry, Binary
netlify/
  functions/                # 24 serverless functions (auth, AI, data, PDF)
  edge-functions/           # robots.txt, sitemap.xml
tests/
  e2e/                      # 13 Playwright spec files + auth/quiz helpers
  api/                      # 3 API contract tests (classes, gemini-proxy, validate-drawing)
firestore/                  # Firestore security rules & indexes
scripts/                    # One-off admin/migration Node scripts (18 files)
```

## Running things

```bash
npm start                   # CRA dev server (port 3000)
npm run dev                 # Netlify dev — runs functions locally (port 8888)
npm run emulators           # Start Firebase Auth (9099) + Firestore (8080) emulators
npm run build               # Production build + inline-critical-css.js post-step
```

## Testing

```bash
npm test                        # Jest watch mode
npm run test:coverage           # With coverage report (lcov + html)
npm run test:ci                 # No watch, with coverage — use in CI
npm run test:e2e                # Playwright (all browsers)
npm run test:e2e:emulator       # Playwright against local Firebase emulator
npm run test:e2e:headed         # Playwright with visible browser
npm run test:lighthouse         # Lighthouse CI performance audit
```

Coverage thresholds are set to 20 % globally (branches, functions, lines, statements).

### Test file naming conventions

| Pattern | Purpose |
|---|---|
| `*.test.js` | Standard unit test |
| `*.snapshot.test.js` | Snapshot / visual regression |
| `*.integration.test.js` | Multi-component interaction |
| `*.count.test.js` | Count / iteration behaviour (e.g. input reset) |

Tests co-locate with their subject in a `__tests__/` sibling folder.

### Standard mock patterns

**Firebase (Firestore)** — always mock at module level, never use the real SDK in unit tests:

```js
const mockGetDoc = jest.fn();
const mockUpdateDoc = jest.fn(() => Promise.resolve());
const mockDoc = jest.fn((...parts) => ({ path: parts.join('/') }));

jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(() => ({})),
  doc: (...args) => mockDoc(...args),
  getDoc: (...args) => mockGetDoc(...args),
  updateDoc: (...args) => mockUpdateDoc(...args),
  setDoc: (...args) => mockSetDoc(...args),
  writeBatch: jest.fn(() => ({ update: jest.fn(), delete: jest.fn(), commit: jest.fn() })),
}));
```

**ModalWrapper** — render children unconditionally in tests:

```js
jest.mock('../../ui/ModalWrapper', () => {
  const React = require('react');
  return function MockModalWrapper({ isOpen, children }) {
    if (!isOpen) return null;
    return React.createElement('div', { role: 'dialog' }, children);
  };
});
```

**common_utils** — always provide `getAppId`, `getTopicsForGrade`, etc.:

```js
jest.mock('../../../utils/common_utils', () => ({
  getAppId: () => 'test-app',
  getTopicsForGrade: (g) =>
    g === 'G3' ? ['Multiplication', 'Division'] : ['Operations & Algebraic Thinking', 'Geometry'],
}));
```

**subtopicUtils**:

```js
jest.mock('../../../utils/subtopicUtils', () => ({
  getSubtopicsForTopic: (topic) => {
    if (topic === 'Multiplication') return ['One-digit', 'Two-digit', 'Multi-digit'];
    return [];
  },
}));
```

## Firebase / data model

All Firestore data is scoped under `artifacts/{appId}/`. The app ID is resolved via `getAppId()` (checks `window.__app_id`, falls back to `'default-app-id'`; override via `REACT_APP_ID`). This enables multi-tenant isolation in one Firebase project.

Key collection paths:

```
artifacts/{appId}/
  classes/{classId}                              # gradeLevel, teacherIds[], name, joinCode
  users/{userId}/math_whiz_data/profile          # role, grade, dailyGoalsByGrade
  classStudents/{classId}__{studentId}           # enrollment, allowedSubtopicsByTopic
  messages/{messageId}                           # internal teacher-to-teacher messages
```

**Hooks:**
- `usePortalClasses()` — classes visible to current user (all for admin, own for teacher)
- `usePortalStudents()` — students with aggregated stats (questions, accuracy, coins)
- `usePortalTeachers()` — all teachers, admin-only

**Role constants** (`src/utils/userRoles.js`):

```js
USER_ROLES.STUDENT | USER_ROLES.TEACHER | USER_ROLES.ADMIN
```

**Class helpers** (`src/utils/classHelpers.js`):
- `getTeacherIds(classData)` — returns `teacherIds[]`, handles legacy `teacherId` scalar
- `isTeacherOnClass(classData, uid)`

## Portal component patterns

All portal modals follow the same design template:

```
<ModalWrapper isOpen={isOpen} onClose={onClose} hideCloseButton size="lg">
  {/* Header */}
  <div className="px-6 py-5 bg-gradient-to-r from-brand-purple to-brand-pink text-white rounded-t-lg">
    ...icon + title + ×-button...
  </div>

  {/* Body */}
  <div className="px-6 py-5 space-y-5">
    {/* Grade selector: pill tabs, not <select> */}
    <div className="inline-flex rounded-button border border-gray-200 bg-gray-50 p-1" role="tablist">
      <button role="tab" aria-selected={grade === 'G3'} ...>3rd Grade</button>
      <button role="tab" aria-selected={grade === 'G4'} ...>4th Grade</button>
    </div>
    ...
  </div>

  {/* Footer */}
  <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end space-x-2 rounded-b-lg">
    <button className="... border border-gray-300 ... rounded-button ...">Cancel</button>
    <button className="... bg-brand-purple ... rounded-button ...">Save</button>
  </div>
</ModalWrapper>
```

**Rules:**
- Header gradient: always `from-brand-purple to-brand-pink`; subtitle text `text-white/80`
- Border radius: `rounded-button` (0.75 rem) everywhere — never `rounded-md` or `rounded-lg` on interactive controls
- Primary action buttons: `bg-brand-purple hover:bg-purple-700`
- Focus rings: `focus:ring-brand-purple`
- Grade selector: pill tabs with `role="tablist"` / `role="tab"` — never a `<select>` dropdown
- Loading spinners: `<Loader2 className="h-4 w-4 mr-2 animate-spin" />`
- Error banners: `bg-red-50 border-red-200 text-red-800` + `<AlertCircle />`
- Success banners: `bg-green-50 border-green-200 text-green-800` + `<CheckCircle2 />`

**Portal focus modals:**
- `StudentFocusModal` — self-loading (fetches own Firestore data on open); use for *Students* section
- `SubtopicsFocusModal` — caller-supplied initial data; use for *ClassDetailPanel*

## Design tokens (tailwind.config.js)

**Brand palette:**

| Token | Hex |
|---|---|
| `brand-purple` | `#7c3aed` |
| `brand-pink` | `#ec4899` |
| `brand-blue` | `#2563eb` |
| `brand-coral` | `#f56565` |
| `brand-mint` | `#48d1a5` |
| `brand-sunny` | `#f6c844` |
| `brand-sky` | `#38bdf8` |
| `brand-orange` | `#fb923c` |

**Spacing / shape:**

| Token | Value |
|---|---|
| `rounded-button` | `0.75rem` |
| `rounded-card` | `1rem` |
| `shadow-card` | `0 2px 12px rgba(0,0,0,0.08)` |

**Fonts:** `font-display` → Baloo 2 / Fredoka; `font-body` → Nunito

**Animations:** `bounce-in`, `slide-up`, `celebrate`, `pulse-soft`, `shake`, `fade-in`, `progress-fill`

## Key utilities

| File | Notable exports |
|---|---|
| `utils/common_utils.js` | `formatDate`, `getTodayDateString`, `getAppId`, `normalizeDate`, `getTopicsForGrade`, `calculateTopicProgressForRange` |
| `utils/studentName.js` | `getStudentDisplayName(student, fallback)`, `getStudentShortId`, `getStudentInitials` |
| `utils/subtopicUtils.js` | `getSubtopicsForTopic(topicName, grade)` |
| `utils/userRoles.js` | `USER_ROLES`, `canAccessTeacherPortal()`, `getRedirectPath(role)` |
| `utils/classHelpers.js` | `getTeacherIds(classData)`, `isTeacherOnClass(classData, uid)` |
| `services/internalMessages.js` | `sendInternalMessage`, `getEnrollmentId`, message normalization |
| `services/questionService.js` | Firestore question fetch with caching & retry |
| `services/quizGenerationService.js` | AI-powered quiz generation, complexity ranking |

## Environment variables

Copy `.env.example` to `.env.local` for local development.

| Variable | Purpose |
|---|---|
| `REACT_APP_FIREBASE_*` (6 vars) | Client Firebase config |
| `REACT_APP_ID` | Multi-tenant app ID (default: `math-whiz-app`) |
| `REACT_APP_USE_EMULATOR` | `true` to point at local emulators |
| `FIREBASE_PROJECT_ID/CLIENT_EMAIL/PRIVATE_KEY` | Server-side Admin SDK |
| `GEMINI_API_KEY` | Google Generative AI key |
| `GEMINI_MODEL_NAME` | Default: `gemini-2.5-flash` |
| `PUBLIC_APP_BASE_URL` | Used in join-code link generation |
| `JOIN_CODE_TTL_MINUTES` | Join code expiry (default: 1440) |

## Netlify functions

Functions live in `netlify/functions/`. Shared helpers:
- `firebase-admin.js` — Admin SDK init (singleton)
- `class-helpers.js` — Class CRUD shared logic
- `retry-utils.js` — Exponential backoff retry

AI functions use background + status pattern for long-running jobs:
- `gemini-image-generation.js` → starts job
- `gemini-image-generation-background.js` → does work
- `gemini-image-generation-status.js` → poll for completion

Same pattern for PDF upload: `upload-pdf-questions-background.js` + `upload-pdf-questions-status.js`.

## Deployment

Netlify auto-deploys `main`. Build command: `npm run build && node scripts/inline-critical-css.js`. Static output to `build/`. Functions bundled by esbuild (sharp marked external). SPA fallback: `/* → /index.html 200`.

Cache strategy: hashed JS/CSS assets are immutable (1 year), HTML is no-cache, images are 1 week.

## E2E tests

Playwright tests in `tests/e2e/`. Run against port 3000 (`npm start`) or port 8888 (`npm run dev` with `PLAYWRIGHT_USE_NETLIFY_DEV=true`). Two shared helper files:
- `auth-helpers.js` — `navigateAndWaitForAuth`, inter-test delays
- `quiz-helpers.js` — `detectQuestionType`, `provideAnswer`, `completeQuiz`

CI uses 1 worker (avoids Firebase Auth rate limits); local uses 2. Retries: 2 in CI, 1 locally.
