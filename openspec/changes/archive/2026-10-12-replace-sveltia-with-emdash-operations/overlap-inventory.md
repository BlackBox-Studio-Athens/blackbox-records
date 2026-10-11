# M1 overlap inventory

Reviewed on 2026-09-12 against `82704cb4be288bb5655f304faeb4ca93b8c472d3` on `main`. This records repository evidence, not a new hosted acceptance run.

| Change                                       | Status at inspection | Preserve during EmDash work                                                                                                                                                         | Acceptance still owned elsewhere                                                                                                                |
| -------------------------------------------- | -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `replace-catalog-promotion`                  | 9/9                  | Persisted Product bindings, current default Price, direct provider reads, targeted signed notifications, snapshot repair, retry-safe initialization, operational-state preservation | Live catalog mutation remains one-run authorized; existing test prices and recovered bindings are not live approval                             |
| `add-staff-order-workspace`                  | 10/10                | Protected read-only `/orders/`, latest-100 subset, exact session lookup, access-expiry clearing, stale/racing reads, private immutable order and notification facts                 | Existing evidence reports no populated PRD orders for detail inspection; CMS work must not imply dispatch/refund/resend controls already exist  |
| `align-cloudflare-uat-and-release-promotion` | 22/22                | UAT Pages plus Worker, main-push UAT-only releases, explicit SHA/run PRD promotion, retained artifacts, target locks, independent launch/catalog controls                           | Reuse its recorded hosting prerequisite; M1 still needs its own combined-CMS resource and authentication proof                                  |
| `fix-paid-order-reconciliation`              | 12/14                | Shipping recipient precedence, atomic paid persistence, truthful return state, cart retention, bounded polling, durable review and delivery retry                                   | Tasks 4.3–4.4: corrected-commit provider scenarios and shared reservation/outbox acceptance before archival                                     |
| `greek-vat-and-shipping-charges`             | 12/21                | Inclusive fixed/custom EUR prices, Stripe Tax, two packing tiers, immutable monetary snapshots, server validation, synthetic-profile isolation                                      | Tasks 1.1–1.4, 4.2–4.4, 5.4–5.5: account, physical packing, fiscal/filing, receipts, wording and hosted acceptance                              |
| `complete-shopper-purchase-information`      | 12/13                | Structured purchase information, terms/privacy routes, shared summaries and links, purchase-group ordering, no editorial monetary authority                                         | Task 3.1: approved published wording; preserve the distinction between accepted local implementation and publication                            |
| `enrich-distro-product-media-and-copy`       | 15/25                | Optional ordered galleries, primary-image ownership, source/rights ledger, contained square CD presentation and natural gallery proportions                                         | CD source/rights/replacement gaps, final completeness and final browser/provider checks remain unresolved; importing an asset cannot approve it |
| `production-go-live-readiness`               | 12/46                | Holding Page, exact-tree acceptance, manual BOX NOW, separate code/catalog/launch controls                                                                                          | Open sections 2–6 retain all provider, fiscal, physical stock, recipient, live-smoke and activation approvals                                   |

## Baseline reconciliation

The three `replace-catalog-promotion` deltas were already synchronized: their added requirements are present in `catalog-promotion-automation`, `static-site-and-deployment`, and `stripe-catalog-sync`; their named removals are absent. No duplicate merge was needed.

The completed staff change had no baseline capability. Added `openspec/specs/staff-order-workspace/spec.md` from its reviewed Purpose and four requirements, using a normal Requirements section. The implementation remains in `apps/staff/src/pages/orders/index.astro` and its existing adapter/components. The completed change remains active; no archival or new operational acceptance is implied.

Some older catalog scenarios still use metadata/lookup-key wording. The explicit bound-Product/default-Price requirements govern the replacement; do not reintroduce sole-active-Price discovery while adapting runtime catalog reads. The newer Cloudflare promotion change also governs over older automatic-publication wording. Preserve these distinctions when its deltas are synchronized.

## Concrete migration boundaries

- The actual content configuration has 13 collections: purchaseInformation, artists, releases, news, distro, distroPage, navigation, socials, settings, newsletter, home, about and services. Section 3 must inventory actual records and media, including optional galleries and fixed-page objects, rather than use an older collection list.
- `apps/backend/src/index.ts` composes the Hono fetch handler and `runPaidOrderDeliverySchedule`. CMS failure must not suppress that existing schedule or public commerce routes.
- Keep `COMMERCE_DB`, stock/revision/hold/order history, provider bindings and current prices intact. M1 imports no real content and performs no live catalog mutation.
- Keep Sveltia, generated catalog inputs and the separate staff deployment operational until their replacement acceptance tasks pass.
- Existing staff Orders is inspection, not a shipment ledger. Continue its manual operations handoff without inventing order mutations.

## Validation

`pnpm openspec -- validate --specs`: 45 passed, 0 failed. Existing placeholder-Purpose warnings remain outside this reconciliation. No application behavior changed in task 1.1.
