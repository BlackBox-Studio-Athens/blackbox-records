# ADR-002: Commerce System Boundaries And Trust Model

**Status:** Proposed  
**Date:** 2026-04-06  
**Decision owner:** Human review required in Phase 1

## Context

The migration target is intentionally minimal. The browser should not become a trusted actor for payment success, inventory state, or authoritative order lifecycle updates. The site also needs to avoid duplicating catalog ownership across Astro content, Stripe, and Supabase.

## Proposed Decision

- **Stripe** is the source of truth for products, prices, checkout sessions, and payment event truth.
- **Supabase** is the source of truth for inventory counts and order lifecycle state only.
- **Browser code** can read safe projections but must not write authoritative inventory or paid-order state.
- **Webhook-confirmed payment success** is authoritative for order-paid transitions and inventory decrement.
- **v1 does not reserve stock** before payment confirmation.

## Rationale

- Keeps pricing and sellable catalog data close to the checkout system that already consumes it
- Limits the Supabase data model to the business state BlackBox actually needs to operate
- Prevents the browser from becoming a privileged actor in payment or stock transitions
- Matches the explicit v1 inventory semantics requested for this milestone

## Consequences

- Server routes must exist before commerce work can proceed
- Stripe API versioning and event handling need explicit Phase 1 design work
- Inventory oversell risk remains possible in v1 because reservation logic is intentionally excluded
- Astro content collections remain editorial, not the sellable product authority

## Review Gate

Phase 1 is not complete until the team approves:

1. Catalog ownership boundaries
2. Order and inventory ownership boundaries
3. Webhook-authoritative paid-state rule
4. No-reservation v1 semantics

## References

- [Stripe Checkout Sessions create API](https://docs.stripe.com/api/checkout/sessions/create)
- [Stripe handling payment events](https://docs.stripe.com/payments/handling-payment-events)

