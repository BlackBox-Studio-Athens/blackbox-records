# ADR-002: Commerce System Boundaries And Trust Model

**Status:** Accepted  
**Date:** 2026-04-19  
**Decision owner:** Approved during archived milestone v1.0

## Context

The migration target is intentionally minimal. The browser must not become a trusted actor for payment success, inventory state, or authoritative order lifecycle updates. The site also needs to avoid duplicating catalog ownership across Astro content, Stripe, and D1.

## Decision

- **Stripe** is the source of truth for products, prices, Checkout Sessions, and payment event truth.
- **D1** is the source of truth for inventory counts and order lifecycle state only.
- **Browser code** can read safe projections but must not write authoritative inventory or paid-order state.
- **Verified Stripe webhooks** are authoritative for order-paid transitions and inventory decrement.
- **v1 does not reserve stock** before payment confirmation.
- **Embedded Checkout API shape** follows current Stripe docs: `ui_mode: embedded`, `return_url`, and optional `redirect_on_completion` tuning.

## Rationale

- Keeps pricing and sellable catalog data close to the checkout system that already consumes it.
- Limits the D1 data model to the operational state BlackBox actually needs.
- Prevents the browser from becoming a privileged actor in payment or stock transitions.
- Matches the approved v1 inventory semantics and low-volume operating model.

## Consequences

- Server routes are mandatory for checkout and webhook work.
- Stripe request shapes and webhook handling must stay aligned with current official docs.
- Inventory oversell remains a rare possible edge case in v1 because reservation logic is intentionally excluded.
- Astro content collections remain editorial, not the sellable catalog authority.

## References

- [Stripe embedded Checkout build guide](https://docs.stripe.com/payments/checkout/build-subscriptions?payment-ui=embedded-form)
- [Stripe custom success / redirect behavior](https://docs.stripe.com/payments/checkout/custom-success-page?payment-ui=embedded-form)
- [Stripe checkout fulfillment](https://docs.stripe.com/checkout/fulfillment?payment-ui=embedded-form)
