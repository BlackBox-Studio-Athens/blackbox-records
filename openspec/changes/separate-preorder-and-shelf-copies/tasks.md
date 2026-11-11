## 1. Backend (Codex)

- [x] 1.1 Read owed copies per variant from paid orders without a shipped dispatch, and include them in staff stock reads.
- [x] 1.2 Recount stores shelf minus owed (never below zero, online capped), keeps shelf and owed on `StockCount` with a migration, and reports a shortfall.
- [x] 1.3 Update the internal stock API contract, generated client and tests (sale-during-recount, shortfall, shipped order).

## 2. Staff (Claude)

- [x] 2.1 Owner selects the stock figures and arrival layout from visible examples.
- [x] 2.2 Stock figures follow the pre-order state; the recount asks for copies on the shelf and reads back owed and free to sell.
- [x] 2.3 Copies arrived asks for the shelf count, shows the split, records the recount and ends the pre-order, with recovery when the second step fails.
- [x] 2.4 Item setup explains what to enter for a pre-order.

## 3. Acceptance

- [ ] 3.1 `pnpm validate` passes and the staff journey covers arrival and recount.
- [ ] 3.2 A Release run on main passes every job.
