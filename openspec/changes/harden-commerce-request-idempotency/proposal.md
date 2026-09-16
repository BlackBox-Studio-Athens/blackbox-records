## Why

A double-click or response lost after a successful write can create another pending checkout hold or repeat a stock adjustment even at very low traffic. On 2026-09-14 the user requested the most sensible small solution for an expected 2–3 purchases per week, with 2–3 per day as the initial maximum.

## What Changes

- Audit the completed EmDash item/price operation journal, existing order/provider recovery, webhook deduplication, stock transactions, and recount revision checks before adding anything.
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

Blocked until `replace-sveltia-with-emdash-operations` completes final acceptance/handoff and spec reconciliation. Follow RFC 9457 for the resulting conflict/retry contract. The user's low-volume guidance resolves the initial scope discussion; wider mutation unification is deferred. See [the sequence](../verify-http3-transport-coverage/planning-evidence.md).

Expected changes are additive D1/Prisma fields/constraints, existing repository/application seams, selected request headers and CORS allowance, generated clients, browser attempt state, and concurrency/recovery tests. Keep attempt metadata separate from StoreCart contents. No Redis, KV, queue, new scheduled cleanup, generic operation bus, or rewrite of the EmDash journal. New required request identity is a contract change and must use the staged compatibility rollout described in the design.
