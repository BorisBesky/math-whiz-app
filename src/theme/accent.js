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
