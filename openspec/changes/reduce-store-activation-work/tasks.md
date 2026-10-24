# Tasks

Method: production build with hidden source maps (shipped JavaScript byte-identical to `pnpm build:web`), served statically, Chromium 4× CPU, 390×844 DPR 2, 150 ms RTT and 1.6 Mbps (the documented mobile-stress profile). DevTools traces combine timeline, invalidation tracking and V8 sampling; frames are symbolicated through the source maps. Old and new builds run in alternating order (5 rounds each) on the same machine. Raw traces, `.cpuprofile` files, tools and summaries are in `.codex-artifacts/runtime-performance/store-activation-20261023/`. The traces open in Chrome DevTools > Performance, and the profiles open in speedscope.

## 1. Findings

- [x] 1.1 Store and Distro post-load long task (262–340 ms at 4× CPU): `AppShellRoot` effect → `connectStoreListingPricePresentation` → `sanitizeStoreListingPricePlaceholders`. It rewrites text, `aria-busy`, `hidden`, `disabled`, classes and dataset on 100+ cards that already hold the server state. The server Buy markup was `hidden` but not `disabled`, so every load also toggled 101 buttons.
- [x] 1.2 `getStoreArtistChoices` sort (`localeCompare` per comparison): 25–52 ms per Store or Distro load.
- [x] 1.3 Home: three font-swap relayouts during load (`Fonts changed` invalidation). Bebas Neue is not preloaded, is discovered after first layout and finishes at about 2–3 s. Retained by the baseline font rule (task 3.1).
- [x] 1.4 Scrolling is healthy: about 0 ms of app JavaScript per frame. Native `scrollBy` work is about 1 ms per frame at 4× CPU on Store and Distro.
- [x] 1.5 Measurement artifact, not a product cost: Playwright's `:visible`/actionability polling (`isElementVisible` → `getBoundingClientRect`) accounted for about 470 ms of the "layout" during a scripted Listen tap. Interaction profiles must avoid Playwright polling inside the profiled window.

## 2. Fixes

- [x] 2.1 Guard every sanitation write (`setText`, `setBusy`, flag, class and dataset checks). End state is unchanged; test: "writes nothing to a presentation that already holds its server state".
- [x] 2.2 Render Store card Buy `disabled hidden`; `StoreCollectionPage.test.ts` asserts it.
- [x] 2.3 Shared `Intl.Collator` for artist choices.
- [x] 2.4 Evidence (symbolicated per run): sanitation 95–252 ms → 11–13 ms on Store and 116–245 ms → 11–25 ms on Distro; artist sort 25–41 ms → 0.7–1.9 ms. Median main-thread blocking (sum of task time over 50 ms): Store 575 → 386 ms, Distro 553 → 472 ms. Whole-load totals vary with the shared desktop's load; the per-function numbers do not.

## 3. Measured and retained

- [x] 3.1 Bebas Neue preload A/B (6 interleaved runs, same document interception in both arms). Bebas done 3,307 → 590 ms (Home) and 2,833 → 632 ms (Store). FCP +71/+75 ms, Veneer +73/+72 ms, layout −30/−16 ms, blocking −47/+15 ms. FCP and the LCP font get worse, so the baseline rule stays (`frontend-runtime-performance` spec: only Latin Inter and Veneer preload in the shell). Owner decision if revisited.

## 4. Acceptance

- [x] 4.1 Unit: `StoreListingPricePresentation.test.ts`, `shell-page-snapshot.test.ts`, `StoreDistroSearch.test.ts`, `StoreCollectionPage.test.ts` pass.
- [x] 4.2 Store E2E specs (store-cart, store-crate, store-formats, store-preorders, store-buy-bar, international-order-store) across projects on the local stack: 131 passed, 9 skipped by project rules, 0 failed.
- [x] 4.3 `pnpm validate` on the final tree passed (`.codex-artifacts/validation/2026-10-23T20-27-33-225Z-56976-95a038/summary.json`); strict OpenSpec validation passed.
