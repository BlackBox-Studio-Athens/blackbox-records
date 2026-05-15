---
plan_id: 12-18
phase: 12
status: completed
completed: 2026-05-15
---

# 12-18 Summary - Shell Scroll Restoration Boundary Hardening

## Completed

- Added scroll-restoration characterization coverage:
  - supported history objects switch to manual scroll restoration
  - cleanup restores the previous scroll-restoration value
  - unsupported history objects are left unchanged
- Extracted shell-owned scroll-restoration setup and cleanup into `shell-scroll-restoration`.
- Updated `AppShellRoot` to delegate scroll-restoration setup/cleanup while preserving document event handling, routing,
  overlay, player, StoreCart, checkout, Worker, D1, Stripe, BOX NOW, generated API output, and worktree behavior.
- Updated the app-shell module canvas and Phase 12 state/roadmap tracking for the approved 12-18 slice.

## Verification

- `pnpm --filter @blackbox/web test:unit -- src/components/app-shell/shell-scroll-restoration.test.ts`
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
