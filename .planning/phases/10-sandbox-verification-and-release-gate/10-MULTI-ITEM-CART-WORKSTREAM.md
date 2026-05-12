# Multi-Item Cart And Quantity Workstream

## Summary

This is a no-account commerce expansion workstream that may proceed while the Stripe Access Gate and BOX NOW Portal
Gate remain deferred. It upgrades the current single-item cart convenience layer into a multi-line CartDraft with
CartQuantity controls, then makes the Worker validate every line before checkout.

This workstream is not production cutover and does not satisfy `07-16`, `09-06`, `10-03`, `OPER-01`, or `SHIP-03`.

## Scope

- Add multi-line StoreCart state with quantity controls.
- Preserve StoreCart as convenience state only.
- Keep native browser `localStorage` behind the cart module unless StoreCart becomes account-backed, cross-device, or
  operationally authoritative.
- Evolve `StartCheckout` from one StoreItemOption to one or more CartLines.
- Add D1 order-line persistence through an additive `CheckoutOrderLine` model/table.
- Decrement stock once per paid CheckoutOrderLine after verified paid webhook transition.
- Keep one BOX NOW Locker per CheckoutOrder unless a later shipping plan explicitly introduces split shipments.

## Required Future Plans

1. Define CartDraft, CartLine, CartQuantity, max quantity, merge-on-add behavior, remove behavior, and v1-to-v2 browser
   storage migration.
2. Update cart drawer, header count, PDP add-to-cart, checkout order summary, and tests for multi-line quantities.
3. Change public checkout request shape to send cart lines plus the existing Shipping Locker Snapshot.
4. Update Worker validation so it re-reads ItemAvailability, OnlineStock, and Stripe Price Mapping for every CartLine.
5. Add `CheckoutOrderLine` persistence and internal readback without overloading current single-item CheckoutOrder
   fields.
6. Update paid webhook stock decrement to apply one idempotent stock decrement per CheckoutOrderLine.
7. Validate with local stripe-mock and Browser Use; defer real multi-line Stripe evidence until the Stripe Access Gate
   is satisfied.

## Storage Policy

Native `localStorage` remains the correct storage primitive for browser-only cart convenience state. The implementation
should harden the existing module with a versioned key such as `blackbox.storeCart.v2`, strict parsing, migration tests,
clear/remove behavior, and optional `storage` event sync if multi-tab drift becomes a real issue.

Do not add Zustand, Redux Persist, Dexie, IndexedDB wrappers, or cart SaaS libraries for this scope. Those tools do not
solve the authoritative parts of this feature: Worker validation, Stripe line items, D1 order lines, webhook
idempotency, and stock semantics.

## Deferred Or Out Of Scope

- Stock reservation before payment.
- Account-backed or cross-device carts.
- Split shipments or multiple BOX NOW Lockers per order.
- Discount codes, cart notes, customer accounts, or production cutover.
- Real Stripe multi-line Checkout evidence until real Stripe test-mode access exists.
- BOX NOW partner-portal fulfillment evidence until portal access exists.

## Implementation Note - 2026-05-08

- Browser cart state now uses canonical `blackbox.storeCart.v2` storage with v1 read migration, multi-line `CartDraft`
  helpers, per-line `CartQuantity` controls, and drawer/checkout summary rendering for multiple lines.
- Public checkout now accepts `lines: [{ storeItemSlug, variantId, quantity }]` beside the existing Shipping Locker
  Snapshot, while retaining single-line compatibility during transition.
- Worker checkout validation re-reads StoreItemOption, ItemAvailability, OnlineStock, and Stripe Price Mapping for every
  CartLine before creating one Stripe line item per CartLine.
- D1/Prisma now has additive `CheckoutOrderLine` persistence, and paid webhook reconciliation decrements stock per paid
  order line after the once-only order transition.
- This does not satisfy the Stripe Access Gate, BOX NOW Portal Gate, `10-03`, `OPER-01`, or `SHIP-03`.

## Validation Update - 2026-05-12

- StoreCart naming fallout was repaired after the `primaryLineItem` rename. Remaining view/test references now use
  `StoreCartState.primaryLineItem`, and snapshot builders are named for `CartLineItemSnapshot`.
- Targeted StoreCart validation passed:
  `pnpm --filter @blackbox/web exec vitest run src/lib/store-cart.test.ts src/components/store/StoreCartDrawer.test.tsx src/components/store/StorePurchaseFlow.test.ts src/components/store/StoreItemPurchaseActions.test.tsx src/lib/store-page-data.test.ts`
  with 5 test files and 32 tests passing.
- Targeted paid-checkout reconciliation validation passed:
  `pnpm --filter @blackbox/backend exec vitest run test/application/commerce/orders/paid-checkout-reconciliation.test.ts test/http/public-commerce-routes.test.ts`
  with 2 test files and 19 tests passing.
- Required repo validation passed: `pnpm test:unit`, `pnpm check`, and `pnpm build`.
- Browser Use validation was attempted through Agentify navigation and failed with `missing_electron_binary`.
- DevTools MCP fallback validation used the running `pnpm dev:stack:stripe-mock` stack. It added Disintegration and
  Afterglow Cassette, adjusted Disintegration to quantity 2, verified drawer and checkout count `3 ITEMS`, selected the
  BOX NOW Test Locker, mounted the local mock checkout state, and confirmed the checkout POST sent `lines` with
  `disintegration-black-vinyl-lp` quantity 2 plus `afterglow-tape` quantity 1. Console warnings/errors were empty.
