/**
 * The app's interactive accent: Tailwind blue-600 (#2563eb, `brand.blue` in
 * tailwind.config.js) with blue-700 on hover. Use these for primary action
 * buttons, focus rings, selected states, checkboxes and toggles so new
 * screens don't drift to other colors.
 *
 * Purple stays for things that are purple on purpose: the admin role badge
 * and Admin login link, avatar/stat color palettes, the portal logo gradient,
 * and the AI-generation modal headers.
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
  /** Modal header band. */
  headerGradient: 'bg-gradient-to-r from-blue-600 to-blue-500',
});

export default ACCENT;
