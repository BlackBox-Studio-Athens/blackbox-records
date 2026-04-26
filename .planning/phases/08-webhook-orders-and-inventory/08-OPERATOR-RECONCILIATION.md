# Phase 8 Operator Reconciliation Notes

## Purpose

This note defines the low-volume order inspection path for sandbox operations. It is not an order management system.

## Protected Readback

Operators inspect checkout order state through the protected Worker internal API on `ops.<managed-zone>`:

- `GET /api/internal/orders?status=needs_review&limit=20`
- `GET /api/internal/orders/checkout-sessions/{checkoutSessionId}`

These routes require the Cloudflare Access-authenticated operator email header and are not public shopper APIs.

## Reconciliation Posture

- Stripe Dashboard remains the payment-provider view of Checkout Sessions, PaymentIntents, refunds, and disputes.
- D1 `CheckoutOrder` rows are the app-owned lifecycle view: `pending_payment`, `paid`, `not_paid`, and `needs_review`.
- `needs_review` means the verified Stripe state was ambiguous for the app model or needs manual inspection before follow-up.
- Operators must not edit D1 directly for normal reconciliation. Inspect the protected readback route, compare with Stripe Dashboard, and record follow-up as a later operator workflow or manual support note.
- Stock decrement is automatic only for first-time `paid` webhook transitions. Non-paid and needs-review outcomes do not mutate stock.

## Deferred Work

This does not add refunds, shipping fulfillment, a dashboard UI, order edits, or live Stripe account validation. Real Stripe evidence still depends on account access, test keys, Price mappings, webhook secrets, and sandbox endpoint setup.
