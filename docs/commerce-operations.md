# Commerce operations runbook

This is the launch runbook for paid orders, review exceptions, delivery, and manual Greece-only BOX NOW fulfillment. The label must name the on-duty operator and backup before launch; owner approval and hosted rehearsals remain launch gates. Local test results do not approve PRD checkout.

## Daily checks

The on-duty operator checks the correct Stripe account and Product Environment, failed webhook deliveries, protected `/api/internal/orders?status=needs_review`, and paid orders with pending or exhausted delivery attempts. Use Access-protected reads and provider dashboards. Keep addresses, contact details, payment references, and raw payloads out of public evidence and logs. Record environment, accepted commit, redacted order reference, outcome, operator, and time.

## Failed webhook delivery and resend

1. In Stripe Workbench, identify the failed event at the environment's configured webhook endpoint. Match its Checkout Session and PaymentIntent to the protected order read. Do not create another payment.
2. For HTTP 503, repair the failed persistence/configuration or session-binding recovery first. A `missing_order` log is not proof of durable recovery. If the order remains missing, retain the failed event for investigation; do not fabricate a paid order or decrement stock manually.
3. Resend that same event using Workbench. Stripe also retries automatically, but retries are finite. Confirm a successful response plus a persisted paid or terminal review outcome. A 200 response alone is insufficient evidence.
4. For a paid result, verify one stock decrement per line and one delivery row per kind. A duplicate resend must preserve the order, address, stock, and delivery uniqueness. Delivery-provider failures after the paid commit belong to the existing outbox.

Stripe documents delivery inspection and manual resend in its [webhook guidance](https://docs.stripe.com/webhooks#manual-retries).

## Terminal order review

Protected reads expose `needsReviewReason` and `stripePaymentIntentId`. New reasons are `stock_unavailable`, `line_mismatch`, and `incomplete_fulfillment`; a legacy null reason requires manual investigation.

1. Match the verified payment to the order in the correct provider account. Review stock/line facts or collected shipping, depending on the reason. Billing details never substitute for shipping.
2. For shortage, contact the customer through the approved operational channel and arrange a manual refund or another explicitly agreed resolution. Confirm the existing payment/refund state before any refund to prevent duplication. Do not ask the customer to pay again.
3. An authorized operator performs any refund in Stripe Dashboard and records its result in the private exception record. A refund does not restock goods automatically: reconcile actual returned physical stock separately through `/stock/`.
4. Preserve the terminal order and its original payment correlation/reason. Do not reopen it, bulk rewrite immutable paid history, create normal fulfillment delivery for it, or use webhook resend as a way to force fulfillment. Record resolution outside the immutable order facts.

For incomplete or suspect historical shipping, record whether customer contact/manual correction is needed before fulfillment acceptance. Retain the original stored snapshot and keep any verified correction in the private manual dispatch record.

## Paid delivery and manual dispatch

1. Verify paid persisted order state and complete collected Greek recipient/address plus shopper contact. Check shopper confirmation and ops fulfillment delivery summaries; investigate exhausted attempts. Scheduled outbox recovery owns transient email failures and does not authorize another stock decrement or payment.
2. Confirm the Greek BOX NOW destination with the customer where needed, then create the shipment manually in the authorized partner portal. No BOX NOW credentials or raw portal payloads belong in this repository.
3. Before dispatch, check the private dispatch record by order reference. Record operator, date, verified destination, and shipment handoff once so another operator cannot ship twice. A rehearsal is not evidence of a physical shipment.
4. For returns, verify actual receipt before recording a stock delta or recount. Use current revision/state and reassess any stale-count conflict.

## Rehearsal evidence

[Paid-order reconciliation evidence](../openspec/changes/fix-paid-order-reconciliation/evidence.md) records local signed HTTP 503/D1 tests and old-account UAT shipping, provider resend, sink-only delivery, controlled shortage, and historical-order inspection. Test review orders remain terminal; no refunds or customer contact were performed. New-account acceptance, named ownership, and launch acceptance remain pending in `production-go-live-readiness`.
