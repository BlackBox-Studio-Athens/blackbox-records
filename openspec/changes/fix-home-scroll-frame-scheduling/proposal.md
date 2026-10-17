# Proposal

## Why

The owner reports Home-only scrolling lag in Facebook Messenger. The initial investigation found the fallback seeking its fade on every scroll event, violating the existing requirement to update at most once per animation frame. Release 614 repaired that scheduling defect, but the owner reports that Android Messenger still freezes; the follow-up below addresses rendering.

## What Changes

- Coalesce Home scroll notifications into the existing animation-frame scheduler and apply the latest scroll position once.
- Keep cached hero geometry during scrolling; invalidate it separately on resize or hero replacement.
- Verify burst events, resize ordering, cleanup and the existing Home/video/player behavior before committing and deploying to UAT.
- Make the existing Chromium cancelled-swipe fixture send a real touch cancellation, matching its WebKit path, while retaining the no-prefetch and subsequent-tap assertions.
- In the Android follow-up, remove the hero crops' unnecessary nested scroll containers with `overflow: clip`, add a fast crop regression and Local-only full-page touch coverage, and verify the UAT candidate.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None. This repair restores the existing `app-shell-and-player` frame-batching and cached-geometry contract without changing its requirements. Specs are explicitly skipped.

## Impact

The initial release changed the app-shell hero scroll connector, its focused tests and the existing cancelled-swipe browser fixture. It preserved the fixed ghost, opacity path, video loading and pause rules, preference fallbacks, shell navigation and player continuity without CSS, content, commerce, dependency or boundary changes. The owner explicitly assigned that UI repair to Codex and authorized a local main commit, UAT delivery and subsequent PRD promotion after verification. The Android follow-up changes the two hero crop declarations and focused browser coverage, retaining those contracts and delivering to UAT only.

## Android WebView follow-up, 17 October 2026

Release 614 repaired event scheduling but did not resolve the reported Messenger experience. The owner identifies a Pixel 6a on Android 17: after at least 15 seconds of settling, scrolling repeatedly freezes after some distance throughout Home. Treat the original scheduling work as delivered and this device acceptance as failed.

Identify the embedded browser technology from primary sources, reproduce repeated full-page scrolling in an actual Android WebView, isolate rendering work from emulator overhead, and apply the smallest demonstrated repair. Add a focused scrolling regression using the existing suite. Preserve the fixed ghost, fade, films, native scrolling and shell continuity; no content or commerce changes. CSS may change where the evidence identifies a rendering defect. Deliver this follow-up to UAT only for the owner's Messenger verification. The earlier production promotion authorization does not apply to this new candidate.

## Release 615 follow-up

The owner reports the crop repair also fails physical acceptance. Their browser reports `Chrome/155.0.0.0` and `[FB_IAB/FB4A;FBAV/583.0.0.29.95;]`. Treat the field problem as unresolved. Repeat diagnosis with UAT's two film chapters, add prolonged-stall detection to the Local test, and use opt-in UAT comparisons to isolate automatic video and the fixed hero background in the affected browser. The normal rendering contract remains the repair target; these comparisons are temporary diagnostic controls.

All three release 616 comparisons retain the same reported freeze. Add one opt-in on-device report that separates stalled animation callbacks and slow main-thread frames from touch/scroll movement and viewport resizing. Collect actual affected-client evidence before choosing another repair. Keep the report temporary, UAT-only, bounded and manually shared; exclude the unrelated unpublished shipping-email work from delivery.
