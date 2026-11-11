## Context

Paid reconciliation lowers stock when payment lands (`createPaidCheckoutStockChangeId`), and dispatch records shipping separately. So the stored stock already means "free to sell", and the shelf equals stock plus copies in paid, unshipped orders. Only the recount and the wording ignore that.

## Decisions

- **Keep one stored number** (owner choice). Stock stays the free-to-sell count used by checkout and holds; nothing in checkout changes.
- **Owed copies are derived**, not stored on `Stock`: the sum of line quantities for the variant in paid orders without a shipped dispatch. Withdrawn or refunded orders follow whatever already removes them from fulfilment.
- **The recount subtracts owed copies inside its write**, so a sale between read and write cannot be double-counted; the existing revision check still guards the write.
- **The recount never stores below zero.** A shortfall is reported, not rejected: staff must be able to record a short delivery.
- **Copies arrived reuses the recount**, then ends the pre-order with the next revision. No new endpoint. A failure between the two steps leaves a recorded count and an open pre-order, which Staff offers to end again.
- **Audit:** `StockCount` gains a nullable owed column; older entries read as unknown.

## Risks

- A paid order that never gets a shipped mark keeps its copies owed. Staff see the owed number in the stock view and the Orders to-do list, so a stale order is visible.
