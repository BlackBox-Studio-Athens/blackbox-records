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

Read-only old-account UAT inspection found 464 orders, 11 pending orders, no sessionless pending orders, and no open Stripe Checkout Sessions. Consequently no open payable Session lacked a recoverable CheckoutOrder. D1 reported zero writes. Runtime configuration and the persistent test-mode webhook endpoint passed verification. Only additive migration `0016_stock_revision.sql` remains unapplied in UAT.

PRD `/api/store/capabilities` reported native checkout disabled. No PRD mutation was performed.

Hosted settlement, expiry, replay, accepted commit identity, and archival remain pending task 5.2. Redacted probe evidence is kept under ignored `.codex-artifacts/reservation-acceptance/`. The prepared expiry/replay probe has not run against hosted state.

Native browser access recovered on retry and the deployed UAT Store Item displayed its current price and available checkout state. The non-MCP Playwright fallback is no longer needed. Hosted proof will use a fresh synthetic order without modifying the existing browser cart.
