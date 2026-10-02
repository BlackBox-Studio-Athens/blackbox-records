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
