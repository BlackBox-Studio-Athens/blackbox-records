# Module Canvas: storefront-catalog

## Responsibility

Own shopper-facing editorial and catalog projection for homepage, artists, releases, news, Distro, and non-checkout
store item routes.

## Owned Files And Directories

- `apps/web/src/lib/site-data.ts`
- `apps/web/src/lib/catalog-data.ts`
- `apps/web/src/lib/distro-data.ts`
- `apps/web/src/lib/store-collection.ts`
- `apps/web/src/lib/store-page-data.ts`
- `apps/web/src/lib/item-availability.ts`
- `apps/web/src/lib/release-commerce.ts`
- `apps/web/src/lib/release-feature.ts`
- `apps/web/src/lib/slugs.ts`
- `apps/web/src/lib/store-tax-category.ts`
- `apps/web/src/pages/index.astro`
- `apps/web/src/pages/artists/**`
- `apps/web/src/pages/releases/**`
- `apps/web/src/pages/news/**`
- `apps/web/src/pages/distro/**`
- `apps/web/src/pages/store/index.astro`
- `apps/web/src/pages/store/[slug]/index.astro`
- `apps/web/src/components/cards/**`
- `apps/web/src/components/detail/**`

## Provided Interface

- browser-safe content and catalog projections
- canonical route props and route builders
- shopper-facing `StoreItem` and display metadata projections
- store tax-category policy for browser-safe Stripe Tax classification

## Internal Implementation Area

- collection sorting and grouping rules
- release and Distro projection heuristics
- editorial normalization and fallback logic
- slug generation, validation, and committed catalog slug collision checks
- tax-category to Stripe Tax code classification for static store products

## Allowed Dependencies

- `player`
- `store-cart`
- `checkout-web`
- `ui-foundation`
- `platform-shared`

## Named Interfaces / SPI Surfaces

- future `catalog-api` facade if collection or route projections need extra exposure beyond the root module surface

## Published Events

- none formal today

## Listened-To Events

- none formal today

## Verification Strategy

- keep browser-facing surfaces free of backend runtime imports and secrets
- keep store projections browser-safe and non-authoritative
- preserve route and projection tests plus Browser Use checks on representative catalog routes

## Tests Required Before Refactors

- `apps/web/src/lib/catalog-data.test.ts`
- `apps/web/src/lib/item-availability.test.ts`
- `apps/web/src/lib/slugs.test.ts`
- `apps/web/src/lib/store-collection.test.ts`
- `apps/web/src/lib/store-page-data.test.ts`
- `apps/web/src/lib/store-tax-category.test.ts`
- Browser Use checks for catalog, detail, and store item routes

## Migration Status

`closed`
