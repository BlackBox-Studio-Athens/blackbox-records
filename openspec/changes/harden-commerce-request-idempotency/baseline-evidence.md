# Baseline reproduction

`pnpm openspec:guard` passed before implementation changes.

The focused checkout and stock use-case reproductions show the uncovered retry behavior:

- Repeating the same keyless checkout command calls `createPendingHold` twice and invokes the checkout provider twice. The current hold repository has no client request identity and `start-checkout.ts` generates a new random `orderId` for each call.
- Repeating the same keyless stock-change command appends two `StockChange` rows and increments stock twice. The current `record-stock-change.ts` command has no request identity, and `D1OperatorStockRepository.recordChange` generates a new ledger ID on every call.

These are keyless legacy calls, so they remain outside the new retry guarantee during the compatibility bridge. The keyed paths added by this change must converge on one durable order or ledger effect.
