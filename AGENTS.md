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

## Open watch-items
- GSC reported 10 "Alternate page with proper canonical tag" URLs for `/about/*`; validation started 2026-05-27 before this fix and should be monitored after deploy.
- GSC reported "Crawled - currently not indexed" for `http://mathwhizapp.kids/` and `https://mathwhizapp.kids/about`; monitor after route-specific raw canonical tags deploy.
- Core Web Vitals has no field data for mobile or desktop as of 2026-05-25.
