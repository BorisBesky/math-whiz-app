# CLAUDE.md - math-whiz-app

## Site
- URL: https://mathwhizapp.kids
- Purpose: Free adaptive math practice app for 3rd and 4th grade students, teachers, and parents.

## Tech stack
- React 19 / Create React App SPA, React Router DOM 7, Tailwind CSS 3
- Firebase Auth + Firestore
- Netlify hosting, functions, and edge functions

## SEO-relevant file map
- Sitemap: `netlify/edge-functions/sitemap.js`
- Robots.txt: `netlify/edge-functions/robots.js`
- `<head>` / base meta template: `public/index.html`
- Route-specific client meta: `src/components/about/SeoHead.js`, `src/components/about/AboutOverview.js`
- Route-specific raw HTML meta: `netlify/edge-functions/seo-head.js`
- Schema.org JSON-LD: emitted by `src/components/about/SeoHead.js`
- Layout / page templates: `src/components/about/AboutLayout.js`, `src/components/about/AboutSeoPage.js`, `src/components/about/pages/*`

## Codebase conventions
- New SEO pages are registered in `src/components/about/seoPageConfig.js`.
- Public SEO pages should also be added to `netlify/edge-functions/sitemap.js` and `netlify/edge-functions/seo-head.js`.
- Authenticated app routes are intentionally excluded from robots and sitemap.
- Internal SEO links use React Router `<Link>` with `/about/<slug>` paths.

## Standing notes / do-not-touch
- `/app/`, `/admin`, `/teacher`, and `/portal` are intentionally disallowed in robots.txt.
- `/login` is not an SEO landing page and should not be submitted in the sitemap.

## Prior SEO fixes (most recent first)
- 2026-05-28 - Alternate canonical pages for `/about/*` in GSC - PR https://github.com/BorisBesky/math-whiz-app/pull/51 - files: `netlify/edge-functions/seo-head.js`, `netlify.toml`, `netlify/edge-functions/sitemap.js`, `AGENTS.md`, `CLAUDE.md` - notes: Added edge-injected route-specific canonical/title/meta for `/about` pages and removed `/login` from sitemap.

## Open watch-items
- GSC reported 10 alternate-canonical `/about/*` pages and 2 crawled-not-indexed URLs (`http://mathwhizapp.kids/`, `https://mathwhizapp.kids/about`) on 2026-05-28.
- Sitemap is successful and was last read 2026-05-27, with 16 discovered pages before `/login` was removed.
- Core Web Vitals has insufficient field data for both mobile and desktop as of 2026-05-25.

---

# Math Whiz App - Codebase Guide

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
  content/                  # PLUGGABLE: a topic = a folder with manifest.json (see below)
    registry.js             # Client query facade (grades, topics, themes, hooks)
    *.generated.*           # Committed codegen output — regenerate, never hand-edit
    g3/                     # grade.json + 4 topics: Multiplication, Division, Fractions, Measurement & Data
    g4/                     # grade.json + 6 topics: Operations, Base Ten, Fractions, Measurement, Geometry, Binary
netlify/
  functions/                # 24 serverless functions (auth, AI, data, PDF)
  edge-functions/           # robots.txt, sitemap.xml
tests/
  e2e/                      # 13 Playwright spec files + auth/quiz helpers
  api/                      # 3 API contract tests (classes, gemini-proxy, validate-drawing)
firestore/                  # Firestore security rules & indexes
scripts/                    # One-off admin/migration Node scripts (18 files)
```

## Content authoring (pluggable topics & grades)

Curriculum content is a plug-in system — **the folder is the registration**
(full guide: `docs/CONTENT_AUTHORING.md`; design: `docs/PLUGGABLE_CONTENT_PLAN.md`):

- New topic: `npm run new:topic -- --grade g4 --id algebra --name "Algebra"`,
  fill in `manifest.json` + `questions.js` + `Explanation.js`, flip `"enabled": true`.
  It then appears everywhere (student picker, portal modals, question bank, all four
  AI functions' prompts and validation) with zero code edits.
- New grade: `npm run new:grade -- --key G5 --label "5th Grade"`, add topics, enable.
- Single source of truth: `src/content/<grade>/<topic>/manifest.json` +
  `src/content/<grade>/grade.json`, aggregated by `npm run generate:content`
  (auto-runs on prestart/prebuild) into two committed generated files. A Jest drift
  test fails CI when they're stale. `shared-constants.js` exports (`TOPICS`,
  `VALID_TOPICS_BY_GRADE`, `SUBTOPICS_BY_GRADE_TOPIC`) are derived — never hand-edit.
- Query via `src/content/registry.js` (client) / `netlify/functions/content-registry.js`
  (server); never import topic folders directly from app code.
- **Topic `name` and grade `key` are Firestore storage keys — never rename once live**
  (use `displayName` + `aliases` instead).
- `"enabled": false` stages content invisibly (excluded from student lists, validation,
  and AI prompts; still resolvable for stored-data lookups).
- Every topic must satisfy the shared generator contract
  (`src/content/__tests__/topicContracts.test.js`, runs automatically per topic):
  well-formed questions at all difficulties, MC answer among options, emitted
  `subtopic` values declared in the manifest, `allowedSubtopics` respected, ≥10
  distinct questions per 200 draws.
- AI prompt text lives in manifests (`ai.guidelines`, grade `ai.storyRequirements`);
  changes surface in `src/__tests__/ai-prompt-snapshots.test.js` — review the diff,
  then update snapshots deliberately.

## Running things

```bash
npm start                   # CRA dev server (port 3003)
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

Playwright tests in `tests/e2e/`. Run against port 3003 (`npm start`) or port 8888 (`npm run dev` with `PLAYWRIGHT_USE_NETLIFY_DEV=true`). Two shared helper files:
- `auth-helpers.js` — `navigateAndWaitForAuth`, inter-test delays
- `quiz-helpers.js` — `detectQuestionType`, `provideAnswer`, `completeQuiz`

CI uses 1 worker (avoids Firebase Auth rate limits); local uses 2. Retries: 2 in CI, 1 locally.

## Internal messaging — gotchas & data flow

**Teacher portal Messages tab data flow:** `MessagesSection` → `useTeacherStudentRelationships` (in `src/hooks/useInternalMessages.js`) → `getTeacherStudentRelationships()` (in `src/services/internalMessages.js`) → `InternalInbox`. The message list itself comes from a separate `useInternalMessages` `onSnapshot` on `artifacts/{appId}/messages` filtered by `participantIds array-contains userId`.

**Two distinct error surfaces in the inbox — don't confuse them:**
- Message-list `permission-denied` → friendly "Messaging is not available yet. Please deploy the updated Firestore rules…" (means rules aren't deployed).
- Relationships-load error → raw `err.message`, e.g. "Missing or insufficient permissions" (a.k.a. "insufficient privileges"). This is the **relationships** path, NOT the message list.

**`profile.teacherIds` is the authorization key — keep it in sync with class membership.** Rule `users/{userId}/math_whiz_data/profile` (`firestore/fs.rules`) lets a teacher read a student profile only when `request.auth.uid in resource.data.teacherIds` on that profile doc. This array is **denormalized** onto every student profile and MUST mirror the teachers of the classes the student is enrolled in. It is maintained server-side (Admin SDK) on every membership-changing path:
- `join-class.js` (student redeems a join code) — `arrayUnion` the class's teachers
- `class-students.js` (teacher adds/removes a student) — add on enroll, remove-with-retention on unenroll
- `classes.js` `handleDeleteClass` — remove-with-retention for all enrolled students; `handleUpdateClass` — diffs old vs new teacherIds on edit and reconciles
- `manage-class-teacher.js` (teacher added/removed on a class) — see below
- `scripts/sync-teacher-ids.js` — one-time backfill that recomputes the correct set from enrollments

"Remove-with-retention" = only strip a teacher from a student's profile if no *other* class still connects them. The propagation logic is single-sourced in `class-helpers.js` → `reconcileEnrolledStudentTeachers({ db, admin, appId, classId, added, removed })`, used by both `manage-class-teacher.js` and `classes.js` `handleUpdateClass`.

**`netlify/functions/classes.js` is token-verified + per-operation authorized** (was an open hole — it extracted the bearer token but skipped verification). Now: `admin.auth().verifyIdToken` (401 on missing/invalid); GET — teacher may only list their own `teacherId` (admin: any); POST — non-admin must include themselves in `teacherIds`, `createdBy` forced to caller; PUT/DELETE — admin or an existing teacher on the class. PUT only writes whitelisted fields (`UPDATABLE_CLASS_FIELDS` + reconciled `teacherIds`), so callers can't clobber `studentCount`/`createdBy`/`joinCode`. Server-side function authz tests live in `src/__tests__/{classes,manage-class-teacher,send-internal-message,get-class-teachers}.test.js` using the shared Admin-Firestore mock at `src/test-utils/firestoreAdminMock.js`.

**Root-cause bug fixed (2026-06-11):** adding/removing a teacher on a class wrote `teacherIds` **directly to the class doc** (client `updateDoc(arrayUnion/arrayRemove)` in `ClassDetailPanel.js`) and never propagated to enrolled students' `profile.teacherIds`. So a teacher added to an existing class was missing from those students' `profile.teacherIds`, the profile read was denied, and `getStudentProfilesById` (in `getTeacherStudentRelationships`) threw `permission-denied`, crashing the whole Messages tab ("Missing or insufficient permissions"). Fix: routed teacher add/remove through the new `netlify/functions/manage-class-teacher.js` (verified ID token; authz = admin or existing teacher on class) which updates the class **and** reconciles every enrolled student's `profile.teacherIds`. `ClassDetailPanel.handleAddTeacher`/`handleRemoveTeacher` now POST to it instead of `updateDoc`. Do **not** swallow a `permission-denied` from the profile read — a denial means the authz data drifted and must surface, not be hidden behind a stale fallback name. Existing drifted data is repaired by running `scripts/sync-teacher-ids.js` once (needs Admin SDK env: `FIREBASE_SERVICE_ACCOUNT_KEY` or the `FIREBASE_PROJECT_ID/CLIENT_EMAIL/PRIVATE_KEY` trio, plus `APP_ID`).

**Two distinct inbox error surfaces — don't confuse them:** message-list `permission-denied` → friendly "Messaging is not available yet…" (rules not deployed); relationships-load error → raw `err.message` (the `profile.teacherIds` authz path above). The `classStudents` read itself is open to any authed user (`allow read: if request.auth != null`).

**Architecture note:** message *writes* and teacher-profile resolution already go server-side via Admin SDK (`send-internal-message.js`, `get-class-teachers.js`) because client-side profile/role reads are unreliable for self-registered teachers (role lives in their Firestore profile, not a custom claim). `manage-class-teacher.js` follows the same verified-auth pattern.

**Server-function authz tests** now cover `classes`, `manage-class-teacher`, `send-internal-message`, `get-class-teachers`, and `class-question-pool-health` (sender-spoof → 403, enrollment-missing → 404, role-pair mismatch → 403, admin-or-teacher-on-class gates, etc.) in `src/__tests__/*.test.js`, all using the shared Admin-Firestore mock `src/test-utils/firestoreAdminMock.js` (supports `collection/doc/where/get/add/set/update/delete`, `batch()`, `FieldValue`, `FieldPath`).

## Question repetition & pool health

**Why a question repeats:** quizzes mix *imported* bank questions (Firestore docs with ids) and *dynamically generated* content questions (from `src/content/.../questions.js` generators). Two repeat-guards exist: the answered-bank-id exclusion (`answeredQuestionBankQuestions`, bank only) and the per-class **Question Mastery Threshold** (`questionMasteryThreshold` on the class; "retire a question type after N correct answers"). Generated questions have no id and (for most topics) no `questionTag`, so historically *neither* guard applied and they recurred forever.

**Fix (`src/utils/questionKey.js`):** `getQuestionSignature(q)` = `question|||correctAnswer`; `getQuestionMasteryKey(q)` returns `q.questionTag` if present, else `gen_<FNV-1a-hash(signature)>` (path-safe base36 — raw signatures contain `.`/`/`/`?`/spaces that break Firestore field paths). `quizGenerationService.js` imports both and skips any question whose `tagMastery[masteryKey]` count ≥ `tagMasteryThreshold` (fed from the class `questionMasteryThreshold`, merged in `MainApp.startNewQuiz`). `MainApp.js` increments `questionMastery.<key>` on **correct** answers in the two tracking branches of `checkAnswer` — standard multiple-choice (~line 1740) and fill-in-blank (~line 1610) — guarded `if (questionTag || !questionId)` so untagged generated questions retire while already-id-tracked bank questions don't double-count. The AI-evaluated (drawing/write-in) branch does **not** track mastery. `tagMastery` lives in `userData.questionMastery` (a map keyed by mastery key → correct count).

**Teacher low-pool flag:** `netlify/functions/class-question-pool-health.js` (verified ID token; authz = admin or teacher-on-class) aggregates enrolled students' answered history (each student's `attempts` subcollection, else `profile.answeredQuestions`) and runs `netlify/functions/question-pool-health-utils.js` → `analyzeRepeatPressure(records, {repeatThreshold})` (default 3, floored at 2), returning `flags` for (topic, subtopic) pairs where a single question recurred ≥ threshold, worst first, `severity` high at ≥ 2× threshold. Surfaced in `ClassDetailPanel` (best-effort `useEffect`; fetch failure never blocks the panel) via `src/services/questionPoolHealth.js` → `fetchClassQuestionPoolHealth` + the presentational `src/components/portal/QuestionPoolHealthBanner.js` (renders null when no flags; optional `onAddQuestions(flag)` CTA pointing at the Question Bank where AI-generate/import live).

**Generator variety:** thin generators cause repeats even with a working guard. `generatePointsLinesRaysQuestion` (g4 geometry `questions.js`) was expanded from 12 → 30+ distinct questions (two phrasings each for definition/example, true/false notation with reliably-false borrowed statements, and an endpoint-count form that excludes `point`) while staying within its `points lines rays` subtopic — do not pull in angles/parallel/perpendicular content, which belongs to the separate `lines and angles` subtopic. Other thin generators are candidates for the same treatment.

**Tests:** `src/utils/__tests__/questionKey.test.js`, `src/services/__tests__/quizGenerationService.test.js` (retirement at threshold), `src/__tests__/question-pool-health-utils.test.js`, `src/__tests__/class-question-pool-health.test.js`, `src/components/portal/__tests__/QuestionPoolHealthBanner.test.js`, and the `points / lines / rays` block in `src/content/g4/geometry/__tests__/questions.test.js` (validity + variety > 20 over 500 draws). Existing production data was backfilled once via `scripts/sync-teacher-ids.js` (separate teacherIds issue); the repeat-guard needs no backfill — it takes effect as students answer.
