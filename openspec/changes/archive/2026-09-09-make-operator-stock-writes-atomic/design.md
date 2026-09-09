## Context

See `proposal.md` for scope. Rechecked on 2026-09-09 at worktree HEAD `4423fbd0b8a8b4d1f1638207095fe18966d79955`, with unrelated dirty files present. `record-stock-change.ts` reads stock, computes an absolute replacement, saves it, then writes StockChange separately. `record-stock-count.ts` also saves before writing StockCount. `PrismaStockRepository.save` upserts absolute quantities. Stock has quantities and timestamps but no revision field.

The rerun audit probe invokes the real stock use case and Prisma adapter, interleaving a simulated paid decrement before its absolute upsert: initial quantity one, operator +1, and checkout -1 finish at two instead of one. This proves the vulnerable interleaving in application code, not a real D1 race. Source also confirms stock survives a later ledger-write failure; implementation acceptance must exercise both faults with actual local D1.

## Goals / Non-Goals

**Goals:** Serialize stock/audit effects, preserve paid settlement, and give recounts an explicit stale-data rejection.

**Non-Goals:** A locking service, generic unit-of-work abstraction, event sourcing, spreadsheet authority, or changes to verified Access identity.

## Decisions

### Use the existing D1 transaction pattern for both operator writes

Replace the stock-save/ledger-save sequence with operation-specific persistence methods inside the existing stock ownership boundary. Use the guarded D1 batch pattern already used by paid finalization. Compute delta and conservative online quantity from current database values within that boundary. Stock and its matching audit row commit together or neither commits. Preserve current delta semantics and reject physical stock below zero.

Reuse database constraints for quantity validity. A conditional D1 update matching zero rows is not a SQL error: guard its audit insert too, and return a conflict/failure instead of committing an audit row without a stock mutation. Verify both rejected conditions and actual statement failures. Do not add a separate stock counter or move paid finalization into the operator path.

Implementation inspection found no existing Stock quantity constraints. The user approved insert/update validation triggers in the additive revision migration on 2026-09-09, enforcing integer, non-negative physical and online quantities with online quantity no greater than physical quantity, without rebuilding Stock.

### Recounts carry a monotonic stock revision

Add a non-negative integer `revision` to Stock with default zero in an additive migration. Every runtime stock writer, including paid finalization, increments it in the same transaction as its quantity change. Audit repository/direct-SQL writers so no path changes stock without advancing the revision. Existing preparation scripts must preserve/increment revision on updates and use zero only on first insert.

Protected stock reads return the revision. The recount form retains the revision read when counting began; background refresh must not silently replace that precondition while preserving an old entered count. Recounts require `expectedRevision`: a non-negative integer for an existing row, or explicit `null` for an absent row. Omission or malformed values are validation errors. A valid precondition that no longer matches returns HTTP 409 without stock or StockCount writes, including an absent-row creation race. Refresh stock, preserve count/notes, and require operator reassessment before resubmission.

The token goes only through the protected stock contract and generated client, never StoreCart or public Store Offers. A timestamp-only comparison risks same-tick writes; comparing quantities alone misses a sale followed by an equal restock. The integer revision is therefore retained. Deltas use current quantities and do not require a browser revision. These transactions prevent lost updates; they do not add deduplication for separately submitted operator requests, so uncertain responses must not trigger automatic resubmission.

## Risks / Trade-offs

- A writer misses the revision increment → map every SQL/repository writer and test a paid settlement invalidates a pending recount.
- Recount conflicts during active sales → explicit 409 and preserved input prevent lost sales; operators must recount/reassess rather than click through stale data.
- Stock transaction succeeds but ledger fails → one D1 batch rolls back both, verified with fault injection.
- Protected API gains a required recount precondition → regenerate internal contracts and deploy Worker/staff together; keep old clients from unguarded writes.

## Migration Plan

1. Add the revision migration through the existing Wrangler/D1 workflow and regenerate Prisma. Keep prior migration history intact.
2. Update every stock writer, protected read/write contract, generated client, and staff conflict handling; retain existing module boundaries. Update boundary spec/manifest only if named entrypoints or dependencies change.
3. Prove delta/delta, delta/paid, recount/paid, absent-row races, and rollback in real local D1, then run repository gates.
4. Accept this correction using real local D1 regressions, native local staff browser proof, and repository gates. The user approved this sequence on 2026-09-09 because the staff portal is PRD-only; no UAT staff portal is provisioned. Sync/archive the locally accepted correction, then require protected PRD adjustment, recount, stale-conflict, retained-input, and Access allow/deny proof under `production-go-live-readiness` before launch sign-off. Apply PRD schema/code under that launch change with checkout closed. Rollback stops operator writes/checkout as needed and retains revision data and audit history.
