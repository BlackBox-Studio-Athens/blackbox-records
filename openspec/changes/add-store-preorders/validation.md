# Validation notes

## Planning evidence, 2 October 2026

- Branch `claude/preorder-flow-design-65884f` now sits on `4a4595af`: `main` at `df2ceae0` plus the two commits of the low-stock branch (`show-low-stock-notice`). No implementation has started; this change holds planning artifacts only.
- Visual reference: canvas Version 13 at https://claude.ai/artifact/MbxNJAgbRi6mdcN6ifSUTN, aligned with the final decisions (no refund promise, no Stripe consent, filter instead of tab, one new email).
- Code facts in design.md were read from source with CodeGraph and exact reads. The Graphify graph was built in this worktree on 2 October after the rebase onto `4a4595af`; the facts were re-read against that tree with CodeGraph and exact reads.

### Order pagination index migration

- Wrangler 4.141.0 `getD1MigrationFiles` uses the pattern `<migrations_dir>/*.sql` unless `migrations_pattern` is configured; `apps/backend/wrangler.jsonc` configures none.
- `@cloudflare/vitest-pool-workers` 0.22.0 `readD1Migrations` keeps `readdirSync` names ending in `.sql`; `apps/backend/vitest.config.ts` passes `prisma/migrations` to it.
- At the time of the check the primary checkout's Local D1 had 25 applied migrations; `0026` now belongs to the low-stock change (`0026_stock_show_low_stock.sql`), so this change's migrations are `0027` to `0030`. The database was copied to a scratch directory and read there: 25 applied migrations (`0001` to `0025_stock_restock_planned.sql`), no row for `20260917120000_staff_order_pagination`, and `PRAGMA index_list("CheckoutOrder")` has no `CheckoutOrder_createdAt_id_idx`.
- Conclusion: the folder-style migration is never applied in Local or in tests, and by the same discovery rule not in UAT or PRD. UAT and PRD were not queried. Fix: task group 2.

## Open changes on the same capabilities

`clarify-store-sold-out-presentation` (base for availability states and the purchase control; archive first), `alphabetize-distro-by-band`, `fix-mobile-cart-scrolling`, `show-release-editorial-details`, `smooth-homepage-hero`, `show-low-stock-notice` (adds `Stock.showLowStock`, the opt-in `lowStockQuantity` and its Store and staff surfaces; implemented, not archived). This change adds requirements beside theirs and modifies only `store-listing-price-presentation` "Listing-price projection is browser-safe and bounded" (built on the sold-out change's text; the low-stock change only adds a requirement to that capability, and this change's exposure scenario names its `lowStockQuantity`) and `paid-order-delivery` "Delivery retries are leased, bounded, and idempotent".

## Run 1, 2 October 2026

- Slices B0, B1, W1, W2 and S1 implemented by Sonnet 5.5 agents; commits `cf033f7d` (B0), `cfcf6a17` (B1), `ffaf0de6` (W1), `dc41526a` (W2), `3aa31be5` (S1); planning artifacts in `ebe05002`.
- Gate: two failed `pnpm validate` runs (a web type error under `exactOptionalPropertyTypes` in the W2 test; a duplicated `preorder` property in two backend test fakes), both fixed. Final `pnpm validate` passed, mode `local`, source fingerprints match: `.codex-artifacts/validation/2026-10-02T14-21-55-306Z-17944-d6d3a9/summary.json`.
- B1 ran `prisma:generate` against a scratch stand-in for the empty `@prisma/engines` package; only the four Stock-related generated files changed. Task 32.2 tracks a clean regeneration.
- B1 also fixed `readStock` in the operator stock repository, which did not select `restockPlanned` or `showLowStock`, so stock returned after a change or count reported both false.
- W1 impeccable gates as reported: context, product and shape passed (the canvas is the shape approval); image and browser checks not run in the slice. The new CSS is not visually verified; group 31 covers it.
- Decision: the Store card pre-order badge has its own element (`store-item-card__preorder`), because the availability slot also carries the low-stock notice.
- Not verified yet: anything visual, browser, Local stack, email or hosted behaviour.