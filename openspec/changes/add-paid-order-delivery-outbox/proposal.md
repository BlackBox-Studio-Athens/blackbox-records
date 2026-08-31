## Why

Paid reconciliation currently commits the order and stock before email and newsletter side effects, but it does not retain enough app-owned fulfillment data or durable retry state to recover a failed side effect. The smallest reliable fix is one fixed-purpose delivery ledger backed by the existing order tables.

## What Changes

- Persist approved paid amount, EUR currency, shopper contact, Greek delivery address, and newsletter-consent fields directly on CheckoutOrder.
- Persist immutable display and purchase values directly on each CheckoutOrderLine.
- Add one PaidOrderDelivery table with exactly three kinds and three statuses.
- Create applicable delivery rows in the same transaction as first paid reconciliation, then attempt them after commit.
- Retry pending deliveries through one 15-minute Worker Cron, with a maximum of five attempts in 24 hours and existing provider idempotency keys.
- Keep payment and stock authoritative when a secondary delivery fails.
- Do not add snapshot JSON, a generic outbox, Queue, Workflow, Durable Object, operator retry UI, or shipping automation.

## Capabilities

### New Capabilities

- paid-order-delivery: Durable paid-order fulfillment fields and bounded fixed-purpose delivery recovery.

### Modified Capabilities

- orders-stock-operator: First paid reconciliation atomically commits fulfillment fields and delivery rows before provider calls.
- shipping-fulfillment: Manual Greek fulfillment reads the persisted paid order instead of requiring a fresh Stripe read.

## Impact

- D1 and Prisma schema, paid reconciliation, order-line creation, Resend/newsletter gateways, scheduled Worker entrypoint, protected order reads, and focused tests.
- Implement after add-checkout-stock-reservations, or rebase onto that change's final CheckoutOrder transaction.
- No new hosted service; operator authentication is owned by verify-operator-access-jwt, not this change.
