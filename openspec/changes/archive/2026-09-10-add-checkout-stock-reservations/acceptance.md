# Reservation acceptance — 2026-09-10

The user approved the existing old-account Stripe UAT sandbox for final reservation acceptance. This acceptance does not certify a future Stripe account cutover or PRD launch.

## Combined local correction evidence

Task 4.4 was verified with both corrections present in the same main worktree:

- The real D1 paid-finalization suite durably records `stock_unavailable`, `line_mismatch`, and `incomplete_fulfillment`, preserves review on replay, and retries failed review persistence without stock or delivery effects.
- Signed webhook tests return retryable 503 for missing orders or failed writes, accept a successful resend, and acknowledge terminal review/replay without normal delivery.
- The production mapper and D1 repository preserve collected Greek shipping despite different British billing, and paid replay cannot replace the original fulfillment facts.
- Real D1 tests cover concurrent operator restock and paid settlement, recount/paid races, stale recount rejection, revision changes, and audit failure rollback. These use the same paid finalizer as reservation settlement.

Initial full runs hit architecture-test timeouts. Diagnosis found the manifest validator compiled an identical root-pattern regular expression for every repository file. Compiling it once per root preserves the exact matching behavior and reduced direct validation from 6,381–7,089 ms to 191 ms cold and 25–27 ms warm. All 15 architecture tests then passed in 1.08 seconds without changing assertions or timeouts.

The final combined tree passed `pnpm test:unit` (1,305 tests including six root contracts), `pnpm check`, and `pnpm build`. This includes all 420 Workers-pool tests and all 262 backend Node tests. Logs are retained under ignored `.codex-artifacts/reservation-acceptance/`.

## Hosted preflight

Read-only old-account UAT inspection found 464 orders, 11 pending orders, no sessionless pending orders, and no open Stripe Checkout Sessions. Consequently no open payable Session lacked a recoverable CheckoutOrder. D1 reported zero writes. Runtime configuration and the persistent test-mode webhook endpoint passed verification.

PRD `/api/store/capabilities` reported native checkout disabled. No PRD mutation was performed.

## Accepted UAT implementation

- Exact Worker implementation commit: `c503e4d9ab7f09cdc719df8cec9e81ee1f8cac14`.
- Checkout was confirmed disabled on temporary UAT Worker version `2f550d97-3a5f-416d-a38a-76182bfebe5f` before additive migration `0016_stock_revision.sql` was applied successfully.
- Accepted enabled UAT Worker version: `89aae672-2249-4dd4-8463-241d0311e7d5`, deployed from the same commit after migration.
- Browser proof used the existing GitHub Pages UAT frontend and the old account's real Stripe sandbox. No static frontend or PRD deployment was performed. Unrelated local distro changes were excluded from the implementation commit.

## Hosted behavior

1. A fresh checkout created one session-bound pending order and one quantity-one line. Its metadata identified the same app order; D1 retained exactly Stripe's accepted expiry, 2,100 seconds after provider creation. Effective availability fell by one without a physical stock decrement.
2. Expiring that Session through Stripe produced `not_paid` through the persistent webhook. Effective availability returned to its initial value, physical/online stock and revision remained unchanged, and no StockChange or delivery row appeared. Resending the actual expiry event preserved that result.
3. A second fresh checkout held one unit before payment. Native browser control submitted a €28 sandbox card payment using synthetic contact/address details and the managed UAT sink. Greek shipping and UK billing had distinct names. The UAT return page displayed confirmed payment and recorded order state; its normal cart reset ran on return.
4. D1 became `paid`, both physical and online stock decreased by one, revision increased by one, and exactly one StockChange plus two delivery rows existed. Both delivery rows reached `delivered`. Stored recipient/address fields matched collected Greek shipping, not UK billing.
5. Stripe CLI resent the real completion event to the persistent UAT webhook. Order facts, stock, revision, and delivery cardinality remained unchanged.
6. Final read-only inspection found 466 orders, the same 11 pre-existing pending orders, no sessionless pending orders, and no open Stripe Sessions. Neither probe left a new hold. PRD capabilities still reported checkout disabled.

Redacted summaries and command logs are retained under ignored `.codex-artifacts/reservation-acceptance/`: `expiry.json`, `paid-replay.json`, `shipping-summary.json`, `preflight.json`, and deployment/validation logs. Private Session URLs and identities remain ignored. This evidence accepts reservation behavior as the prerequisite for `add-paid-order-delivery-outbox`; that change's controlled-retry acceptance remains separate.

## Archive validation

All three synced reservation capabilities pass strict validation. The full baseline passes standard validation (38/38); its strict scan reports 18 pre-existing placeholder Purpose warnings in unrelated capabilities. All 17 reservation tasks are complete.
