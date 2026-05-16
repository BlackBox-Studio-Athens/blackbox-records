# Module Canvas: store-cart

## Responsibility

Own browser-only cart convenience state, storage format, parsing, totals, and cart-specific UI surfaces without
becoming a source of commerce authority.

## Owned Files And Directories

- `apps/web/src/lib/store-cart.ts`
- `apps/web/src/lib/store-cart.test.ts`
- `apps/web/src/components/store/StoreCartButton.tsx`
- `apps/web/src/components/store/StoreCartButton.test.tsx`
- `apps/web/src/components/store/StoreCartDrawer.tsx`
- `apps/web/src/components/store/StoreCartDrawer.test.tsx`

## Provided Interface

- `@/lib/store-cart`
- StoreCart button and drawer presentation surfaces

## Internal Implementation Area

- storage parsing and serialization details
- quantity normalization and subtotal formatting
- future storage migration helpers

## Allowed Dependencies

- `ui-foundation`
- `platform-shared`

## Named Interfaces / SPI Surfaces

- future `api`, `storage`, and `events` entrypoints if the root facade becomes too broad

## Published Events

- event contract ownership for `STORE_CART_ADD_ITEM_EVENT`
- event contract ownership for `STORE_CART_OPEN_REQUESTED_EVENT`

## Listened-To Events

- none required in the pure cart state module today

## Verification Strategy

- keep backend calls, Stripe concerns, stock authority, and checkout orchestration out of the cart module
- require callers to use the root StoreCart facade instead of deep imports into storage or event internals
- enforce strict parser and state tests around storage reads, writes, and quantity behavior

## Tests Required Before Refactors

- `apps/web/src/lib/store-cart.test.ts`
- `apps/web/src/components/store/StoreCartButton.test.tsx`
- `apps/web/src/components/store/StoreCartDrawer.test.tsx`

## Migration Status

`closed`
