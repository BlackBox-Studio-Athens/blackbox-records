# Phase 3: Webhook-Authoritative Orders And Inventory - Context

**Gathered:** 2026-04-19
**Status:** Ready for planning

<domain>
## Phase Boundary

Define the authoritative post-payment state model for the native store so paid status and inventory changes come only from verified Stripe webhooks, never from the browser or return pages.

</domain>

<decisions>
## Implementation Decisions

### Order lifecycle shape
- **D-01:** v1 should use a minimal D1 order-state model: `pending_payment`, `paid`, `closed_unpaid`, and `needs_review`.
- **D-02:** Do not plan a larger accounting-style state machine unless Phase 3 research finds a concrete Stripe or D1 constraint that makes the minimal model unsafe for the expected order volume.
- **D-03:** `needs_review` exists specifically to catch rare operational exceptions without forcing the MVP into a more complex state taxonomy.

### Authoritative payment event policy
- **D-04:** The v1 paid trigger set should stay Checkout-session-centric rather than mixing a broad PaymentIntent event machine into the first implementation.
- **D-05:** Treat `checkout.session.completed` as authoritative only when the Checkout Session is actually paid.
- **D-06:** Treat `checkout.session.async_payment_succeeded` as the paid trigger for delayed payment methods.
- **D-07:** Treat `checkout.session.async_payment_failed` and `checkout.session.expired` as unpaid-closure signals that move the order to `closed_unpaid`.
- **D-08:** Browser return or cancel pages must never mark an order paid or mutate inventory.

### No-reservation oversell policy
- **D-09:** v1 accepts the tiny theoretical oversell risk created by having no reservation logic.
- **D-10:** The first paid webhook that successfully decrements stock wins.
- **D-11:** If a later paid webhook finds no stock available, the order moves to `needs_review` for manual operator handling rather than adding automated reservation or buffering logic.
- **D-12:** Manual refund handling through Stripe is acceptable for the rare oversell edge case at the expected launch volume.

### Operator reconciliation and tooling
- **D-13:** Stripe Dashboard only is sufficient for MVP reconciliation and exception handling.
- **D-14:** Do not plan an internal admin surface or dedicated order-ops tool in Phase 3.

### the agent's Discretion
- Exact D1 table/column names and idempotency-record shape
- Exact mapping of Stripe webhook payload fields into stored order records
- Whether `closed_unpaid` is produced only by explicit Stripe closure events or also by a later operational cleanup rule
- Exact criteria that should auto-route an event into `needs_review`

</decisions>

<specifics>
## Specific Ideas

- The user wants the simplest working thing that is still safe for very low launch volume.
- Expected initial order volume is approximately `2-3 sales per month`.
- Manual handling is acceptable for rare exception paths as long as normal paid flow stays authoritative and simple.
- The user explicitly prefers a brain-dead simple oversell policy over reservation logic or safety buffers.

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase and milestone constraints
- `.planning/ROADMAP.md` — Phase 3 scope, success criteria, and dependency on the Phase 2 checkout contract
- `.planning/STATE.md` — current milestone position and open blockers
- `.planning/REQUIREMENTS.md` — Phase 3 requirements list; note that `ORDR-01` and `OPER-01` still contain stale `Supabase` wording, so prefer the newer Phase 1 and Phase 3 context when they conflict

### Prior-phase locked decisions
- `.planning/phases/01-runtime-and-guardrails/01-CONTEXT.md` — locked Worker, D1, secret-boundary, and no-browser-write decisions
- `.planning/phases/01-runtime-and-guardrails/01-RESEARCH.md` — Stripe webhook-authority and runtime-boundary research
- `.planning/phases/02-native-catalog-and-embedded-checkout-slice/02-CONTEXT.md` — locked single-item `Buy Now` slice and non-authoritative return/cancel behavior
- `.planning/phases/02-native-catalog-and-embedded-checkout-slice/02-RESEARCH.md` — current embedded Checkout semantics and server-created session flow
- `.planning/phases/02-native-catalog-and-embedded-checkout-slice/02-02-PLAN.md` — planned Checkout Session contract, metadata expectations, and explicit Phase 3 handoff
- `.planning/phases/02-native-catalog-and-embedded-checkout-slice/02-UI-SPEC.md` — return/cancel copy must stay non-authoritative

### External product/payment references
- [Stripe fulfill orders](https://docs.stripe.com/checkout/fulfillment) — current Checkout event guidance for fulfillment and delayed-payment handling
- [Stripe handle payment events with webhooks](https://docs.stripe.com/webhooks/handling-payment-events) — webhook verification and authoritative server-side event handling
- [Stripe customize redirect behavior for embedded Checkout](https://docs.stripe.com/payments/checkout/custom-success-page?payment-ui=embedded-form) — explicit warning that landing pages cannot be the fulfillment authority

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `02-02-PLAN.md` in the Phase 2 planning set already defines the future session-creation contract and notes that order-paid authority belongs to Phase 3.
- The current app-shell and `/shop/` planning already treat return and cancel pages as informational only, which supports the webhook-authoritative Phase 3 model cleanly.

### Established Patterns
- The repo does not currently contain a live order, inventory, or webhook handling layer; Phase 3 is defining that operational model from scratch rather than adapting an existing backend subsystem.
- Current planning already treats Stripe as payment authority and D1 as operational state only, so Phase 3 should not invent a second source of truth.
- Very low order volume and explicit acceptance of manual exception handling are core constraints, not temporary implementation shortcuts.

### Integration Points
- Future webhook handling must connect to the Checkout Session metadata and route contract planned in `.planning/phases/02-native-catalog-and-embedded-checkout-slice/02-02-PLAN.md`.
- Future D1 order and inventory writes must remain server-only and align to the Cloudflare Worker trust boundary established in Phase 1.
- Future Phase 4 BOX NOW planning will depend on whatever order state and paid-event semantics are locked here.

</code_context>

<deferred>
## Deferred Ideas

- Internal order lookup or admin UI — defer beyond MVP unless manual Stripe Dashboard handling proves insufficient
- Conservative stock buffer rules — defer unless real oversell behavior appears in production
- Reservation logic before payment — explicitly deferred out of v1 scope

</deferred>

---

*Phase: 03-webhook-authoritative-orders-and-inventory*
*Context gathered: 2026-04-19*
