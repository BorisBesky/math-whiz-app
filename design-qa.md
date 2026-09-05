# Little Planet store QA

Final result: passed — September 5, 2026.

## Design and layout

Little Planet now uses Math Whiz's existing Baloo headings, Nunito body text,
blue and purple controls, white cards, rounded corners, and pastel backgrounds.
The dark stage and serif typography were replaced to match the rest of the app.

The globe occupies a full row above the scenery shop. Both page width caps are
removed for the planet tab, retaining normal page gutters. At a 1440px viewport,
the store is 1408px wide and the globe panel is 1358px wide. Switching to Characters
restores its 1152px store width. The catalog flows into six, three, and two columns
at the checked desktop, tablet, and phone widths. No inner catalog scrollbar.

## Scenery

All 18 rewards have more detail: tiered trees and ferns; flower petals and
butterflies; tent seams, ropes, lanterns and embers; pond ripples and reeds;
cottage roof tiles, shutters and planters; apple crates; windmill sail frames
and hay; alpine ledges; faceted crystals; lighthouse railings and dock posts;
palm leaflets and coconuts; fluted ruins and mosaic paving; spotted mushrooms
and gills; layered waterfall cliffs, foam and a bridge; sailboat rigging and
deck boards; observatory dome ribs and windows; village furniture; and balloon
panels, suspension ropes and a woven basket. The starter campsite, coast, ocean
waves, and clouds are also refined.

The catalog renders 18 thumbnails directly from the actual Three.js models.
It reuses the viewer's renderer and caches the images; category icons remain
available if image capture fails. Static geometry is batched by material.
Focused camera framing brings rewards closer, with a camera floor above the
planet's surface. Orbit, zoom, reset, rotation, and reduced-motion support remain.

## Verification

- `npm run build` passed. Final chunk:
  `rewards-store-planet-details-v39.a476ed80.chunk.js`.
- ESLint passed for all changed JavaScript files.
- 35 tests passed across the six reward/store service suites, covering free
  previews, purchases, balances, duplicate protection, errors, ownership,
  hide/show, pending states, and filters.
- Browser QA used the rebuilt production files at port 8888. Initial iterations
  used `localhost:8888`; another Netlify server subsequently bound the IPv6 port,
  so final QA used `http://127.0.0.1:8888/store?tab=planet&v=planet-details-v39`.
  The final v39 stylesheet was verified in the rendered document.
- Checked 1440 × 1000, 700 × 777, and 390 × 844. Document width equals viewport
  width at each size. At 700px the globe panel is 618px wide; at 390px it is 324px.
- All 18 individual previews were clicked on mobile and allowed to settle.
  Each displayed the correct title and visible item ID, with a ready canvas
  and no horizontal overflow. Full preview reported all 18 IDs.
- Visually reviewed the complete globe front and rear, all 18 catalog images,
  and mobile waterfall and balloon close-ups. Verified category and empty
  collection filters, keyboard orbit, zoom, reset, and rotation/pause.
- Switching tabs removes the planet canvas; returning creates one canvas and
  restores all 18 cached thumbnails. The default viewport was restored.
- No planet rendering errors observed. The static server cannot serve the
  existing background-image Netlify API; its JSON fetch error is unrelated.
  The existing character viewer also reports a Three.js shadow deprecation.
- No live purchases were made. Purchase persistence and prices are unchanged.
  These changes have not been committed, pushed, or deployed.

## Local screenshots

Evidence is saved under the ignored `test-results/little-planet/` directory:
`refined-complete-desktop.png`, `refined-complete-rear.png`,
`refined-catalog-desktop.png`, `refined-complete-mobile.png`,
`refined-waterfall-mobile.png`, `refined-balloon-mobile.png`, and
`refined-complete-tablet.png`.

The original reference remains
https://signals.forwardfuture.com/astra-review/demos/little-planet/index.html.
The world uses original procedural scenery; the reference game's walking,
quests, audio, and journal remain outside this reward-store feature.
