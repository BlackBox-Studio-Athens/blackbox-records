# Design

## Context

See proposal.md for the reported incident. The current drawer has one scrolling region containing its heading, lines and delivery summary, above a fixed footer. The shell already owns dismissal, focus restoration, persistence and the player session.

## Goals / Non-Goals

**Goals:** Keep heading and dismissal reachable with overflowing content and verify the existing buy/dismiss lifecycle in Firefox.

**Non-Goals:** Change shared scroll locks or BUY without a matching failing regression; infer Android acceptance from desktop browser emulation.

## Decisions

- Move the existing SheetHeader outside the scroll pane and use the shared large outline Button for Close. Reuse onContinueShopping rather than introduce another callback or alter shared Sheet behavior. Use a short shopper-facing description to preserve content space.
- Limit Firefox projects to store-cart.spec.ts. Compact Firefox uses viewport and hasTouch without isMobile, which Firefox does not support. Use wheel input and trusted taps there; retain trusted Chromium touch swipes.
- Keep public CI browser installation scoped to accept-e2e; other acceptance jobs retain their existing installations.

## Risks / Trade-offs

- Fixed controls reduce scroll height at 320×568 → test long titles, delivery loading/errors and empty state at all approved sizes.
- Desktop Firefox cannot establish Android gesture behavior → keep the incident open and require real Android Firefox on UAT before PRD promotion.

## Migration Plan

Prepare the authorized worktree from main. Validate locally, then use existing code promotion gates for UAT. Record real Android Firefox UAT acceptance before PRD promotion and verify PRD after promotion. Rollback uses the existing software release process; no data migration is needed.
