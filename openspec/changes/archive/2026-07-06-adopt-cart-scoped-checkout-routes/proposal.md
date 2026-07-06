## Why

Checkout is now cart-capable, but the browser route still looks like checkout belongs to the first cart item, for example `/store/aftermaths/checkout/`. That is misleading when `StoreCart` contains multiple `CartLine`s and it also makes future variant design harder to explain.

This change moves shopper checkout documents to a cart-scoped URL while keeping item pages focused on sellable item discovery and add-to-cart actions.

## What Changes

- Move the shopper checkout document from `/store/{storeItemSlug}/checkout/` to `/store/checkout/`.
- Move the shopper checkout return document from `/store/{storeItemSlug}/checkout/return/` to `/store/checkout/return/`.
- Keep the Worker-owned checkout API at `/api/checkout/sessions`; it already accepts `lines[]` and remains the authority for validating every `CartLine`.
- Update Stripe success and cancel URL generation so hosted Checkout returns to the cart-scoped checkout pages.
- Keep old item-scoped checkout URLs as compatibility redirects or non-primary aliases during rollout so old links, tests, and provider-return paths do not strand shoppers.
- Keep item detail pages at `/store/{storeItemSlug}/`, with add-to-cart as the primary item action.
- Decide and document the format/variant URL model:
  - Phase 1: keep one sellable `StoreItem` per format where that is already the current catalog shape, for example `/store/album-vinyl/` and `/store/album-cd/`.
  - Later: allow one product-style page with a variant selector only when catalog content, Store Offer reads, and stock UI are ready to expose multiple variants under one page.
- Update tests, smoke routes, docs, and OpenSpec language so checkout is described as cart-scoped rather than item-scoped.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `commerce-checkout`: checkout document routing, return/cancel URL behavior, and multi-line cart checkout expectations change from item-scoped route ownership to cart-scoped route ownership.
- `project-language`: canonical language must distinguish Store Item pages, cart-scoped checkout pages, and future variant selector behavior.
- `module-boundaries`: checkout-web route ownership changes to include cart-scoped checkout pages and keep item-scoped checkout pages compatibility-only.

## Impact

- Frontend routes under `apps/web/src/pages/store/`.
- Cart drawer checkout entry in `apps/web/src/components/store/StoreCartDrawer.tsx`.
- Checkout/return components under `apps/web/src/components/store/`.
- Cart path helper in `apps/web/src/lib/store-cart.ts`.
- Store item path helpers in `apps/web/src/lib/catalog-data.ts` and `apps/web/src/lib/store-page-data.ts`.
- Remove the Store Item `checkoutPath` projection and any catalog field-ownership references that still make item-scoped checkout look primary.
- Worker return/cancel URL generation in `apps/backend/src/interfaces/http/routes/public-checkout-return-url.ts`.
- Module-boundary manifest entries for checkout web routes under `openspec/specs/module-boundaries/`.
- Public checkout route tests and return URL tests under `apps/backend/test/http/`.
- Frontend cart and checkout tests under `apps/web/src/components/store/` and `apps/web/src/lib/`.
- Smoke fixtures and docs that reference `/store/{slug}/checkout/`, including Stripe UAT smoke and deterministic local checkout paths.
- No new runtime dependency is expected.
