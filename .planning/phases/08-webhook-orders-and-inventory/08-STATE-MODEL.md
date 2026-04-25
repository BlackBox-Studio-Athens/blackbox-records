# Phase 8 Order State Model Decision

## Decision

Do not add a state-machine dependency or frontend state machine for commerce. Phase 8 should add one small backend-only typed order transition module after the D1 order schema exists.

The current Phase 7 browser state is intentionally derived and non-authoritative. Persisted order state starts in Phase `08-01`; transition rules belong in Phase `08-02`, where order repositories and use cases first exist.

## Frontend State Boundary

Frontend state remains local display state only:

- Cart: one browser-safe item in `localStorage`.
- Checkout shell: loading, ready, unavailable, error, and mounted display states.
- Return UI: loading, missing session, ready, and error display states from Worker-owned `ReadCheckoutState`.

The browser must not persist or infer payment/order authority. Browser state must not contain Stripe price IDs, server secrets, D1 IDs, stock counts, checkout session IDs, client secrets, order status, paid truth, actor email, or operator fields.

## Backend State Boundary

`CheckoutState` remains a derived return/read model mapped from Stripe session state:

- `open`
- `paid`
- `processing`
- `expired`
- `unknown`

Persisted D1 order lifecycle uses the approved minimal vocabulary:

- `pending_payment`
- `paid`
- `not_paid`
- `needs_review`

## Transition Guard

Phase `08-02` should add a tiny backend order-state module with:

- status union types
- allowed transition table
- transition guard function
- tests for valid transitions, invalid transitions, and idempotent replay behavior

Allowed persisted transitions for v1:

- `pending_payment -> paid`
- `pending_payment -> not_paid`
- `pending_payment -> needs_review`
- `paid -> needs_review` only for later operator/reconciliation escalation

Rules:

- Do not mutate an old `not_paid` order back to `pending_payment`; create a new checkout/order attempt instead.
- Disallow `paid -> not_paid`.
- Duplicate paid webhook delivery must be a no-op for stock decrement.
- Browser read paths may derive `CheckoutState` but must not perform persisted transitions.

## Persisted Vs Derived

Persist in D1:

- order id and checkout-session mapping
- order status
- backend-owned Stripe checkout/payment identifiers needed for reconciliation
- store item and variant identity
- transition timestamps and idempotency markers needed for webhook replay safety

Derive from Stripe:

- raw Checkout Session status
- payment status
- browser-facing `CheckoutState`
- reconciliation outcome before a verified webhook path applies it

## Tooling Decision

- No explicit model is acceptable through Phase 7, but risky once webhooks and stock decrement start.
- Plain typed status fields are necessary in D1, but not enough to prevent invalid lifecycle writes.
- A typed transition table/reducer is the best fit: small, testable, dependency-free, and consistent with existing repo state-helper style.
- Robot3 and XState are not justified for four persisted backend order states.
- Cloudflare Workflows is deferred until fulfillment/shipping has durable retries, long-running steps, external approvals, or manual recovery flows.

## Verification

When implemented in `08-02`, run:

- targeted backend order-state transition tests
- backend order use-case tests
- `pnpm --filter @blackbox/backend test`
- `pnpm test:unit`
- `pnpm check`
- `pnpm build`
