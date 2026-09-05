# Little Planet store QA

final result: passed

## Scope and visual reference

This is an adaptation of the Little Planet globe into the existing Math Whiz
rewards store: free starter scenery, purchasable additions, and persistent
collections. The reference's walking character, discovery quests, audio, and
field journal are outside this store-building feature. The scenery is original
procedural Three.js geometry; no remote game code or runtime is embedded.

- Reference: https://signals.forwardfuture.com/astra-review/demos/little-planet/index.html
- Source capture: `test-results/little-planet/reference.png` (700 × 777).
- Implementation: http://localhost:8888/store?tab=planet&v=little-planet-v36
- Desktop capture: `test-results/little-planet/desktop-complete.png` (1280 × 1000).
- Phone captures: `test-results/little-planet/mobile-complete.png` and
  `test-results/little-planet/mobile-focused.png` (390 × 844).
- Captures were displayed together for comparison. The reference is a full-screen
  game and the implementation is a store panel, so comparison concerns the globe,
  scenery, palette, and interaction clarity rather than pixel-identical chrome.
  Source and implementation globe orientations differ. Captures use CSS-sized
  screenshots; no density scaling was needed. Screenshot files are local QA
  evidence in the ignored test-results directory.

## Findings and iterations

1. Initial complete world was too sparse. Each purchase now includes surrounding
   foliage, rocks, or paths. The final desktop comparison shows connected scenery
   and clear differences between a starter and completed planet. Static scenery
   is batched by material so the extra detail does not require a draw call per leaf.
2. Item names and purchase details were too small. Catalog labels are now 13px,
   details 12px, and the primary purchase control has a 44px minimum height.
3. On phones, choosing an item could leave its preview above the viewport.
   Selection now scrolls to the globe below the fixed app header, and a visible
   details shortcut returns to the item's purchase controls. Verified at 390px.
4. Focused previews needed an oblique camera angle and stronger header contrast.
   The camera now moves toward the selected landmark, with orbit limits outside
   the globe. Header labels have a dark backing. The waterfall stream was moved
   in front of its rock face. The final focused phone capture verifies these fixes.

No remaining actionable P0/P1/P2 issues in the new store section.

## Required visual surfaces

- Typography: serif globe headings and understated labels reflect the reference;
  the surrounding store retains the existing app typography. Names and prices
  wrap without truncating purchase information.
- Layout: desktop globe/shop split; phone layout stacks them. The 390px and
  1280px document widths equal their viewport widths, with no horizontal overflow.
  Long catalogs scroll inside the shop; filters and item details remain available.
- Colors: dark blue-green stage, muted green land, pale snow, sandy desert, and
  warm accents follow the reference. Ownership, preview, disabled, and saving
  states are explained with text as well as color.
- Scenery: native 3D, faceted terrain and radial models remain sharp while
  rotating or zooming. The complete preview includes all 18 catalog items.
  The focused waterfall capture and desktop globe comparison provide closer
  evidence beyond the overall layout check.
- Copy: free starter, temporary previews, prices, insufficient coins, collection
  ownership, and hide/show behavior are explicit. No preview implies a purchase.

## Verification

- Production build passed. Store chunk:
  `rewards-store-little-planet-v36.c1a63ed8.chunk.js`.
- ESLint passed for new components, scene, catalog, service, and store integration.
- 35 tests passed across six store/service suites, including the 14 new tests.
  After the final UI changes, the 14 new tests were rerun successfully.
- Tests cover exact/insufficient balances, duplicate purchases, missing profiles,
  invalid items, errors/retry, free previews, ownership/visibility compatibility,
  hide/show without repurchase, pending-button protection, and filters.
- Browser checks: real rebuilt store tab/deep link; starter globe; full world;
  category and collection filters; focused preview; insufficient funds; mobile
  preview/details navigation; keyboard orbit; zoom; reset; and rotation/pause.
- Canvas reported ready and all 18 item IDs in complete-world mode.
- No new planet rendering errors were observed. The static preview server cannot
  serve the existing Netlify store-background API, so the app logs an unrelated
  background-image JSON fetch error. An earlier Three.js shadow deprecation
  warning in the planet viewer was fixed by using PCFShadowMap.
- Purchase/visibility writes were tested with mocked Firestore transactions;
  no live student's coins were spent. No new Firestore paths/rules are needed:
  the two new compact arrays use the existing profile document and permissions.
- Production was not deployed.

## Follow-up polish

The globe is intentionally simpler than the reference's full exploration game.
Additional scenery models and richer ambient animation can extend the catalog
without changing the ownership or transaction format.
