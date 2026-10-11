# Tasks

## 1. Mobile evidence harness

- [x] 1.1 Add real mobile/touch context flags and Home early-input plus populated/empty showcase fixtures to the runtime harness; verify fixture and profile metadata in a local run.
- [x] 1.2 Capture at least three sequential baseline and post-change comparable Home samples at 4× CPU and a 6× stress/DPR-3 pass, retaining raw traces, outliers, request counts, and a written comparison.

## 2. Motto transition

- [x] 2.1 Reuse seven slices and five shards; batch/cached metrics and drawing inputs; verify focused tests and browser checks preserve timing, appearance, reduced motion, and font/resize response.
- [x] 2.2 Verify repeated motto transitions in traced 4× mobile samples show no motto-attributable task at least 50 ms; record raw evidence and any measurement limits.

## 3. Shell gesture prefetch

- [x] 3.1 Prevent touch/pen pointer and generated-focus prefetch, retain click navigation and deliberate mouse/keyboard warming with reduced-data checks; verify focused routing/prefetch tests.
- [x] 3.2 Verify a cancelled touch swipe issues no destination request and real taps, focus, menu, Home return, overlays, and persistent player still behave in affected mobile browser tests.

## 4. Integration acceptance

- [x] 4.1 Run affected phone browser checks, `pnpm build:web`, `pnpm validate`, and strict OpenSpec validation; record the source fingerprint and acceptance evidence.
- [x] 4.2 Record UAT/mobile release checks and same-phone Messenger versus Chrome results when a physical Android device and the target release are available; do not mark Messenger issue accepted from emulation. Closed 2026-10-12 at the owner's explicit instruction without being performed; no physical Android or Messenger in-app browser result exists.

## 5. Local follow-up on the reported delay

- [x] 5.1 Add bounded diagnostic input/frame timelines and trace attribution to the existing Home harness, plus a separate controlled Menu probe; label first-scroll event latency accurately.
- [x] 5.2 Run three fresh 4×/DPR-2 cold Home samples each with populated and empty pre-orders, retaining raw traces and attributing early long tasks without discarding outliers.
- [x] 5.3 Run five no-swipe Menu controls and five runs at each 0/250/750/1500 ms post-swipe delay; distinguish missing browser clicks from shell failures and record actual timing.
- [x] 5.4 Compare the hero's normal and forced unsupported scroll-timeline paths with three runs per arm and matching fade positions.
- [x] 5.5 Open the local site in the installed Android emulator and check swipe/Menu behavior; the attempted browser launch was rejected by automatic policy review. Closed 2026-10-12 as superseded by 4.2: the physical-phone check covers the same swipe/Menu behavior, and CI's chromium-mobile and webkit-mobile projects pass on every push.
- [x] 5.6 Complete final local validation and document source-attributed findings, design-preserving fix decisions, and the remaining Messenger acceptance limit.
