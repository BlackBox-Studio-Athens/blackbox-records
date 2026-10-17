# Design

## Context

See proposal.md. `connectHomepageHeroScrollProgress` is connected only by the route-scoped AppShellRoot effect. At the start of this change it cached hero geometry and fade animations, but its passive scroll listener bypassed its frame queue. That queue also marked geometry dirty, so merely reusing it for scrolling would have added a layout read per frame. Release 614 delivered the scheduling repair below.

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

## Android WebView follow-up

Use real Android WebView rendering and native input for diagnosis. A mobile viewport or Messenger user-agent string alone does not reproduce Android's embedding, graphics or input pipeline. The installed emulator is Android 16 / API 36.1, WebView 151 and 411×914 at DPR 2.625; it is a useful control, not the owner's Android 17 Pixel 6a or Messenger build. Reject the initial software-rendered low-FPS samples as causal evidence. Keep hardware-backed measurements separate, retain first and repeat traversal, wait for fonts and at least 15 seconds, and inspect stalls across the full page.

Do not choose a repair from average FPS alone. Compare the same workload with narrow rendering controls, retain raw trace and gesture evidence, and keep any remaining uncertainty explicit. The follow-up must retain the existing visual and playback contracts and add a scoped browser check. Deploy the candidate to UAT only, verify source identity and existing release gates, then hand the specific URL and manual scrolling path to the owner.

The measured repair changes only the hero section and its fixed media layer from `overflow: hidden` to `overflow: clip`. They keep the same crop while ceasing to create nested scroll containers. No browser detection, extra compositing transform, video disablement or animation rewrite is needed. A real-browser overflow probe fails against both original containers and passes with the repair. Actual Android WebView traversal and an out-of-hero paint hit-test confirm the fixed ghost survives. Native ADB crossover runs improve first-traversal stalls; repeat-traversal ranges overlap and the owner's exact Messenger build remains unverified.

The owner prefers Local scrolling tests. The complete gesture test therefore skips CI, waits 15 seconds, and optionally attaches to an existing Android WebView using `BLACKBOX_ANDROID_WEBVIEW_CDP`. Its default is clearly labelled Chromium mobile emulation. CI runs only the crop regression, measured at 590 ms locally.

## Release 615 diagnostic controls

The phone still freezes, so do not select another repair from emulator timing noise. The Local test now makes two round trips, requires H.264 support, attaches frame-callback timing, and rejects a 500 ms gap. A temporary 750 ms fault demonstrated that the assertion fails; remove the fault after recording the expected failure. This measures renderer responsiveness, with compositor-only freezes explicitly outside its guarantee.

Only the existing private review build flag includes the `scroll-check` script. Its allowlist is `normal`, `no-video`, and `no-ghost`; other values do nothing. The video control uses the existing data-saving media gates before players initialize. The background control changes the hero media to absolute positioning in that document. Labels identify each opt-in mode. Fresh document navigation resets the controls; in-document shell navigation does not. No user-agent production branch, new dependency, backend operation or PRD behavior is introduced.

## Affected-phone report after all controls fail

Extend the same allowlist with `report`, leaving normal rendering active. Static controls below the hero start a bounded recorder after 15 seconds; finishing manually or reaching two minutes stops its callbacks, observers and listeners, then reveals copyable JSON. No fixed debug overlay, extra animation, telemetry endpoint or storage is added. A disappearing panel or document pagehide also cleans up the recorder.

Use frame callbacks plus [Long Animation Frames](https://developer.chrome.com/docs/web-platform/long-animation-frames), with long tasks as the supported fallback. Keep only the five slowest entries and three script attributions each; strip URL queries, paths and origins to bounded filenames. Retain at most 24 frame-stall, touch-gesture and viewport-resize entries. Passive touch/scroll observation never cancels input. Visibility changes reset the callback clock and the attribution window, excluding time spent outside the page. Browser identity, video state and movement counts help confirm that the requested mode and input actually reached the page. Compositor presentation and proprietary host code remain outside this report's guarantee.
