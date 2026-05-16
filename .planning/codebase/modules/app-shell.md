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
- the thin `AppShellRoot` composition root for persistent shell behavior

## Internal Implementation Area

- app-shell internal organization now follows the Phase 12 AppShellRoot strategy: `navigation`, `overlay`,
  `player-shell`, `store-cart`, and `dom` folders hold extracted helper/test pairs
- shell page snapshot parsing/application plus the `shell-page-loader` request/cache seam
- shell-section navigation orchestration for route parsing, snapshot cache/fetch, transition, history, scroll reset, and
  fallback document navigation
- overlay history behavior plus the `overlay-fragment-loader` request/cache seam, `overlay-history` history seam, and
  overlay open coordination and overlay focus scheduling
- shell transition state, cached page restoration, route loading timer mechanics, target scrolling, body state classes,
  hero scroll progress, and focus, scroll-restoration, or scroll resets
- shell rendered navigation state synchronization
- shell `popstate` routing decisions
- shell Escape-key dismissal priority
- shell document click target classification
- shell document/window event routing for click, prefetch, Escape, popstate, and iframe-blur behavior
- shell anchor-click navigation routing
- shell document/window listener attachment for persistent navigation, overlay, and player events
- player shell view-state derivation while player session behavior remains shell-owned from the user perspective
- player modal focus scheduling and trigger focus restoration for shell-owned player controls
- player modal open request decision-making for shell-owned player controls
- player session-machine input derivation for shell-owned player controls
- player iframe blur interaction detection for shell-owned player controls
- player frame-host synchronization for shell-owned player controls
- player session lifecycle coordination for shell-owned player controls
- StoreCart state application and persistence through the StoreCart bridge
- shell prefetch intent classification for player origin warmup and route/overlay prefetch
- portal reinjection details plus the `shell-portal-targets` route-scoped target helper
- the closed `player` module's `player-*` files remain at the app-shell root until a separate manifest-aware move is
  approved

## Allowed Dependencies

- `player`
- `store-cart`
- `checkout-web`
- `storefront-catalog`
- `ui-foundation`
- `platform-shared`

## Named Interfaces / SPI Surfaces

- none today

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
- shell document event routing tests
- shell anchor click navigation tests
- shell player modal open request tests
- shell player session controller tests
- Browser Use shell acceptance checks

## Migration Status

`closed`

## Closure Evidence

- `AppShellRoot.tsx` is inside the Phase 12 target band at 820 lines and remains focused on React composition, state, refs,
  and rendering.
- routing, overlay, history, scroll/focus, prefetch, player coordination, and StoreCart bridge behavior live in named
  internal helpers with direct tests.
- external callers use `AppShell.astro` as the documented shell mount surface; shell internals are not published as
  compatibility facades.
