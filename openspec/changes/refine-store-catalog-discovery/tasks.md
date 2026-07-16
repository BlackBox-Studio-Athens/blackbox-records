## 1. Prerequisite and presentation contract

- [x] 1.1 Confirm `consolidate-distro-into-store` is accepted and archived so its `store-catalog-categories` capability is baseline before applying this change.
- [x] 1.2 Add a read-only Store Offer snapshot repository query that returns the compact current listing-price projection without reconciling Stripe or mutating provider state.
- [x] 1.3 Define the browser-safe listing-price OpenAPI schema and public Worker route, regenerate the public API client, and expose only slug, presentation state, and formatted price with `Cache-Control: no-store`.
- [x] 1.4 Add Worker/application/HTTP contract tests for fresh active snapshots, missing/stale/inactive snapshots, response field exclusion, no-store behavior, and no per-card reconciliation.

## 2. One listing-price presentation path

- [x] 2.1 Replace collection-card `StoreOfferPriceDisplay` islands with accessible Store Item price placeholders in `StoreItemCard` and page-variant `DistroCard`; retain the authoritative detail-price path.
- [x] 2.2 Remove listing-only capability gating and four-request Store Offer queue behavior that becomes unused after card migration.
- [x] 2.3 Add the catalog-owned listing-price presentation entrypoint that performs one projection read, updates matching placeholders, renders explicit non-price states, and aborts/cleans up safely.
- [x] 2.4 Mount that entrypoint from the persistent app shell for direct, replaced, and restored Store collection documents; sanitize cached price placeholders before a refresh.
- [x] 2.5 Update the module-boundary manifest and architecture tests so the app shell consumes only the declared storefront-catalog entrypoint.
- [x] 2.6 Add focused unit/component and shell navigation tests proving one listing projection read, no per-card `/api/store/items/:slug` reads, direct-load refresh, cached snapshot refresh, and honest failure UI.

## 3. Catalog discovery and destination copy

- [x] 3.1 Extract or reuse the server-derived Distro summary/group data needed to render an All Store Distro panel without duplicating Distro cards.
- [x] 3.2 Render the All Store Distro panel with introduction, total, current format counts, and base-aware canonical `/store/distro/#distro-group-*` links; keep ordinary no-JavaScript anchors.
- [x] 3.3 Add format-navigation and collection tests for order, counts, target IDs, no duplicate All membership, and changed Distro group content.
- [x] 3.4 Add a derived discoverable-category helper so `Merch` remains reserved/classified from `Clothes` but appears in Store navigation and sitemap only when populated.
- [x] 3.5 Make zero-item `/store/merch/` use the existing base-aware redirect pattern to `/store/`, while populated Merch remains its normal static collection route.
- [x] 3.6 Add Store category, route, sitemap, and redirect tests for zero-item Merch and first populated `Clothes`/Merch content.
- [x] 3.7 Remove redundant card `View Item` / `View in Store` copy and rename native release commerce actions to `Shop release`; retain external `Buy merch` behavior and test labels/destinations.

## 4. Validation and handoff

- [x] 4.1 Extend hosted UAT regression coverage to wait for first-viewport listing prices, assert ready/non-price terminal states, and reject repeated per-card Store Offer listing reads.
- [x] 4.2 Run focused backend/web tests, generated-client validation, `pnpm store:categories:check`, `pnpm test:unit`, `pnpm check`, and `pnpm build`.
- [x] 4.3 Validate direct and shell-navigated Store routes with Browser Use: All Distro format handoff, BlackBox Releases, Distro, zero-item Merch redirect, visible prices, CTA destinations, and console cleanliness.
- [x] 4.4 Update affected README/AGENTS/OpenSpec module-boundary and validation documentation, then run `pnpm openspec -- validate refine-store-catalog-discovery --strict`.
