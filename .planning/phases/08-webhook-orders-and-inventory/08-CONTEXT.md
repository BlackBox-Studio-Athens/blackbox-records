# Phase 8: Webhook Orders And Stock - Context

**Gathered:** 2026-04-21
**Status:** Planning refined

<domain>
## Phase Boundary

Phase 8 makes paid-order truth and post-payment stock mutation authoritative in the Worker backend. It defines the verified webhook path, the shared Stripe reconciliation flow behind it, and the idempotent D1 transitions that the browser must never own.

Because Stripe account access is not currently available, Phase 8 is split into non-secret groundwork and deferred Stripe-account validation. D1/Prisma order schema, repository seams, typed transition guards, generated client checks, fixture-based webhook route shape, and documentation may proceed now. Real Stripe Checkout validation, live test Price mappings, webhook signing against Stripe Dashboard events, and remote sandbox payment evidence remain blocked until account access exists.

</domain>

<decisions>
## Implementation Decisions

- **D-01:** Verified raw-body Stripe webhooks are the only path that marks orders paid or decrements stock.
- **D-02:** Webhook handlers verify the signature, acknowledge promptly, and move idempotent reconciliation side effects into backend-owned asynchronous work where practical.
- **D-03:** Phase 8 defines one business-named Stripe reconciliation use case shared by verified webhook handling and ReadCheckoutState.
- **D-04:** Shared reconciliation logic can normalize observable checkout state for browser UX, but only verified webhooks may perform authoritative paid transitions or stock decrement.
- **D-05:** Phase 8 remains a one-time physical-goods flow; subscription-oriented Stripe event models and customer-authenticated SaaS assumptions are out of scope.
- **D-06:** Low-volume exception handling can continue through Stripe Dashboard plus D1-backed manual reconciliation rather than requiring a full operator OMS in this milestone.
- **D-07:** Do not add Robot3, XState, Cloudflare Workflows, or a frontend commerce state machine for v1 order status. Use a tiny backend typed transition table/guard after the D1 order schema exists.
- **D-08:** `CheckoutState` remains a derived browser read model from Stripe session state; persisted D1 order lifecycle uses `pending_payment`, `paid`, `not_paid`, and `needs_review`.
- **D-09:** Real Stripe-account validation is a deferred gate, not a prerequisite for non-secret Phase 8 schema and contract work. Do not commit real Stripe keys, Price IDs, webhook secrets, or account-specific sandbox config.

</decisions>

<specifics>
## Specific Ideas

- Keep the Stripe event allowlist narrow and focused on the checkout/session events needed for the approved v1 flow.
- Treat Stripe customer/session/payment identifiers as backend mapping inputs, not as durable browser contracts.
- Reuse the same backend normalization logic for ReadCheckoutState and webhook-triggered reconciliation so order state does not drift across code paths.
- Persist transition authority only through backend order use cases. Browser return reads may observe state, but must not apply persisted order transitions.
- Keep fixture-based webhook tests explicitly labeled as contract tests until `STRIPE_WEBHOOK_SECRET` and Stripe account access exist.
- Preserve `07-16` as a required later validation gate before sandbox/release approval.
- `08-01` added only the D1/Prisma lifecycle schema: `CheckoutOrder` plus `OrderStatus`. It intentionally did not add repositories, transition guards, webhook routes, reconciliation, stock decrement, frontend behavior, or account-specific Stripe values.
- `08-02` added internal order repository/application seams plus a dependency-free typed transition guard. It intentionally did not add webhook routes, Stripe signature verification, stock decrement, frontend behavior, or account-specific Stripe values.
- `08-03` added the Stripe webhook raw-body route contract using fixture-based signature tests. It intentionally did not claim real Stripe account validation, live Dashboard webhook setup, order mutation, stock decrement, frontend behavior, or account-specific Stripe values.
- `08-03.1` added a no-Docker official `stripe-mock` API local checkout simulation harness. It starts `stripe-mock` through Go, points the real Stripe SDK at a local dev-only compatibility proxy for request-shape validation, keeps mock/fake behavior in local scripts/config/tests, and uses signed webhook fixtures because official `stripe-mock` is stateless and does not emit webhooks.
- `08-04` added shared Stripe Checkout Session reconciliation for `ReadCheckoutState` and verified webhook acknowledgement. It intentionally remains non-authoritative for browser reads and does not perform order mutation, stock decrement, frontend behavior, live Stripe validation, or account-specific configuration.
- `08-05` added pending `CheckoutOrder` creation from Worker-owned checkout start and idempotent paid webhook handling that transitions orders to `paid`, decrements stock once, and records a `checkout_paid` stock change only when the transition is not a replay. It intentionally does not handle unpaid/expired/needs-review outcomes, shipping, frontend behavior, live Stripe validation, or account-specific configuration.
- `08-06` added fixture-tested non-paid and needs-review webhook handling. It transitions pending orders to `not_paid` or `needs_review`, ignores open/processing `pending_payment` recommendations, treats duplicate terminal delivery as replay/no-op, and never writes stock. It intentionally does not add operator order-state readback, refunds, shipping, frontend behavior, live Stripe validation, or account-specific configuration.

</specifics>

<canonical_refs>

## Canonical References

- `.planning/ROADMAP.md`
- `.planning/REQUIREMENTS.md`
- `.planning/adrs/ADR-002-commerce-boundaries.md`
- `.planning/phases/07-embedded-checkout-sandbox-flow/07-CONTEXT.md`
- `.planning/phases/06.1.1-internal-stock-operations-and-operator-access/06.1.1-CONTEXT.md`
- `.planning/phases/08-webhook-orders-and-inventory/08-STATE-MODEL.md`

</canonical_refs>

---

_Phase: 08-webhook-orders-and-stock_
_Context gathered: 2026-04-21_
