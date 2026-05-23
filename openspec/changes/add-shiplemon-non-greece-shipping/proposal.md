## Why

Current shipping is Greece-only manual BOX NOW fulfillment. Non-Greece shipping is post-MVP and must not block checkout launch readiness, but the preserved plan should become an OpenSpec change for later reactivation.

## What Changes

Add a post-MVP OpenSpec change for Worker-owned Shiplemon quotes and operator-confirmed shipment creation outside Greece, with explicit fail-closed and secret-boundary rules.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `shipping-fulfillment`: Adds deferred non-Greece Shiplemon requirements.
- `commerce-checkout`: Future checkout starts may require an app-owned `shippingQuoteId` for non-Greece destinations.
- `orders-stock-operator`: Future shipment creation happens after verified payment and operator review.

## Impact

- Docs/specs only until explicitly reactivated.
- Future code areas include Worker checkout, Stripe gateway, D1/Prisma, public commerce API, internal operator API, generated API client, and shopper checkout UI.
