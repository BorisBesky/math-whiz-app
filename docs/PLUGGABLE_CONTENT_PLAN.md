# Plan: Pluggable Content Modules (Topics & Grade Levels)

Status: Phases 0–1 implemented on `feature/pluggable-content`; Phases 2+ pending.
Author: drafted 2026-07-08

Implementation notes vs. this plan:
- Phase 1 deviation: `grade.json` does **not** yet carry `ai.promptEnhancement`
  (the gemini-proxy per-grade text interpolates the topic, so the template
  moves together with its consumer in Phase 3; the schema reserves the field).
- Phase 1 deviation: there is deliberately **no `pretest` codegen hook** — CI
  runs `npm test`, so regenerating before tests would mask stale committed
  files. Freshness is enforced by `src/__tests__/content-registry-drift.test.js`;
  `prestart`/`prebuild` keep local runs and deploys fresh.
- Phase 1 went slightly further than written: `src/content/index.js` already
  consumes `registry.generated.js` (the plan sketched that for Phase 2), so
  the per-grade `index.js` registration files are gone — the folder is the
  registration as of Phase 1.

## 1. Goal

Make curriculum content a plug-in system along two axes:

1. **Topic pluggability** — an author creates a new topic (e.g. *Algebra*) by adding one
   self-contained folder. It automatically appears in the student topic picker, daily-goal
   defaults, dashboard, portal Goals/Focus modals, question-bank dropdowns, AI question
   generation (valid-topic validation + prompt guidelines), teacher AI focus analysis, and
   PDF-upload topic validation — with **zero edits outside the folder**.
2. **Grade pluggability** — a new class level (e.g. G5) is added the same way: one grade
   folder with metadata + topic folders. Grade toggles, portal grade tabs, class-creation
   dropdowns, server-side grade validation, and prompt labels all derive from it.

**Non-goals** (explicitly out of scope, see §10): runtime plugin loading (no code changes at
all), teacher-authored topics stored in Firestore, migrating Firestore storage keys from
topic names to ids, SEO/about marketing pages (intentionally hand-written).

## 2. Current-state audit

Topic and grade knowledge is duplicated across ~22 locations today. The topic modules in
`src/content/<grade>/<topic>/index.js` are already the right *shape* (id, name, grade,
standards, subtopics, objectives, lazy `loadGenerateQuestion` / `loadExplanationComponent`)
— but they are only one of several competing sources of truth.

### Client

| # | Location | Hardcoded knowledge |
|---|----------|--------------------|
| 1 | `src/constants/shared-constants.js` | `GRADES`, `TOPICS` (display-name constants), `VALID_TOPICS_BY_GRADE`, `SUBTOPICS_BY_GRADE_TOPIC` (CJS; consumed by client **and** functions) |
| 2 | `src/constants/topics.js` | ESM re-export of #1 |
| 3 | `src/constants/appConstants.js` | `quizTopicsByGrade` (also defines **display order**), `TOPIC_CONTENT_MAP` (name → `[gradeId, topicId]`), `conceptExplanationFiles` (legacy iframe fallbacks) |
| 4 | `src/utils/common_utils.js:105` | `getTopicsForGrade` — a re-inlined copy of the grade→topics map |
| 5 | `src/content/index.js`, `g3/index.js`, `g4/index.js` | manual grade/topic registration; grade-level standards maps |
| 6 | `src/components/TopicSelection.js` | `topicColors` keyed by display name; hardcoded 3rd/4th grade toggle & labels; goal seeding on grade switch |
| 7 | `src/components/Dashboard.js` | G3/G4 toggle buttons, `"3rd"/"4th"` labels, legacy `!q.grade → G3` assumptions |
| 8 | `src/MainApp.js` | default grade `"G3"`, `normalizeClassGrade` (recognizes only 3/4), legacy-G3 dual-write progress paths, grade labels, goal seeding loops, `TOPIC_CONTENT_MAP` explanation dispatch |
| 9 | `src/components/QuizView.js:26` | **eager deep import** of `content/g4/geometry/questions` for `refreshAngleAdditionDiagram` (breaks code-splitting; topic-specific hook in shared UI) |
| 10 | `src/services/topicAvailability.js` | `quizTopicsByGrade` |
| 11 | `src/services/quizGenerationService.js` | `TOPIC_CONTENT_MAP`; `refreshQuestionImages` hardcodes `G4`/`Geometry` |
| 12 | `src/services/questionService.js` | `normalizeTopicValue` strips `/(3rd|4th|grade\s*[34]|g[34])/` — grade-vocabulary-aware regex |
| 13 | Portal: `GoalsModal`, `StudentFocusModal`, `SubtopicsFocusModal`, `sections/StudentsSection`, `TeacherDashboard` | `['G3','G4']` pill tabs, `'3rd Grade'/'4th Grade'` labels, `getTopicsForGrade` |
| 14 | `src/components/CreateClassForm.js` | `gradeLevels = ['G3','G4']` |
| 15 | `src/components/QuestionBankManager.js` | `topicOptions` from `TOPICS`, `gradeOptions = ['G3','G4']` |

### Server (Netlify functions)

| # | Location | Hardcoded knowledge |
|---|----------|--------------------|
| 16 | `netlify/functions/constants.js` | re-export of shared-constants (already single-sourced — good) |
| 17 | `gemini-generate-questions.js` | `TOPIC_GUIDELINES` — per-grade prose with one line per topic; `"3rd grade"/"4th grade"` labels; `[G3,G4]` validation |
| 18 | `gemini-proxy.js` | `VALID_TOPICS_BY_GRADE` validation; per-grade prompt enhancement branches |
| 19 | `upload-pdf-questions-background.js` | valid-topic list embedded in the PDF-extraction prompt; grade labels |
| 20 | `teacher-ai-focus-analysis.js` | `inferGradeForTopic` via `VALID_TOPICS_BY_GRADE`; per-grade guidance map; literal `"G3 or G4"` in the prompt schema |

### Data (Firestore) — constraints, not code to change

| # | Where | Coupling |
|---|-------|----------|
| 21 | user profiles | **topic display names are storage keys**: `dailyGoalsByGrade[grade][topicName]`, `progressByGrade[date][grade][sanitizeTopicName(name)]`, `answeredQuestions[].topic`, `pausedQuizzes[topicName]` |
| 22 | question bank / enrollments / classes | question docs carry `topic` + `grade` fields; `classStudents.allowedSubtopicsByTopic[topicName]`; `classes.gradeLevel` ∈ `{'G3','G4'}` |

Firestore **rules and indexes do not reference topics or grades** — adding topics/grades
requires no rules/index changes.

Known drift risk: subtopic lists currently exist in **three places** (shared-constants,
topic modules, prose inside `TOPIC_GUIDELINES`) with no test asserting they agree.

## 3. Design decisions

### 3.1 Metadata format: JSON manifests (`manifest.json` per topic, `grade.json` per grade)

| Criterion | JSON | YAML | JS module (status quo) |
|---|---|---|---|
| Loadable by CRA/webpack without eject | ✅ native | ❌ needs loader (CRA can't add loaders without eject/CRACO) | ✅ |
| Loadable by Netlify functions (CJS + esbuild) | ✅ `require()` bundles it | ⚠️ runtime parser + `included_files` friction | ❌ topic modules sit in an ESM/JSX dependency graph functions must not touch |
| One file shared verbatim by client + server | ✅ | ⚠️ | ❌ |
| Schema validation + editor autocomplete | ✅ JSON Schema + `$schema` key | ✅ | ⚠️ ad-hoc |
| Comments | ⚠️ none (use `description` fields) | ✅ | ✅ |
| Non-engineer friendliness | ✅ | ✅ | ❌ |

**Decision: JSON.** The deciding constraints are (a) CRA cannot load YAML without ejecting,
and (b) Netlify functions must consume the same metadata without importing the React/JSX
content graph. Plain JSON is natively importable in both worlds, diffable, and validatable
with JSON Schema. YAML's only advantage (comments) is covered by `description` fields and
the schema docs.

Code (question generators, Explanation components) stays in JS — a manifest cannot express
it. Each topic = **`manifest.json` (pure data) + `index.js` (binds manifest to lazy code
loaders)**.

### 3.2 Package layout — the folder is the plugin

```
src/content/
  manifest.schema.json            # JSON Schema for topic manifests
  grade.schema.json               # JSON Schema for grade manifests
  registry.js                     # public API (hand-written facade)
  registry.generated.js           # generated: static imports of every topic index.js
  content-manifest.generated.json # generated: pure-data aggregate (client+server)
  testing/
    topicContractTests.js         # shared generator-contract test suite
  g4/
    grade.json                    # grade metadata (replaces g4/index.js prose)
    algebra/                      # ← a new topic is exactly this folder
      manifest.json
      index.js                    # ~15 lines: manifest + lazy loaders
      questions.js                # generateQuestion(difficulty, allowedSubtopics)
      Explanation.js              # React component
      __tests__/questions.test.js # mostly runTopicContractTests(...)
```

### 3.3 Identity, ordering, and storage-key rules

- `id` — kebab-case slug, **must equal the folder name** (validated).
- `name` — canonical display name **and Firestore storage key** (matches today's behavior:
  goals, progress, question docs, focus restrictions are all keyed by it).
  **Immutable once published.** The schema docs and a lint test enforce: renaming `name`
  orphans student data; instead set a new `displayName` (optional, UI-only) and add the old
  spelling to `aliases`.
- `aliases: string[]` — feeds the existing normalized matching in
  `questionService.normalizeTopicValue` / `subtopicUtils`, so legacy bank questions keep
  matching if labels evolve.
- `order: number` — explicit display order within the grade. Today order is implied by the
  `quizTopicsByGrade` arrays (and differs from the `g4/index.js` import order!); folder
  scanning is alphabetical, so order **must** be explicit. A parity test pins the generated
  order to today's `quizTopicsByGrade` order.
- Sanitization lint: `sanitizeTopicName(name)` must be non-empty and **unique per grade**
  (progress uses it as a Firestore field path segment).

### 3.4 Grade manifests

`src/content/<gradeId>/grade.json`:

```json
{
  "$schema": "../grade.schema.json",
  "id": "g4",
  "key": "G4",
  "label": "4th Grade",
  "shortLabel": "4th",
  "ordinal": 4,
  "description": "Fourth grade mathematics topics",
  "enabled": true,
  "default": false,
  "ai": {
    "promptEnhancement": "Optional grade-wide prompt text used by gemini-proxy."
  },
  "standards": { "Geometry": ["4.G.A.1", "4.G.A.2", "4.G.A.3"] }
}
```

- `key` (`'G4'`) is the **storage key** (profiles' `selectedGrade`, `classes.gradeLevel`,
  question docs' `grade`) — immutable like topic `name`.
- `ordinal` drives sorting, grade normalization (`normalizeClassGrade` matches the digit),
  and the grade-word regex in `questionService`.
- `default: true` marks the grade new students start in (today: hardcoded `"G3"`).
- `enabled: false` lets a grade land fully wired but invisible (safe staging for G5).

### 3.5 Registry & discovery: build-time codegen (recommended)

`scripts/build-content-registry.js` (Node, no transpilation needed — manifests are plain
JSON) scans `src/content/*/grade.json` + `src/content/*/*/manifest.json`, validates every
manifest against the schemas (ajv, devDependency), and emits two committed files:

1. `src/content/registry.generated.js` — static `import`s of each topic's `index.js`,
   grouped by grade, sorted by `order`. Static imports keep Jest happy (no
   `require.context`) and preserve code-splitting (topic `index.js` files stay tiny; heavy
   `questions.js` / `Explanation.js` remain behind dynamic `import()`).
2. `src/content/content-manifest.generated.json` — pure-data aggregate `{ grades: [...],
   topics: [...] }` consumed by `shared-constants.js` (client) **and** by
   `netlify/functions` via `require('../../src/content/content-manifest.generated.json')`
   (esbuild bundles it), exactly like `constants.js` already requires from `src/`.

Wiring: `prestart`, `prebuild`, and `pretest` npm hooks run the script; CI adds a drift
check (`node scripts/build-content-registry.js --check` fails if regeneration changes the
committed output). **The folder alone is the registration** — no import line to forget.

*Conservative fallback (Option B):* keep explicit one-line imports in per-grade `index.js`
files and add a Jest test that `fs`-scans content folders and fails when a folder with a
`manifest.json` isn't registered. Same public registry API either way; switching between
options later is cheap. Choose B only if codegen-in-prehooks proves annoying.

### 3.6 UI theming constraint (Tailwind)

`TopicSelection.topicColors` can't move into JSON as raw class strings — Tailwind's JIT
purges classes it can't see statically. Instead the manifest declares a **named theme**
(`"ui": { "icon": "🅧", "theme": "violet" }`) and one hand-written map in
`src/components/topicThemes.js` holds the literal class bundles (`bg-violet-50`,
`border-violet-200`, …) for every supported theme name. The schema enum limits `theme` to
the supported names; unknown → existing gray default. Adding a theme = one entry in one
file (acceptable: it's styling, not curriculum).

### 3.7 Topic code contract (hooks)

`index.js` exports the manifest spread plus lazy hooks:

```js
import manifest from './manifest.json';

export default {
  ...manifest,
  loadGenerateQuestion: () => import('./questions').then(m => m.generateQuestion),
  loadExplanationComponent: () => import('./Explanation').then(m => m.default),
  // optional — only topics that need it:
  loadQuestionHooks: () => import('./questions').then(m => ({
    prepareForDisplay: m.refreshAngleAdditionDiagram,
  })),
};
```

The optional `prepareForDisplay` hook generalizes the two hardcoded geometry hacks
(`quizGenerationService.refreshQuestionImages` and `QuizView.js`'s eager deep import of
`g4/geometry/questions`) into a declared capability: QuizView/quizGenerationService call it
when the current question's topic provides it, restoring code-splitting.

## 4. Topic manifest schema

```json
{
  "$schema": "../../manifest.schema.json",
  "id": "algebra",
  "name": "Algebra",
  "displayName": "Algebra",
  "grade": "G4",
  "order": 7,
  "description": "Variables, expressions, and simple equations",
  "standards": ["4.OA.A.3", "5.OA.A.1", "5.OA.A.2"],
  "subtopics": ["variables", "expressions", "one-step equations", "patterns"],
  "objectives": [
    "Use a letter to stand for an unknown number",
    "Evaluate simple expressions for a given value",
    "Solve one-step addition and subtraction equations"
  ],
  "ui": { "icon": "🅧", "theme": "violet" },
  "ai": {
    "guidelines": "Focus on reading and writing simple expressions with one variable, evaluating expressions for given whole-number values, and solving one-step equations. Keep numbers within 0-100.",
    "focusGuidelines": "Optional: per-topic guidance for teacher-ai-focus-analysis."
  },
  "legacyExplanationHtml": null,
  "aliases": [],
  "enabled": true,
  "version": 1
}
```

Field rules (enforced by `manifest.schema.json` + a Jest validation test):

| Field | Req | Rule |
|---|---|---|
| `id` | ✅ | kebab-case, equals folder name, unique per grade |
| `name` | ✅ | storage key; immutable once published; `sanitizeTopicName(name)` unique per grade |
| `displayName` | – | UI label override; defaults to `name` |
| `grade` | ✅ | must equal enclosing grade folder's `key` |
| `order` | ✅ | unique integer within grade |
| `subtopics` | ✅ | non-empty; single source of truth (replaces `SUBTOPICS_BY_GRADE_TOPIC`) |
| `ui.theme` | ✅ | enum of names defined in `topicThemes.js` |
| `ai.guidelines` | ✅ | one-paragraph prompt text (replaces its line in `TOPIC_GUIDELINES`) |
| `legacyExplanationHtml` | – | `/xyzExplanation.html` iframe fallback (replaces `conceptExplanationFiles`) |
| `aliases`, `enabled`, `version`, `standards`, `objectives`, `description` | – | as described above |

## 5. Registry API (`src/content/registry.js`)

```js
getAllGrades()                    // enabled grades, sorted by ordinal: [{key,label,shortLabel,ordinal,…}]
getGrade(keyOrId)                 // accepts 'G4' or 'g4'
getDefaultGradeKey()              // grade.json default:true, else lowest ordinal
normalizeGradeKey(value)          // 'g4'|'4th'|'Grade 4'|4 → 'G4' | null   (replaces normalizeClassGrade)
gradeWordPattern()                // regex source for questionService.normalizeTopicValue
getTopicsForGrade(gradeKey)       // enabled topic objects (manifest + loaders), in `order`
getTopicNamesForGrade(gradeKey)   // string[] — drop-in for common_utils.getTopicsForGrade
getTopicByName(name, gradeKey?)   // exact → alias → normalized match
getTopicContent(topicName)        // replaces TOPIC_CONTENT_MAP lookup + content.getTopic
getTopicTheme(topicName)          // class bundle from topicThemes.js
inferGradeForTopic(topicName)     // replaces teacher-ai-focus-analysis helper (also server-side)
```

Server twin: `netlify/functions/content-registry.js` (CJS) exposes the same read-only
queries over `content-manifest.generated.json`, plus prompt builders:
`validTopicsByGrade()`, `topicGuidelinesText(gradeKey)` (assembles the per-topic
`ai.guidelines` lines), `gradeLabel(gradeKey)`.

## 6. Migration plan (phased; each phase independently shippable, zero user-visible change until Phase 5)

### Phase 0 — Guardrails & parity audit (1 PR)

1. Characterization tests freezing today's behavior:
   - `getTopicsForGrade('G3'|'G4')` exact arrays (names **and order**).
   - `VALID_TOPICS_BY_GRADE`, `SUBTOPICS_BY_GRADE_TOPIC` snapshots.
   - `buildPrompt()` output snapshots in `gemini-generate-questions` (per grade) and the
     prompt fragments in `gemini-proxy` / `upload-pdf-questions-background` /
     `teacher-ai-focus-analysis`.
2. **Parity audit test**: assert topic-module `subtopics` ≡ `SUBTOPICS_BY_GRADE_TOPIC`
   entries. Reconcile any drift consciously (this is a latent-bug hunt, not a refactor).

Exit: green tests documenting the exact current surface.

### Phase 1 — Manifests + codegen + derived shared-constants (1–2 PRs)

1. Add `manifest.schema.json`, `grade.schema.json`; add `ajv` (devDependency).
2. Extract each topic module's metadata into `manifest.json` (10 topics); `index.js` shrinks
   to manifest + loaders (§3.7). Add `order` matching `quizTopicsByGrade`; move each topic's
   `TOPIC_GUIDELINES` line into `ai.guidelines`; move `conceptExplanationFiles` entries into
   `legacyExplanationHtml`; move `topicColors` entries into `ui`.
3. Add `grade.json` for g3/g4 (absorbing grade `index.js` standards + labels + the
   `gemini-proxy` per-grade prompt enhancements).
4. Add `scripts/build-content-registry.js` + schema validation + npm pre-hooks + CI drift
   check; commit generated files.
5. Rewrite `shared-constants.js` to **derive** `GRADES`, `TOPICS`, `VALID_TOPICS_BY_GRADE`,
   `SUBTOPICS_BY_GRADE_TOPIC` from `content-manifest.generated.json`, preserving export
   names/shapes (TOPIC constant keys like `MULTIPLICATION` derived from `name`
   upper-snake). Every existing consumer — client and functions — keeps working untouched.

Exit: Phase 0 tests still byte-green; duplication count for topic lists drops to 1.

### Phase 2 — Client consumers move to the registry (2–4 PRs, batched)

Batch A (student app core):
- `common_utils.getTopicsForGrade` → delegates to registry (same signature).
- `appConstants`: `quizTopicsByGrade`, `TOPIC_CONTENT_MAP`, `conceptExplanationFiles`
  become derived exports (then inline callers onto registry calls and delete).
- `topicAvailability.js`, `quizGenerationService.js` (drop `refreshQuestionImages`
  hardcoding via the `prepareForDisplay` hook), `MainApp.js` (`normalizeClassGrade` →
  `normalizeGradeKey`; goal-seeding loops; `"3rd"/"4th"` ternaries → `grade.shortLabel`;
  default grade → `getDefaultGradeKey()`; explanation dispatch → `getTopicContent`).
  **Keep the legacy-G3 dual-write branches literal** (`progress.` vs `progressByGrade.`)
  — that's a data-model legacy tied to historical G3 data, not grade logic.
- `TopicSelection.js` / `Dashboard.js`: grade toggle renders `getAllGrades()` (works for
  N grades); colors/icons via `getTopicTheme`.
- `QuizView.js`: delete the eager geometry import; use the topic hook.

Batch B (portal):
- Pill tabs in `GoalsModal`, `StudentFocusModal`, `SubtopicsFocusModal`,
  `StudentsSection`, `TeacherDashboard` → map over `getAllGrades()`.
- `CreateClassForm.gradeLevels` → `getAllGrades()`.
- `QuestionBankManager` topic/grade dropdowns → registry (topics grouped by grade).
- `questionService.normalizeTopicValue` grade-word regex → `gradeWordPattern()`.
- `subtopicUtils.getSubtopicsForTopic` → `getTopicByName` (alias-aware).

Update the standard unit-test mocks (CLAUDE.md patterns) — provide a canonical
`src/test-utils/contentRegistryMock.js` so section tests stop re-stubbing
`getTopicsForGrade` ad hoc.

Exit: `grep -rn "'G3'\|\"G3\"" src` outside `src/content/`, tests, and the legacy
dual-write block returns nothing; topic names appear only in content folders and tests.

### Phase 3 — Netlify functions (1–2 PRs)

- `gemini-generate-questions.js`: `TOPIC_GUIDELINES` + grade labels + validation from
  `content-registry.js`. Prompt snapshots from Phase 0 must stay **byte-identical**.
- `gemini-proxy.js`: valid-topic validation + per-grade enhancement from grade manifest.
- `upload-pdf-questions-background.js`: valid-topic list + labels from registry.
- `teacher-ai-focus-analysis.js`: `inferGradeForTopic` + guidance + the `"G3 or G4"`
  literal in the response schema → generated grade-key list.
- Error strings like `"Grade must be G3 or G4"` → derived from enabled grade keys.

Exit: no `GRADES.G3`-style literals in functions except via registry; snapshots green.

### Phase 4 — Authoring DX (1 PR)

- `npm run new:topic -- --grade g4 --id algebra --name "Algebra"` and
  `npm run new:grade -- --key G5 --label "5th Grade"` scaffolds (templates for manifest,
  index, questions with one sample generator + subtopic dispatch, Explanation, tests).
- `src/content/testing/topicContractTests.js`: shared suite asserting for any topic —
  generator returns valid question shape across difficulty 0→1, respects
  `allowedSubtopics`, covers every manifest subtopic, multiple-choice answers appear among
  options (`isMultipleChoiceAnswerable`), variety > N distinct signatures over 500 draws
  (generalizing the existing points/lines/rays test).
- `docs/CONTENT_AUTHORING.md`: the two walkthroughs (§7), manifest field reference,
  storage-key immutability warning, theme list.
- Update `CLAUDE.md` (replace the "4–5 places" subtopic checklist with the new one-folder
  flow).

### Phase 5 — Pilot: prove the plug (1 PR each)

1. **Topic pilot**: build *Algebra* (G4, pre-algebra scope: variables, expressions,
   one-step equations, patterns) using only the documented workflow. Ship with
   `enabled: false`, flip on after content review. Acceptance: the PR touches only
   `src/content/g4/algebra/**` + regenerated files.
2. **Grade pilot**: scaffold `g5` with `enabled: false` (one starter topic, e.g. moving
   Algebra to G5 or a placeholder). Acceptance: with `enabled: true` flipped locally, grade
   toggle, portal tabs, class form, goals seeding, and AI validation all work with zero
   code edits; with `false`, production is unchanged.

Any out-of-band edit discovered during the pilots is a bug in Phases 1–4 — fix the
mechanism, not the pilot.

### Phase 6 (optional, later)

- Migrate Firestore keys from topic `name` → `id` (mapping table + backfill script +
  dual-read window). Only worth it if renames become a real need.
- Per-class topic enable/disable in the portal (teacher chooses which enabled topics a
  class sees) — the manifest `enabled` flag plus `allowedSubtopicsByTopic` already give
  most of the value.

## 7. Authoring workflow after migration

**New topic (Algebra):**
1. `npm run new:topic -- --grade g4 --id algebra --name "Algebra"`
2. Fill in `manifest.json` (subtopics, `ai.guidelines`, theme/icon, order).
3. Implement `generateQuestion(difficulty, allowedSubtopics)` in `questions.js`; write
   `Explanation.js`.
4. `npm test` — contract suite validates shape/coverage/variety; schema test validates the
   manifest; codegen runs automatically via `pretest`.
5. Commit. Student picker, goals, dashboard, portal modals, question bank, and all four AI
   functions pick it up.

**New grade (G5):** `npm run new:grade -- --key G5 --label "5th Grade"`, add topic folders,
flip `enabled` when ready. Everything derives.

## 8. Risks & mitigations

| Risk | Mitigation |
|---|---|
| Topic `name` doubles as Firestore key — a rename orphans goals/progress/bank questions/paused quizzes | Schema doc + lint declaring `name` immutable; `displayName` for label changes; `aliases` for matching; Phase 6 id-migration if renames ever matter |
| Tailwind purges JSON-supplied classes | Named-theme enum + literal class map in `topicThemes.js` (§3.6) |
| Prompt-quality regression when `TOPIC_GUIDELINES` is assembled from manifests | Phase 0 snapshots; Phase 3 must be byte-identical before any wording evolves |
| Generated-file drift (stale registry committed) | pre-hooks + CI `--check`; functions and client read the **same** committed JSON |
| `require.context`/Jest incompatibility | avoided entirely — codegen emits static imports |
| Bundle size | manifests are tiny and eager; generators/explanations stay dynamically imported (verify with existing Lighthouse CI) |
| Legacy G3 dual-write accidentally genericized | explicitly kept literal + covered by a Phase 0 characterization test |
| Two topics sanitizing to the same Firestore field path | schema test: `sanitizeTopicName` uniqueness per grade |
| Subtopic drift already present between the three current sources | Phase 0 parity audit surfaces it before consolidation hides it |
| New grade leaks into UI before content is ready | `enabled: false` staging on grades and topics |

## 9. Effort estimate

| Phase | Size |
|---|---|
| 0 Guardrails | ~1 day |
| 1 Manifests + codegen + derived constants | 2–3 days |
| 2 Client consumers (A: student core, B: portal) | 3–5 days (MainApp is the bulk) |
| 3 Functions | 1–2 days |
| 4 DX + docs | 1–2 days |
| 5 Pilots | 1–3 days (mostly Algebra content itself) |

Total ≈ 2–3 weeks of focused work across ~8–11 PRs, each shippable alone.

## 10. Out of scope (and why)

- **Runtime plugins / teacher-authored topics in Firestore**: question generators are code;
  executing remotely-defined code client-side is a security and review problem. The
  question *bank* + AI generation already cover teacher-supplied content.
- **Module federation / dynamic remote bundles**: CRA constraint + no operational need.
- **SEO/about pages**: marketing copy mentioning topics stays hand-written by design.
- **Firestore schema migration to topic ids**: deferred to Phase 6; `name`-as-key with
  immutability + aliases is safe and zero-migration today.
