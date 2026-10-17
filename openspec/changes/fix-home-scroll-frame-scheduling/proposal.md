# Proposal

## Why

The owner reports Home-only scrolling lag in Facebook Messenger. Home's fallback currently seeks its fade on every scroll event, violating the existing requirement to update at most once per animation frame; this is a confirmed scheduling defect, though physical Messenger causality remains unverified.

## What Changes

- Coalesce Home scroll notifications into the existing animation-frame scheduler and apply the latest scroll position once.
- Keep cached hero geometry during scrolling; invalidate it separately on resize or hero replacement.
- Verify burst events, resize ordering, cleanup and the existing Home/video/player behavior before committing and deploying to UAT.
- Make the existing Chromium cancelled-swipe fixture send a real touch cancellation, matching its WebKit path, while retaining the no-prefetch and subsequent-tap assertions.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None. This repair restores the existing `app-shell-and-player` frame-batching and cached-geometry contract without changing its requirements. Specs are explicitly skipped.

## Impact

The app-shell hero scroll connector, its focused tests and the existing cancelled-swipe browser fixture. Preserve the fixed ghost, opacity path, video loading and pause rules, preference fallbacks, shell navigation and player continuity. No CSS, content, commerce, dependency or boundary changes are planned. The owner explicitly assigned this UI repair to Codex and authorized a local main commit, UAT delivery and subsequent PRD promotion after verification.
