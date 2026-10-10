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
