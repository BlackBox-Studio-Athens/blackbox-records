## Context

The About page currently renders its `contact` content block inside the existing rich-text card as a heading, intro paragraph, and plain-text list. The content collection already provides ordered `{ label, value }` items, and the selected direction uses that order to make General dominant while keeping Demo Submissions and Press secondary.

The public site is a static Astro build with a persistent app shell. This change must remain static, preserve shell navigation, reuse the established near-black/off-white tokens and display typography, and stay usable at 320 CSS pixels and with keyboard navigation.

## Goals / Non-Goals

**Goals:**

- Implement the selected Primary Inbox composition within the existing About surface.
- Make each current email address a clear, full-area native email action.
- Keep the visual and semantic hierarchy aligned: first authored item primary, later items secondary.
- Preserve content ownership, source order, accessible names, narrow-screen wrapping, and visible focus.
- Leave one focused automated contract check plus required browser and repository validation.

**Non-Goals:**

- Adding a contact form, copy-to-clipboard control, email validation workflow, analytics, or client-side JavaScript.
- Changing the About content schema, Decap fields, email addresses, title, intro, app shell, or page statistics.
- Adding a reusable component or dependency for a single route-local presentation.
- Redesigning the surrounding About page.

## Decisions

### Keep the implementation route-local

Update the existing About Astro template and global stylesheet rather than creating a one-use component. The contact block has one caller and no independent behavior, so extraction would add indirection without reuse.

Alternative considered: create an `AboutContactDirectory` component. Rejected because the current scope has one presentation and the existing route already owns the content mapping.

### Use authored order as presentation authority

Render the first contact item as the primary row and every later item as a secondary row. With current content, General is primary and Demo Submissions and Press are secondary. One semantic list preserves every item once and keeps source order consistent across visual and assistive presentation.

Alternative considered: match the literal `General` label or add a `primary` content field. Literal matching couples layout to editable copy; a new field expands schema and CMS contracts for a hierarchy already expressed by item order.

### Use native static email links

Each item becomes a block-level `<a href="mailto:…">` that fills the complete visible row and contains the role label, visible address, and the existing `lucide-react` `Mail` icon at 18 CSS pixels. The icon is decorative with `aria-hidden="true"`; the label and address provide the accessible name. Links do not use `target="_blank"`, scripted window handling, or a separate copy action.

Alternative considered: leave addresses selectable text or add copy buttons. Plain text blocks the primary action; copy buttons add state, feedback, and JavaScript while native email links already satisfy the requested workflow.

### Express the selected hierarchy with CSS grid

Use one contact list with a single-column base layout. At the existing medium-width range, switch to two equal secondary columns and make the primary item span both. Apply thin token-based separators, flat backgrounds, hard edges, `overflow-wrap: anywhere`, and a minimum 44 CSS pixel link target. Hover and `:focus-visible` change color/background or outline only; they do not move content. Text and focus indicators must meet WCAG 2.2 AA contrast requirements.

Alternative considered: three cards or a nested contact panel grid. Rejected because the selected preview uses one editorial surface and the project design system avoids repeated or nested cards.

### Add one source/CSS contract test

Add a focused Vitest file beside the existing layout contract tests. It will assert the route keeps ordered primary/secondary markup, native `mailto:` links, decorative mail icons, and the responsive/focus/wrapping CSS contract. Browser Use remains the visual authority for desktop and narrow layouts.

Alternative considered: introduce an Astro rendering harness. Rejected because this repository already uses source/CSS contract tests for route-local presentation, and a new harness would outweigh this change.

## Risks / Trade-offs

- Non-email contact values added later would not suit `mailto:` links → keep this slice scoped to the current email-only contact content; introduce an explicit link target only when a real non-email case exists.
- Authored order now controls visual prominence → preserve current General-first order and cover the first-item contract in the focused test.
- Long addresses can pressure narrow layouts → use `min-width: 0`, intrinsic stacking, and `overflow-wrap: anywhere`, then verify at 320 CSS pixels.
- Source/CSS tests can be structural rather than behavioral → pair them with the production build and Browser Use checks of rendered link targets, focus, layout, and console state.

## Migration Plan

1. Add the focused failing contract test.
2. Replace the plain contact list markup and add route-local contact classes.
3. Add responsive, focus, and wrapping styles using existing tokens.
4. Bring the latest `main` into the feature branch and resolve any overlap before final validation.
5. Run the focused test, `pnpm test:unit`, `pnpm check`, and `pnpm build`.
6. Validate desktop and 320-pixel About-page states with Browser Use, including keyboard focus and exact `mailto:` destinations.

After every OpenSpec task is complete and the validated implementation is committed, merge the feature branch into `main`, confirm the merged tree matches the validated tree, remove the feature worktree, and delete the merged branch. This repository closeout happens outside the versioned task checkboxes because removing the worktree cannot truthfully update its own task file.

Rollback is a normal source revert of the About markup, contact styles, and focused test; no content or data migration is required.

## Open Questions

None.
