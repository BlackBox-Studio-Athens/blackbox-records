## Why

A double-click or response lost after a successful write can create another pending checkout hold or repeat a stock adjustment even at very low traffic. On 2026-09-14 the user requested the most sensible small solution for an expected 2–3 purchases per week, with 2–3 per day as the initial maximum.

## What Changes

- Reuse completed item/price journals, durable selected-record/batch publication identity, order/provider recovery, webhook deduplication, stock transactions and recount revision checks; add protection only where checkout/stock retry identity is still missing.
- Give a checkout attempt one opaque client request identity and one persisted pending CheckoutOrder; reuse the identity for retries and use a new identity for a new intentional attempt.
- Make stock adjustment and recount retries recover their original committed ledger result without repeating a write; preserve the original recount revision for first execution.
- Persist input fingerprints and request identity in the existing D1-owned order/ledger scope wherever feasible; use database uniqueness and atomic writes instead of a memory cache or generic middleware store.
- Keep provider uncertainty, launch gates, security, and existing stock-hold lifecycle authoritative. Terminal/expired attempts cannot silently create replacement payable sessions.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `checkout-stock-reservations`: A repeated checkout intent reuses one durable hold and its recovery outcome.
- `orders-stock-operator`: Repeated operator stock requests apply once and preserve revision conflict semantics.

## Impact

Revised on 2026-09-17 after accepted EmDash cutover and runtime-publication rollout. Reuse those receipts and reconcile affected current checkout/stock contracts; archive and dormant cleanup are not blockers. Follow RFC 9457 for the conflict/retry contract. Preserve implemented monetary-policy and paid-order recovery semantics without treating their outstanding hosted/business acceptance as completed by this work. The user's low-volume guidance resolves scope; wider mutation unification remains deferred. See [the current sequence](../verify-http3-transport-coverage/proposal.md).

Expected changes are additive D1/Prisma fields/constraints, existing repository/application seams, selected request headers and CORS allowance, generated clients, browser attempt state, and concurrency/recovery tests. Keep attempt metadata separate from StoreCart contents. No Redis, KV, queue, new scheduled cleanup, generic operation bus, or rewrite of the EmDash journal. New required request identity is a contract change and must use the staged compatibility rollout described in the design.
