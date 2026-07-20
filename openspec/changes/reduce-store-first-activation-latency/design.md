## Context

The July 20, 2026 UAT deployment at commit `2f703122` serves 104 Store cards. The persistent shell currently performs an uncached Store activation in this order:

1. begin the section transition;
2. fetch Store HTML;
3. decode, parse, cache, and apply the Store `main` snapshot;
4. let `AppShellRoot` observe the active Store route;
5. connect `StoreListingPricePresentation` and start the one listing-price projection read;
6. replace all 104 `Checking price` placeholders from that projection.

The fourth and fifth steps create a serial request waterfall. The five desktop and three mobile-stress paired runs in `evidence.md` show that a runtime-only concurrent request improves click → prices settled by 38.7% at desktop p75 and 36.4% at mobile-stress p75 without materially changing Store content or veil timing.

The same evidence also shows a mobile residual after concurrency: click → Store content remains 1,019 ms p75, veil closure remains 1,233 ms p75, and Store HTML response → applied 104-card content remains 441 ms p75. This design therefore combines the bounded concurrency fix with delayed shared feedback, while explicitly retaining the current complete server-rendered collection.

Constraints:

- exactly one listing-price projection network request per Store collection activation;
- zero per-card Store Offer reads for collection prices;
- projection responses remain `Cache-Control: no-store` and are not cached across activations;
- checkout independently revalidates Store Item, variant, availability, stock, product projection, and current catalog price;
- direct loads, uncached shell navigation, cached snapshots, history restoration, same-route actions, failures, cancellation, and rapid route changes remain correct;
- no new dependency, state library, service worker, endpoint, schema, D1 query, or backend mutation;
- no pagination, virtualization, infinite scrolling, or node recycling in this change.

## Goals / Non-Goals

**Goals:**

- overlap the existing one listing-price projection request with Store HTML retrieval and DOM preparation;
- make activation ownership explicit so one prepared result cannot leak into a later route activation;
- keep fresh no-store price presentation and independent checkout authority;
- add repeatable Store activation evidence to the existing runtime-performance runner;
- provide one calm, accessible delayed status for the measured slow uncached mobile path;
- leave a hard OpenSpec boundary before structural catalog rendering work.

**Non-Goals:**

- changing listing-price endpoint behavior, response shape, cache headers, D1 reads, or Worker deployment;
- caching listing-price data in memory, browser storage, a service worker, CDN policy, or static HTML;
- adding per-card requests, speculative Store Offer preloads, retries, or checkout state to StoreCart;
- changing checkout, stock, order, Stripe, or provider authority;
- changing the 104-card markup, image strategy, containment, category structure, or Store routes;
- addressing the separate cart/history restoration defect.

## Decisions

### 1. Prepare one projection promise at Store activation start

The shell navigation coordinator will expose a Store-activation-start hook before it awaits the Store HTML snapshot. `AppShellRoot` will own a small activation record containing the destination route key, generation, `AbortController`, and one prepared listing-price promise. Store HTML retrieval and the projection read will then begin in the same activation turn.

When the Store placeholders mount, `connectStoreListingPricePresentation` will receive its existing injected `readListingPrices` dependency as a function that returns the prepared promise. The existing presentation code remains responsible for applying ready/unavailable states. Consuming the prepared promise must not call the endpoint again.

The browser listing reader will remain the one fetch implementation. It may be exported from its current module and accept an optional abort signal; this avoids a second networking abstraction or a new store-specific state container.

The static document head will also emit DNS-prefetch and anonymous preconnect hints for the configured public backend origin. This starts origin setup before Store intent without fetching listing data, creating a projection result, changing `no-store`, or altering the one-request-per-activation boundary. The hint is omitted when no public backend base URL is configured.

Alternatives rejected:

- Keep the current effect timing: preserves the measured 112–614 ms p75 serial penalty.
- Add a second preload call: violates one projection request per activation.
- Put the promise in module-global state or a client cache: risks cross-activation stale price reuse and weakens `no-store` semantics.
- Render prices into static Store HTML: creates browser-visible stale authority and bypasses the Worker projection boundary.
- Preload or prefetch the listing endpoint from the document head: creates projection traffic without a Store activation and breaks activation request cardinality.

### 2. Scope preparation to one route activation

A prepared result belongs only to the activation that created it.

- Direct Store document load has no prepared shell result, so the existing presentation connection performs one fresh projection read.
- Uncached shell navigation prepares one projection while Store HTML is fetched.
- Cached or prefetched Store snapshot activation still prepares one fresh no-store projection while the cached `main` is applied.
- History restoration uses the same activation path and one fresh projection.
- A same-route click that does not create a new activation performs no extra projection read.
- Route exit, superseding navigation, failure, or shell teardown aborts the request when possible and clears the activation record.
- A later Store activation always creates a new generation and never consumes an older result.

The prepared promise will receive an immediate rejection observer so an aborted or failed request cannot become an unhandled rejection if its Store placeholders never mount. The presentation consumer still receives the original success or failure and renders the existing explicit unavailable state.

Alternative rejected: retain a successfully settled promise for later Store visits. This would be a cross-activation cache despite the endpoint's `no-store` contract.

### 3. Preserve commerce authority and request shape

This change is frontend scheduling and connection preparation only. It will not change the listing endpoint, its browser-safe response, its single D1 projection read, or its `Cache-Control: no-store` response. Collection activation remains exactly one projection request and zero `/api/store/items/:storeItemSlug` reads for listing prices. Resource hints may establish the configured backend connection, but they must not fetch Store data.

Checkout continues to ignore listing presentation as authority. The Worker checkout use case must still resolve the submitted Store Item and variant, check current availability and `canBuy`, verify online stock, resolve the current product projection, reconcile catalog state and blocking drift, and then create the hosted Checkout Session.

Alternative rejected: cache projection data to improve repeat visits. The user explicitly requires separate approval for cache semantics, and concurrency supplies the measured benefit without that policy change.

### 4. Extend the existing runtime-performance runner

`scripts/measure-runtime-performance.ts` will gain a Store activation scenario instead of adding another runner or dependency. Each run will create a fresh browser context or equivalently clear cache, load Home, wait for shell readiness, click Store, and record:

- click → Store HTML request start and response;
- Store HTML response → 104-card content;
- click → Store content;
- click → transition veil closed;
- click → all listing prices settled;
- listing projection request start and response;
- Store HTML, projection, and per-card Store Offer request counts and statuses;
- card count, settled listing count, console errors, `document.visibilityState`, browser version, commit, URL, Product Environment, profile, cache state, and run order.

The runner will retain individual runs and report median and p75. Acceptance requires five desktop runs and three mobile-stress runs on the same deployed commit before and after the change. It will flag hidden/background execution or other invalid timing conditions instead of silently including them.

Browser Use remains the authority for rendered completeness, visible status behavior, focus, scroll, layout stability, cart/player/overlay continuity, and console cleanliness. Chrome performance tooling may supply only metrics Browser Use cannot expose, with the limitation recorded.

Alternative rejected: rely on Lighthouse navigation metrics. They do not capture the same-document click, veil, and price-settlement milestones that define this defect.

### 5. Gate and show one delayed shared Store status

A meaningful residual is defined here as post-concurrency mobile-stress p75 click → Store content exceeding the 750 ms feedback delay. The experiment records 1,019 ms p75, so the gate is met.

For an uncached Store activation, the shell will start a 750 ms timer with the existing route transition. If the activation is still busy when the timer expires, the shared route status will show one `Loading Store` label with polite status semantics and the existing reduced-motion-safe spinner. It remains visible until the route transition closes, then clears. The timer and status clear on success, failure, cancellation, superseding navigation, and unmount.

Fast desktop and cached Store activations finish before the delay and show no flash. Price settlement remains represented by the existing per-card `Checking price` state after content appears; no per-card spinners are added.

Alternatives rejected:

- Immediate spinner: flashes during the measured 130–170 ms desktop path.
- Per-card spinners: creates 104 competing motion sources and does not explain the blank transition interval.
- Keep the veil textless: leaves the measured one-second mobile activation without explicit progress feedback.

### 6. Keep the 104-card renderer and enforce a stop boundary

The current complete server-rendered collection remains unchanged. The runner will continue splitting Store HTML network time from response → applied content so the 104-card DOM cost remains visible. Current mobile evidence records 441 ms p75 for response → content, which is material but does not authorize a structural rendering change.

If post-implementation evidence still identifies DOM parsing/application as the dominant actionable residual, this change records that non-passing residual and stops. Pagination, virtualization, infinite scrolling, node recycling, or another structural renderer requires an explicit OpenSpec amendment with accessibility, keyboard, find-in-page, source-order, shell-navigation, and commerce-request acceptance.

Alternative rejected: combine concurrency with pagination or virtualization now. That expands scope before the bounded scheduling fix has been implemented and measured.

## Risks / Trade-offs

- [A prepared promise is consumed by a later activation] → bind it to a route key plus generation, abort and clear on superseding navigation, and test rapid route changes and history restoration.
- [The presentation effect issues a second projection request] → inject the prepared promise through the existing reader seam and assert one network request per activation in unit and browser evidence.
- [An early failed promise becomes unhandled before placeholders mount] → attach an immediate rejection observer while preserving the original rejection for the presentation fallback.
- [Concurrency competes with Store HTML and delays content] → require five desktop and three mobile before/after runs; reject the slice if content or veil p75 regresses by more than 10%.
- [The first cross-origin projection still pays avoidable origin setup] → emit build-time DNS-prefetch and anonymous preconnect hints for the configured public backend origin, while forbidding endpoint preload or extra API traffic.
- [Abort behavior leaves cards in `Checking price`] → route failures through the existing explicit unavailable state when the activation remains current; ignore results only after route exit.
- [Delayed feedback flashes or remains stale] → use the measured 750 ms delay, one activation-owned timer, and deterministic fake-timer coverage for completion, failure, cancellation, and unmount.
- [Browser timing is polluted by background throttling] → record visibility/focus state and request-start timing, reject invalid runs, and keep Browser Use as rendered authority with trace fallback documented.
- [The mobile residual is mistaken for approval to restructure Store] → retain the complete renderer and require a new OpenSpec amendment before any structural list strategy.

## Migration Plan

1. Add focused characterization and failing tests for activation ownership, request cardinality, cancellation, and delayed feedback.
2. Implement activation-scoped preparation, backend-origin connection hints, and prepared-promise consumption without changing the endpoint or Store markup.
3. Extend the existing measurement runner and capture five desktop plus three mobile-stress post-change runs on the exact final tree.
4. Accept only if click → prices settled p75 improves at least 25%, content and veil p75 do not regress by more than 10%, request cardinality stays one projection and zero per-card reads, and checkout authority tests remain passing.
5. Validate delayed feedback and shell continuity in Browser Use, then run repository and OpenSpec strict gates.
6. Deploy to UAT and repeat the hosted Store activation evidence against the deployed commit before treating the change as accepted.

Rollback is frontend-only: remove the activation-start preparation hook and return the presentation connection to its direct one-read path. The endpoint, cache policy, backend data, and checkout behavior require no rollback or migration.

## Open Questions

None. The evidence resolves the scheduling choice, feedback gate, request boundary, and structural-rendering boundary for this change.
