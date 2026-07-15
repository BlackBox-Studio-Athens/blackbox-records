## Why

The independent post-round-one audit found that the first implementation fixed major load and request costs but did not make the first traversal consistently smooth. Distro first scroll still produced a 183.3 ms frame p95 and 26 long tasks, Store first scroll produced a 100 ms frame p95 and 11 long tasks, the unmodified 312,816-byte Veneer font still triggered approximately one second of late layout work, and Artists, Services, and About missed the good LCP threshold.

This second child of `site-performance-program` closes every implementation-ready residual issue with first traversal as the critical scroll experience. It preserves round one's successful Store request control, static Astro architecture, brand identity, accessibility, and app-shell/player contracts, and records any exhausted Store strategy as an explicit non-passing residual for a post-consolidation performance slice.

## What Changes

- Expand performance acceptance from a narrow warmed scroll script to separate first and repeat traversal profiles at realistic desktop and mobile sizes, while keeping the old script as a regression check.
- Replace per-card long-catalog activation with the smallest route- and breakpoint-specific strategy that meets both initial-load and first-scroll budgets. Test retained activation and coarser groups first; remove harmful containment where needed. Virtualization or pagination remains a separately approved last resort.
- Keep the original Veneer WOFF2 byte-for-byte unchanged because no modification license is available. Load that existing asset through the fingerprinted immutable path, use `font-display: optional`, preserve the approved fallback stack, and verify English, Greek, diacritics, wrapping, and visual hierarchy.
- Fix About, Services, and Artists LCP discovery and image selection: make only first-viewport/LCP media eager and high-priority, keep later media lazy, add the missing About candidate size, and remediate the measured Artists outlier through the existing source/image pipeline.
- Make the complete first-party eager JavaScript graph route-proportional. Load Artists, Services, and Store portals only for their owning route or first intent; decouple the cart event contract from heavy UI; remove Zod from the non-authoritative browser cart storage path only if a smaller explicit parser preserves validation and malformed-storage handling.
- Stop the hidden hero scroll cue and closed route-loading bar from running infinite animation work while retaining active loading feedback and reduced-motion behavior.
- Preserve exactly one Store capability read, zero Store Offer reads, and zero Store 5xx responses in disabled PRD while rendering changes prime the first-scroll corridor.
- Re-profile every changed slice, all primary and secondary route classes, request behavior, accessibility, shell/player continuity, and available field data. Append `PERF-003` to the epic before this child is archived.
- Calibrate frame-interval acceptance against a same-profile low-work control when the runner cadence itself exceeds the 60 Hz-equivalent budget; application work, long-task, layout, and rendered UX gates remain unchanged.
- Preserve the existing Store renderer when all approved rungs are measured and rejected, record its non-passing residual without calling it accepted, and defer a bounded remedy until Store category consolidation changes the measured route shape.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `frontend-runtime-performance`: Makes first traversal the primary scroll gate, broadens route and JavaScript budgets, replaces harmful per-card containment behavior, and defines the license-safe optional-font contract.
- `app-shell-and-player`: Makes route-specific portal code active-route or first-intent only and stops hidden or closed infinite shell animations while preserving eager navigation and player continuity.
- `site-images`: Strengthens first-viewport priority and route-specific image requirements for About, Services, and Artists.
- `commerce-checkout`: Ensures first-scroll rendering activation cannot bypass visible-demand Store Offer hydration or the round-one disabled-capability short circuit.
- `tooling-validation`: Adds realistic first/repeat scroll profiles, secondary-route and mobile-stress load coverage, total eager-graph measurement, immutable-font checks, and epic report closure.

## Impact

- Frontend code: Store and Distro card/group rendering, global font and animation CSS, `SiteLayout`, app-shell portal boundaries, StoreCart browser parsing/event imports, `InternalPageHero`, Services and Artists image markup or source assets.
- Validation: updates the runtime performance runbook and focused tests; Browser Use remains rendered authority, with Chrome performance tracing used only for unavailable trace metrics.
- Hosting/assets: the main site receives a fingerprinted immutable URL for the exact existing Veneer bytes. Stable public font/CSS copies required by the PRD Holding Page remain available and its closed asset contract is reverified.
- Commerce: no Worker API, Store Offer authority, capability contract, checkout, stock, order, D1, Stripe, or provider behavior change is planned.
- Dependencies: no new runtime or performance dependency, framework, router, state library, virtualization library, service worker, CDN/DAM, SSR path, or telemetry backend is introduced.
