# Operator-stock received review

Reviewer: `01a125bd-c48a-79d0-9a01-8ce64b5f6dfa`; turn: `01a125bd-de47-7120-bb3b-6bd440062589`.

Immutable source: `.codex-artifacts/simplification/27-operator-stock-review.result.json`; raw SHA-256: `101c4f5c822f1002dd636790e90bd9953f0871b7fabf716eb68ec62651adf5d4`.

The complete received review follows. Historical review findings and limits remain intact; later implementation evidence is recorded separately in `../implementations/operator-stock.md`.

Completed the read-only review of module 27/29, `operator-stock`, in the existing `main` checkout. All three owned production files were read completely. Six behavior-preserving simplifications are actionable, with an expected combined reduction of **111 production lines**. No repository files, reports, task records, tests, generated files, or graph outputs were written.

**What this module does:** It defines protected operator stock contracts, constructs request-scoped stock services, and translates inventory, stock, history, and mutation results into HTTP responses. Authentication comes from the internal router; stock authority, revision checks, retry identity, and atomic ledger writes remain in the connected application and persistence modules.

**Scope and source identity**

Assigned root: `apps/backend/src/interfaces/http/stock`. It contains three production TypeScript files and `project.json`, totaling 1,426 production lines plus 30 configuration lines. There are no nested module roots, generated files, or test files beneath this root. The module’s test target delegates to `public-commerce-http`.

| Owned file                                                                                                                                                       | Lines | SHA-256                                                            |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----: | ------------------------------------------------------------------ |
| [internal-contracts.ts](C:/Users/SVall/WebstormProjects/blackbox-records/apps/backend/src/interfaces/http/stock/internal-contracts.ts:1)                         |    80 | `30e4c474cca1777750ae02d1425dd2c562f820b098741eec24901013e511b1a7` |
| [internal-stock-services.ts](C:/Users/SVall/WebstormProjects/blackbox-records/apps/backend/src/interfaces/http/stock/internal-stock-services.ts:1)               |    99 | `88f6eaf3be9d25636a7c115cd5197ab382736eb1a11e2d89b9a88d8992a0ebbc` |
| [register-internal-stock-routes.ts](C:/Users/SVall/WebstormProjects/blackbox-records/apps/backend/src/interfaces/http/stock/register-internal-stock-routes.ts:1) | 1,247 | `a3fb60596332bc806b2e3610827f6717b31ac14fe044159a24c8e8f16f39243b` |
| [project.json](C:/Users/SVall/WebstormProjects/blackbox-records/apps/backend/src/interfaces/http/stock/project.json:1)                                           |    30 | `74055403cc9d1383e78f48522c60f9c6dae1fdf4662f47d9ea67ab9253721be9` |

Owned aggregate fingerprint: `1cc7f34bc983e54b067be0d56df4595c66872273489e8a33a2d7ff211ea58a44`.

Fingerprint recipe: sort repo-relative paths lexicographically, use forward slashes, form `path + space + lowercase SHA-256 of raw file bytes` rows, join them with LF without a trailing LF, and SHA-256 the resulting UTF-8 string.

The starting HEAD was `3355c335226838f996efb5536f55271f819a3e14`. During review, `main` advanced to `1dc943972e0c8cd28bc82c3d16bc964909d37963`, a separate frontend commit. Its Store Pre-orders spec change concerns video labels; the relevant backend stock requirements were unchanged. The final audit at **2026-10-10 12:46:32 UTC** found no byte changes in any of the four owned files or 35 selected connected files. The owned working-tree diff was empty. This thread performed no checkout or commit operation.

The connected-file aggregate fingerprint is `b54a21dc2099040e5397fdae80fef1b8213c8da3b4a842e64573c52fb1cf3187`, using the same recipe. It covers the application functions and types, HTTP composition/authentication/response helpers, selected persistence adapters, retained tests, and staff callers listed below. Those 35 hashes matched their 12:37:11 UTC snapshot at the final audit. Existing unrelated working-tree changes remain outside this review; HEAD alone does not identify the reviewed working-tree source.

**Actionable findings**

1. **Pass the classified error directly to `jsonError`.**

   **Source:** [register-internal-stock-routes.ts:605](C:/Users/SVall/WebstormProjects/blackbox-records/apps/backend/src/interfaces/http/stock/register-internal-stock-routes.ts:605), lines 605–609, 667–671, 728–732, 837–841, 924–928, and 1016–1020.

   **What this is:** Six handlers reconstruct `{ code, message, status }` from `routeError` immediately before returning it. The pre-order handler already passes the same object directly at line 788.

   **Proof:** `toInternalStockRouteError`, lines 66–83, returns a plain object containing exactly those three fields. [responses.ts:257](C:/Users/SVall/WebstormProjects/blackbox-records/apps/backend/src/platform/interfaces/http/responses.ts:257) defines that input shape, and `jsonError`, lines 355–367, reads those fields without mutating the input. Its problem body, request ID, content type, status, and no-store header are independent of this extra object copy.

   **Smaller change:** Replace each five-line adapter with `return jsonError(context, routeError);`. Keep error classification, logging, conflict branches, and unknown-error rethrows in their current positions.

   **Behavior to preserve:** The route-specific invalid-request messages, generic missing-variant message, 400/404 statuses, earlier 409 conflict handling, log severity and fields, problem extensions, and cleanup after either return or throw.

   **Focused validation:** Retain the HTTP cases at `internal-stock-routes.test.ts:122–190`, `269–294`, `574–597`, and `656–715`. Exercise both classified outcomes for each changed handler, including history and low-stock notice. The read-only probe compared 16 error inputs and found identical serialized bodies, statuses, and headers.

   **Expected net reduction:** **24 lines.** If skipped, six copies of an already supported input adapter remain.

2. **Reuse the existing history entry serializers and exported history type.**

   **Source:** [register-internal-stock-routes.ts:1159](C:/Users/SVall/WebstormProjects/blackbox-records/apps/backend/src/interfaces/http/stock/register-internal-stock-routes.ts:1159), lines 1159–1247; caller at lines 802–812.

   **What this is:** `toHistoryEntryResponse` repeats the full change/count input union and both serializer bodies. The mutation endpoints already use `toStockChangeEntryResponse` and `toStockCountEntryResponse`.

   **Proof:** Each history branch emits the same fields in the same order as its corresponding existing serializer. The branch’s `entry.type` is the same literal that the existing serializer emits. [read-variant-stock-history.ts:29](C:/Users/SVall/WebstormProjects/blackbox-records/apps/backend/src/application/commerce/stock/read-variant-stock-history.ts:29), lines 29–52, constructs only these two literal forms and owns the sorting and limit. [types.ts:25](C:/Users/SVall/WebstormProjects/blackbox-records/apps/backend/src/application/commerce/stock/types.ts:25), lines 25–45, already defines the identical `VariantStockHistoryEntry` union; `stock/index.ts:19–25` exports it through the permitted module entrypoint.

   **Smaller change:** Import `type VariantStockHistoryEntry` alongside `inventoryQuerySchema`. Keep a short dispatcher accepting that type: return `toStockChangeEntryResponse(entry)` when the type is `change`, otherwise return `toStockCountEntryResponse(entry)`.

   **Behavior to preserve:** Explicit field selection, field order, `recordedAt.toISOString()`, null notes, literal entry types, omitted internal persistence fields, and upstream ordering and limiting. Keep the existing serializers’ bodies unchanged.

   **Focused validation:** Retain `stock-use-cases.test.ts:622–653`, which protects combined history ordering and unchanged ledger counts. Verify a successful mixed history HTTP response, both entry forms, empty history, and timestamp conversion. The read-only probe compared 12 cases, including matching `RangeError` behavior for invalid dates, with zero differences.

   **Expected net reduction:** **43 lines**, including removal of the repeated union. If skipped, history and mutation projections continue to maintain equivalent serializers separately.

3. **Make the existing stock-detail projector produce the complete enriched detail.**

   **Source:** [register-internal-stock-routes.ts:583](C:/Users/SVall/WebstormProjects/blackbox-records/apps/backend/src/interfaces/http/stock/register-internal-stock-routes.ts:583), lines 583–592, 636–645, 697–706, 757–766, and 1029–1062.

   **What this is:** GET stock and all three setting PATCH handlers repeat the same composition: stock detail projection, variant links, revision-bound actions, JSON 200, and no-store wrapping.

   **Proof:** All four call sites use `toStockDetailResponse(detail)`, `variantLinks(variantId)`, and `variantActions(variantId, detail.stock.revision)` in the same order. There are no other callers of the private detail projector. The adjacent `toVariantSummaryResponse`, lines 1064–1066, already combines projection with its links. Shared `addHypermedia` at `responses.ts:431–440` performs the same explicit enrichment for every call.

   **Smaller change:** Give `toStockDetailResponse` a second parameter, `variantId`, and move the existing `addHypermedia` call into it. Each handler can then return `jsonNoStore(context.json(toStockDetailResponse(detail, variantId), 200))`.

   **Behavior to preserve:** Pass the validated route parameter explicitly. Do not derive link identity from `detail.variantId`: the current body and link identities have separate sources. Preserve field order, action order, path encoding, the freshly read revision, the position of success logging, and calendar evaluation during stock-state projection.

   **Focused validation:** Retain `internal-stock-routes.test.ts:63–190`, `192–230`, and `369–414`, plus `preorder-http.worker.test.ts:7–115`. Compare GET and all three PATCH success bodies, action revisions, headers, and encoded link targets. The read-only probe compared 1,152 detail cases, including different body/route identities, and found identical JSON and unchanged calendar-call ordering.

   **Expected net reduction:** **29 lines** after adding the enrichment to the existing helper and removing the four repeated compositions. No additional helper or route factory is needed.

4. **Remove the unused contract-group record layer.**

   **Source:** [internal-contracts.ts:40](C:/Users/SVall/WebstormProjects/blackbox-records/apps/backend/src/interfaces/http/stock/internal-contracts.ts:40), lines 40–80.

   **What this is:** Four private records contain `name` and `paths`, but the only consumer reads `paths` to flatten them. None of the four names is used.

   **Proof:** Full source, graph relationships, and connected reference checks identify only the flattening expression as a consumer of `internalContractModules`. The exported `internalContractPaths` is consumed by [api-documents.worker.test.ts:54](C:/Users/SVall/WebstormProjects/blackbox-records/apps/backend/src/interfaces/http/openapi/api-documents.worker.test.ts:54), lines 54–89. That test checks the complete ordered path list against the actual registered document. HTTP registration uses the route declarations, through `register-internal-routes.ts:12–35`, rather than these private names.

   **Smaller change:** Keep the four readonly path arrays in their existing order, remove their record wrappers and unused name fields, and export `internalContractModules.flat()`.

   **Behavior to preserve:** All **20** paths and their order; the existing discovery route path references; the mutable exported array and its inferred element type; route declarations and OpenAPI schema names.

   **Focused validation:** Retain the internal OpenAPI document test, especially line 59’s complete ordered equality and lines 75–77’s pre-order position assertion. The read-only probe produced identical 20-path arrays. A separate two-snippet TypeScript probe returned zero diagnostics, an identical exported type, and a mutable array in both versions. That probe did not compile project imports.

   **Expected net reduction:** **12 lines.** If skipped, private labels and record wrappers remain solely to feed one flattening expression.

5. **Use ordinary properties for the two optional JSON quantities.**

   **Source:** [register-internal-stock-routes.ts:1050](C:/Users/SVall/WebstormProjects/blackbox-records/apps/backend/src/interfaces/http/stock/register-internal-stock-routes.ts:1050), lines 1050–1053.

   **What this is:** The projector creates and spreads temporary objects to omit `availableOnlineQuantity` and `heldQuantity` when they are undefined.

   **Proof:** Every result of this private projector reaches `context.json`, directly or through `addHypermedia`; neither consumer inspects property presence. Installed Hono 4.13.9 serializes through `JSON.stringify` at `apps/backend/node_modules/hono/dist/cjs/context.js:397–402`, matching the documented [Context implementation](https://github.com/honojs/hono/blob/v4.13.0/src/context.ts). Undefined object values are therefore omitted from the wire response in either form. The service already supplies numeric defaults at `internal-stock-services.ts:55–60`, while the retained HTTP fixtures also exercise omitted quantities.

   **Smaller change:** Use `availableOnlineQuantity: detail.availableOnlineQuantity` and `heldQuantity: detail.heldQuantity` in the same positions. Leave the input fields and response schema optional.

   **Behavior to preserve:** Zero values must remain present; undefined values must remain absent from JSON. Do not add defaults in this projector or change the display-name condition. This is an internal serialization reduction, not removal of input validation.

   **Focused validation:** Compare JSON for both fields absent, independently absent, zero, and positive values, using the retained zero/held assertions at `internal-stock-routes.test.ts:69–98`. These combinations were included in the 1,152-case detail probe, with zero differences.

   **Expected net reduction:** **2 lines**, plus removal of conditional temporary-object construction. No latency improvement was measured.

6. **Delete the service’s discarded `itemType` return field.**

   **Source:** [internal-stock-services.ts:62](C:/Users/SVall/WebstormProjects/blackbox-records/apps/backend/src/interfaces/http/stock/internal-stock-services.ts:62).

   **What this is:** `readVariantStock` adds `itemType` to its internal result, but every HTTP caller immediately passes that result through an explicit projector that discards it.

   **Proof:** The only production consumer of `createInternalStockServices` is the owned route file. Its four detail consumers are at lines 575–588, 634–641, 695–702, and 755–762. The projector at lines 1029–1062 neither accepts nor emits `itemType`. The factory is private to the closed module’s implementation; `project.json` exports only the contracts and route-registration files. The catalog repository returns a plain data record, so reading this discarded property has no additional persistence effect.

   **Smaller change:** Remove only `itemType: record?.itemType ?? null,` from the service’s detail result.

   **Behavior to preserve:** Keep the catalog lookup and validated display-name projection. Keep inventory/search item types, filters, schemas, and responses. Stock detail currently omits `itemType`; adding it would change behavior and is outside this simplification.

   **Focused validation:** Compare the complete stock-detail JSON for catalog records with null, CD, and clothing item types. The detail probe confirmed that adding or removing this internal input field cannot change the explicit HTTP projection. Retain inventory and staff client coverage independently.

   **Expected net reduction:** **1 line.** This removes a dead internal result member; it does not remove a database query.

**Reduction and proof summary**

| Finding                                     | Expected production reduction |
| ------------------------------------------- | ----------------------------: |
| 1. Duplicate error adapters                 |                      24 lines |
| 2. History serializers and duplicated union |                      43 lines |
| 3. Repeated complete detail projection      |                      29 lines |
| 4. Unused contract-group record layer       |                      12 lines |
| 5. Optional quantity spreads                |                       2 lines |
| 6. Discarded service field                  |                        1 line |
| **Combined**                                |                 **111 lines** |

These counts came from a candidate constructed and formatted entirely in memory using the existing Prettier configuration. The original route source already matched that formatting, so the reduction does not include unrelated formatting changes. Nothing was applied to disk.

Selected current functions were transpiled and evaluated in memory. The probes found zero differences across 1,152 detail cases, 12 history cases, 16 error cases, and the ordered 20-path contract list. Calendar functions used fixed stubs for the detail comparison; their real behavior was inspected through retained source and tests. These probes establish bounded equivalence evidence and are not HTTP, Worker, D1, or project-test acceptance.

**Inspected files and flows**

The review read the required AGENTS/imported preferences/map, software, Windows, graph and Codex instructions; both saved Ponytail skills; Cloudflare and Workers guidance; the agent workflow/reference; commerce operations; relevant stock/operator, pre-order, reservation, hypermedia, boundary, language, and simplification requirements; and the module configuration.

Both graph tools were used before substantive source investigation. The initial Graphify query used budget 2500 and was truncated. Targeted explains and complete bounded incident-edge reads then resolved the route entrypoint, service factory, and contract file: 25, 29, and 12 incident edges respectively. CodeGraph supplied current source and relationships; omitted imports, barrel exports, function spans, and test DSL bodies were filled with exact reads. No graph was initialized, enriched, or rebuilt by this thread. Graph metadata changed externally during review and ended bound to the final HEAD.

Connected production inspection covered:

- `apps/backend/src/interfaces/http/`: `app.ts`, `routes/register-internal-routes.ts`, `openapi/api-documents.ts`, and the operator authentication middleware and identity verifier. Authentication precedes service construction; hosted attribution comes from verified JWT claims; the Local bypass remains loopback-only.
- `apps/backend/src/application/commerce/stock/`: `index.ts`, `types.ts`, `errors.ts`, `inventory.ts`, search, stock/history reads, change/count commands, and all three setting commands. This covers validation, default stock state, ordering, revision semantics, request identity, and safe domain errors.
- `apps/backend/src/infrastructure/persistence/`: Prisma client scoping, store-item mapping/search/inventory, stock mapping, change/count history reads, relevant D1 operator mutation/replay statements, checkout-hold availability, and alert counts. This covers atomic stock/audit writes, actor/environment-scoped replay, revision conflicts, holds, and pre-order notice transactions.
- Shared HTTP response helpers and environment bindings, including error construction, no-store headers, path encoding, link/action enrichment, and idempotency enforcement.
- `apps/staff/src/lib/backend/internal-stock-api.ts` and the connected stock workspace read/mutation flows in `StockOperationsApp.tsx`. The client retains no-store reads, safe error handling, retry keys, refresh after mutations, and recount reassessment.

Nine connected test files were read completely, totaling 2,277 lines:

- `apps/backend/src/interfaces/http/internal-stock-routes.test.ts` — 716 lines.
- `apps/backend/src/interfaces/http/openapi/api-documents.worker.test.ts` — 91 lines.
- `apps/backend/src/interfaces/http/app.worker.test.ts` — 257 lines.
- `apps/backend/src/interfaces/http/operator-access-middleware.worker.test.ts` — 116 lines.
- `apps/backend/src/interfaces/http/internal-stock-ui-boundary.worker.test.ts` — 23 lines.
- `apps/backend/src/application/commerce/stock/stock-use-cases.test.ts` — 660 lines.
- `apps/backend/test/integration/stock/preorder-http.worker.test.ts` — 115 lines.
- `apps/backend/test/integration/stock/inventory.worker.test.ts` — 87 lines.
- `apps/staff/src/lib/backend/internal-stock-api.test.ts` — 212 lines.

No test deletion is proposed. The retained suites protect distinct authentication, HTTP, application, D1, pagination, calendar, schema-ordering, and client behavior.

**Rejected risky ideas**

- **Remove application validation because HTTP schemas already validate.** These are separate boundaries. In particular, pre-order schema regexes check shape while application parsing checks real calendar values and Athens-relative eligibility. Revision validation also protects direct application callers.
- **Simplify recount revisions with truthiness or defaults.** Explicit null means absent stock; zero is a valid existing revision. Omitted, malformed, and mismatched values have different outcomes, protected by `internal-stock-routes.test.ts:252–294` and the guarded D1 mutation.
- **Remove retry-key enforcement or merge it into a generic journal.** Changes/counts have specific actor, operation, environment, and fingerprint semantics. Replay must recognize a committed recount before rejecting its old revision. Keyless compatibility behavior also remains distinct.
- **Return the PATCH mutation result instead of rereading detail.** The fresh read supplies checkout-held availability, waiting-alert count, display name, current state, and current revision actions. Pre-order persistence also queues or deletes estimate notices atomically. Preserve mutation, fresh read, logging, response, and cleanup order.
- **Replace explicit serializers with object spreads.** That could expose currently omitted catalog, stock, ledger, or retry metadata and alter field order and timestamp conversion. Findings 2 and 3 reuse the existing explicit field selection.
- **Remove `await`/`finally` cleanup, cache services globally, or lazily generalize construction.** Regular requests and explicitly scoped shared Prisma clients have different cleanup behavior. Preserve cleanup on success and failure, including existing exception precedence. Current [Workers guidance](https://developers.cloudflare.com/workers/best-practices/workers-best-practices/) also supports retaining awaited work and request-scoped state.
- **Introduce a generic PATCH-handler factory or normalize all error/log branches.** The operations retain distinct trace names, messages, conflict handling, log fields, and readback behavior. Reusing the existing projection is sufficient without a new handler abstraction.
- **Remove public contracts, schema names, optional response fields, or allowed dependencies based on current caller counts.** These remain declared interfaces. The findings change private implementation structure and preserve the exported API and generated contract inputs.

**Implementation validation and remaining gaps**

The fresh implementation thread should first match the owned hashes and recheck changed dependencies. It should run the guarded OpenSpec preflight before edits, independently verify each selected finding, and use the repository’s scoped test wrapper.

Focused validation should include `pnpm test operator-stock`, which delegates to `public-commerce-http`; `pnpm test stock` for application behavior; and `pnpm test stock-integration` for existing D1 inventory/pre-order checks. Relevant staff API assertions should remain intact if consumer validation is selected. The parent verification owner retains shared `pnpm validate`, graph refresh, and any Local mock acceptance while implementers are idle.

The retained HTTP suite does not directly cover successful mixed history serialization, successful count response serialization, or the low-stock-notice PATCH handler. Its service mock does not provide `setShowLowStock`. Explicitly verify those paths when implementing findings 1–3; do not treat the existing suite alone as coverage of them. Any connected-test edits must respect their owning module and parent assignment.

No project tests, lint/type targets, shared validation, browser checks, Local stack scenarios, D1 operations, or hosted application/provider operations were executed in this read-only assignment. The isolated path-type probe checked two virtual snippets and standard-library declarations only. Latest Workers types were not downloaded; relevant installed types were inspected at version `5.20260926.1`. No runtime performance gain is claimed.

**Verdict:** Review complete. Findings 1–6 are ready for independent implementation in the fresh assigned thread. **Lean: 111 production lines possible; zero test deletions proposed.**
