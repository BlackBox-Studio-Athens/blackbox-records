# Proposal

## Why

Home and Releases paint first and only then learn, from a browser read of the Worker, whether any pre-order is open. The Home Pre-orders section appears late, and Releases changes a neutral "Vinyl edition" link into Pre-order after paint. The owner requires that this cannot happen. If pre-orders exist, the page arrives with them; if none exist, the page arrives without them.

Whether a pre-order is open changes rarely: staff open or end it, its copies run out, its exact date arrives, or its price changes. That fact belongs in the rendered HTML and should refresh when it changes. Prices and stock stay authoritative at purchase.

## What Changes

- The commerce Worker derives one **open pre-order projection** (Store Item slug, display price and shopper ship estimate for every buyable pre-order) from the existing listing rules and pushes it to the public renderer when it changes. Pushes run after the stock, pre-order and paid-order writes that can change it, and on the existing five-minute cron as a backstop.
- The public renderer stores the latest projection and makes it available to page rendering. Its HTML reuse becomes bound to release, snapshot **and projection identity**. A changed projection retires persisted pages and purges the edge cache using the existing publication tag purge.
- **Home** renders the Pre-orders section in its HTML from the projection and the accepted snapshot, or omits it. The browser listing read and the `/preorder-showcase.json` candidate read are removed. **BREAKING** for the public route `/preorder-showcase.json`, which is removed.
- **Releases** and **release pages** render the Pre-order label, badges, price, shipping estimate and terms link in their HTML from the projection. The existing browser offer read remains as a correction for live changes, but it no longer starts from a neutral state.
- A cached shell return restores the server-rendered presentation instead of a neutral one, then makes the existing fresh read.
- The renderer still has no D1, commerce secrets or sessions. It only receives a public projection over the existing private service binding.

## Capabilities

### New Capabilities

- `preorder-projection`: the open pre-order projection that commerce publishes to the public renderer, covering its content, refresh triggers, renderer storage, cache invalidation and failure behavior.

### Modified Capabilities

- `store-preorders`: Home presents pre-orders from the rendered projection instead of a browser read, release pages label pre-orders in their HTML, and the showcase JSON requirement is removed.
- `release-catalog-presentation`: Releases first renders confirmed pre-order state from the projection instead of neutral links.
- `cloudflare-free-tier-cache-policy`: published HTML reuse is bound to release, snapshot and projection identity.
- `module-boundaries`: a cached Releases return restores the server-rendered presentation instead of a neutral one.

## Impact

- Backend: `apps/backend/src/application/commerce` (projection derivation reusing `readStoreListingPrices`), the internal stock routes, Stripe paid reconciliation, `cms-worker.ts` scheduled handler and its `PUBLIC_SITE` service binding.
- Renderer: `apps/backend/src/cms/public-runtime.ts`, `public-publication-cache.ts`, `public-render-cache.ts`, `published-reader.ts`.
- Web: `apps/web/src/pages/index.astro`, `pages/releases/index.astro`, `ReleaseCard.astro`, `ReleaseDetailContent.astro`, `StorePreorderShowcase.tsx`, `ReleaseCatalogPresentation.tsx`, `ReleaseStoreLink.tsx`, `release-presentation.ts`, `shell-page-snapshot.ts`. `pages/preorder-showcase.json.ts` is removed.
- Tests: backend unit and worker tests, web component tests, and the e2e specs `home-preorders.spec.ts` and `release-merchandising.spec.ts`.
- Docs: `docs/content-publication.md` (renderer and cache), `docs/cloudflare-free-tier.md` (operation estimates).
- Free tier: no new binding, KV, queue or cron. There is one private service call per cron run and per relevant write. Edge purges happen only when the projection changes.
