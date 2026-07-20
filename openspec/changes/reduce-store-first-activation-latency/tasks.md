## 1. Characterize activation ownership

- [x] 1.1 Add focused tests that prove a direct Store document activation performs one listing-price projection read and zero per-card Store Offer reads.
- [x] 1.2 Add failing shell-navigation tests for one prepared projection shared with uncached Store HTML retrieval and consumed without a second request.
- [x] 1.3 Add cached snapshot, prefetched snapshot, and history-restoration tests that require one fresh no-store projection per new Store activation.
- [x] 1.4 Add same-route, rapid-route-change, failure, teardown, and aborted-navigation tests that prove request deduplication, activation isolation, and timer cleanup.
- [x] 1.5 Retain or extend checkout tests proving current Store Item, variant, availability, online stock, product projection, and catalog price are revalidated independently of listing presentation.

## 2. Start and consume one concurrent projection

- [x] 2.1 Export the existing browser listing-price reader as the single fetch implementation and add optional abort-signal support without changing its endpoint, response schema, or no-store contract.
- [x] 2.2 Add the smallest Store-activation record in `AppShellRoot` with route key, generation, abort controller, and one prepared projection promise.
- [x] 2.3 Add a shell section-activation hook that prepares the projection before awaiting uncached Store HTML or applying a cached/prefetched Store snapshot.
- [x] 2.4 Supply the prepared promise through `connectStoreListingPricePresentation`'s existing reader seam, while preserving the direct-load fallback of one fresh read.
- [x] 2.5 Clear and abort activation state on route exit, superseding navigation, failure, and unmount; attach rejection handling so an unconsumed early failure cannot become an unhandled promise rejection.
- [x] 2.6 Keep the current explicit ready and unavailable card states, exactly one projection request per activation, and zero `/api/store/items/:storeItemSlug` reads for collection prices.
- [x] 2.7 Add build-time DNS-prefetch and anonymous preconnect hints for the configured public backend origin without preloading Store data or changing request cardinality.

## 3. Add measured delayed feedback

- [x] 3.1 Start one activation-owned 750 ms feedback timer only for an uncached Store collection transition.
- [x] 3.2 Reuse the shared route status and existing reduced-motion-safe spinner to show the accessible label `Loading Store` until the transition closes.
- [x] 3.3 Prove with fake timers that fast or cached activations do not flash the status and that completion, failure, cancellation, superseding navigation, and unmount clear it.
- [x] 3.4 Keep per-card `Checking price` placeholders as the only price-settlement feedback and add no per-card spinners.

## 4. Extend repeatable performance evidence

- [x] 4.1 Extend `scripts/measure-runtime-performance.ts` with a same-document Store activation scenario instead of adding a new runner or dependency.
- [x] 4.2 Record click → Store content, click → veil closed, click → prices settled, Store HTML and projection request timing, response → content time, card and settled-price counts, request counts/statuses, console errors, browser visibility, and browser version.
- [x] 4.3 Support the fixed five-run 1440×900 DPR-1 desktop profile and three-run 390×844 DPR-2 / 4× CPU / 150 ms RTT / 1.6 Mbps mobile-stress profile with cache clearing between runs.
- [x] 4.4 Store raw individual runs plus median/p75 summaries under `.codex-artifacts/runtime-performance/<commit-or-run>/`, including commit, URL, Product Environment, Store card count, run order, method, and rejected-run reasons.
- [x] 4.5 Add focused runner tests for milestone extraction, percentile summaries, request cardinality, and rejection of hidden/background-throttled runs.

## 5. Measure and accept the exact final tree

- [ ] 5.1 Capture five desktop and three mobile-stress post-change runs against the exact final tree and compare them with the fixed UAT baseline in `evidence.md`.
- [ ] 5.2 Accept concurrency only if click → prices settled p75 improves by at least 25% in both profiles and click → Store content plus click → veil closed p75 regress by no more than 10%.
- [ ] 5.3 Verify every direct, uncached, cached/prefetched, and history-restored Store activation makes exactly one listing projection request, zero per-card Store Offer reads, and no Store-related request error.
- [ ] 5.4 Verify the listing response remains `Cache-Control: no-store`, no cross-activation browser cache is introduced, and checkout authority tests remain passing.
- [ ] 5.5 Use Browser Use on desktop and mobile to verify 104-card completeness, delayed-status timing and accessibility, no fast-path flash, focus/scroll reset, visible layout stability, console cleanliness, and cart/player/overlay continuity when app-shell imports change.
- [ ] 5.6 Record any DevTools timing fallback with its exact Browser Use capability limitation; reject hidden-tab or background-throttled timing runs.

## 6. Close gates and retain the structural boundary

- [x] 6.1 Run `pnpm test:unit`, `pnpm check`, and `pnpm build` against the exact final implementation tree.
- [x] 6.2 Run `pnpm openspec -- validate reduce-store-first-activation-latency --type change --strict` and `pnpm openspec -- validate --all --strict`.
- [ ] 6.3 Deploy through the normal UAT workflow, confirm the deployed commit, and repeat the hosted five desktop plus three mobile-stress Store activation evidence before acceptance.
- [ ] 6.4 Publish the final before/after report with all three milestones, request cardinality, no-store proof, checkout-revalidation proof, excluded runs, and remaining Store HTML network versus response → content cost.
- [ ] 6.5 If the complete 104-card DOM remains the dominant actionable residual, leave the renderer unchanged, record the non-passing residual, and create an explicit OpenSpec amendment before pagination, virtualization, infinite scrolling, or node recycling.
