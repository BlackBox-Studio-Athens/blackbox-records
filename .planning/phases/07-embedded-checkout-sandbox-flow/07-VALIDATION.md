# Phase 7 Validation

## Required Checks

- Worker-owned StoreItem/Variant lookup and StartCheckout APIs exist.
- Worker-owned checkout-status retrieval exists for return/retry states.
- Static frontend checkout route uses backend APIs, not Stripe secrets.
- Embedded Checkout mounts and returns cleanly in sandbox.
- Browser pages remain non-authoritative for paid state.
- Shopper-facing checkout URLs describe the sellable item option rather than legacy release shorthand.
- Cart icon, cart drawer, and checkout summary remain single-item and do not introduce browser-owned commerce authority.
- Local stripe-mock checkout readiness covers every current distro entry and release entry with fake local stock and mock Stripe mappings.
- Fake local stock is documented as development-only and is not treated as real inventory evidence.

## Review Questions

- Can the frontend remain stable if Stripe identifiers or internal mappings change?
- Does any browser path bypass the Worker backend for checkout initialization?
- Does any browser path infer durable checkout truth from raw Stripe query params instead of Worker-owned status retrieval?
- Is webhook authority still reserved for Phase 8?
- Does the cart/checkout UI feel familiar to Shopify users without copying Shopify theme assets or implying unsupported multi-item behavior?
- Does every current release and distro store item have local mock D1 state, fake local stock, and a mock Stripe mapping?
- Is real quantity uncertainty still handled by staff-recorded D1 stock operations rather than committed fake data outside mock mode?

---
*Validation completed: 2026-04-20; Shopify UX validation addendum added: 2026-04-24; all-items mock readiness addendum added: 2026-04-25*
