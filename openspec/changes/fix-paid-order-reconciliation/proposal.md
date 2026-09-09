## Why

Paid checkout can use billing details for shipment, acknowledge unresolved reconciliation without durable recovery, and tell shoppers their order is recorded before D1 confirms it. All three findings were reproduced again on 2026-09-09; together they break the payment-to-fulfillment handoff.

## What Changes

- Map the shipping recipient and address from Stripe's collected shipping details, preserving shopper contact separately.
- Acknowledge paid events only after durable paid/review state or a safe replay; return a retryable failure when an app-owned order cannot yet be recovered.
- Use the existing terminal `needs_review` path for paid stock shortages, with protected operator visibility and a documented manual resolution path.
- Show final order confirmation and clear StoreCart only after Worker-owned order status is paid; provide bounded refresh and truthful pending/review states.
- Verify complete fulfillment persistence and existing outbox behavior without creating a second reconciliation queue.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `shipping-fulfillment`: Collected shipping details are the fulfillment source.
- `orders-stock-operator`: Durable paid/review outcomes and retryable webhook failures.
- `commerce-checkout`: Return confirmation follows persisted order status.

## Impact

Stripe session mapping, checkout reconciliation types, paid-order finalization, one additive nullable order review-reason column, webhook response handling, protected order reads, existing outbox consumers, and checkout return UI/tests. Existing recipient/address storage is reused. Builds on the implemented reservation and paid-delivery seams; their hosted acceptance must include these corrections. No BOX NOW automation, generic job system, automatic refunds, or live activation.
