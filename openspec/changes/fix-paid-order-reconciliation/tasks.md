## 1. Correct Fulfillment Projection

- [ ] 1.1 Run `pnpm openspec:guard`, trace Session mapping through paid persistence and delivery consumers, and add a committed regression with different shipping/billing names, addresses, and countries; verify current code fails the intended shipping assertions.
- [ ] 1.2 Carry collected shipping recipient/address separately from buyer contact through mapping, reconciliation, persisted order, and ops delivery; verify GR shipping with GB billing succeeds and missing/non-GR shipping cannot fall back to billing.
- [ ] 1.3 Update signed webhook, simulator, and mock fixtures to match the pinned Stripe shipping shape; verify complete fulfillment and paid replay preserve immutable recipient/address facts without exposing shopper data in public contracts or logs.

## 2. Durable Reconciliation Outcomes

- [ ] 2.1 Map missing app-owned order/failed recovery and pre-commit persistence failures to retryable HTTP 503; verify signed route tests produce non-2xx, later recovery succeeds, known terminal replays acknowledge, and unrelated/unsupported events retain safe ignored behavior.
- [ ] 2.2 Add nullable `CheckoutOrder.needsReviewReason`, regenerate Prisma/affected internal contracts, and atomically record shortage and existing line-mismatch review outcomes with safe reason/payment correlation; verify real D1 zero-row races preserve the winning terminal state, no partial decrement or normal delivery, and immutable review replay. Legacy review rows may retain an unknown reason.
- [ ] 2.3 Route incomplete paid fulfillment through durable review or a retryable failure until review can be saved; verify review-write failure does not acknowledge success and ordinary paid/outbox rollback/retry behavior remains intact.
- [ ] 2.4 Verify protected order reads expose review status/reason and safe payment reference under Access; add failed-webhook resend and terminal-shortage contact/refund steps to the single launch runbook, then walk through both using test data without reopening terminal orders.

## 3. Truthful Checkout Return

- [ ] 3.1 Require successful payment plus paid order status for final confirmation and StoreCart clearing; verify null, pending, needs-review, and conflicting terminal statuses preserve the cart and never claim a recorded order or offer duplicate payment.
- [ ] 3.2 Add five-second, non-overlapping refresh for processing/paid-but-unconfirmed results, capped at 12 automatic refreshes; verify cleanup and stop on final/review/error/unmount, preserve known payment success after refresh failure, and retain existing open/cancelled/expired recovery behavior.
- [ ] 3.3 Use native Codex Browser Use to verify initial pending, delayed confirmation, review/support, and confirmed return on desktop/mobile; verify status reads remain read-only and no private fulfillment details enter browser responses.

## 4. Acceptance and Handoff

- [ ] 4.1 Run focused signed-webhook and real local D1 rollback/replay tests plus `pnpm test:unit`, `pnpm check`, `pnpm build`, and `pnpm audit:commerce-boundaries`; verify any generated contracts and strict-validate this change.
- [ ] 4.2 Before accepting hosted fulfillment, inspect potentially affected existing orders through protected/redacted reads and record whether manual address correction/customer contact is required; do not bulk rewrite immutable paid history.
- [ ] 4.3 After new-account test-mode access and approved recipients exist, prove differing shipping/billing, a delayed webhook return, failed delivery/resend, stock-shortage review, and ordinary paid/outbox delivery on the same corrected commit; record evidence before accepting the reservation/outbox parent gates.
- [ ] 4.4 After shared reservation and outbox acceptance, strict-validate, sync, and archive this correction; link the accepted evidence and manual exception procedure from `production-go-live-readiness` while PRD launch controls remain closed.
