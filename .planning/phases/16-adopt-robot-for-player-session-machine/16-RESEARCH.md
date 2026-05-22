# Phase 16 - Research: Robot Player Session Machine

## Current State

- The player session state currently lives in `apps/web/src/components/app-shell/player-session-machine.ts`.
- The reducer has six events and four status-like outcomes: idle, modal-open, loading-related flags, and minimized.
- Focused tests already characterize dismiss-before-interaction, dismiss-after-interaction, reopen, and stop behavior.
- `pnpm view robot3 version` returned `1.2.0` on 2026-05-22.

## Recommended Approach

Use Robot internally behind the existing reducer-shaped API first:

- add `robot3` to `@blackbox/web`;
- model states as `idle`, `modalOpen`, and `minimized`, with context flags for loaded/interacted if that keeps the transition map simple;
- keep `reducePlayerSessionMachine(state, event)` exported initially so call sites remain stable;
- map Robot's current state and context back to the current `PlayerSessionMachineState` shape.

This makes the dependency adoption small and testable. A later phase can expose a long-lived interpreted service only if app-shell orchestration needs it.

## Avoid

- Do not reopen backend `CheckoutOrder` transition decisions. Phase 8 intentionally avoided Robot/XState for persisted order state.
- Do not add XState for this small state surface.
- Do not add new player UX states in the migration.
- Do not couple player state to routes or provider warmup in this slice.

## Verification

- `pnpm --filter @blackbox/web exec vitest run src/components/app-shell/player-session-machine.test.ts src/components/app-shell/player-shell`
- `pnpm test:app-shell`
- `pnpm test:unit`
- `pnpm check`
- `pnpm build`
