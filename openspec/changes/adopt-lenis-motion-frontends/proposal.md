# Proposal

## Why

Public-site and staff scrolling currently use native smooth scrolling, direct DOM scroll writes, CSS transitions, and timer-driven transitions in separate places. Migrating owned scroll behavior and coordinated animation to Lenis and Motion will give both frontends one lifecycle-aware implementation while preserving routing, editor behavior, saved navigation state, and reduced-motion support.

## What Changes

- Add exact Lenis and Motion dependencies to the public and staff frontends.
- Give each app one lifecycle-owned scroll runtime that covers its document and explicitly registered first-party scroll panes.
- Route smooth scroll actions through Lenis while keeping focus, history restoration, section resets, validation recovery, and preview synchronization immediate.
- Move coordinated first-party transitions to Motion. Keep direct styling, simple CSS feedback, and third-party editor animation under their current owners.
- Refine Store browsing with stable Coverflow controls, interruptible artwork movement, softer alternate-image hover, and a thumbnail gallery using shadcn controls. Remove static listing availability claims and use the live Store Offer on details. Use the actual Bandcamp and TIDAL marks on artist links.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `app-shell-and-player`: define Lenis scroll ownership and lifecycle-safe Motion transitions without changing shell routing or player continuity.
- `staff-workspace`: define Lenis scrolling for owned workspace panes while preserving editor, draft, and history behavior.
- `module-boundaries`: expose the public Lenis implementation through the existing web module layers.

## Impact

- Both Astro frontends, the public React app shell, the staff shell and workspace components, and their existing scroll/animation tests.
- Public and staff package manifests and the pnpm lockfile.
- No API, persistence, content schema, Worker, hosting, or commerce changes.
