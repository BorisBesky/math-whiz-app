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
