# Item Setup opening stock

The existing `D1OperatorStockRepository` now provides `initializeOpeningStock` for a claimed Item Setup at `price_bound`. It validates a nonnegative whole quantity and checks the persisted journal identity, actor, revision, claim, lease, CMS source linkage, and Product/Price mapping before proceeding. Existing stock, movement history, or recount history prevents initialization.

One native D1 batch advances the journal to `stock_initialized`, creates physical and online stock with the same opening quantity, and records one opening StockChange when that quantity is positive. Zero creates no fake movement. The journal stores the StockChange identity only when a movement exists. Generic journal progression cannot bypass this transaction. Normal stock change/count commands continue using their existing repository methods.

Local D1 tests cover zero and ten opening units, invalid input, expired/forged claims, competing submissions, pre-existing stock/history, transaction rollback, and replay after a later movement. The rollback test fails the StockChange insert for positive quantities, proving earlier journal and stock writes are undone. Retries do not reset quantities or append another opening movement.

This is the opening-stock part of task 7.3 only. CMS source orchestration, initial Product/Price setup, the guided API/form, and publication remain unfinished. No migration, hosted provider request, persistent inventory change, or KV operation is involved.
Final verification: `pnpm test:unit`, `pnpm check`, `pnpm build`, and strict OpenSpec validation pass. Logs: `.codex-artifacts/emdash-m1/opening-stock-{unit,check,build}.log`; the initial focused D1 run is `opening-stock-targeted.log`.
