---
plan_id: 12-16
phase: 12
status: completed
completed: 2026-05-15
---

# 12-16 Summary - Shell Hero Scroll Progress Boundary Hardening

## Completed

- Added homepage hero scroll progress characterization coverage:
  - progress uses the larger viewport/hero fade distance
  - progress clamps between zero and one
  - homepage routes set the CSS custom property on the next animation frame
  - non-homepage routes do not set hero progress
  - cleanup removes listeners, cancels queued work, and clears the shell-owned CSS property
- Extracted hero scroll progress coordination into `shell-hero-scroll-progress`.
- Updated `AppShellRoot` to delegate hero scroll progress wiring while preserving routing, overlay, player, StoreCart,
  checkout, Worker, D1, Stripe, BOX NOW, generated API output, and worktree behavior.
- Updated the app-shell module canvas and Phase 12 state/roadmap tracking for the approved 12-16 slice.

## Verification

- `pnpm --filter @blackbox/web test:unit -- src/components/app-shell/shell-hero-scroll-progress.test.ts`
- `pnpm audit:module-boundaries`
- `pnpm depcruise:boundaries`
- `pnpm test:unit`
- `pnpm check`
- `pnpm build`

## Notes

- No shopper UI copy, checkout API, Worker runtime, D1, Stripe, BOX NOW, generated API output, `.planning/config.json`,
  or worktree/parallelization setting changed.
- Browser Use could not be completed because the Browser plugin's Node REPL control surface was not exposed in the
  current tool session, and DevTools fallback remained unavailable because the Chrome DevTools MCP profile was already
  running.
