# Design

## Context

The shared Store controller already registers a non-passive stage wheel listener and cancels the default action before evaluating wheel cadence. The installed Lenis window listener also processes these events without checking `defaultPrevented`. CSS makes the inner stage hidden while its positioned covers remain visible, so empty-space hits target the enclosing surface instead. See proposal.md for the observed failure.

## Decisions

- Stop propagation immediately after cancelling a consumed wheel event, before evaluating thresholds or repeat timing. Existing early returns preserve browser-owned input.
- Register wheel input and gesture-reset listeners on the enclosing `.store-coverflow-shell`, falling back to the stage for callers without that wrapper. Keep touch pointer listeners and disclosure animation on the existing inner stage; remove listeners from their registered surface during cleanup.
- Keep the fix in the shared controller used by All Store and Distro. A permanent stage exclusion attribute would also affect Grid mode; changing global smooth-scroll policy would broaden this fix.
- Extend the existing controller harness and Store formats browser suite. Browser checks use real wheel input with Lenis active and sample page position over 750ms, covering the 360ms cover animation and subsequent smooth scrolling.

## Risks / Trade-offs

Consumed events no longer reach ancestor wheel listeners. This is intentional for the preview stage; regressions verify that outside-stage and Grid wheel scrolling remain available and that zoom, zero-delta, and search-mode input are not intercepted.

## Migration Plan

No migration or feature flag is required. Ship through the normal code release process; reverting the handler change restores the previous behavior.
