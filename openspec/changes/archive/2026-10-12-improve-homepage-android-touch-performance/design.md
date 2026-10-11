# Design

## Context

See [proposal.md](proposal.md). July round two and October round three established native scrolling, lazy shell surfaces, self-hosted fonts, and a settled idle baseline without recurring frame callbacks. October 9 responsive showcase imagery and lazy validation are already on local main but not PRD. The current motto transition inserts twelve new nodes and interleaves reads with writes. Shell `pointerover` and subsequent `focusin` can prefetch an overlay during the first touch of a swipe. The local preview has no live listing-price response, so a fixture must represent populated preorders.

## Goals / Non-Goals

**Goals:** Preserve the existing visual motion and persistent shell; remove repeated transition construction and synchronous layout dependencies; distinguish gesture intent from activation; retain comparable mobile traces including outliers.

**Non-Goals:** Redesigning the hero, changing media delivery or commerce authority, raising budgets, deploying PRD, or claiming Messenger acceptance from desktop emulation.

## Decisions

1. **Reuse a per-element tear layer.** Build seven slices and five canvas shards once for each enhanced Home motto. Keep the layer attached and hidden between transitions. Before a transition writes visibility, measure all word widths, stage width, font size, and shard color together; pass those values into the tear drawing/positioning path. Re-randomize positions, bursts, and waveform on each transition, preserving the current effect. Cache measurements between transitions and invalidate on `document.fonts` completion and resize. This avoids a synchronous read after each append; deleting the effect or replacing it with a static image would change the approved design.
2. **Treat only mouse hover and non-pointer focus as prefetch intent.** Ignore touch/pen `pointerover`; track the latest pointer-originated focus so a press-generated `focusin` is ignored. Actual click/tap still enters the existing navigation loader. Mouse dwell remains 80 ms. Honor reduced-data settings before speculative shell or overlay warming. Direct activation is never blocked by the prefetch guard. A blanket focus suppression would break keyboard affordance.
3. **Extend the existing Playwright/CDP harness.** Use `isMobile` and `hasTouch` on mobile-load contexts, keep fixed throttling, and add named Home input scenarios with a deterministic listing-price fixture for populated and empty cases. Record early gesture and tap separately from settled first/repeat scroll, request activity, long tasks, trace identity, and invalid run reasons. Keep runs sequential and at least three per paired profile. Reuse the trace parser and existing preorder candidate fixture rather than introducing a second measurement framework.
4. **Make the remaining ambiguity observable locally.** Add bounded, diagnostic-only touch/pointer/click/scroll/frame timelines and trace marks to the Home input harness. Report first-scroll _event_ delay without implying a visible-frame measurement. A separate settled Menu probe varies the swipe-to-tap delay and retains the actual event interval, browser click, and Menu state. Analyze early trace tasks and compare the hero's normal and forced fallback paths before changing product code. The existing Android emulator is a behavior supplement, not a Messenger substitute. Keep UAT and PRD untouched in this follow-up.

## Risks / Trade-offs

- **Canvas bitmap and resize changes** → Repaint the reused shard canvas after cached metrics are invalidated; compare visual frames at DPR 2 and 3.
- **Focus source ambiguity in embedded browsers** → Suppress only focus immediately generated from touch/pen input; retain keyboard and programmatic focus. Exercise swipe, tap, hover, and Tab in a real browser.
- **Shared-machine scheduling outliers** → Keep every valid run and separate app-attributable slices from CDP/browser scheduling stalls. Historical July/October LCP values are context, not a paired improvement percentage.
- **Local preview commerce gap** → Identify fixture-backed states in output; UAT and same-device Messenger/Chrome release checks remain separate acceptance evidence.
- **Synthetic gesture ambiguity** → Retain both click/no-click outcomes; a pointerup without browser `click` does not justify opening the Menu from pointerup.
- **Cold font swap** → Clean traces place the largest early layout immediately after the preloaded Veneer face completes. Preserve the branded font and existing `swap` decision until a candidate delivery change proves a reduction without changing cold-session typography or delaying primary media; do not treat a local 4× task as Messenger acceptance.
- **Emulator access** → The installed Android emulator is useful only for behavior; if local automation cannot open the page, record that missing check instead of substituting desktop emulation.

## Migration Plan

Land source and harness on local main after focused tests, browser checks, `pnpm build:web`, and `pnpm validate`. Validate the mobile fixes through the normal UAT release process. PRD promotion and physical Android Messenger acceptance are separate release decisions; rollback is reverting this change's source commits if measured regressions appear.
