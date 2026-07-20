## Why

The July 20, 2026 UAT deployment at commit `2f703122` renders 104 Store cards, but first shell activation starts the one listing-price projection only after Store HTML has been fetched, parsed, and applied. Fixed-profile evidence shows that this serial request adds about 112 ms at desktop p75 and 614 ms at mobile-stress p75 to settled prices, while mobile Store content still remains hidden for about one second.

## What Changes

- Start one activation-scoped listing-price projection read when a new Store collection shell navigation starts, in parallel with the Store HTML snapshot request, and reuse that same promise when listing placeholders become active.
- Warm the configured public backend origin from the static document head with DNS-prefetch and anonymous preconnect hints; do not preload Store data or create an additional API request.
- Preserve one projection network request per Store collection activation, zero per-card Store Offer reads, `Cache-Control: no-store`, explicit unavailable states, and independent checkout-time availability, stock, and catalog-price revalidation.
- Cover direct Store loads, uncached shell navigation, prefetched or cached Store snapshots, history restoration, cancellation, and rapid route changes without carrying a listing result into a later activation.
- Extend the existing runtime-performance runner with a Store activation profile that records click to content, click to veil closed, and click to prices settled across five cache-cleared desktop runs and three mobile-stress runs.
- Because the concurrent mobile-stress experiment still leaves click → Store content at 1,019 ms p75, add one delayed shared `Loading Store` status after 750 ms only when an uncached Store activation is still in flight; keep per-card `Checking price` placeholders and avoid per-card spinners.
- Retain the complete 104-card server-rendered collection. If post-change evidence identifies DOM application as the remaining failing bottleneck, stop and amend OpenSpec before pagination, virtualization, infinite scrolling, or node recycling.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `store-listing-price-presentation`: Starts and reuses one activation-scoped projection read before Store placeholders exist while preserving the existing browser-safe, no-store, presentation-only boundary.
- `app-shell-and-player`: Coordinates Store HTML and listing-price work during same-document navigation and adds delayed shared feedback only for a slow uncached Store activation.
- `frontend-runtime-performance`: Adds Store first-activation milestones, fixed before/after evidence, and an explicit stop boundary before structural catalog rendering changes.
- `tooling-validation`: Extends the existing runtime-performance command and Browser Use acceptance for Store activation timing, request counts, loading feedback, and rendered correctness.

## Impact

- Frontend shell, static document head, and Store presentation code under `apps/web/src/components/app-shell/`, `apps/web/src/layouts/`, and `apps/web/src/components/store/`, plus focused tests and the existing loading-feedback primitives.
- Performance tooling under `scripts/measure-runtime-performance.ts` and its focused helper tests; raw evidence remains under `.codex-artifacts/runtime-performance/`.
- OpenSpec requirements for Store listing presentation, shell navigation feedback, frontend runtime performance, and validation.
- No Worker endpoint, response schema, D1 query, cache policy, checkout contract, stock/order behavior, Stripe behavior, service worker, state library, virtualization library, or new dependency.
