## Why

One stock number serves two meanings. Payment lowers it at once, so it counts copies **free to sell**, not copies on the shelf. Staff read it as "Copies on hand", including during a pre-order when nothing is pressed yet. Two real problems follow:

- **Overselling after arrival.** Pressings of 300 arrive while 50 pre-orders are unshipped. A stocktake of the shelf records 300 as free to sell, although 50 of them belong to buyers. The shop can sell 50 copies it does not have. `record-stock-count.ts` has no knowledge of unshipped paid orders.
- **"Copies arrived" records nothing.** It only ends the pre-order. The number staff see afterwards is the pre-order allocation minus sales, not the pressing that arrived.

The owner chose to keep one stored number and fix the flow and wording (11 November 2026), not to store pre-order and shelf copies separately.

## What Changes

- **Owed copies.** Stock reads include the copies in paid orders that are not yet shipped for the variant.
- **Stocktake records the shelf.** Staff enter the copies on the shelf. Stored stock becomes shelf minus owed, never below zero. A shortfall is shown when the shelf holds fewer copies than are owed. The count entry keeps the owed number for audit.
- **Copies arrived records the arrival.** It asks how many copies are on the shelf now, records that as a stocktake, then ends the pre-order.
- **Wording follows the state.** During a pre-order, Staff shows copies that can still be pre-ordered and copies pre-ordered but not shipped. Otherwise it shows copies on the shelf, owed to orders and free to sell. Item setup explains what to enter for a pre-order.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `orders-stock-operator`: a recount records the shelf and keeps owed copies out of sale.
- `store-preorders`: Copies arrived records the arrived copies; Staff stock wording follows the pre-order state.

## Impact

- Backend: stock detail read (owed copies), stock count use case and D1 repository, a nullable owed column on `StockCount` with a migration, internal stock API contract and its tests.
- Staff: `StockOperationsApp.tsx` metrics and count form, `PreorderControl.tsx` arrival step, `ItemSetupApp.tsx` help text.
- Out of scope: checkout, holds, paid reconciliation, shopper-facing copy and the stored stock model.
