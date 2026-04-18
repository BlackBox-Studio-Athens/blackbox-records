# Phase 3: Webhook-Authoritative Orders And Inventory - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-19
**Phase:** 03-webhook-authoritative-orders-and-inventory
**Areas discussed:** Order lifecycle shape, Authoritative payment event policy, No-reservation oversell policy, Operator reconciliation surface

---

## Order lifecycle shape

| Option | Description | Selected |
|--------|-------------|----------|
| Minimal lifecycle | `pending_payment`, `paid`, `closed_unpaid`, `needs_review` | ✓ |
| Medium explicit lifecycle | Separate `expired`, `failed`, `canceled`, and other unpaid states | |
| Broad state machine | Larger fulfillment/accounting-style state model | |

**User's choice:** Use the recommended minimal lifecycle model if it is safe for the expected simple use case.
**Notes:** User expects approximately `2-3 sales per month` at launch and wants the simplest working thing as long as it does not create problems for that low-volume flow.

---

## Authoritative payment event policy

| Option | Description | Selected |
|--------|-------------|----------|
| Minimal Checkout-session event set | Use `checkout.session.completed` when paid, `checkout.session.async_payment_succeeded`, and unpaid closure events | ✓ |
| Broader multi-event model | Mix a larger set of Checkout and PaymentIntent events into a richer state machine | |
| PaymentIntent-centric model | Use PaymentIntent events as the main paid trigger path | |

**User's choice:** Use the recommended minimal authoritative event set.
**Notes:** User explicitly wants the simplest working approach and does not want unnecessary event complexity for MVP.

---

## No-reservation oversell policy

| Option | Description | Selected |
|--------|-------------|----------|
| Manual rare-oversell handling | Accept rare oversell risk, move late conflict to `needs_review`, refund manually in Stripe | ✓ |
| Conservative stock buffer | Reserve a safety margin or hide the last unit early | |
| Reservation logic | Hold stock before payment confirmation | |

**User's choice:** Use the recommended manual exception policy.
**Notes:** User wants a brain-dead simple solution and believes this edge case will likely never happen at the expected launch volume.

---

## Operator reconciliation surface

| Option | Description | Selected |
|--------|-------------|----------|
| Stripe Dashboard only | Manual reconciliation and refund handling stays in Stripe Dashboard | ✓ |
| Thin internal lookup | Add a minimal order lookup or status page | |
| Full internal admin | Build a dedicated operator/admin surface | |

**User's choice:** Use the recommended Stripe Dashboard only approach.
**Notes:** User considers Stripe Dashboard sufficient for MVP operational handling.

---

## the agent's Discretion

- Exact D1 persistence shape for order and idempotency records
- Exact webhook-to-state transition table details
- Exact trigger conditions for `needs_review`

## Deferred Ideas

- Internal admin tooling
- Conservative stock buffering
- Reservation logic
