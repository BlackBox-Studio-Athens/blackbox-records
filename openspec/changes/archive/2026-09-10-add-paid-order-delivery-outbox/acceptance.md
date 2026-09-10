# Paid-order delivery acceptance — 2026-09-10

The user approved the existing old-account Stripe UAT sandbox and managed test-email sink for closing task 4.3. This accepts the outbox on that account; it does not certify a later account cutover or PRD launch.

## Accepted implementation

- Worker implementation commit: `c503e4d9ab7f09cdc719df8cec9e81ee1f8cac14`.
- UAT Worker version: `89aae672-2249-4dd4-8463-241d0311e7d5`, verified at 100% before and after recovery.
- The current backend and API-client tree matches that implementation. No Worker deployment, provider configuration change, new purchase, or PRD mutation was needed.

## Immediate delivery

The shared [reservation acceptance](../archive/2026-09-10-add-checkout-stock-reservations/acceptance.md) proves a real sandbox payment, complete persisted Greek fulfillment, one stock decrement, and exactly two delivered rows. Before this recovery probe, both shopper confirmation and operations fulfillment were still delivered with one attempt each. This purchase has no newsletter opt-in, so no newsletter row is applicable.

## Controlled retry

The probe simulated a Worker losing its database acknowledgement after provider acceptance. It changed only the approved purchase's shopper delivery from delivered to pending, cleared its delivered timestamp, and restored a due next-attempt time with an expired lease. It preserved the row identity, creation time, and first attempt count. A compare-and-set guarded the fixture write; the original row and redacted checks are retained in ignored evidence.

The existing hosted `*/15 * * * *` Cron processed it at `2026-09-09T22:30:54.000Z` (`2026-09-10` local time). Its invocation succeeded on the accepted Worker version. The structured outcome reported one processed and delivered row, with zero rescheduled, needs-review, or lost-lease results. The shopper email outcome was sent, and its logged idempotency identity matched the original purchase's stable key after applying the production log redactor.

D1 then showed delivered with attempt count two, no active lease, no next attempt, and no safe failure reason. Hash comparisons of the complete order, immutable lines, stock, and stock-change rows were unchanged. The operations delivery was unchanged, delivery cardinality remained two, and the purchase still had exactly one stock change. No pending fixture remained.

This is controlled expired-lease recovery after simulated lost acknowledgement, not an induced Resend outage. Transient-error classification and rescheduling remain covered by the passing local tests; the hosted proof exercised the real scheduled claim, provider request, and delivered transition.

## Verification

The proof tree passed `pnpm test:unit` (1,305 tests), `pnpm check`, and `pnpm build`. Strict validation of this change also passed. A final read-only PRD capabilities check confirmed native checkout disabled.

Ignored evidence lives under `.codex-artifacts/outbox-acceptance/`: `prepared.json`, `recovered.json`, `scheduled.json`, runnable probes, private fixture backup and tail, and the three gate logs. Immediate-success and replay evidence remains under `.codex-artifacts/reservation-acceptance/`. Contact data, addresses, and provider identities are excluded from this acceptance record.
