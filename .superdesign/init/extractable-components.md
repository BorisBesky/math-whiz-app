# Extractable components

## Layout Components

## PortalSidebar
- Source: `src/components/portal/PortalLayout.js` (aside)
- Category: layout
- Description: Left sidebar with logo tile, "Math Whiz Portal / Workspace" heading, role label, collapse button, section nav
- Extractable props: activeItem (string, default: "overview"), roleLabel (string, default: "Teacher")
- Hardcoded: Sparkles logo tile (solid blue-600), nav labels/icons (Overview, Students, Classes, Question Bank, Messages, My Account), CSS

## PortalHeader
- Source: `src/components/portal/PortalLayout.js` (header)
- Category: layout
- Description: Sticky header with section icon tile, title/description, avatar + name/email, Sign out button
- Extractable props: title (string), description (string)
- Hardcoded: Sign out button, CSS

## AppHeader
- Source: `src/components/AppHeader.js`
- Category: layout
- Description: Student app top header
- Extractable props: none significant

## Basic Components

## PortalButton
- Source: `src/components/portal/PortalUI.js`
- Category: basic
- Description: 12px (`rounded-button`) button with primary/secondary/ghost/danger variants and a focus-visible ring; classes from `buttonClasses()` in `src/theme/accent.js`. One primary per view.
- Extractable props: variant (string, default "secondary"), size (string, default "md")

## IconButton
- Source: `src/components/portal/PortalUI.js`
- Category: basic
- Description: 32px square icon button (8px radius) with hover tone (default/blue/emerald/red)
- Extractable props: tone (string)

## ModalHeader
- Source: `src/components/portal/PortalUI.js`
- Category: basic
- Description: Shared white portal modal header (optional blue-50 icon tile, eyebrow, Nunito semibold title, subtitle, actions, gray close)
- Extractable props: title (string), subtitle (string), eyebrow (string)
- Hardcoded: close icon, CSS from `MODAL` tokens

## SectionCard / SectionHeader / EmptyState / Avatar / Alert / OverflowMenu
- Source: `src/components/portal/PortalUI.js`
- Category: basic

## StudentRowActions
- Source: `src/components/portal/StudentRowActions.js`
- Category: basic
- Description: Row action icon group (View, Goals, Focus, optional Message/Remove)
