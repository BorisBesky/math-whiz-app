# .superdesign

This folder holds the design context for [Superdesign](https://superdesign.dev). The Superdesign CLI and agent skill read it when they generate or iterate UI drafts for Math Whiz.

- `design-system.md`: the product's design rules (color, type, shape, components). Superdesign passes it as the design system for every draft.
- `init/`: repository analysis written by `superdesign init` (shared components, layouts, routes, theme tokens, page dependency trees, extractable components). It embeds real source code, so regenerate the affected sections when those files change.
- `resume.json`: the saved Superdesign target (project id, draft ids, context-file list and fingerprints) so work can resume on the same canvas. It holds no credentials.
- `tmp/`: local scratch output. It's git-ignored.

## Using it with the canvas

Project: https://superdesign.dev/teams/88fe052a-261a-4901-9e7e-c5f6274e98ab/projects/fa666ea1-f13d-4ab4-9adb-7d750650ced9

Ask the Superdesign skill to work on a portal page (for example "iterate the Students page"). It resumes the saved target from `resume.json` and refreshes stale context. If it's missing, it re-runs init. Pass `.superdesign/design-system.md` plus the page's files from `init/pages.md` as context.

## Keep it in sync

`src/theme/accent.js` is the code source of truth for the portal accent color, the button shape (12px `rounded-button`) and the modal chrome. `src/theme/__tests__/accent.test.js` enforces it. When you change either file, or `PortalUI.js` / `ModalWrapper.js`, update `design-system.md` (and the matching code blocks in `init/components.md` and `init/theme.md`) in the same PR.
