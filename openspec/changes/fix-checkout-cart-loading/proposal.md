# Proposal

## Why

Checkout initially treats an unread saved cart as empty. Slow hydration shows contradictory empty-cart and delivery-failure copy before the shopper's saved items appear.

## What Changes

- Represent an unread cart separately from a confirmed empty cart in both checkout islands.
- Reuse neutral loading feedback and reserved delivery rows until the cart is read; withhold quantity editing and payment until their prerequisites are known.
- Preserve current cart updates, single-item fallback, authoritative quote gating and delivery retry.
- Cover server rendering and delayed hydration with focused tests at desktop and 390px.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `commerce-checkout`: distinguish saved-cart loading from empty, unsupported and failed-quote states.

## Impact

CheckoutOfferStatus, CheckoutOrderSummary, their component tests and a dedicated browser regression. No API, cart persistence, layout, filters, Home video, dependency or provider changes. Base dependency: `a0ad126957f9a8482d8a5736fefab0f37854074b`, delivery recovery. Local isolated implementation and one focused commit only; integration remains with the coordinator.
