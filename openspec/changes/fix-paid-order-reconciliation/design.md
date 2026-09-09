## Context

See `proposal.md` for scope. Rechecked on 2026-09-09 against the current worktree at HEAD `4423fbd0b8a8b4d1f1638207095fe18966d79955`; unrelated changes were already present.

| Finding                                        | Rechecked source and probe                                                                                                                                                                                     | Result                                                                                                                                                        |
| ---------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Billing becomes shipment data                  | `stripe-checkout-session-state.ts` reads `customer_details.address/name`; `checkout-order-paid-event.ts` uses these as shipping address/recipient. A fixture supplies different collected shipping details.    | Greek billing replaces the intended Greek shipping address; valid Greek shipping with GB billing fails fulfillment validation.                                |
| Paid failures receive success acknowledgements | `stripe-webhook-acknowledgement.ts` logs `missing_order` and `stock_unavailable` as retryable but returns `{ received: true }`; the route maps that to HTTP 200. The finalizer leaves shortage orders pending. | Both probe outcomes acknowledge without publishing delivery. No reconciliation retry record is created; the email outbox starts only after paid finalization. |
| Return claims completion too early             | `checkout-return-status-state.ts` checks provider-derived `state === 'paid'`; `CheckoutReturnStatus.tsx` uses the same condition to clear the cart and reads once.                                             | Null, pending-payment, and needs-review order statuses all render final recorded-order confirmation.                                                          |

The ignored audit probe was rerun with `pnpm exec tsx .codex-artifacts/stripe-readiness-2026-09-09/reproduce.mjs`. Its assertions reproduce failures; implementation adds independent committed regression tests. The installed Stripe SDK and [Session object reference](https://docs.stripe.com/api/checkout/sessions/object) identify `collected_information.shipping_details`. [Webhook delivery guidance](https://docs.stripe.com/webhooks) distinguishes successful acknowledgements from retryable failures. No actual payment, webhook delivery, or email was sent for this recheck.

## Goals / Non-Goals

**Goals:** Correct persisted fulfillment, durable exception handling, and shopper confirmation at the existing payment/order boundary.

**Non-Goals:** Browser-triggered reconciliation, a new queue, automatic refunds, an operator retry screen, historical address rewriting, or BOX NOW automation.

## Decisions

### Shipping recipient and shopper contact remain distinct

Read recipient name/address from `collected_information.shipping_details` at the pinned API version. Keep buyer email/phone under customer contact. Carry shipping recipient name through the session snapshot and reconciliation into the existing `CheckoutOrder.recipientName` column and fulfillment email projection; do not add duplicate recipient storage or repurpose buyer name. Validate `GR` against shipping, not billing. Missing/incomplete shipping cannot silently fall back to billing or become a fulfillable paid order.

Retain the existing required shipping fields and optional phone contract. Fixtures, webhook simulator, and mock compatibility must model actual collected shipping shape. No raw provider payload or extra billing snapshot is persisted. Existing paid snapshots remain immutable; inspect potentially affected hosted history before acceptance and resolve it manually rather than bulk rewriting addresses.

### Resolve every app-owned paid outcome before acknowledging

Reuse the existing guarded paid transaction and `needs_review` order status. For insufficient physical/online stock, atomically transition the pending order to `needs_review` with its verified payment/session correlation. Commit no stock changes and enqueue no normal paid delivery. Preserve the winning terminal outcome if another reconciliation wins the transition; zero changed rows is not evidence that review was saved.

The schema has `needsReviewAt` and payment correlation but no persisted order review reason; `PaidOrderDelivery.safeReason` belongs to a different record. Add one nullable `CheckoutOrder.needsReviewReason` column through an additive migration, carrying a bounded application-owned reason code for new review transitions, including shortage, line mismatch, and incomplete fulfillment. Persist reason/status/correlation together, preserve them on replay, and allow legacy review rows to have an unknown reason. No new exception table or review lifecycle is needed.

If an app-owned order remains missing after metadata recovery, or a D1 transition fails before any durable outcome, return a retryable non-2xx response (503 through the established error mapper). Do not equate a `retryable` log field with recovery. Successful paid/review transitions and known terminal replays acknowledge 2xx. Unsupported or verifiably unrelated events retain their ignored-event behavior. Missing order identity alone must not discard a valid session-bound order: attempt the existing session lookup.

Operator reads must expose review status, the new safe reason, and existing order/payment reference under Access. The launch runbook owns daily failed-webhook, needs-review order, and exhausted-outbox checks. Reference that procedure here and test provider event resend for repaired transient state plus customer contact/refund for terminal shortages. Do not invent paid rows or automatically reopen terminal review orders; do not create a second runbook.

Delivery-provider failure after a successful paid commit remains the existing outbox's responsibility and does not roll back payment or stock. Duplicate/reordered webhooks preserve the single paid transaction and per-kind delivery uniqueness.

### Return state uses payment and order facts together

Keep the initial accessible pending marker. Final order confirmation and cart clearing require provider payment success plus Worker `orderStatus === 'paid'`. A paid provider Session with null/pending order status shows payment received, order confirmation pending; needs-review or contradictory terminal order state shows a support action and never advises paying again.

For payment processing or paid-but-unconfirmed results, refresh the existing read-only endpoint at five-second intervals, with no overlapping requests and a maximum of 12 automatic refreshes per mount. Preserve existing open/cancelled/expired recovery behavior; review or conflicting terminal facts take precedence over polling. Stop on final/review state, network failure, or unmount. A refresh failure retains the last verified payment fact and offers manual refresh/support, never a new payment action. Use component timers and cleanup; no polling library, new public fulfillment fields, or reconciliation endpoint is needed.

## Risks / Trade-offs

- A correct address mapper reveals genuinely incomplete old sessions → preserve review handling and inspect hosted history; do not fabricate shipping data.
- Stripe retries are finite → record operator recovery ownership and exercise one failed-delivery resend; no claim that a 503 guarantees eventual success.
- Terminal shortage releases its pending hold → retain actual stock truth and block normal fulfillment; manual refund/contact remains an operator action.
- Polling could multiply provider reads → fixed interval, finite count, no overlap, and cleanup tests.

## Migration Plan

1. Reuse existing recipient/address columns, add nullable `needsReviewReason`, regenerate Prisma and affected internal contracts, and implement guarded review transitions over existing order/outbox seams. Never rewrite commerce history.
2. Test signed webhook handling, actual D1 rollback/replay, protected review reads, fulfillment projections, and return state/cart lifecycle locally.
3. On one new-account UAT tree, prove differing billing/shipping, delayed webhook return, retry/resend, shortage review, and ordinary paid delivery with approved recipients. These corrections must be implemented before accepting the reservation/outbox parent proofs; archive this change after that evidence.
4. PRD execution belongs to the launch change. Rollback closes checkout and retains all paid/review facts and delivery rows.
