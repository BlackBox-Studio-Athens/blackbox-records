# Local reconciliation evidence — 2026-09-09

Scope: correction on `main`, with the separate operator-stock work preserved outside this commit. Local implementation evidence and old-account diagnostics do not approve PRD launch or satisfy new-account acceptance.

## Regression and persistence

- The shipping regression failed against the original mapper, then passed with collected shipping. It uses different buyer/recipient names, GB billing, and GR shipping. Missing, non-GR, and nameless shipping cannot fall back to valid GR billing.
- Real local D1 tests exercise the production Prisma repository and paid finalizer. They cover persisted collected shipping, immutable replay, all three review reasons, review-write failure/retry, and paid/not-paid/review winners racing a guarded update. Stock and normal delivery rows remain unchanged for review outcomes.
- Signed webhook tests cover 503 on missing app orders and persistence failure, successful resend, terminal replay acknowledgement, and no normal delivery for review. Unsupported/unrelated events retain ignored handling.
- Prisma and affected API contracts were regenerated. Review reason/payment correlation is exposed only through protected order reads; public status contracts contain no new fulfillment fields. Migration `0017_checkout_order_review_reason.sql` must be applied through the normal environment migration workflow before deploying the corrected Worker.

## Checkout return

- Four premature-confirmation regressions failed before the fix. The return component suite now covers payment/order agreement, bounded polling, no overlapping requests, delayed confirmation, budget exhaustion, error retention, review, and unmount cleanup.
- Native Codex Browser Use exercised the local return route at 1440×900 and 390×844 using controlled status GET responses. Initial pending, paid-but-pending, review/support, and final confirmation rendered without clipping. The one-item cart remained during pending/review and cleared after the delayed paid-order response.
- A five-second delayed status read reached final confirmation. No further status request appeared during the subsequent six-second observation; the console had no errors. Temporary response interception was cleared afterward. This was a synthetic UI probe, not a hosted Stripe payment.

## Operations rehearsal

The [single commerce runbook](../../../docs/commerce-operations.md) covers failed delivery/resend and terminal shortage contact/refund. Synthetic route tests rehearse failure then resend; D1 shortage/replay tests rehearse terminal preservation and no stock/delivery side effects. Customer contact and refund steps were reviewed as manual operator steps only: no message, refund, shipment, or hosted write was performed.

## Outstanding acceptance

Validation passed: `pnpm test:unit` (1,305 tests across workspace and root contracts), `pnpm check`, `pnpm build`, `pnpm audit:commerce-boundaries`, and `pnpm openspec -- validate fix-paid-order-reconciliation --strict`. The final fixture-only type assertion correction was also checked by rerunning the real D1 file (23 tests). `git diff --check` passed. Existing dependency-rule deprecation notices and the StoreCart Zod hint remain.

- Task 1.1 includes the regression and observed failing result; commit isolation excludes the separate operator-stock change.
- Task 4.2: authenticated, read-only UAT D1 inspection found 257 paid, 191 not-paid, and 11 pending orders. Of the paid rows, 13 contain recipient/address snapshots. An in-memory comparison with the old Stripe test account found all 13 match collected shipping name and every address field; none were unavailable or live-mode. No correction/contact requirement was identified for those 13. The remaining 244 legacy paid rows lack snapshots and must have recipient/address verified manually before any fulfillment; this inspection does not certify them for dispatch. PRD has zero orders. No history was rewritten and no customer contact was initiated. Queries reported zero writes; recorded evidence contains counts only.
- Task 4.3 requires new-account test-mode access, approved recipients, and same-commit hosted evidence for the reservation/outbox parents.
- Task 4.4 remains gated by that parent acceptance. Do not sync/archive this correction or open PRD launch controls from these local results.

The user requested use of the old Stripe account on 2026-09-09 and explicitly deferred incorporating the new account. Old-account UAT runtime and persistent webhook configuration checks passed. Payment-method policy inspection passed, with a local environment configuration-ID gap; the deployed UAT runtime reports that required secret present. UAT delivery remains routed to its existing managed receiving sink.

Commit isolation was verified independently: `pnpm test:unit` passed 1,285 tests without the unrelated stock-revision change; `pnpm check` and `pnpm build` passed on that isolated implementation. Prisma and API regeneration produced no outstanding generated diff. The earlier 1,305 count includes the separate stock work. An initial partial-staging placement error was caught by those isolated tests, corrected, and the full suite rerun successfully.
