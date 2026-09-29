# Proposal

## Why

The desktop cart checkout was 1448 px tall, leaving the Stripe action about 540 px below the fold at 1440×900. Nested cards and facts repeated two to four times (item, Greece-only delivery, card-detail reassurance, cost) caused it.

## What Changes

- Cart and compatibility checkout pages: single "Checkout" heading with Continue Shopping; drop the badge, intro paragraph, outer card and "Shipping & Payment" header; reduce top padding.
- Checkout offer status becomes the one payment card: "Review and Pay" heading with status badge, delivery/cost summary, then consent, Stripe action and one card-detail line.
- Remove the Item/Shipping fact grid and the shipping-step notice (`CheckoutShippingStep`), which repeated the order summary and delivery text.
- Delivery summary reserves its loading height so the checkout action does not move when the quote arrives.
- Order summary keeps title, availability and lines only; remove the subtotal block, secure-payment copy and Back To Item link; quantity stepper grows to 44 px touch targets.
- Update unit tests and the UAT static smoke text to match.

## Capabilities

### Modified Capabilities

- `commerce-checkout`: Cart checkout fits one desktop screen and states each fact once.

## Impact

`apps/web` checkout pages and `store/checkout` components, their tests, and `scripts/smoke-uat-static.ts`. No API, Worker, dependency or commerce-authority change.
