# Math Whiz — Design System

> Code source of truth for portal color and shape: `src/theme/accent.js` (`ACCENT`, `BUTTON_SHAPE`, `BUTTON_VARIANTS`, `BUTTON_SIZES`, `buttonClasses()`, `MODAL`), used by `src/components/portal/PortalUI.js` and `src/components/ui/ModalWrapper.js`. `src/theme/__tests__/accent.test.js` guards it: shared buttons must be 12px with a focus ring; there must be no purple in the portal, account or guest UI (the allowlist is empty); there must be no `font-display` in the portal or account UI. Keep this file in sync with those files.

## Product context
Math Whiz is a kid-friendly math practice web app for grades 3–4. It has two surfaces:
- **Student app** (`/`): playful. Topic cards, quizzes, coins/rewards store, dashboard. Display font Baloo 2, 12px `rounded-button` buttons, brand-blue primary (topic/grade identity colors are decorative).
- **Teacher/Admin portal** (`/portal`): calm, data-dense workspace. Sidebar nav, Overview stats, Students table with per-row icon actions, Classes with a Class Detail window (roster, teachers, question-pool health), Question Bank, Messages, Settings, My Account.

JTBD (teacher): see who is active or struggling, set daily goals and focus subtopics, manage class rosters, invite students, add questions.

## Color
- **Primary (one accent across the portal): Blue.** `#2563eb` (Tailwind blue-600, token `brand-blue`), hover `#1d4ed8` (blue-700). Code: `ACCENT.primaryButton` = `bg-blue-600 text-white hover:bg-blue-700`.
  - Tints: blue-50 (active nav background, selection bar, icon tiles, grade pills), blue-100, blue-500 (focus rings), blue-700 (active nav text, links).
- **Primary usage:**
  - primary buttons, active nav item and its left indicator bar;
  - focus rings (`focus-visible:ring-2 ring-blue-500`, global `:focus-visible` outline `#2563eb`);
  - checkboxes and toggles, the selection bar, active pagination, active tab text, spinners, icon tiles.
- **Decorative portal surfaces use the blue family:**
  - sidebar logo tile: solid `bg-blue-600`;
  - class card icons: `bg-blue-50 text-blue-600`;
  - Overview stat tiles: Total Students blue-50/600, Active Today green-50/600, Avg. Accuracy sky-50/600, Questions Answered amber-50/600.
- **Avatars:** rotating identity tints of blue, cyan, emerald, amber, pink and sky (`-100` background, `-700` text). There is no purple.
- **Neutrals:** gray-50…900; page background slate-50 `#f8fafc`; cards white with a gray-200/80 border; modal scrim slate-900/45.
- **Semantic:**
  - success: green (green-50/700 pills, green-600 icons);
  - warning: amber (amber-50 background, amber-200 border, amber-600 icon, amber-800/900 text);
  - **danger: red.** Destructive actions only: outline danger button = white background, red-200 border, red-600 text, red-50 hover; solid confirm = red-600 / red-700.
- **Intentional exceptions (purple on purpose):**
  - the admin role badge and the "Admin" login link in the student app header (`AppHeader`);
  - the AI-generation dialog header bands: `GenerateQuestionsModal` purple→pink, `ImageGenerationModal` indigo→purple;
  - the Question Bank "drawing" question-type tag.
- **Secondary brand palette (student app and topic identity only, never portal actions):** coral #f56565, mint #48d1a5, sunny #f6c844, purple #7c3aed, pink #ec4899, sky #38bdf8, orange #fb923c.

## Typography
- Body/UI: **Nunito**, Segoe UI, system-ui, sans-serif. The portal uses Nunito everywhere, including modal titles.
- Display: **"Baloo 2"**, Fredoka (`font-display`). **Student app only.** Never in the portal or account UI (guarded by test).
- Portal scale:
  - page title: text-xl/600;
  - section title: text-base–lg/600;
  - **modal title: text-lg/600 gray-900** (`MODAL.title`);
  - body: text-sm/400–500;
  - table headers: text-xs uppercase tracking-wide/600 gray-600;
  - meta: text-xs gray-400/500.
- Buttons: text-sm font-medium in the portal; student app CTAs use font-display font-bold.

## Shape, spacing, elevation
- **Radius:**
  - **all text buttons: `rounded-button` 12px** (`rounded-xl`, `BUTTON_SHAPE`). Portal, modal footers, pagination and header Sign out all match the student app.
  - **8px `rounded-lg`:** 32×32 icon buttons, overflow-menu triggers, sidebar nav items.
  - **Form inputs/selects:** mostly 6–8px (`rounded-md`/`rounded-lg`); a few modal inputs use `rounded-button`.
  - **Cards and modal panels:** `rounded-card` 16px.
  - **Pills and avatars:** `rounded-full`.
- **Spacing:** Tailwind 4px scale; card padding 20px (p-5); page padding 32px on desktop; table cells px-4 py-3; modal header px-6 py-4.
- **Shadows:** `shadow-card` 0 2px 12px rgba(0,0,0,.08); hover 0 8px 30px rgba(0,0,0,.12); buttons shadow-sm; modals shadow-2xl.

## Components (portal)
- **Buttons.** `PortalButton` / `buttonClasses({ variant, size })`. Every variant is 12px with a `focus-visible:ring-2 ring-blue-500 ring-offset-1` ring, a hover color and disabled opacity-50.
  - Variants:
    - primary = blue-600 background, white text, shadow-sm;
    - secondary = white background, gray-300 border, gray-700 text, gray-50 hover;
    - ghost = gray-600 text, gray-100 hover;
    - danger = white background, red-200 border, red-600 text;
    - dangerSolid = red-600.
  - Sizes: sm px-3 py-1, md px-3 py-2, lg px-4 py-2. Icon 16px on the left with an 8px gap.
- **One primary per view.** Each screen, card or dialog has at most one blue primary button; everything else is secondary (outline), ghost or danger.
  - Class Detail: **Invite Students** is primary. Edit Class, Add (teacher), Refresh and Assign to class are secondary.
  - Modals: Cancel is secondary, Save is primary.
- **IconButton:** 32×32, 8px radius, gray-500 icon; hover tints default/blue/emerald/red; focus-visible ring.
- **Modals:** `ModalWrapper` plus `ModalHeader`, styled by the `MODAL` tokens.
  - Scrim: slate-900/45 with a slight blur. Panel: white, `rounded-card`, gray-200 border, shadow-2xl.
  - **Shared white header:** optional blue-50 icon tile, optional uppercase eyebrow, Nunito semibold gray-900 title, gray-500 subtitle, actions, gray-400 close with hover.
  - Goals, Focus Areas and Focus subtopics use this header (no gradient bands).
  - **Class Detail uses the same shared modal chrome and header.** Its eyebrow is "Class Detail" and Edit Class sits in the header actions.
  - Footer: px-6 py-4, gray-50 background, top border, right-aligned buttons.
- **Selection bar:** gray-50/70 when empty; blue-50 with a blue-100 border when rows are selected.
- **Pills:** class pill green-50/green-700; grade pill blue-50/blue-700; count pill gray-100/gray-600.
- **Icons:** lucide-react, 16–20px stroke icons.

## Motion
Portal: subtle only. `transition-colors` on buttons, rows and nav; modals open without keyframe animation (ModalWrapper uses transition-opacity/transition-all). The keyframe animations in tailwind.config.js (bounce-in, slide-up, celebrate, pulse-soft, shake, fade-in, progress-fill) are for the student app; no bouncy motion in the portal.
