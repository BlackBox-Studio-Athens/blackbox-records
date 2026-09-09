## Local evidence — 2026-09-09

The main-worktree guard passed. No historical migration was edited; migration `0016_stock_revision.sql` is additive. Prisma and internal OpenAPI/client artifacts were regenerated.

### Lost-sale reproduction and D1 regression

Before changing the use case, the real local D1 test interleaved the paid finalization repository between the operator read and its absolute save. The test adapter performed the existing absolute-save behavior against D1; Prisma's generated WASM could not load in Vitest. The assertion failed with physical and online quantities **2**, expected **1**, from initial quantities one, restock one, and paid decrement one.

After replacement with `D1OperatorStockRepository`, the executable regression lives in `apps/backend/test/persistence/prisma/d1-paid-checkout-finalization-repository.test.ts`. The 15-test file passes in the Cloudflare Workers pool against local D1. It covers concurrent deltas, delta/paid and recount/paid races, stale recounts after paid settlement and equal restock, absent-versus-zero revisions, first-row races, non-negative quantities, physical-only/online-only revision changes, audit cardinality, and injected StockChange/StockCount failure rollback.

`apps/backend/test/scripts/stock-revision-migration.test.ts` separately applies the original ledger schema and the new migration to SQLite with an existing Stock and audit row. Quantities and history survive; revision initializes to zero; invalid quantities and revisions fail. The migration also applied successfully to existing local Wrangler D1.

### Writer and caller audit

- Operator change/count use cases now call one operation-specific transaction through the existing domain repository SPI and persistence root export.
- Live paid finalization advances revision in its guarded D1 batch. The repository-based paid test path delegates to StockRepository.save; Prisma save increments revision on updates.
- Local baseline seed, UAT catalog generator/seed, local mock seed generator, and sandbox smoke top-up advance existing-row revisions. First inserts default to zero. PRD initialization remains insert-only with conflict DO NOTHING.
- The existing ignored local Stripe test seed was updated locally to advance revision; no provider mappings were committed. Old operator-edited SQL copies must also advance revision on quantity updates.
- Catalog cleanup removes stale Stock rows; historical ownership migrations remain unchanged.
- Protected reads serialize revision. Count requests require explicit null or a non-negative integer. Route tests cover malformed/missing tokens, 409 responses, no-store headers, and verified actor attribution.
- Module ownership roots, provided entrypoint paths, and allowed dependencies are unchanged.

### Native browser verification

Native Codex Browser Use exercised the local staff app at `http://127.0.0.1:4322/stock/` against the local Worker on port 8788. These temporary servers were stopped afterward.

1. Read Disintegration mock stock at 99/99 and entered recount 98/97 plus notes.
2. Saved an operator +1 adjustment. Displayed stock became 100/100; the draft remained 98/97 with its notes and original revision.
3. Submitted the stale recount. Worker returned 409; displayed stock stayed 100/100, inputs remained intact, and Save StockCount was disabled until explicit reassessment. Screenshot and accessibility-tree evidence are in the task conversation.
4. Explicitly reassessed, restored mock count to 99/99, and saved. The UI showed StockCount recorded and one matching new history entry attributed to the local operator.
5. Stopped the temporary Worker, entered another 98/97 draft and notes, then submitted. The unconfirmed request retained input, attempted a read refresh, and disabled submission/reassessment when refresh failed. It did not automatically resubmit.

Review also disabled variant selection during submission to prevent a completed mutation from replacing another variant's draft. Failed refresh now retains the last known stock/history; a separate fresh-read state keeps recount submission and reassessment disabled until both reads succeed.

The final native browser recheck on local port 4323 confirmed that stopping the Worker before submission preserved displayed 99/99 stock, history, the entered 98/97 draft, and notes; both Save StockCount and reassessment stayed disabled. The temporary tab and servers were closed after proof.

### Repository gates

- `pnpm test:unit` passed: 1,273 workspace tests and 6 root contract tests. The final run used `VITEST_MAX_WORKERS=1` to avoid local filesystem-test contention. Earlier runs hit unrelated launcher/architecture timeouts; closing the completed browser tab removed its port-4322 reconnect interference. Assertions and timeouts were not changed.
- `pnpm check` passed formatting, lint, generated catalog checks, type checks, and module/commerce boundary checks. Existing deprecation hints remain unrelated.
- `pnpm build` passed for all 348 web routes and both staff routes, including static cache, brand font, image markup, CMS mode, and route-isolation checks.
- `pnpm audit:commerce-boundaries` passed with 303 browser-facing files.
- Local migration application and mock seed/readiness checks passed; all 3 checkout-enabled items were ready.
- Both the correction and revised launch plan strict-validated. Main spec validation passed all 37 capabilities, with existing placeholder-purpose warnings outside this correction.

Initial unfiltered variant search encountered a pre-existing local-data ZodError; scoped Disintegration search and detail worked. This does not constitute UAT acceptance.

### Approved hosted acceptance handoff

Cloudflare Pages project discovery confirmed `blackbox-records-staff` at `staff.blackboxrecordsathens.com`. The accepted `verify-operator-access-jwt` design explicitly defines this as **PRD-only** and says UAT has no staff hostname or portal. Its archived design requires local verification followed by protected PRD proof.

On 2026-09-09 the user approved local proof for this correction and protected PRD proof during `production-go-live-readiness`. Tasks 3.3–3.4 and the launch plan now reflect that sequence. Local acceptance permits correction archival; it does not satisfy the launch plan's protected PRD adjustment/recount/conflict, retained-input, and Access allow/deny gate. No PRD migration, deployment, or stock write was performed.
