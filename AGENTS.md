# AGENTS.md - math-whiz-app

## Site
- URL: https://mathwhizapp.kids
- Purpose: Free adaptive math practice app for 3rd and 4th grade students, teachers, and parents.

## Tech stack
- React 19 via Create React App / `react-scripts`
- React Router DOM 7 SPA
- Firebase Auth + Firestore
- Netlify hosting with serverless functions and edge functions
- Tailwind CSS

## SEO-relevant file map
- Sitemap: `netlify/edge-functions/sitemap.js`, mounted at `/sitemap.xml` from `netlify.toml`
- Robots.txt: `netlify/edge-functions/robots.js`, mounted at `/robots.txt` from `netlify.toml`
- Static base head: `public/index.html`
- Route-specific SEO head: `src/components/about/SeoHead.js`
- Route-specific edge head injection: `netlify/edge-functions/seo-head.js`
- SEO page registry: `src/components/about/seoPageConfig.js`
- Marketing routes: `src/components/about/` and `src/components/about/pages/`
- SPA routes: `src/App.js`

## Build / deploy notes that affect SEO
- The app is an SPA served from `build/index.html`.
- Netlify redirects all routes to `/index.html`, so raw HTML is otherwise identical for every route.
- Google may see raw HTML canonical/meta before client-side React updates run.
- Public marketing pages under `/about` need edge-injected canonical/title/meta tags for crawlable route-specific HTML.
- Netlify edge functions are configured in `netlify.toml`.

## Codebase conventions
- New SEO landing pages are added to `SEO_PAGES` in `src/components/about/seoPageConfig.js`.
- Add matching public sitemap entries in `netlify/edge-functions/sitemap.js`.
- Add matching route metadata in `netlify/edge-functions/seo-head.js` so the raw HTML canonical matches the final SPA route.
- Internal links between marketing pages use React Router `<Link to="/about/<slug>">`.
- Do not add authenticated app, admin, teacher, portal, or login routes to the public sitemap.

## Standing notes / do-not-touch
- `/app/`, `/admin`, `/teacher`, and `/portal` are intentionally disallowed in robots.txt.
- `/login` is a public app entry point but is not an SEO landing page and should stay out of the sitemap.

## Prior SEO fixes
- 2026-05-28 - GSC alternate canonical pages for `/about/*` SEO routes - PR https://github.com/BorisBesky/math-whiz-app/pull/51 - files: `netlify/edge-functions/seo-head.js`, `netlify.toml`, `netlify/edge-functions/sitemap.js`, `AGENTS.md`, `CLAUDE.md` - notes: Added edge-injected route-specific canonical/title/meta for `/about` pages and removed `/login` from sitemap.

## Reward store / 3D character notes
- Character store code lives in `src/components/rewards/` with the lazy-loaded store chunk named in `src/MainApp.js`.
- When changing reward store or character viewer code, always update the `webpackChunkName` for `RewardsStore`, rebuild, and validate against the new query/chunk URL on `localhost:8888`. The in-app browser may keep old chunks cached unless the chunk id changes.
- Visual QA for store items must wait for the category and item card to be visible, click the item, then wait for the canvas render to settle before taking screenshots. Fast snapshots can capture the previous/default preview.
- Users must buy characters before selecting them. Character price is 60 coins; Buddy is the default starter character. Existing users may keep their previously selected character during migration.
- Current character availability rule: Buddy, Milo, Pip, and Leo should not have Dresses or Skirts. Cora, Sunny, and Mia may have Dresses and Skirts.
- Cora intentionally has no tail; previous tail shapes looked detached or odd from side/rear angles.
- Bow ties should use rounded flattened lobes plus a center knot, not diamond/rhombus cone shapes.
- For character-fit work, validate front and rear/side views where relevant, especially Back Gear, Neckwear, Jewelry, and Props.

## Question bank / history notes
- Class question copies under `artifacts/{appId}/classes/{classId}/questions` must include enough metadata for student-side filtering: `subtopic`, `operation`, and `tags` should be copied from the source question when assigning to a class. Students can read class question copies, but should not rely on reading private teacher question-bank source documents at quiz time.
- Client-side class-question cache keys live in `src/utils/questionCache.js`. When changing the shape or required metadata of cached class questions, bump the cache prefix to avoid stale localStorage entries.
- Student focus filtering uses `allowedSubtopicsByTopic` from `classStudents`; subtopic normalization needs to support Firestore REST-style values such as `arrayValue.values[].stringValue` as well as plain arrays.
- Do not store full answer history in the student profile document. The profile should keep compact summary fields such as `questionSummary` and `questionStatsByDate`; per-question history belongs in `artifacts/{appId}/users/{studentId}/attempts/{attemptId}`.
- `get-all-students` should return compact student summaries by default. Full question history should be lazy-loaded only for student detail/history views via a dedicated history endpoint.
- When adding or moving attempt/history paths, update Firestore rules and deploy them before testing student quiz writes. The client helper for attempts is `getUserAttemptsCollectionRef()` in `src/utils/firebaseHelpers.js`.
- Existing legacy `answeredQuestions` arrays were migrated to the attempts subcollection and removed from profiles to avoid Firestore's 1 MiB document limit. Keep fallbacks for old profile history only as transitional compatibility, not as the primary write path.

## Open watch-items
- GSC reported 10 "Alternate page with proper canonical tag" URLs for `/about/*`; validation started 2026-05-27 before this fix and should be monitored after deploy.
- GSC reported "Crawled - currently not indexed" for `http://mathwhizapp.kids/` and `https://mathwhizapp.kids/about`; monitor after route-specific raw canonical tags deploy.
- Core Web Vitals has no field data for mobile or desktop as of 2026-05-25.
