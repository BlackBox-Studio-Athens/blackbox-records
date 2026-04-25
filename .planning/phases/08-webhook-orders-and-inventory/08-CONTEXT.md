# Phase 8: Webhook Orders And Stock - Context

**Gathered:** 2026-04-21
**Status:** Planning refined

<domain>
## Phase Boundary

Phase 8 makes paid-order truth and post-payment stock mutation authoritative in the Worker backend. It defines the verified webhook path, the shared Stripe reconciliation flow behind it, and the idempotent D1 transitions that the browser must never own.

</domain>

<decisions>
## Implementation Decisions

- **D-01:** Verified raw-body Stripe webhooks are the only path that marks orders paid or decrements stock.
- **D-02:** Webhook handlers verify the signature, acknowledge promptly, and move idempotent reconciliation side effects into backend-owned asynchronous work where practical.
- **D-03:** Phase 8 defines one business-named Stripe reconciliation use case shared by verified webhook handling and ReadCheckoutState.
- **D-04:** Shared reconciliation logic can normalize observable checkout state for browser UX, but only verified webhooks may perform authoritative paid transitions or stock decrement.
- **D-05:** Phase 8 remains a one-time physical-goods flow; subscription-oriented Stripe event models and customer-authenticated SaaS assumptions are out of scope.
- **D-06:** Low-volume exception handling can continue through Stripe Dashboard plus D1-backed manual reconciliation rather than requiring a full operator OMS in this milestone.

</decisions>

<specifics>
## Specific Ideas

- Keep the Stripe event allowlist narrow and focused on the checkout/session events needed for the approved v1 flow.
- Treat Stripe customer/session/payment identifiers as backend mapping inputs, not as durable browser contracts.
- Reuse the same backend normalization logic for ReadCheckoutState and webhook-triggered reconciliation so order state does not drift across code paths.

</specifics>

<canonical_refs>

## Canonical References

- `.planning/ROADMAP.md`
- `.planning/REQUIREMENTS.md`
- `.planning/adrs/ADR-002-commerce-boundaries.md`
- `.planning/phases/07-embedded-checkout-sandbox-flow/07-CONTEXT.md`
- `.planning/phases/06.1.1-internal-stock-operations-and-operator-access/06.1.1-CONTEXT.md`

</canonical_refs>

---

_Phase: 08-webhook-orders-and-stock_
_Context gathered: 2026-04-21_
