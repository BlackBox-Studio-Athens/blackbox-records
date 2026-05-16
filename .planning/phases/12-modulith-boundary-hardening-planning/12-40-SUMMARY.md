---
plan_id: 12-40
phase: 12
status: completed
completed: 2026-05-16
---

# 12-40 Summary - Shell Document Event Routing

## Completed

- Added `dom/shell-document-event-routing` as the shell-owned coordinator for document/window events.
- Moved out of `AppShellRoot`:
  - mobile navigation trigger routing;
  - player modal dismiss, mini-player reopen/stop, and player trigger routing;
  - scroll-target and anchor routing handoff;
  - pointer/focus prefetch routing;
  - Escape dismissal routing;
  - popstate routing;
  - window-blur iframe interaction checks.
- Added characterization tests for each event-routing branch above using injected app-shell dependencies.
- Reduced `AppShellRoot.tsx` from 1,114 lines to 997 lines.

## Verification

- `pnpm --filter @blackbox/web exec vitest run shell-document-event-routing`
- `pnpm --filter @blackbox/web exec vitest run src/components/app-shell`
- `pnpm check`
- `pnpm test:unit`
- `pnpm build`

## Notes

- No shopper UI, checkout contracts, Worker runtime, D1, Stripe, BOX NOW, generated API output, `.planning/config.json`,
  or worktree/parallelization setting changed.
- Browser Use remains blocked in this tool session; this slice relies on characterization tests plus repo gates and keeps
  the Browser Use blocker visible for final acceptance.
