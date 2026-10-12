# Shared UI components

Framework: React 19 (CRA / react-scripts 5), React Router 7, Tailwind CSS 3 (custom tokens in tailwind.config.js), lucide-react icons. No third-party component library; primitives are hand-rolled.

## Portal accent & shape tokens — ACCENT colors, BUTTON_SHAPE (12px `rounded-button`), BUTTON_VARIANTS / BUTTON_SIZES / buttonClasses(), MODAL chrome (scrim, panel, white header, Nunito title, close). Code source of truth for portal color/shape; guarded by `src/theme/__tests__/accent.test.js`

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

## PortalUI primitives — SectionCard, SectionHeader, EmptyState, LoadingRow, PortalButton (primary/secondary/ghost/danger; sizes sm/md/lg; 12px rounded-button + focus-visible ring via buttonClasses), ModalHeader (shared white modal header), IconButton (32px, 8px radius; tones default/blue/emerald/red), RowActions, Avatar (blue/cyan/emerald/amber/pink/sky), Alert, OverflowMenu

### `src/components/portal/PortalUI.js`

```jsx
import React, { useEffect, useRef, useState } from 'react';
import { MoreVertical, X } from 'lucide-react';
import { MODAL, buttonClasses } from '../../theme/accent';

/**
 * Small presentational building blocks shared by the teacher/admin portal
 * sections so every tab gets the same card, header, empty-state and
 * row-action styling instead of each section hand-rolling its own.
 */

const cx = (...classes) => classes.filter(Boolean).join(' ');

export const SectionCard = ({ as: Tag = 'section', className = '', children, ...rest }) => (
  <Tag
    className={cx('bg-white border border-gray-200/80 rounded-card shadow-card', className)}
    {...rest}
  >
    {children}
  </Tag>
);

export const SectionHeader = ({ title, description, icon: Icon, actions, className = '' }) => (
  <div
    className={cx(
      'flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between',
      className
    )}
  >
    <div className="flex min-w-0 items-start gap-3">
      {Icon && (
        <span className="hidden sm:inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
      )}
      <div className="min-w-0">
        <h3 className="text-base font-semibold text-gray-900 sm:text-lg">{title}</h3>
        {description && <p className="mt-0.5 text-sm text-gray-500">{description}</p>}
      </div>
    </div>
    {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
  </div>
);

export const EmptyState = ({ icon: Icon, title, description, action, className = '' }) => (
  <div
    className={cx(
      'flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50/60 px-6 py-12 text-center',
      className
    )}
  >
    {Icon && (
      <span className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full bg-white text-gray-400 shadow-sm ring-1 ring-gray-200">
        <Icon className="h-6 w-6" aria-hidden="true" />
      </span>
    )}
    {title && <p className="text-sm font-semibold text-gray-900">{title}</p>}
    {description && <p className="mt-1 max-w-sm text-sm text-gray-500">{description}</p>}
    {action && <div className="mt-4">{action}</div>}
  </div>
);

export const LoadingRow = ({ label = 'Loading...' }) => (
  <div className="flex items-center justify-center gap-2 py-10 text-sm text-gray-500">
    <span className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" aria-hidden="true" />
    <span>{label}</span>
  </div>
);

export const PortalButton = ({
  variant = 'secondary',
  size = 'md',
  icon: Icon,
  className = '',
  children,
  type = 'button',
  ...rest
}) => (
  <button
    type={type}
    className={cx(buttonClasses({ variant, size }), className)}
    {...rest}
  >
    {Icon && <Icon className="h-4 w-4 flex-shrink-0" aria-hidden="true" />}
    {children}
  </button>
);

/**
 * White modal header used by every portal dialog: optional icon tile,
 * Nunito semibold title, optional subtitle, actions and a close button.
 */
export const ModalHeader = ({ title, subtitle, eyebrow, icon: Icon, actions, onClose, titleId, titleProps = {} }) => (
  <div className={MODAL.header}>
    <div className="flex min-w-0 items-center gap-3">
      {Icon && (
        <span className={MODAL.iconTile}>
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
      )}
      <div className="min-w-0">
        {eyebrow && <p className="text-xs uppercase tracking-wide text-gray-500">{eyebrow}</p>}
        <h2 id={titleId} className={cx(MODAL.title, 'truncate')} {...titleProps}>{title}</h2>
        {subtitle && <p className={MODAL.subtitle}>{subtitle}</p>}
      </div>
    </div>
    <div className="flex flex-shrink-0 items-center gap-2">
      {actions}
      {onClose && (
        <button type="button" onClick={onClose} className={MODAL.close} aria-label="Close">
          <X className="h-5 w-5" aria-hidden="true" />
        </button>
      )}
    </div>
  </div>
);

const ICON_TONES = {
  default: 'text-gray-500 hover:text-gray-900 hover:bg-gray-100',
  blue: 'text-gray-500 hover:text-blue-700 hover:bg-blue-50',
  emerald: 'text-gray-500 hover:text-emerald-700 hover:bg-emerald-50',
  red: 'text-gray-500 hover:text-red-700 hover:bg-red-50',
};

/** Fixed-size square icon button so per-row actions line up in a column. */
export const IconButton = ({ icon: Icon, label, tone = 'default', className = '', title, type = 'button', ...rest }) => (
  <button
    type={type}
    aria-label={label}
    title={title || label}
    className={cx(
      'inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent',
      ICON_TONES[tone] || ICON_TONES.default,
      className
    )}
    {...rest}
  >
    <Icon className="h-4 w-4" aria-hidden="true" />
  </button>
);

/** Right-aligned, non-wrapping container for a row's action buttons. */
export const RowActions = ({ children, className = '' }) => (
  <div className={cx('flex items-center justify-end gap-1 whitespace-nowrap', className)}>
    {children}
  </div>
);

export const getInitials = (name = '') => {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  const first = parts[0][0] || '';
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return `${first}${last}`.toUpperCase();
};

const AVATAR_TONES = [
  'bg-blue-100 text-blue-700',
  'bg-cyan-100 text-cyan-700',
  'bg-emerald-100 text-emerald-700',
  'bg-amber-100 text-amber-700',
  'bg-pink-100 text-pink-700',
  'bg-sky-100 text-sky-700',
];

export const Avatar = ({ name, seed, size = 'md' }) => {
  const key = String(seed || name || '');
  let hash = 0;
  for (let i = 0; i < key.length; i += 1) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  const tone = AVATAR_TONES[hash % AVATAR_TONES.length];
  const sizeClass = size === 'sm' ? 'h-8 w-8 text-xs' : 'h-9 w-9 text-sm';
  return (
    <span
      aria-hidden="true"
      className={cx('inline-flex flex-shrink-0 items-center justify-center rounded-full font-semibold', sizeClass, tone)}
    >
      {getInitials(name)}
    </span>
  );
};

export const Alert = ({ tone = 'error', children, className = '' }) => {
  const toneClass = tone === 'warning'
    ? 'bg-amber-50 border-amber-200 text-amber-800'
    : tone === 'success'
      ? 'bg-green-50 border-green-200 text-green-800'
      : 'bg-red-50 border-red-200 text-red-800';
  return (
    <div role={tone === 'error' ? 'alert' : 'status'} className={cx('rounded-lg border px-4 py-3 text-sm', toneClass, className)}>
      {children}
    </div>
  );
};

/**
 * Compact "more actions" menu used on narrow screens so a row's actions
 * collapse into one button instead of wrapping. The panel is fixed-positioned
 * from the trigger's rect so it isn't clipped by scrollable table wrappers.
 * items: [{ key, label, icon, onClick, disabled, tone }]
 */
export const OverflowMenu = ({ label = 'More actions', items = [], className = '' }) => {
  const [position, setPosition] = useState(null);
  const triggerRef = useRef(null);
  const menuRef = useRef(null);
  const isOpen = Boolean(position);

  useEffect(() => {
    if (!isOpen) return undefined;
    const close = () => setPosition(null);
    const handlePointer = (event) => {
      if (menuRef.current?.contains(event.target) || triggerRef.current?.contains(event.target)) return;
      close();
    };
    const handleKey = (event) => {
      if (event.key === 'Escape') {
        close();
        triggerRef.current?.focus();
      }
    };
    document.addEventListener('mousedown', handlePointer);
    document.addEventListener('touchstart', handlePointer);
    document.addEventListener('keydown', handleKey);
    window.addEventListener('resize', close);
    window.addEventListener('scroll', close, true);
    return () => {
      document.removeEventListener('mousedown', handlePointer);
      document.removeEventListener('touchstart', handlePointer);
      document.removeEventListener('keydown', handleKey);
      window.removeEventListener('resize', close);
      window.removeEventListener('scroll', close, true);
    };
  }, [isOpen]);

  const toggle = () => {
    if (isOpen) {
      setPosition(null);
      return;
    }
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const right = Math.max(8, window.innerWidth - rect.right);
    // Open upward when the menu would run past the bottom of the viewport
    // (e.g. last rows of a table or a roster inside a modal).
    const estimatedHeight = items.filter(Boolean).length * 36 + 8;
    if (rect.bottom + 4 + estimatedHeight > window.innerHeight && rect.top - 4 - estimatedHeight > 0) {
      setPosition({ bottom: window.innerHeight - rect.top + 4, right });
    } else {
      setPosition({ top: rect.bottom + 4, right });
    }
  };

  return (
    <div className={cx('relative', className)}>
      <button
        ref={triggerRef}
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        onClick={toggle}
        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
      >
        <MoreVertical className="h-4 w-4" aria-hidden="true" />
      </button>
      {isOpen && (
        <div
          ref={menuRef}
          role="menu"
          style={{ position: 'fixed', top: position.top, bottom: position.bottom, right: position.right }}
          className="z-50 min-w-[11rem] overflow-hidden rounded-lg border border-gray-200 bg-white py-1 shadow-lg"
        >
          {items.filter(Boolean).map(({ key, label: itemLabel, icon: Icon, onClick, disabled, tone }) => (
            <button
              key={key || itemLabel}
              type="button"
              role="menuitem"
              disabled={disabled}
              onClick={() => {
                setPosition(null);
                onClick?.();
              }}
              className={cx(
                'flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50',
                tone === 'red' ? 'text-red-600' : 'text-gray-700'
              )}
            >
              {Icon && <Icon className="h-4 w-4 flex-shrink-0" aria-hidden="true" />}
              {itemLabel}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
```

## StudentRowActions — per-row icon actions (View / Daily goals / Focus subtopics + extras), folds into ⋮ on phones

### `src/components/portal/StudentRowActions.js`

```jsx
import React from 'react';
import { Crosshair, Eye, Target } from 'lucide-react';
import { IconButton, OverflowMenu, RowActions } from './PortalUI';

/**
 * Per-student row actions shared by the Students table and the class roster,
 * so both lists show the same buttons, order, tooltips and mobile behaviour:
 * fixed-size icon buttons on sm+ screens, folded into a ⋮ menu on phones.
 *
 * Core actions (always in this order): View details, Set daily goals,
 * Set focus subtopics. Pass `extraActions` for context-specific actions
 * (e.g. Message / Remove from class in a roster); they render after the core
 * actions, with `separated` items preceded by a divider.
 *
 * extraActions: [{ key, label, menuLabel?, title?, icon, tone?, onClick, disabled?, separated? }]
 */
const StudentRowActions = ({
  displayName,
  onViewDetails,
  onSetGoals,
  onSetFocus,
  focusTitle = 'Set focus subtopics',
  focusDisabled = false,
  extraActions = [],
}) => {
  const core = [
    onViewDetails && {
      key: 'view', label: 'View details', menuLabel: 'View details', icon: Eye, tone: 'blue', onClick: onViewDetails,
    },
    onSetGoals && {
      key: 'goals', label: 'Set daily goals', menuLabel: 'Daily goals', icon: Target, tone: 'blue', onClick: onSetGoals,
    },
    onSetFocus && {
      key: 'focus',
      label: 'Set focus subtopics',
      menuLabel: 'Focus subtopics',
      title: focusTitle,
      icon: Crosshair,
      tone: 'emerald',
      onClick: onSetFocus,
      disabled: focusDisabled,
    },
  ].filter(Boolean);
  const actions = [...core, ...extraActions.filter(Boolean)];

  return (
    <>
      <OverflowMenu
        className="flex justify-end sm:hidden"
        label={`Actions for ${displayName}`}
        items={actions.map(({ key, label, menuLabel, icon, onClick, disabled, tone }) => ({
          key,
          label: menuLabel || label,
          icon,
          onClick,
          disabled,
          tone: tone === 'red' ? 'red' : undefined,
        }))}
      />
      <RowActions className="hidden sm:flex">
        {actions.map(({ key, label, title, icon, tone, onClick, disabled, separated, className }) => (
          <React.Fragment key={key}>
            {separated && <span className="mx-1 h-5 w-px bg-gray-200" aria-hidden="true" />}
            <IconButton
              icon={icon}
              label={label}
              title={title}
              tone={tone}
              onClick={onClick}
              disabled={disabled}
              className={className}
            />
          </React.Fragment>
        ))}
      </RowActions>
    </>
  );
};

export default StudentRowActions;
```

## ModalWrapper — generic modal shell (MODAL scrim `slate-900/45`, `rounded-card` panel, white header with Nunito semibold title)

### `src/components/ui/ModalWrapper.js`

```jsx
import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { MODAL } from '../../theme/accent';

const SIZE_CLASSES = {
  sm: 'max-w-md',
  md: 'max-w-2xl',
  lg: 'max-w-4xl',
  xl: 'max-w-6xl',
};

const ModalWrapper = ({ isOpen, onClose, title, size = 'md', children, hideCloseButton = false }) => {
  const modalRef = useRef(null);
  const previousFocusRef = useRef(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;

    previousFocusRef.current = document.activeElement;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onCloseRef.current?.();
        return;
      }
      if (e.key === 'Tab' && modalRef.current) {
        const focusable = modalRef.current.querySelectorAll(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    requestAnimationFrame(() => {
      if (modalRef.current) {
        const focusable = modalRef.current.querySelectorAll(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length > 0) {
          focusable[0].focus();
        }
      }
    });

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
      previousFocusRef.current?.focus();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizeClass = SIZE_CLASSES[size] || SIZE_CLASSES.md;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-wrapper-title' : undefined}
    >
      {/* Backdrop */}
      <div
        className={`absolute inset-0 ${MODAL.overlay} transition-opacity`}
        onClick={onClose}
      />

      {/* Modal */}
      <div
        ref={modalRef}
        className={`relative ${MODAL.panel} overflow-hidden w-full ${sizeClass} max-w-[95vw] max-h-[90vh] flex flex-col transform transition-all`}
      >
        {/* Header */}
        {(title || !hideCloseButton) && (
          <div className={MODAL.header}>
            {title && (
              <h2 id="modal-wrapper-title" className={MODAL.title}>
                {title}
              </h2>
            )}
            {!hideCloseButton && (
              <button
                type="button"
                onClick={onClose}
                className={`ml-auto ${MODAL.close}`}
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
};

export default ModalWrapper;
```

## ConfirmationModal — confirm dialog with danger/primary variants

### `src/components/ui/ConfirmationModal.js`

```jsx
import React, { useEffect, useRef, useCallback } from 'react';
import { AlertTriangle, Info, Trash2, Loader2 } from 'lucide-react';

const VARIANT_CONFIG = {
  danger: {
    icon: Trash2,
    iconBg: 'bg-red-100',
    iconColor: 'text-red-600',
    confirmBtn: 'bg-red-600 hover:bg-red-700 focus:ring-red-500 text-white',
  },
  warning: {
    icon: AlertTriangle,
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-600',
    confirmBtn: 'bg-amber-600 hover:bg-amber-700 focus:ring-amber-500 text-white',
  },
  info: {
    icon: Info,
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    confirmBtn: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500 text-white',
  },
};

const ConfirmationModal = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  onConfirm,
  onCancel,
  isLoading = false,
}) => {
  const modalRef = useRef(null);
  const cancelBtnRef = useRef(null);

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Escape' && !isLoading) {
        onCancel();
        return;
      }
      // Focus trap
      if (e.key === 'Tab' && modalRef.current) {
        const focusable = modalRef.current.querySelectorAll(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    },
    [onCancel, isLoading]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      // Focus the cancel button on open
      requestAnimationFrame(() => cancelBtnRef.current?.focus());
      // Prevent body scroll
      document.body.style.overflow = 'hidden';
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
        document.body.style.overflow = '';
      };
    }
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  const config = VARIANT_CONFIG[variant] || VARIANT_CONFIG.danger;
  const Icon = config.icon;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
      aria-describedby="confirm-modal-message"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={isLoading ? undefined : onCancel}
      />

      {/* Modal */}
      <div
        ref={modalRef}
        className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6 transform transition-all"
      >
        <div className="flex items-start space-x-4">
          <div className={`flex-shrink-0 w-10 h-10 rounded-full ${config.iconBg} flex items-center justify-center`}>
            <Icon className={`h-5 w-5 ${config.iconColor}`} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 id="confirm-modal-title" className="text-lg font-semibold text-gray-900">
              {title}
            </h3>
            <p id="confirm-modal-message" className="mt-2 text-sm text-gray-600">
              {message}
            </p>
          </div>
        </div>

        <div className="mt-6 flex justify-end space-x-3">
          <button
            ref={cancelBtnRef}
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 ${config.confirmBtn}`}
          >
            {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
```

## QuestionPoolHealthBanner — amber warning card listing topics with repeated questions

### `src/components/portal/QuestionPoolHealthBanner.js`

```jsx
import React from 'react';
import { AlertTriangle, Sparkles } from 'lucide-react';

/**
 * Advisory banner that warns a teacher when a class is over-repeating questions in some
 * topic/subtopic (signal that the question pool is too small). Each flag offers a CTA to
 * add questions — wired by the parent via onAddQuestions(flag), typically navigating to
 * the Question Bank where AI generation and import live.
 *
 * Renders nothing when there are no flags, so it is safe to mount unconditionally.
 */
const QuestionPoolHealthBanner = ({ flags = [], onAddQuestions, className = '' }) => {
  if (!flags || flags.length === 0) return null;

  return (
    <div
      className={`bg-amber-50 border border-amber-200 text-amber-900 rounded-button p-4 ${className}`}
      role="status"
    >
      <div className="flex items-start space-x-2">
        <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5 text-amber-600" aria-hidden="true" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="font-semibold">Students are repeating questions</p>
            <span className="flex-shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800 tabular-nums">
              {flags.length} {flags.length === 1 ? 'topic' : 'topics'}
            </span>
          </div>
          <p className="text-sm text-amber-800 mt-0.5">
            These topics have too few distinct questions, so students keep seeing the same ones.
            Add more by generating with AI or importing questions.
          </p>

          {/* Bounded so a long list of flags can't take over the class detail
              modal; the header and explanation above stay visible. */}
          <ul
            className="mt-3 space-y-2 max-h-48 sm:max-h-64 overflow-y-auto overscroll-contain pr-1 rounded-button focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
            aria-label="Topics with repeated questions"
            tabIndex={0}
            data-testid="question-pool-health-list"
          >
            {flags.map((flag) => {
              const label = flag.subtopic
                ? `${flag.topic} — ${flag.subtopic}`
                : flag.topic;
              return (
                <li
                  key={`${flag.topic}|||${flag.subtopic || ''}`}
                  className="flex items-center justify-between gap-3 bg-white/60 rounded-button px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">
                      {label}
                      {flag.severity === 'high' && (
                        <span className="ml-2 text-xs font-semibold uppercase text-red-700">high</span>
                      )}
                    </p>
                    <p className="text-xs text-amber-700 truncate">
                      seen up to {flag.maxRepeats}× · {flag.distinctQuestions} distinct
                      {flag.sampleQuestion ? ` · e.g. "${flag.sampleQuestion}"` : ''}
                    </p>
                  </div>
                  {onAddQuestions && (
                    <button
                      type="button"
                      onClick={() => onAddQuestions(flag)}
                      className="flex-shrink-0 inline-flex items-center px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-button focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <Sparkles className="h-4 w-4 mr-1.5" aria-hidden="true" />
                      Add questions
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default QuestionPoolHealthBanner;
```

## GoalsModal — daily goals modal (shared white ModalHeader with blue icon tile; secondary Cancel + blue primary Save via buttonClasses). StudentFocusModal and SubtopicsFocusModal follow the same pattern

### `src/components/portal/GoalsModal.js`

```jsx
import React, { useEffect, useRef, useState } from 'react';
import { Target, Loader2, AlertCircle } from 'lucide-react';
import ModalWrapper from '../ui/ModalWrapper';
import { ModalHeader } from './PortalUI';
import { buttonClasses } from '../../theme/accent';
import { getTopicsForGrade } from '../../utils/common_utils';
import { getAllGrades, getDefaultGradeKey } from '../../content/registry';

const DEFAULT_TARGET = 4;

const clampNonNegative = (raw) => {
  const parsed = parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed < 0) return 0;
  return parsed;
};

const buildInitialTargets = (grade, existingTargets) => {
  const topics = getTopicsForGrade(grade);
  const next = {};
  topics.forEach((topic) => {
    const existing = existingTargets ? existingTargets[topic] : undefined;
    next[topic] = existing === undefined || existing === null ? String(DEFAULT_TARGET) : String(existing);
  });
  return next;
};

const GoalsModal = ({
  isOpen,
  onClose,
  initialGrade = getDefaultGradeKey(),
  initialTargets,
  studentCount = 1,
  onSave,
}) => {
  const [grade, setGrade] = useState(initialGrade);
  const [targets, setTargets] = useState(() => buildInitialTargets(initialGrade, initialTargets));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const applyAllInputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setGrade(initialGrade);
      setTargets(buildInitialTargets(initialGrade, initialTargets));
      setError(null);
    }
  }, [isOpen, initialGrade, initialTargets]);

  const handleGradeChange = (nextGrade) => {
    const topics = getTopicsForGrade(nextGrade);
    const next = { ...targets };
    topics.forEach((topic) => {
      if (next[topic] === undefined) next[topic] = String(DEFAULT_TARGET);
    });
    setGrade(nextGrade);
    setTargets(next);
  };

  const handleTargetChange = (topic, raw) => {
    setTargets((prev) => ({ ...prev, [topic]: raw }));
  };

  const handleTargetBlur = (topic) => {
    setTargets((prev) => {
      const raw = prev[topic];
      const parsed = parseInt(raw, 10);
      const next = !Number.isFinite(parsed) || parsed < 0 ? '0' : String(parsed);
      if (next === raw) return prev;
      return { ...prev, [topic]: next };
    });
  };

  const handleApplyAll = (raw) => {
    const value = clampNonNegative(raw);
    const topics = getTopicsForGrade(grade);
    setTargets((prev) => {
      const next = { ...prev };
      topics.forEach((topic) => {
        next[topic] = String(value);
      });
      return next;
    });
  };

  const handleSave = async () => {
    if (!onSave) {
      onClose();
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const topics = getTopicsForGrade(grade);
      const numericTargets = {};
      topics.forEach((topic) => {
        numericTargets[topic] = clampNonNegative(targets[topic]);
      });
      await onSave({ grade, targets: numericTargets });
      onClose();
    } catch (err) {
      console.error('Error saving goals:', err);
      setError(err.message || 'Failed to save goals.');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  const topics = getTopicsForGrade(grade);
  const totalDaily = topics.reduce((sum, t) => sum + clampNonNegative(targets[t]), 0);

  return (
    <ModalWrapper isOpen={isOpen} onClose={onClose} title="" size="lg" hideCloseButton>
      <ModalHeader
        icon={Target}
        title="Set daily goals"
        subtitle={
          <>
            Choose how many questions per topic{' '}
            <strong className="font-semibold text-gray-700">
              {studentCount} student{studentCount === 1 ? '' : 's'}
            </strong>{' '}
            should answer each day.
          </>
        }
        onClose={onClose}
      />

      <div className="px-6 py-5 space-y-5">
        {error && (
          <div className="flex items-start gap-3 rounded-button border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">
              Grade
            </label>
            <div className="inline-flex rounded-button border border-gray-200 bg-gray-50 p-1" role="tablist">
              {getAllGrades().map(({ key: g, label }) => (
                <button
                  key={g}
                  type="button"
                  role="tab"
                  aria-selected={grade === g}
                  onClick={() => handleGradeChange(g)}
                  className={`px-4 py-1.5 text-sm font-medium rounded-button transition ${
                    grade === g
                      ? 'bg-white shadow-card text-blue-700'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-end gap-2">
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">
                Apply to all topics
              </label>
              <div className="flex items-stretch border border-gray-300 rounded-button overflow-hidden">
                <input
                  ref={applyAllInputRef}
                  type="number"
                  min="0"
                  defaultValue={DEFAULT_TARGET}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleApplyAll(e.currentTarget.value);
                    }
                  }}
                  className="w-20 px-3 py-2 text-sm focus:outline-none"
                  aria-label="Apply same goal to all topics"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (applyAllInputRef.current) {
                      handleApplyAll(applyAllInputRef.current.value);
                    }
                  }}
                  className="px-3 bg-gray-100 text-sm font-medium text-gray-700 hover:bg-gray-200 border-l border-gray-300"
                >
                  Apply
                </button>
              </div>
            </div>
            <div className="hidden sm:block ml-2 text-xs text-gray-500 pb-2">
              Daily total:{' '}
              <span className="font-semibold text-gray-800">
                {totalDaily} question{totalDaily === 1 ? '' : 's'}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {topics.map((topic) => (
            <div
              key={topic}
              className="flex items-center justify-between border border-gray-200 rounded-button px-4 py-3 hover:border-blue-300 transition-colors bg-white"
            >
              <span className="text-sm font-medium text-gray-800 mr-3 truncate" title={topic}>
                {topic}
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  value={targets[topic] ?? ''}
                  onChange={(e) => handleTargetChange(topic, e.target.value)}
                  onBlur={() => handleTargetBlur(topic)}
                  className="w-20 border border-gray-300 rounded-button px-2 py-1 text-sm text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-xs text-gray-500">/ day</span>
              </div>
            </div>
          ))}
        </div>

        <div className="sm:hidden text-xs text-gray-500">
          Daily total: <span className="font-semibold text-gray-800">{totalDaily}</span>
        </div>
      </div>

      <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          disabled={saving}
          className={buttonClasses({ variant: 'secondary', size: 'lg' })}
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className={buttonClasses({ variant: 'primary', size: 'lg' })}
        >
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          {saving ? 'Saving…' : 'Save goals'}
        </button>
      </div>
    </ModalWrapper>
  );
};

export default GoalsModal;
```

