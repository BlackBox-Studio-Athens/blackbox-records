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

- shell page snapshot parsing/application plus the `shell-page-loader` request/cache seam
- overlay history behavior plus the `overlay-fragment-loader` request/cache seam, `overlay-history` history seam, and
  overlay focus scheduling
- shell transition state, cached page restoration, route loading timer mechanics, target scrolling, body state classes,
  hero scroll progress, and focus, scroll-restoration, or scroll resets
- shell rendered navigation state synchronization
- shell `popstate` routing decisions
- shell Escape-key dismissal priority
- shell document click target classification
- shell anchor-click navigation routing
- shell document/window listener attachment for persistent navigation, overlay, and player events
- player shell view-state derivation while player session behavior remains shell-owned from the user perspective
- player modal focus scheduling and trigger focus restoration for shell-owned player controls
- player modal open request decision-making for shell-owned player controls
- player session-machine input derivation for shell-owned player controls
- player iframe blur interaction detection for shell-owned player controls
- player frame-host synchronization for shell-owned player controls
- StoreCart state application and persistence through the StoreCart bridge
- shell prefetch intent classification for player origin warmup and route/overlay prefetch
- portal reinjection details plus the `shell-portal-targets` route-scoped target helper

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
- shell body state tests
- shell document listener tests
- shell hero scroll progress tests
- shell snapshot parser and application tests
- shell page loader tests
- route loading indicator tests
- shell scroll restoration tests
- shell target scroll tests
- overlay fragment loader tests
- overlay focus tests
- overlay history tests
- shell portal target tests
- shell player view-state tests
- shell player focus tests
- shell player iframe blur interaction tests
- shell player frame-host tests
- shell player session-machine state tests
- shell prefetch intent tests
- shell rendered navigation state tests
- shell cached page restoration tests
- shell popstate navigation tests
- shell escape dismissal tests
- shell document click intent tests
- shell anchor click navigation tests
- shell player modal open request tests
- Browser Use shell acceptance checks

## Migration Status

`open-temporary`

## Exit Criteria

- `AppShellRoot.tsx` becomes a thin composition root
- routing, overlay, history, and StoreCart bridge logic live in extracted internal modules
- shell behavior has direct automated coverage beyond player helper tests
- callers depend on explicit shell entrypoints instead of deep imports into extracted helpers
