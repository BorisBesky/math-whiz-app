# Content Authoring Guide

How to add curriculum content to Math Whiz. Since the pluggable-content migration
(see `docs/PLUGGABLE_CONTENT_PLAN.md`), **the folder is the registration**: a topic
or grade exists because its folder exists under `src/content/`. There is no list to
edit anywhere else — the student topic picker, daily goals, dashboards, portal
Goals/Focus modals, question-bank dropdowns, and all four AI functions (question
generation, story problems, PDF extraction, teacher focus analysis) derive from the
content manifests.

## Adding a topic

```bash
npm run new:topic -- --grade g4 --id algebra --name "Algebra" [--theme violet] [--icon 🅧]
```

This scaffolds `src/content/g4/algebra/` with:

| File | Purpose |
|---|---|
| `manifest.json` | All metadata (validated against `src/content/manifest.schema.json`) |
| `questions.js` | `generateQuestion(difficulty, allowedSubtopics)` — starts as a contract-passing placeholder |
| `Explanation.js` | React component shown when a student taps "Explain" |
| `index.js` | Binds the manifest to the lazy code loaders (rarely needs editing) |
| `__tests__/questions.test.js` | Topic-specific tests (the shared contract runs automatically) |

Then:

1. **Fill in `manifest.json`** — description, Common Core `standards`, the real
   `subtopics` list, `ai.guidelines` (one line of guidance embedded in AI
   question-generation and story prompts), `ui` icon/theme.
2. **Write the generator** in `questions.js`. Convention: one generator function
   per subtopic, dispatched through a `GENERATORS_BY_SUBTOPIC` map. Rules the
   shared contract enforces (`src/content/__tests__/topicContracts.test.js`):
   - valid question object at every difficulty 0→1 (non-empty `question`,
     non-empty `correctAnswer`);
   - multiple-choice `correctAnswer` appears among `options` character-for-character;
   - every emitted `subtopic` is declared in the manifest (the portal Focus
     feature and repeat-pressure analysis key on it);
   - `allowedSubtopics` restrictions are respected (return `null` if unsatisfiable);
   - variety: ≥ 10 distinct questions over 200 draws (tune per topic in
     `OPTIONS_BY_TOPIC` if a topic legitimately differs).
3. **Write `Explanation.js`** — kid-friendly, worked examples.
4. `npm test` — the contract suite picks the topic up automatically.
5. Flip `"enabled": true` in the manifest and run `npm run generate:content`.
   Until then the topic is fully wired but invisible (safe to merge).

## Adding a grade

```bash
npm run new:grade -- --key G5 --label "5th Grade"
```

Creates `src/content/g5/grade.json` with `"enabled": false`. Add topics with
`new:topic --grade g5 ...`, review the grade's `ai.storyRequirements` wording,
then flip `"enabled": true`. Grade toggles, portal tabs, the class-creation
form, server-side grade validation, and prompt labels all pick it up — zero
code changes. A disabled grade may sit empty; an enabled one must have topics.

## Manifest field reference

See the JSON Schemas (`manifest.schema.json`, `grade.schema.json`) — editors
autocomplete via the `$schema` key. The rules that bite:

- **`name` is a Firestore storage key. NEVER rename it once students have used
  the topic** — daily goals, progress paths, question-bank docs, and focus
  restrictions are keyed by it. To change the label, set `displayName` and add
  the old spelling to `aliases`. Same for a grade's `key`.
- **`order`** controls display order within the grade (unique integer).
- **`ui.theme`** must be one of the named themes in
  `src/components/topicThemes.js` — raw Tailwind classes can't live in JSON
  (the JIT compiler would purge them). Adding a theme = one entry there plus
  the enum in `manifest.schema.json`.
- **`ai.guidelines`** changes live AI prompts — the snapshot tests in
  `src/__tests__/ai-prompt-snapshots.test.js` will flag the diff for review.
- **`subtopicAliases`** maps alternate labels → canonical subtopics (each value
  must be a real subtopic; the codegen enforces it). Use it for legacy labels
  that exist in stored student records.
- **`enabled: false`** stages content invisibly: excluded from student lists,
  validation, and prompts; still resolvable for stored-data lookups.

## How registration works

`scripts/build-content-registry.js` (runs on `prestart`, `prebuild`,
`npm run generate:content`) scans the content folders, validates every manifest
plus cross-file invariants, and emits two committed files:

- `src/content/registry.generated.js` — static imports for the client registry
- `src/content/content-manifest.generated.json` — the pure-data aggregate that
  `shared-constants.js` and the Netlify functions consume

`src/__tests__/content-registry-drift.test.js` fails CI if the committed output
is stale — when it does, run `npm run generate:content` and commit the result.
Query APIs: `src/content/registry.js` (client) and
`netlify/functions/content-registry.js` (server). Never import topic folders
directly from app code; go through the registries.
