# Stock — complete received review

Reviewer thread: `01a1256b-29d2-7a43-8be5-983d885194a5`.
Reviewer turn: `01a1256b-31ad-7ed3-8d2a-541ac83866b1`.
Immutable source: [20-stock-review.result.json](../../../../.codex-artifacts/simplification/20-stock-review.result.json).
Raw source SHA-256: `eba42578aeaf82da92942b2f74d74151a0fb43b7c1a13d3c488a83f63f7f0f35`.

The complete received report follows. Its findings are historical candidates; current decisions and scoped results are recorded separately in [the implementation report](../implementations/stock.md).

What this change does: This is a completed read-only review of module 20/29, `stock`. The module validates stock commands, coordinates protected repository operations, and projects stock detail and history. Three concrete simplifications are supported by the current source: one removes repeated quantity validation, and two remove unnecessary test-double behavior. No files, task records, graphs, generated output or services were intentionally modified.

**Source identity and ownership.** Reviewed the existing `main` checkout at `C:/Users/SVall/WebstormProjects/blackbox-records`, HEAD `3355c335226838f996efb5536f55271f819a3e14`. All 14 owned files had identical raw-byte SHA-256 hashes at the initial inventory on 2026-10-10 at 13:47:52 +03:00 and the closing observations at 14:01:43 +03:00. The scoped Git status was clean. Ten fingerprinted connected source files also remained unchanged between observations; this does not assert that the entire shared checkout was unchanged.

The aggregate stock manifest SHA-256 is `38383c2699528b579079d0b244946b0833e307319359ec51d3e703e3d41ef98b`. Its canonical input is the sorted filenames relative to the stock root, followed by TAB, the lowercase SHA-256 of each file’s raw bytes, and LF, including the final row. The filename inventory appears below.

[project.json](/C:/Users/SVall/WebstormProjects/blackbox-records/apps/backend/src/application/commerce/stock/project.json:1) declares a closed module with `./index.ts` as its only export, dependencies on `commerce-domain` and `backend-platform`, and no named or workspace interfaces. No nested project roots or generated sources were found within the assigned root.

**Findings.** These are implementation candidates, not completed changes. None requires a new dependency, abstraction or public interface change.

1. **Remove the two outer quantity parses in recount validation.** Nice to have. Exact location: [record-stock-count.ts](/C:/Users/SVall/WebstormProjects/blackbox-records/apps/backend/src/application/commerce/stock/record-stock-count.ts:39), lines 39–47; also remove the now-unused `createStockQuantity` import name on line 2.

   **What this is and proof:** `recordStockCount` calls `createStockQuantity` on both command quantities before passing them to `createStockState`. The existing [domain constructor](/C:/Users/SVall/WebstormProjects/blackbox-records/apps/backend/src/domain/commerce/quantities.ts:41), lines 41–52, already accepts unknown inputs, validates both through the same quantity schema, and rejects online quantity above physical quantity. A valid recount therefore performs four quantity parses where two suffice.

   **Smaller implementation:** Keep the existing try/catch and pass `onlineQuantity: command.onlineQuantity` and `quantity: command.countedQuantity` directly to `createStockState`. Retain the exact `InvalidStockOperationError('Online stock cannot exceed counted stock.')` mapping.

   **Behavior proof:** The production caller constructs an ordinary command object from validated HTTP JSON at [register-internal-stock-routes.ts](/C:/Users/SVall/WebstormProjects/blackbox-records/apps/backend/src/interfaces/http/stock/register-internal-stock-routes.ts:961), lines 961–970, and forwards it through `internal-stock-services.ts:77–86`. The quantities schema contains number validation and a type brand, with no coercion or transformation. Zod documents that branding does not change the runtime parse result. [Zod branded types](https://zod.dev/api#branded-types).

   A read-only probe transpiled the current domain constructor entirely in memory with TypeScript 5.9.3 and installed Zod 4.6.5. It compared the current and smaller expressions over all 576 pairs drawn from 24 representative values, including zero, negative zero, valid integers, fractions, safe-integer limits, strings, null, undefined, NaN, infinities, objects, arrays, bigint, symbol and boxed numbers. It observed 16 accepted pairs and zero differences in returned quantities or the mapped error name/message. This establishes expression equivalence for those inputs, not full Worker acceptance.

   **Retain and check:** Preserve the existing order of variant lookup, quantity validation, revision validation, notes normalization, request fingerprinting and repository mutation. Keep all revision, idempotency and repository-result handling. Run `pnpm test stock` after implementation. A small table-driven recount check should establish that invalid counted quantity, invalid online quantity and online quantity above the count produce the same application error without calling `recordCount`; this protects the trust boundary rather than counting parser invocations.

   **Expected reduction / if skipped:** Two redundant wrapper calls and one import name disappear; successful recounts perform two quantity schema parses instead of four. Whole-line reduction is effectively zero. No end-to-end latency improvement was measured. Skipping this leaves repeated validation work and obscures the domain constructor’s existing responsibility.

2. **Replace three unused test-double implementations with typed mocks.** Should fix. Exact location: [stock-use-cases.test.ts](/C:/Users/SVall/WebstormProjects/blackbox-records/apps/backend/src/application/commerce/stock/stock-use-cases.test.ts:37), `findBySource` at lines 40–46, `findByStoreItemSlug` at 48–50, and `listOpenPreorders` at 78–81.

   **What this is and proof:** These file-local classes implement repository operations that no owned test or stock use case invokes. The complete 660-line test file and an exact reference search show only the method definitions. The owned application functions use `findByVariantId`, `search`, ledger reads and operator writes; none calls the three methods above. `athensToday` and `isPreorderOpen` are imported on line 2 solely for the unused `listOpenPreorders` implementation, and `StoreItemSourceRef` on line 28 is used solely by the unused source lookup.

   **Smaller implementation:** Preserve `implements StoreItemOptionRepository` and `implements StockRepository`. Replace the three bodies with existing Vitest primitives typed from the interface, for example `public findBySource = vi.fn<StoreItemOptionRepository['findBySource']>();`. Apply the same form to the other two methods, then remove the newly unused imports. Vitest 4.1.11 supports a function type parameter for `fn`; the matching version’s source was checked. [Vitest 4.1.11 mock implementation](https://raw.githubusercontent.com/vitest-dev/vitest/v4.1.11/packages/spy/src/index.ts).

   **Retain and check:** Keep the used lookup, stock-save and ledger methods, their fixture state, and every existing test and assertion. Preserve revision increments, recorded dates, ledger ordering and pre-order state in the used helpers. Run `pnpm test stock` and let the verification thread’s `pnpm validate` confirm that the full interface types still hold. Do not weaken production repository contracts to accommodate the test doubles.

   **Expected reduction / if skipped:** Approximately 14 lines including unused imports, depending on formatting. No regression case is deleted. Skipping this leaves unexercised repository and calendar logic that readers must distinguish from tested behavior.

3. **Replace the test repository’s search algorithm with a configured result and verify delegation.** Should fix. Exact location: [stock-use-cases.test.ts](/C:/Users/SVall/WebstormProjects/blackbox-records/apps/backend/src/application/commerce/stock/stock-use-cases.test.ts:56), lines 56–68, setup at 168–172, and the search test at 200–202.

   **What this is and proof:** The fake implements trimming, case folding, filtering three identity fields and result limiting. It is used only by the single search test. The actual [stock application function](/C:/Users/SVall/WebstormProjects/blackbox-records/apps/backend/src/application/commerce/stock/search-variants.ts:4), lines 4–9, only forwards query and limit to the repository. Production search belongs to `PrismaStoreItemOptionRepository.search` at lines 133–179 of its persistence file, where it also searches product names, orders results, and enriches them with stock. The fake does not establish that production behavior.

   **Smaller implementation:** Replace the fake method with `vi.fn<StoreItemOptionRepository['search']>()`, configure it to resolve `[storeItem]` in the existing setup, and retain the result assertion. Add an assertion that it received exactly `'disintegration'` and `20`.

   **Meaningful coverage to retain:** Preserve successful result forwarding and query/limit forwarding through the stock boundary. The added argument assertion detects a concrete regression the current test misses: forwarding an empty query can still return the same single fixture and pass the existing result-only assertion. Keep persistence search and inventory integration coverage with their current owners.

   **Focused check:** Run `pnpm test stock`. This candidate changes only the owned unit-test double and its collaboration assertion.

   **Expected reduction / if skipped:** Approximately 10 lines after configuring the mock and adding the argument assertion. No test is deleted. Skipping this retains an approximate search implementation in an application test while leaving delegation arguments weakly checked.

**Rejected simplifications and coverage to retain.**

- Removing revision validation or factoring the four checks into a new helper was rejected. These commands accept unknown values, explicit null distinguishes an absent stock row, and the checks occur at different positions relative to other validation. Their repetition does not justify weakening validation or adding an abstraction.
- Removing either pre-order revision check was rejected. `set-stock-preorder.ts:44–52` protects the initial read and no-op return; lines 59–60 reject a race at the actual write. Owned tests at 442–485 exercise no-op behavior, stale input and the post-read race separately.
- Moving recount revision rejection ahead of repository execution was rejected. A committed keyed recount must replay even after its original revision becomes stale. `D1OperatorStockRepository.recordCount` and `replayCount`, plus its worker test at 317–353, demonstrate this distinct contract.
- Removing idempotency error translation, quantity-failure handling, null-result checks or D1 transaction guards was rejected. They determine safe application errors and prevent partial ledger effects. Current D1 documentation confirms that batch statements execute in order and roll back the sequence on failure. [D1 batch semantics](https://developers.cloudflare.com/d1/worker-api/d1-database/#batch).
- Replacing stock history projections with repository-object spreads was rejected. The current projection explicitly controls returned fields and preserves change-before-count ordering for equal timestamps before sorting and limiting. No performance problem was established for the bounded history.
- Parallelizing the stock and alert-count reads was rejected because it would issue the second read even when the first fails, changing work and failure ordering.
- Removing the exported search wrapper, parser or type aliases was rejected. The task requires stable interfaces; a thin exported boundary is not proven dead code.
- Deleting the keyless-repeat, negative-stock, pre-order lifecycle, Athens-midnight, no-op, race or history tests was rejected. They protect distinct application outcomes. No test deletion is recommended.

**Inspected scope.** Every owned file was inspected: `errors.ts`, `index.ts`, `inventory.ts`, `project.json`, `read-variant-stock-history.ts`, `read-variant-stock.ts`, `record-stock-change.ts`, `record-stock-count.ts`, `search-variants.ts`, `set-show-low-stock.ts`, `set-stock-preorder.ts`, `set-zero-stock-state.ts`, `stock-use-cases.test.ts`, and `types.ts`.

Connected evidence included the complete internal stock service composition; relevant HTTP validation, command construction, error mapping and response paths; domain identifiers, quantities, pre-order rules, request fingerprints and repository contracts; the used Prisma lookup/search/stock/history methods; D1 operator writes, replay and pre-order notice handling; and alert-count reads. Test evidence included the stock-owned unit suite, inventory and pre-order HTTP integration tests, domain quantity tests, D1 idempotency/pre-order tests, and the paid-checkout/operator-restock integration caller. Connected files outside stock were read as compatibility evidence and are not implementation targets.

Required instructions, archived Ponytail skills, Graphify guidance, Cloudflare/Workers guidance, the OpenSpec change artifacts, feedback policy and relevant stock, reservation, checkout, pre-order, boundary and staff-input requirements were read. The assumed load is concurrent shopper checkout and authenticated operator activity against shared D1 state, as specified by the repository’s stock race requirements.

**Tools, checks and limitations.** Graphify was queried against the existing graph with budget 2500. Its initial two-hop result was truncated. CLI `explain` and `path` returned no output, and `query --help` was interpreted as another corpus query. The relevant gap was closed with two bounded, read-only traversals of the existing graph’s direct stock relationships: 39 and 50 edges, each within the 2500-token character cap. Extracted edges were distinguished from inferred repository dispatch edges. No graph initialization, refresh, enrichment or result saving was invoked.

CodeGraph returned current source and caller information. It omitted the export-only index and two test files without indexed symbols, and elided portions of larger files. Those gaps were resolved with bounded exact reads. No remaining source gap affects these findings. The existing Graphify file timestamp remained unchanged during the observations.

The only executed behavioral probe was the isolated, in-memory 576-pair validation comparison described in finding 1. Project tests, Worker tests, `pnpm validate`, OpenSpec checks, browser acceptance and provider checks were not run in this read-only role. Shared validation and task updates remain with the persistent verification thread. If finding 1 is implemented, use `pnpm test stock` first; the verification thread can select the existing stock-integration, persistence or checkout integration checks according to the actual diff and acceptance matrix.

Verdict: The review is complete. Findings 1–3 are concrete, bounded candidates for the fresh stock implementation thread to verify against its starting source. Approximately 24 existing test-support lines can be removed before any focused regression additions, and a valid recount can avoid two repeated quantity parses. No source change or test-suite pass is claimed.
