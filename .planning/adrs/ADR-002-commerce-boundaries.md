# ADR-002: Commerce System Boundaries And Trust Model

**Status:** Accepted  
**Date:** 2026-04-19  
**Decision owner:** Approved during archived milestone v1.0

## Context

The migration target is intentionally minimal. The browser must not become a trusted actor for payment success, stock state, or authoritative order lifecycle updates. The site also needs to avoid duplicating catalog ownership across Astro content, Stripe, and D1.

## Decision

- **Stripe** is the source of truth for products, prices, Checkout Sessions, and payment event truth.
- **v1 shopper payment initiation** uses Checkout Sessions only; raw PaymentIntents or Payment Element flows stay out of scope unless a later phase explicitly re-approves a more custom payment surface.
- **D1** is the source of truth for stock counts and order lifecycle state only.
- **Browser code** can read safe projections but must not write authoritative stock or paid-order state.
- **Return and retry pages** retrieve CheckoutState only through Worker-owned APIs; raw Stripe query params or raw Stripe identifiers are not the durable browser contract.
- **Stripe-to-app state normalization** is expressed as one backend-owned reconciliation use case shared by ReadCheckoutState and verified webhook handling.
- **Verified Stripe webhooks** are authoritative for order-paid transitions and stock decrement.
- **v1 does not reserve stock** before payment confirmation.
- **Embedded Checkout API shape** follows current Stripe docs: `ui_mode: embedded`, `return_url`, and optional `redirect_on_completion` tuning.

## Rationale

- Keeps pricing and sellable item data close to the checkout system that already consumes it.
- Keeps the approved one-time physical-goods flow on the lowest-maintenance Stripe surface.
- Limits the D1 data model to the operational state BlackBox actually needs.
- Prevents the browser from becoming a privileged actor in payment or stock transitions.
- Avoids split-brain checkout-state handling across return pages and webhook processing.
- Matches the approved v1 stock semantics and low-volume operating model.

## Consequences

- Server routes are mandatory for StartCheckout, ReadCheckoutState, and webhook work.
- Stripe request shapes and webhook handling must stay aligned with current official docs.
- Frontend contracts stay on app slugs and backend-owned status payloads rather than raw Stripe IDs or `CHECKOUT_SESSION_ID` browser coupling.
- Webhook handlers must verify the raw body and signature, acknowledge promptly, and run idempotent reconciliation side effects asynchronously where practical.
- Stock oversell remains a rare possible edge case in v1 because reservation logic is intentionally excluded.
- Astro content collections remain editorial, not the sellable item authority.

## References

- [Stripe embedded Checkout build guide](https://docs.stripe.com/payments/checkout/build-subscriptions?payment-ui=embedded-form)
- [Stripe custom success / redirect behavior](https://docs.stripe.com/payments/checkout/custom-success-page?payment-ui=embedded-form)
- [Stripe checkout fulfillment](https://docs.stripe.com/checkout/fulfillment?payment-ui=embedded-form)
