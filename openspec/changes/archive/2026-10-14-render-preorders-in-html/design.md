# Design

## Context

See proposal.md for the problem. Current state, observed in source and on PRD (13 October 2026):

- Public HTML is rendered by Astro inside the `PublicSiteRuntime` Durable Object (`apps/backend/src/cms/public-runtime.ts`). Pages are persisted in SQLite under the key `release/snapshot/origin+path` and cached at the edge for 30 s, plus 30 s stale-while-revalidate, with the `blackbox-publication` tag. The renderer has only the `MEDIA` R2 binding.
- The deployed backend Worker (`cms-worker.ts`) hosts commerce (`COMMERCE_DB`, `COMMERCE_RUNTIME`, a five-minute cron) and already holds the `PUBLIC_SITE` service binding to the renderer, which publication uses for `/__publication/invalidate`.
- `readStoreListingPrices` derives shopper pre-order state: stocked and `deriveShopperPreorder` for open status, plus a ready presentation for buyability.
- Home mounts `StorePreorderShowcase` with `client:idle`. It reads `/api/store/listing-prices?scope=preorders` and then `/preorder-showcase.json` before it renders anything. Releases SSR renders neutral links; `ReleaseCatalogPresentation` resets to neutral, reads offers and then applies them. On a cold PRD load, Pre-order appeared about 1.0 s after navigation, and later in a backgrounded tab.

## Goals / Non-Goals

**Goals:**

- Home, Releases and release pages contain their pre-order state in the HTML response.
- Keep the renderer free of D1, commerce secrets and sessions, and keep the publication cache model.
- Stay within the Free plan, with no new binding, KV, queue or cron.

**Non-Goals:**

- Store cards, the Store Pre-orders filter and the Store Item page. Their prices and stock are already live reads with a parse-time prefetch, and they are not changed here.
- Server-rendered stock counts or low-stock labels.
- Changing purchase authority. Checkout and the Store Item page keep their authoritative offer reads.

## Decisions

### 1. Push the projection over the existing service binding, not through R2

Commerce computes the projection and sends it with a POST to a private renderer path, `/__publication/preorders`. The path is in the `__publication` namespace, which the Pages gateway never forwards. The renderer validates the projection and stores it in its own Durable Object SQLite storage.

- **Alternative: R2 file plus renderer polling.** This would add an R2 read every pointer refresh (each 5 s per active object), or a separate invalidation call anyway. Pushing reuses the call publication already makes and costs no R2 operations.
- **Alternative: the renderer reads commerce directly.** This would break the renderer's R2-only rule and need a commerce binding or secret in the renderer.
- **Alternative: HTMLRewriter injection in the Pages gateway.** This costs a commerce read on every page view and complicates ETag handling, for a fact that changes rarely.

The renderer's default entrypoint receives the push. It forwards the push to the `public-v2` and `publication-v2` objects, so previews and publication validation render the same state. It purges `blackbox-publication` only when at least one object reports a changed identity. This mirrors `invalidatePublicPublication`.

### 2. Projection shape and identity

```json
{
  "items": [
    {
      "storeItemSlug": "lotus-vinyl",
      "displayPrice": "€28.00",
      "shipEstimate": { "kind": "month", "month": "2026-11", "part": null }
    }
  ]
}
```

Items are sorted by slug. The identity is the SHA-256 of the canonical JSON. A new pure function in `application/commerce` derives the projection from the `readStoreListingPrices(..., 'preorders')` output. The filter is `presentationState === 'ready' && availabilityState === 'stocked' && preorder`, which is the rule the Home showcase applies today. The listing read and the projection therefore cannot disagree.

### 3. Triggers: after writes, plus the cron as a backstop

- Each successful internal stock mutation in `register-internal-stock-routes.ts` calls `ctx.waitUntil(pushPreorderProjection(bindings))`. This covers pre-order set or end, stock count, zero-stock state and Copies arrived.
- Paid reconciliation in `stripe-webhook-services.ts` does the same after finalization.
- `cms-worker.ts` `scheduled` pushes on every run. This covers exact-date closing (an Athens date change), missed pushes and a renderer with empty storage.
- Catalog price changes from the Stripe catalog webhook push as well, because the projection carries the display price.

A push failure is logged and swallowed. The next cron run repairs it within five minutes. The commerce write is never affected.

- **Alternative: push only from the cron.** Up to five minutes of staleness after a staff action is too slow for a deliberate action.
- **Alternative: store the last pushed digest in commerce and skip unchanged pushes.** This saves about 288 service calls per day, but an emptied renderer would then never refill. The renderer compares the identity instead, so an unchanged push is one cheap read.

### 4. Cache identity

The persisted cache key and the weak ETag input become `release/snapshot/projection/origin+path`. A changed projection calls `retain()` with the new prefix, which retires older rows through the existing mechanism, and then purges the edge tag. This affects all published HTML, which is acceptable because changes are rare and it keeps one invalidation path.

### 5. Rendering access

`publishedContext` gains a `preorders` field, the projection or `null`. A small web accessor, `readOpenPreorders()`, returns the items from that context. Outside the renderer it reads a fixture: `site:dev`, the e2e Astro server and the CI static fixture build read a JSON file named by `BLACKBOX_PREORDER_PROJECTION` and default to empty. This keeps `output: 'static'` builds working without a commerce call at build time.

### 6. Home

`pages/index.astro` builds the showcase items at render. It reuses `buildPreorderShowcaseCandidates` and the image preparation now in `preorder-showcase.json.ts`, keeps only candidates listed in the projection, and merges in `displayPrice` and `shipEstimate`. It renders `StorePreorderShowcase` only when items exist and passes the items as props, keeping `client:idle`. The SSR markup is therefore complete at first paint, and hydration adds media behavior only. `loadStorePreorderShowcase`, its retry and the JSON route are removed, along with the route's renderer cache allowance in `public-runtime.ts`.

### 7. Releases and release pages

`ReleaseCard.astro` and `ReleaseDetailContent.astro` render with `releasePresentation(entry, projectedRecord)`, where a projected item maps to a ready, stocked `Listing` with its pre-order. Editions the projection does not list render neutral, as today. `connectReleaseCatalogPresentation` stops applying `[]` on mount. On success it applies the live records. On failure it keeps the rendered state. The cached-return sanitizer in `shell-page-snapshot.ts` restores the rendered state from a data attribute that the SSR card writes, for example `data-release-projected`.

This supersedes the uncommitted parse-time Releases prefetch in this worktree. Discard it before implementation.

## Risks / Trade-offs

- [Edge staleness: a page can be up to about 60 s old after a push if a purge fails] → Purge on every changed projection. Purchase paths keep authoritative reads, so this cannot oversell.
- [The renderer has an empty projection after its first deploy] → Pages render with no pre-order claims, which is safe. Run the cron or a manual push before checking acceptance, and record it in the release notes.
- [Price formatting churn creates spurious identity changes] → The identity is computed from canonical JSON of the same display string the listing returns. A unit test fixes the canonical form.
- [E2E specs that stub `/api/store/listing-prices` in the browser no longer control Home] → Move Home pre-order specs to the fixture projection, and cover the empty case with a component or render test plus a renderer worker test.
- [Every push touches two Durable Object objects, about 576 DO requests per day per environment] → This is far below the Free allowance. Record it in `docs/cloudflare-free-tier.md`.

## Migration Plan

1. Deploy backend and renderer together, as a normal release. The renderer accepts pushes. Pages without a projection render neutral until the first push.
2. The first cron run, within five minutes, pushes the projection, purges, and Home and Releases render pre-orders in HTML.
3. Rollback: revert and promote. The old client code reads offers itself, and a stored projection is ignored by old renderer code.

## Open Questions

None.
