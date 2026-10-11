# Commerce persistence received review

Reviewer thread: `01a1254f-c4d2-7563-822d-8d2549f1b1cd`.

Review source: `.codex-artifacts/simplification/18-commerce-persistence-review.result.json`, completed `report` field, matching the full review supplied in the implementation assignment. Review HEAD: `3355c335226838f996efb5536f55271f819a3e14`; owned manifest: `f583e035aaf51db9e7ed6e1ef73ef45fa8cf0b342ed25e83c3b6b2090ce9afc8`; connected manifest: `2ee283147923fe8507c68612d73eafb12c56b8e2b2e6d336ce416bc04a31d46c`. The complete received review follows with repository Markdown formatting; the raw report remains unchanged.

**What this change does:** This is a read-only Ponytail review of module 18/29, `commerce-persistence`, in the existing `main` checkout. It identifies three concrete simplifications while retaining persistence behavior, interfaces, validation, ordering, error handling and security. No source, tests, task records or reports were edited.

Checkout: `C:/Users/SVall/WebstormProjects/blackbox-records`. Task record: `openspec/changes/simplify-main-site-modules`. Reviewed all 18 owned source files, all 13 owned test files and `project.json`; there are no nested project roots in the assigned directory. Generated code and migrations were excluded from simplification proposals. Relevant migration constraints were read as supporting evidence.

The load assumption comes from `apps/backend/src/index.ts:13`: one low-traffic store per Durable Object. Catalog verification can request up to 500 items through `catalog-reconciler.ts:30,312–319`. No throughput or latency improvement is claimed without measurement.

**Should fix**

1. **Remove unreachable completion logic from `advance()`** — [d1-catalog-operation-repository.ts](/C:/Users/SVall/WebstormProjects/blackbox-records/apps/backend/src/infrastructure/persistence/prisma/d1-catalog-operation-repository.ts:620), lines 626–660.

   - **What this is:** `advance()` records intermediate catalog-operation steps. Dedicated methods finish setup, price changes, initial pricing and publication together with their required persistence changes.
   - **Problem and proof:** Lines 627–628 reject `nextStep === 'completed'` for all four supported operation kinds. Nevertheless, line 643 calculates `completed`, and lines 646–656 contain status and lease-clearing branches for that impossible result. The closed kind set is established by `domain/commerce/repositories/catalog-operation-repository.ts:11–21` and the database CHECK constraint in `prisma/migrations/0024_price_initialization_operation.sql`.
   - **Caller evidence:** `application/commerce/catalog-sync/change-catalog-price.ts:162–207` advances through `validated`, `price_bound` and `default_selected`, then calls `completePriceChange()`. `initialize-catalog-price.ts:258–291` uses intermediate steps and `completePriceInitialization()`. `setup-catalog-item.ts:165,204,235–250` uses `initializeOpeningStock()` and `completeSetup()`. `publish-catalog-item.ts:102–105,121–197` advances publication steps and finishes with `completeItemPublication()`. CMS recovery also uses that dedicated completion method at `cms/item-publication-recovery.ts:107–110`.
   - **Smaller change:** Delete `const completed`. Make the UPDATE assign only `step`, `results` and `updatedAt`; remove the redundant status assignment and the two lease CASE assignments, together with their three bind arguments. Keep the transition table, both rejection guards, results validation, immutable-results check and every WHERE predicate unchanged.
   - **Behavior to preserve:** Intermediate transitions remain pending and retain the claim token and lease. Invalid completion attempts still throw `Invalid catalog operation step.` before database work. Expired or replaced claims return null. Dedicated completion methods remain responsible for terminal status and lease release. No CatalogOperation trigger in the migration set depends on the removed no-op assignments.
   - **Focused validation:** Run `pnpm test apps/backend/test/integration/catalog-sync/catalog-operation.worker.test.ts` and `pnpm test commerce-persistence`. Retain the existing tests at `catalog-operation.worker.test.ts:48–67` for expired claims, stale steps, immutable results and rejected completion. The integration tests for setup and initial pricing already reject completion through `advance()` at `setup-catalog.worker.test.ts:150` and `interfaces/http/routes/initialize-catalog-price.worker.test.ts:365`.
   - **Expected net reduction:** Approximately **5 source lines**, with three fewer SQL bind parameters. No new helper, interface or test deletion is needed.
   - **If skipped:** Every intermediate write continues carrying unreachable terminal-transition machinery.

2. **Remove tests that only verify declared methods exist** — [repository-seams.worker.test.ts](/C:/Users/SVall/WebstormProjects/blackbox-records/apps/backend/src/infrastructure/persistence/prisma/repository-seams.worker.test.ts:16), lines 16–54; [create-prisma-client.worker.test.ts](/C:/Users/SVall/WebstormProjects/blackbox-records/apps/backend/src/infrastructure/persistence/prisma/create-prisma-client.worker.test.ts:8), lines 8–17.

   - **What this is:** The seam test constructs eight repositories and checks `typeof ... === 'function'`. The first client test similarly checks two generated delegate methods.
   - **Problem and proof:** None of those assertions executes a repository operation or verifies data, query results, errors, ordering or persistence. Each inspected repository constructor merely stores its client. An empty or incorrect implementation would still pass these assertions. These tests mirror declarations rather than protect a distinct behavioral scenario.
   - **Retained coverage:** Keep the client lifecycle test at `create-prisma-client.worker.test.ts:18–35`: it verifies separate object scopes, shared request clients, cleanup and an actual D1 query. Keep `runtime-catalog-fields.worker.test.ts:6–45` for real catalog reads and unique identities; `d1-checkout-stock-hold-repository.worker.test.ts:16–138` for pending orders, retry reads and immutable pre-order snapshots through both adapters; `order-search.worker.test.ts:8–205` for actual order and stock queries; and `catalog-webhook-events.worker.test.ts:7–105` for retryable duplicates and late-failure protection. Production composition retains the barrel imports and construction of these repositories in `interfaces/http/stock/internal-stock-services.ts:19–35`, `interfaces/http/routes/public-commerce-services.ts:69–88` and `interfaces/http/routes/stripe-webhook-services.ts:36–44`. Package type checking continues checking declared APIs and imports.
   - **Smaller change:** Delete the 54-line `repository-seams.worker.test.ts`. Delete only the first `it()` block and following blank line from `create-prisma-client.worker.test.ts`; retain its lifecycle test unchanged. Do not delete repository implementations or public exports.
   - **Behavior to preserve:** All runtime behavior and public APIs remain unchanged. The removed coverage consists solely of constructor/method-presence checks; the meaningful connection-lifetime, mapping, persistence and concurrency checks remain.
   - **Focused validation:** Run `pnpm test commerce-persistence`. The implementation handoff must also obtain the normal successful `pnpm validate` result for package types and boundaries. Do not substitute these presence assertions for missing behavior coverage or remove additional tests under this finding.
   - **Expected net reduction:** **64 test lines** and two tests. No replacement test is required because neither removed test has a distinct behavioral assertion.
   - **If skipped:** Future API edits must maintain assertions that do not detect incorrect implementations.

**Nice to have**

3. **Reuse the stock match for both quantity fields** — [prisma-store-item-option-repository.ts](/C:/Users/SVall/WebstormProjects/blackbox-records/apps/backend/src/infrastructure/persistence/prisma/prisma-store-item-option-repository.ts:164), lines 164–178.

   - **What this is:** `search()` fetches matching items and their stock rows, then attaches physical and online quantities to each item.
   - **Problem and proof:** Lines 175 and 176 run the identical `stock.find((item) => item.variantId === record.variantId)` twice for the same record and unchanged array. Both fields necessarily use the same first matching stock row. For a match at the end of a 500-row stock array, that is 1,000 comparisons instead of 500 for that item.
   - **Caller evidence:** Staff search delegates directly through `application/commerce/stock/search-variants.ts:4–9` and `interfaces/http/stock/internal-stock-services.ts:97`. Catalog verification uses the same search with its 500-item bound at `application/commerce/catalog-sync/catalog-reconciler.ts:30,312–319`. The owned catalog-fields test invokes real repository search at `runtime-catalog-fields.worker.test.ts:23–26`.
   - **Smaller change:** Store the existing `find()` result once in a local variable inside the mapping callback. Read both `quantity` and `onlineQuantity` from it. Keep the queries, filtering, ordering, limit, display-name handling and identifier parsing intact. A Map or shared helper is unnecessary for this change.
   - **Behavior to preserve:** Both quantities remain null when stock is missing; zero remains zero through `?? null`. Results retain their existing item order, optional display name and shape. Database query count remains unchanged.
   - **Focused validation:** Run `pnpm test apps/backend/src/infrastructure/persistence/prisma/runtime-catalog-fields.worker.test.ts` or the module check. Review the final diff for the unchanged missing-stock and zero-value expressions. This recommendation proves removal of repeated comparisons, not a measured latency gain.
   - **Expected net reduction:** Approximately **+1 source line**, with one stock-array scan instead of two per result. Include it for reduced repeated work, not line count.
   - **If skipped:** Every result continues repeating the same lookup.

**Rejected ideas**

- **Do not merge delivery repositories into a generic outbox.** Paid delivery uses a candidate read, conditional claim and verified read-back (`d1-paid-order-delivery-repository.ts:39–79`). Estimate notices additionally protect their replacement sequence and recover exhausted claims (`d1-preorder-estimate-delivery-repository.ts:24–82`). Availability alerts have different eligibility, deletion, budget and attempt-refund behavior (`d1-availability-alert-repository.ts:49–195`). Withdrawal deliveries retain a separate cap and review lifecycle. Combining these changes observable selection, errors or persistence unless substantially more machinery is introduced.
- **Do not replace the paid-delivery claim with a single UPDATE RETURNING as a cleanup.** Its current losing claimant returns `not_claimed`, and a failed read-back throws a specific error. A query rewrite can select another row during a race or remove that failure path. The owned concurrent-claim and stale-lease tests have distinct value.
- **Do not remove revision, lease, identity or conditional-write guards.** Operator changes and recounts use database predicates plus `changes()` to commit ledger entries only with the corresponding stock write. Pre-order changes similarly enqueue or clear notices transactionally. The owned tests verify stale revisions, concurrent winners, replay and rollback.
- **Do not replace native D1 batches with independent writes or Prisma transaction wrappers.** The native batch ordering and rollback behavior are part of the current contract. Cloudflare documents that a failed batch statement rolls back the sequence. [D1 batch documentation](https://developers.cloudflare.com/d1/worker-api/d1-database/#batch)
- **Do not substitute `stockPreorderFromColumns()` for the order-line preorder mapping.** Stock requires a valid estimate, while saved order lines support a withheld/null estimate. The owned checkout-hold test deliberately covers null, month and date estimates at lines 64–138. The domain helper at `domain/commerce/preorder.ts:54–68` is therefore not equivalent.
- **Do not remove the scoped Prisma client cache or cleanup override.** `create-prisma-client.ts:6–25`, `src/index.ts:15–18` and the retained lifecycle test establish deliberate object ownership and request sharing. A general module-level client would change that lifetime and risk request isolation. [Workers state guidance](https://developers.cloudflare.com/workers/best-practices/workers-best-practices/#do-not-store-request-scoped-state-in-global-scope)
- **Do not spread whole records into Prisma update objects to shorten CRUD mappings.** Create and update fields deliberately differ: stock revisions increment; snapshot updates retain their original slug/variant identity; mapping updates retain variant identity. Keep those distinctions. Prisma also treats create and update as different branches of an upsert. [Prisma upsert documentation](https://www.prisma.io/docs/orm/v7/reference/prisma-client-reference#upsert)
- **Do not delete migration, unique-identity, pagination-index, immutable-snapshot or rollback tests.** Their assertions establish behavior absent from the proposed presence-test deletions.
- **Do not redesign inventory pagination or order sorting.** Inventory deliberately uses SQLite normalization on both cursor sides and a fixed cutoff. Order search filters before pagination and uses tied-date cursor ordering. Replacing these with JavaScript filtering changes results.
- **No interface removal, new abstraction, provider/API change or unrelated behavior fix is proposed.** Shorter return forms, uniform numeric checks and broader CRUD consolidation did not provide enough concrete benefit to justify additional findings.

**Inspected owned files**

All entries below are relative to `apps/backend/src/infrastructure/persistence/`; each owned source and test was read completely, including sections omitted from graph output.

| Area                | Source files                                                                                                               | Tests retained or reviewed                                                                       |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Checkout holds      | `d1-checkout-stock-hold-repository.ts`                                                                                     | `d1-checkout-stock-hold-repository.worker.test.ts`                                               |
| Withdrawals         | `d1-order-withdrawal-repository.ts`                                                                                        | `d1-order-withdrawal-repository.worker.test.ts`                                                  |
| Availability alerts | `d1-availability-alert-repository.ts`                                                                                      | `d1-availability-alert-repository.worker.test.ts`                                                |
| Paid deliveries     | `d1-paid-order-delivery-repository.ts`                                                                                     | `d1-paid-order-delivery-repository.worker.test.ts`, `paid-order-delivery-schema.worker.test.ts`  |
| Estimate notices    | `d1-preorder-estimate-delivery-repository.ts`                                                                              | `d1-preorder-estimate-delivery-repository.worker.test.ts`                                        |
| Client and exports  | `prisma/create-prisma-client.ts`, `prisma/index.ts`                                                                        | `prisma/create-prisma-client.worker.test.ts`, `prisma/repository-seams.worker.test.ts`           |
| Operator stock      | `prisma/d1-operator-stock-repository.ts`                                                                                   | `prisma/d1-operator-stock-repository.worker.test.ts`                                             |
| Catalog journal     | `prisma/d1-catalog-operation-repository.ts`                                                                                | Connected catalog-operation integration tests                                                    |
| Orders              | `prisma/prisma-order-state-repository.ts`                                                                                  | `prisma/order-search.worker.test.ts`                                                             |
| Stock and ledgers   | `prisma/prisma-stock-repository.ts`, `prisma/prisma-stock-change-repository.ts`, `prisma/prisma-stock-count-repository.ts` | Owned stock, order-search and seam tests; connected history caller                               |
| Availability        | `prisma/prisma-item-availability-repository.ts`                                                                            | Connected public/webhook composition and retained module tests                                   |
| Catalog items       | `prisma/prisma-store-item-option-repository.ts`                                                                            | `prisma/runtime-catalog-fields.worker.test.ts`, `prisma/runtime-catalog-backfill.worker.test.ts` |
| Offers and mappings | `prisma/prisma-store-offer-snapshot-repository.ts`, `prisma/prisma-variant-stripe-mapping-repository.ts`                   | Connected reconciliation, pricing and catalog-reader flows                                       |
| Webhook records     | `prisma/prisma-stripe-catalog-webhook-event-repository.ts`                                                                 | `prisma/catalog-webhook-events.worker.test.ts`                                                   |

Also read `project.json`, repository/global instructions, the saved Ponytail review and coding guidance, Graphify guidance, Cloudflare/Workers/Durable Objects guidance, Stripe guidance, task proposal/design/tasks, agent workflow/reference and relevant checkout, stock-reservation, paid-delivery, shipping, pre-order, operator-stock, boundary and simplification specs. Design work was unnecessary.

**Connected flows and evidence files**

Read the relevant caller and contract sections for checkout creation/retry/recovery, catalog setup/pricing/publication, CMS publication recovery, staff stock search/history, order reads, scheduled deliveries, alerts and withdrawals. The following 24 files form the connected-evidence fingerprint; paths are relative to the checkout:

- `apps/backend/src/application/commerce/catalog-sync/`: `catalog-reconciler.ts`, `change-catalog-price.ts`, `initialize-catalog-price.ts`, `publish-catalog-item.ts`, `setup-catalog-item.ts`.
- `apps/backend/src/application/commerce/checkout/`: `start-checkout.ts`, `request-availability-alert.ts`.
- `apps/backend/src/application/commerce/orders/`: `availability-alert-delivery.ts`, `internal-order-services.ts`, `order-withdrawal.ts`, `paid-order-delivery-processing.ts`, `preorder-estimate-notice.ts`, `run-paid-order-delivery-schedule.ts`.
- `apps/backend/src/application/commerce/stock/`: `read-variant-stock-history.ts`, `search-variants.ts`.
- `apps/backend/src/interfaces/http/routes/`: `public-commerce-services.ts`, `stripe-webhook-services.ts`; plus `apps/backend/src/interfaces/http/stock/internal-stock-services.ts`.
- `apps/backend/src/domain/commerce/repositories/catalog-operation-repository.ts`, `apps/backend/src/index.ts`, `apps/backend/src/cms/item-publication-recovery.ts`.
- `apps/backend/test/integration/catalog-sync/catalog-operation.worker.test.ts`, `apps/backend/test/integration/catalog-sync/runtime-catalog-reader.worker.test.ts`, `apps/backend/test/integration/stock/inventory.worker.test.ts`.

Additional supporting reads included preorder and repository contracts, catalog migrations 0021/0022/0024, migration trigger discovery and test configuration. CMS was inspected only as a consumer; it is outside implementation scope.

**Verification and source identity**

- Branch: `main`. HEAD at inspection and closeout: `3355c335226838f996efb5536f55271f819a3e14`.
- Owned module manifest SHA-256: `f583e035aaf51db9e7ed6e1ef73ef45fa8cf0b342ed25e83c3b6b2090ce9afc8`. Identical at both fingerprint captures. It covers all 32 files: 18 sources, 13 tests and `project.json`.
- Connected-evidence manifest SHA-256 for the 24 files listed above: `2ee283147923fe8507c68612d73eafb12c56b8e2b2e6d336ce416bc04a31d46c`.
- Manifest method: sort repository-relative forward-slash paths; create one line per file as lowercase SHA-256 of its bytes, two spaces, then path; join with LF, append a final LF and hash the UTF-8 manifest.
- Finding-file hashes: `prisma/d1-catalog-operation-repository.ts` = `defb04ab468c49eada95e484ca0f772f5f3ae904c78ff4bdbdf87ee630ee1ab2`; `prisma/prisma-store-item-option-repository.ts` = `29f872148acd6f39b596a2f9accbdbbfd8dce1602d98d83c1c1826d1bf9e89b5`; `prisma/repository-seams.worker.test.ts` = `9e25fe9589e51dd5a85706bd345a1da715b1f37003c58b24f9335a194250830e`; `prisma/create-prisma-client.worker.test.ts` = `f7c93bb57935f030011d04237da2993216801accbc6616e893f4f0758e378b39`.
- `pnpm test commerce-persistence`: **exit 0, Nx cache hit**. Cached output reports 13 files and 56 passing tests. The [module JSON report](/C:/Users/SVall/WebstormProjects/blackbox-records/.codex-artifacts/validation/2026-10-09T10-00-33-998Z-63624-cf27de/commerce-persistence.json) confirms success and zero failed tests. This was reused evidence, not a fresh execution. Its enclosing historical validation summary was interrupted/failed with exit 130; it is not evidence of a successful whole-project validation.
- `pnpm test apps/backend/test/integration/catalog-sync/catalog-operation.worker.test.ts`: **exit 0, fresh execution, 0/1 cache hits**. The approved runner selected `catalog-sync-integration:test`; that task passed in approximately 62 seconds. The successful task output was suppressed by Nx, so no unsupported test-count claim is made.
- Graphify used the existing graph with budget 2500. The combined checkout/order query was truncated; targeted explanations of `D1CheckoutStockHoldRepository`, `PrismaOrderStateRepository` and `D1CatalogOperationRepository` bounded the relevant architecture. CodeGraph then supplied exact source and relationships. Omitted source sections were recovered through focused reads. Ambiguous graph matches were treated as navigation, not behavioral proof.
- No graph rebuild, initialization or enrichment was run. CodeGraph briefly reported generated Prisma files awaiting synchronization; those were excluded from review findings.
- Other threads changed frontend/shared-package files during the review. The assigned module stayed unchanged. No commit, push, deployment, publication, provider mutation or message to another thread occurred.

**Handoff limits**

The fresh implementer should independently verify findings against the fingerprints, implement only selected owned-file changes and run the focused checks above. `pnpm validate` belongs to the implementation/integration closeout; it was not run during this read-only review because it can format the concurrent working tree. Browser, hosted D1, email-provider, Stripe and release acceptance were not exercised, and no latency benchmark was run.

**Verdict: Ship the review to the fresh implementation thread.** Findings 1 and 2 are worthwhile deletion candidates; finding 3 is a small optional reduction in repeated work.

**Lean: approximately −68 lines possible overall**: −5 source lines, −64 test lines and +1 line for lookup reuse. No abstraction or dependency is needed.

**Not checked:** post-refactor equivalence, final package types/boundaries, browser/provider/release acceptance and measured latency; no implementation was performed.
