# Design

## Context

See proposal.md. `connectHomepageHeroScrollProgress` is connected only by the route-scoped AppShellRoot effect. It already caches hero geometry and fade animations, but its passive scroll listener bypasses its frame queue. The queue also marks geometry dirty, so merely reusing it for scrolling would add a layout read per frame.

## Decisions

Use the existing single pending frame for initial, scroll and resize notifications. The frame reads the current scroll position, including the latest event in a burst. A separate resize handler invalidates geometry before queuing the same frame; hero replacement retains its existing invalidation. Cleanup removes both exact listeners and cancels the pending frame. Keep CSS scroll timelines and paused fallback keyframes unchanged.

Verify the workload with focused unit regressions and the existing Local production performance/browser harnesses. Record comparable before/after samples and their variation; a scheduling-work reduction is not proof of physical Messenger frame pacing.

The cancelled-swipe browser fixture sends `touchCancel` in Chromium, matching WebKit's pointer-cancellation path. Its former `touchEnd` completed a flick rather than cancelling it; the subsequent tap failure reproduced with the original connector. Keep both destination-fetch suppression and real-tap navigation assertions.

## Risks / Trade-offs

- Scroll effects update on the next frame rather than synchronously in the event callback. This is the existing specified behavior; regression tests must check the last position and threshold transitions.
- A scroll and resize in one frame must retain resize invalidation; test both orderings and cleanup.
- Desktop emulation cannot establish the reported in-app device experience. Record that limit explicitly and preserve physical Messenger acceptance as unverified.

## Delivery

Run focused tests, Home/phone/player browser checks, strict OpenSpec validation, a final web build, Graphify refresh and source-bound pnpm validate. Commit only the repair's files on main, push to UAT, and verify all CI/smoke gates plus hosted identity and Home behavior. The owner's later instruction authorizes promoting that verified candidate to PRD and checking its identity and Home behavior. Roll back through a scoped revert and release if needed; content and launch settings are outside this task.
