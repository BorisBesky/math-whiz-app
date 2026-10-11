# Theme

## Part 1 — Compact token summary

Tailwind 3 default palette + custom `theme.extend` (tailwind.config.js). No CSS variables / dark mode.

**Brand colors (`brand-*`)**: blue `#2563eb` (= Tailwind blue-600, the site primary), coral `#f56565`, mint `#48d1a5`, sunny `#f6c844`, purple `#7c3aed`, pink `#ec4899`, sky `#38bdf8`, orange `#fb923c`.
**Topic accents (`topic-*`)**: multiplication #2563eb, division #7c3aed, fractions #f56565, geometry #48d1a5, measurement #f6c844, decimals #ec4899, patterns #fb923c, data-graphs #38bdf8.
**Primary action**: `bg-blue-600 hover:bg-blue-700 text-white` (`ACCENT.primaryButton` in `src/theme/accent.js`; portal PortalButton primary, login buttons, pagination active), student app uses `bg-brand-blue` (#2563eb) + `font-display font-bold rounded-button`. One primary button per portal view; everything else secondary (white, gray-300 border) / ghost / danger (red).
**Focus**: global `:focus-visible { outline: 2px solid #2563eb }`; Tailwind `focus-visible:ring-2 ring-blue-500`. Selection highlight rgba(37,99,235,.2).
**Neutrals**: gray-50..900, slate-50 page bg (portal), slate-900/45 modal scrim.
**Semantic**: success green-50/600/700; warning amber-50/200/600/800; danger red-50/200/600/700.
**Fonts**: display `"Baloo 2", Fredoka, Comic Sans MS, cursive` (`font-display`, student app only — never in the portal); body `Nunito, Segoe UI, system-ui, sans-serif` (portal modal titles: Nunito `text-lg font-semibold text-gray-900`).
**Portal tokens in code**: `src/theme/accent.js` — `ACCENT`, `BUTTON_SHAPE`, `BUTTON_VARIANTS`, `BUTTON_SIZES`, `buttonClasses()`, `MODAL` (raw source below).
**Type scale**: Tailwind default (text-xs 12, sm 14, base 16, lg 18, xl 20, 2xl 24).
**Radius**: `rounded-card` 1rem (cards, modal panels), `rounded-button` 0.75rem (all portal and student text buttons, via `BUTTON_SHAPE`); `rounded-lg` 0.5rem for 32px icon buttons, sidebar nav items and inputs; `rounded-full` pills/avatars.
**Shadows**: card `0 2px 12px rgba(0,0,0,.08)`, card-hover `0 8px 30px rgba(0,0,0,.12)`, glow-blue `0 0 20px rgba(37,99,235,.25)`, glow-green, glow-coral, inner-soft.
**Spacing**: Tailwind default 4px scale. **Breakpoints**: Tailwind default sm 640, md 768, lg 1024, xl 1280.
**Motion**: bounce-in, slide-up, celebrate, pulse-soft, shake, fade-in, progress-fill keyframes.

## Part 2 — Raw sources

### `tailwind.config.js`

```js
/** @type {import('tailwindcss').Config} */
export const content = [
  "./src/**/*.{js,jsx,ts,tsx}",
];
export const theme = {
  extend: {
    colors: {
      // Brand palette — playful, warm, kid-friendly
      brand: {
        blue: '#2563eb',
        coral: '#f56565',
        mint: '#48d1a5',
        sunny: '#f6c844',
        purple: '#7c3aed',
        pink: '#ec4899',
        sky: '#38bdf8',
        orange: '#fb923c',
      },
      // Per-topic accent colors for topic cards
      topic: {
        multiplication: '#2563eb',
        division: '#7c3aed',
        fractions: '#f56565',
        geometry: '#48d1a5',
        measurement: '#f6c844',
        decimals: '#ec4899',
        patterns: '#fb923c',
        'data-graphs': '#38bdf8',
      },
    },
    fontFamily: {
      display: ['"Baloo 2"', 'Fredoka', 'Comic Sans MS', 'cursive'],
      body: ['"Nunito"', '"Segoe UI"', 'system-ui', 'sans-serif'],
    },
    borderRadius: {
      'card': '1rem',
      'button': '0.75rem',
    },
    boxShadow: {
      'card': '0 2px 12px rgba(0, 0, 0, 0.08)',
      'card-hover': '0 8px 30px rgba(0, 0, 0, 0.12)',
      'glow-blue': '0 0 20px rgba(37, 99, 235, 0.25)',
      'glow-green': '0 0 20px rgba(72, 209, 165, 0.3)',
      'glow-coral': '0 0 20px rgba(245, 101, 101, 0.25)',
      'inner-soft': 'inset 0 2px 4px rgba(0, 0, 0, 0.06)',
    },
    keyframes: {
      'bounce-in': {
        '0%': { transform: 'scale(0.3)', opacity: '0' },
        '50%': { transform: 'scale(1.08)' },
        '70%': { transform: 'scale(0.95)' },
        '100%': { transform: 'scale(1)', opacity: '1' },
      },
      'slide-up': {
        '0%': { transform: 'translateY(20px)', opacity: '0' },
        '100%': { transform: 'translateY(0)', opacity: '1' },
      },
      'celebrate': {
        '0%': { transform: 'scale(1)' },
        '15%': { transform: 'scale(1.15) rotate(-3deg)' },
        '30%': { transform: 'scale(1.15) rotate(3deg)' },
        '45%': { transform: 'scale(1)' },
      },
      'pulse-soft': {
        '0%, 100%': { opacity: '1' },
        '50%': { opacity: '0.7' },
      },
      'shake': {
        '0%, 100%': { transform: 'translateX(0)' },
        '20%': { transform: 'translateX(-6px)' },
        '40%': { transform: 'translateX(6px)' },
        '60%': { transform: 'translateX(-4px)' },
        '80%': { transform: 'translateX(4px)' },
      },
      'fade-in': {
        '0%': { opacity: '0' },
        '100%': { opacity: '1' },
      },
      'progress-fill': {
        '0%': { transform: 'scaleX(0)' },
        '100%': { transform: 'scaleX(1)' },
      },
    },
    animation: {
      'bounce-in': 'bounce-in 0.5s cubic-bezier(0.68, -0.55, 0.27, 1.55)',
      'slide-up': 'slide-up 0.4s ease-out',
      'celebrate': 'celebrate 0.6s ease-in-out',
      'pulse-soft': 'pulse-soft 2s ease-in-out infinite',
      'shake': 'shake 0.5s ease-in-out',
      'fade-in': 'fade-in 0.3s ease-out',
      'progress-fill': 'progress-fill 0.6s ease-out',
    },
  },
};
export const plugins = [];

```

### `src/theme/accent.js`

```js
/**
 * The app's interactive accent: Tailwind blue-600 (#2563eb, `brand.blue` in
 * tailwind.config.js) with blue-700 on hover. Use these for primary action
 * buttons, focus rings, selected states, checkboxes and toggles so new
 * screens don't drift to other colors.
 *
 * Purple stays only where it is purple on purpose: the admin role badge,
 * the Admin login link and the AI-generation modal header bands. Decorative
 * portal surfaces (logo tile, class icons, stat tiles, avatars) use the blue
 * family so the portal reads as one accent color.
 */
export const ACCENT = Object.freeze({
  /** Solid primary action button (pair with your own padding/shape). */
  primaryButton: 'bg-blue-600 text-white hover:bg-blue-700',
  /** Text-only accent, e.g. links and selected segmented-control labels. */
  text: 'text-blue-700',
  /** Icon tint. */
  icon: 'text-blue-600',
  /** Selected list row / chip. */
  selected: 'bg-blue-50 text-blue-700',
  /** Selected card border. */
  selectedBorder: 'border-blue-300',
  /** Small solid count badge. */
  badge: 'bg-blue-600 text-white',
  /** Soft icon tile. */
  softTile: 'bg-blue-100 text-blue-600',
  /** Input focus ring. */
  focusRing: 'focus:ring-blue-500',
  /** Input focus border + ring. */
  inputFocus: 'focus:border-blue-500 focus:ring-blue-500',
  /** Native checkbox/radio. */
  checkbox: 'text-blue-600 focus:ring-blue-500',
  /** Progress bars and similar fills. */
  fill: 'bg-blue-600',
});

/**
 * Portal button shape: 12px corners (`rounded-button` in tailwind.config.js),
 * the same radius the student app uses for its call-to-action buttons.
 */
export const BUTTON_SHAPE = 'rounded-button';

const BUTTON_BASE = [
  'inline-flex items-center justify-center gap-2 font-medium transition-colors',
  BUTTON_SHAPE,
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1',
  'disabled:cursor-not-allowed disabled:opacity-50',
].join(' ');

export const BUTTON_VARIANTS = Object.freeze({
  primary: `${ACCENT.primaryButton} shadow-sm`,
  secondary: 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 shadow-sm',
  ghost: 'text-gray-600 hover:bg-gray-100',
  danger: 'bg-white text-red-600 border border-red-200 hover:bg-red-50',
  dangerSolid: 'bg-red-600 text-white hover:bg-red-700 shadow-sm',
});

export const BUTTON_SIZES = Object.freeze({
  sm: 'px-3 py-1 text-sm',
  md: 'px-3 py-2 text-sm',
  lg: 'px-4 py-2 text-sm',
});

/**
 * Class string for a portal button. `PortalButton` uses this; reach for it
 * directly only when a component can't render `PortalButton` (e.g. a link).
 */
export const buttonClasses = ({ variant = 'secondary', size = 'md' } = {}) =>
  [BUTTON_BASE, BUTTON_SIZES[size] || BUTTON_SIZES.md, BUTTON_VARIANTS[variant] || BUTTON_VARIANTS.secondary].join(' ');

/**
 * Shared modal chrome for portal dialogs (ModalWrapper and the class detail
 * window): scrim, panel corners and the white header with a Nunito title.
 */
export const MODAL = Object.freeze({
  overlay: 'bg-slate-900/45 backdrop-blur-[1px]',
  panel: 'bg-white rounded-card border border-gray-200 shadow-2xl',
  header: 'flex items-center justify-between gap-3 px-6 py-4 border-b border-gray-200 flex-shrink-0',
  title: 'text-lg font-semibold text-gray-900',
  subtitle: 'text-sm text-gray-500',
  iconTile: 'inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600',
  close:
    'rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500',
});

export default ACCENT;
```

### `src/index.css`

```css
@import "tailwindcss/base";
@import "tailwindcss/components";
@import "tailwindcss/utilities";

/* ── Global Defaults ───────────────────────────────────── */
html {
  scroll-behavior: smooth;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

body {
  font-family: 'Nunito', 'Segoe UI', system-ui, sans-serif;
}

/* Brand selection highlight */
::selection {
  background-color: rgba(37, 99, 235, 0.2);
  color: inherit;
}

/* Accessible focus ring */
:focus-visible {
  outline: 2px solid #2563eb;
  outline-offset: 2px;
  border-radius: 4px;
}

/* ── Utility Component Classes ─────────────────────────── */
@layer components {
  .font-display {
    font-family: 'Baloo 2', 'Fredoka', 'Comic Sans MS', cursive;
  }

  /* Gradient text utility */
  .text-gradient-brand {
    background: linear-gradient(135deg, #2563eb, #7c3aed);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  /* Card base style */
  .card-base {
    @apply bg-white rounded-card shadow-card transition-all duration-300;
  }

  .card-base:hover {
    @apply shadow-card-hover;
  }

  /* Animated progress bar fill */
  .progress-bar-animated {
    transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  }
}

/* ── Staggered animation delays ────────────────────────── */
.stagger-1 { animation-delay: 0.05s; }
.stagger-2 { animation-delay: 0.1s; }
.stagger-3 { animation-delay: 0.15s; }
.stagger-4 { animation-delay: 0.2s; }
.stagger-5 { animation-delay: 0.25s; }
.stagger-6 { animation-delay: 0.3s; }

```

### `src/components/topicThemes.js`

```js
// Topic card theming (docs/PLUGGABLE_CONTENT_PLAN.md, Phase 2).
//
// Manifests declare a named theme ("ui": { "theme": "blue" }); this module
// owns the literal Tailwind class strings for each name. The classes MUST
// stay literal in source — Tailwind's JIT purges anything it cannot see
// statically, which is why raw class names never live in manifest JSON.
// Adding a theme = one entry here plus the enum in manifest.schema.json.
import { getTopicByName } from '../content/registry';

export const TOPIC_THEME_CLASSES = {
  blue:    { bg: 'bg-blue-50',    border: 'border-blue-200',    accent: 'bg-blue-500',    text: 'text-blue-700',    hoverBg: 'hover:bg-blue-100',    lightBg: 'bg-blue-100' },
  purple:  { bg: 'bg-purple-50',  border: 'border-purple-200',  accent: 'bg-purple-500',  text: 'text-purple-700',  hoverBg: 'hover:bg-purple-100',  lightBg: 'bg-purple-100' },
  rose:    { bg: 'bg-rose-50',    border: 'border-rose-200',    accent: 'bg-rose-500',    text: 'text-rose-700',    hoverBg: 'hover:bg-rose-100',    lightBg: 'bg-rose-100' },
  amber:   { bg: 'bg-amber-50',   border: 'border-amber-200',   accent: 'bg-amber-500',   text: 'text-amber-700',   hoverBg: 'hover:bg-amber-100',   lightBg: 'bg-amber-100' },
  teal:    { bg: 'bg-teal-50',    border: 'border-teal-200',    accent: 'bg-teal-500',    text: 'text-teal-700',    hoverBg: 'hover:bg-teal-100',    lightBg: 'bg-teal-100' },
  indigo:  { bg: 'bg-indigo-50',  border: 'border-indigo-200',  accent: 'bg-indigo-500',  text: 'text-indigo-700',  hoverBg: 'hover:bg-indigo-100',  lightBg: 'bg-indigo-100' },
  pink:    { bg: 'bg-pink-50',    border: 'border-pink-200',    accent: 'bg-pink-500',    text: 'text-pink-700',    hoverBg: 'hover:bg-pink-100',    lightBg: 'bg-pink-100' },
  orange:  { bg: 'bg-orange-50',  border: 'border-orange-200',  accent: 'bg-orange-500',  text: 'text-orange-700',  hoverBg: 'hover:bg-orange-100',  lightBg: 'bg-orange-100' },
  emerald: { bg: 'bg-emerald-50', border: 'border-emerald-200', accent: 'bg-emerald-500', text: 'text-emerald-700', hoverBg: 'hover:bg-emerald-100', lightBg: 'bg-emerald-100' },
  cyan:    { bg: 'bg-cyan-50',    border: 'border-cyan-200',    accent: 'bg-cyan-500',    text: 'text-cyan-700',    hoverBg: 'hover:bg-cyan-100',    lightBg: 'bg-cyan-100' },
  violet:  { bg: 'bg-violet-50',  border: 'border-violet-200',  accent: 'bg-violet-500',  text: 'text-violet-700',  hoverBg: 'hover:bg-violet-100',  lightBg: 'bg-violet-100' },
  // Also the fallback look for unknown themes; text-gray-600 matches the
  // historical default card style.
  gray:    { bg: 'bg-gray-50',    border: 'border-gray-200',    accent: 'bg-gray-500',    text: 'text-gray-600',    hoverBg: 'hover:bg-gray-100',    lightBg: 'bg-gray-100' },
};

const FALLBACK_ICON = '📚';

/**
 * Resolves a topic (module object or student-facing name) to its card theme:
 * the Tailwind class bundle for its manifest ui.theme plus its ui.icon.
 * Unknown topics or themes get the historical gray default.
 */
export const getTopicTheme = (topicOrName) => {
  const topic = typeof topicOrName === 'string' ? getTopicByName(topicOrName) : topicOrName;
  const classes = TOPIC_THEME_CLASSES[topic?.ui?.theme] || TOPIC_THEME_CLASSES.gray;
  return { ...classes, icon: topic?.ui?.icon || FALLBACK_ICON };
};

```

