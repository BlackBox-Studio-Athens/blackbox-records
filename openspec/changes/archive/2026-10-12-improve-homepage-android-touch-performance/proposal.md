# Proposal

## Why

Android visitors reported delayed scrolling on the PRD homepage inside Facebook Messenger. Local profiling found repeatable motto-transition main-thread work and a touch-triggered overlay fetch before a swipe becomes navigation. PRD also predates 58 local commits, so new findings must be measured separately from already completed mobile fixes.

## What Changes

- Keep the approved motto animation while reducing its transition-time DOM, style, and layout work.
- Keep speculative document fetching out of touch and pen gestures; retain deliberate mouse-hover and keyboard-focus warming, and fetch on actual navigation.
- Measure mobile Home early input, settled first/repeat traversal, and populated/empty preorder states with reproducible, touch-enabled profiles.
- Record comparable before/after evidence, visual and navigation acceptance, and the outstanding physical Messenger versus Chrome check.
- Follow up locally on cold-opening layout work, the browser-dispatched Menu click after a swipe, and the hero scroll-timeline fallback without treating emulation as Messenger acceptance.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `app-shell-and-player`: Home motto transition and input-intent behavior on touch, pen, mouse, and keyboard.
- `frontend-runtime-performance`: Comparable Home mobile gesture and content-state evidence.

## Impact

The Home motto island, shell document event routing/prefetch, runtime performance harness, focused browser checks, and their documentation. The follow-up adds diagnostic-only trace and input timelines to the existing harness. No public API, commerce schema, new dependency, hero composition, media delivery, or native-app migration changes.
