# Module Canvas: app-shell

## Responsibility

Own persistent shell navigation, overlay loading, history integration, and portal reinjection for top-level shopper
sections while acting as the future thin composition root over smaller shell submodules.

## Owned Files And Directories

- `apps/web/src/components/app-shell/AppShell.astro`
- `apps/web/src/components/app-shell/AppShellRoot.tsx`
- `apps/web/src/lib/app-shell/routing.ts`

## Provided Interface

- `AppShell.astro` as the shell mount surface
- the future thin `AppShellRoot` composition root for persistent shell behavior

## Internal Implementation Area

- shell page snapshot parsing and caching
- overlay cache and overlay history behavior
- shell transition state and focus or scroll resets
- portal reinjection details

## Allowed Dependencies

- `player`
- `store-cart`
- `checkout-web`
- `storefront-catalog`
- `platform-shared`

## Named Interfaces / SPI Surfaces

- none today
- planned future seams: `snapshot`, `overlay`, `history`, and `cart-bridge`

## Published Events

- none formal today

## Listened-To Events

- `STORE_CART_ADD_ITEM_EVENT`
- `STORE_CART_OPEN_REQUESTED_EVENT`
- `CHECKOUT_CART_UPDATED_EVENT`

## Verification Strategy

- reject imports into shell internals from outside the module through the manifest plus boundary rules
- add helper-level tests for routing, snapshot parsing, and history coordination before moving code
- relocate touched shell tests closer to the hardened shell seams during boundary work
- keep Browser Use validation for header/footer/mobile section switching, overlay continuity, and player continuity

## Tests Required Before Refactors

- routing helper tests
- shell snapshot parser tests
- overlay history tests
- Browser Use shell acceptance checks

## Migration Status

`open-temporary`

## Exit Criteria

- `AppShellRoot.tsx` becomes a thin composition root
- routing, overlay, history, and StoreCart bridge logic live in extracted internal modules
- shell behavior has direct automated coverage beyond player helper tests
- callers depend on explicit shell entrypoints instead of deep imports into extracted helpers
