# Catalog-sync received review

Reviewer thread: `01a12555-0b5b-7263-8602-d5f1335f7857`.
Review source: human assignment; retained launch input at `.codex-artifacts/simplification/parallel-high-19-catalog-sync-implement.actions.json`. Original reviewer output: `.codex-artifacts/simplification/19-catalog-sync-review.result.json`.
Review source identity: `main`, HEAD `3355c335226838f996efb5536f55271f819a3e14`, owned manifest `415f3c2ea0933cdd8fdb22086a871877cd322ab2725ccef1bea9946f3658b88a`, recorded `2026-10-10T13:38:32+03:00`.

What this change does: `catalog-sync` reconciles Stripe Product defaults into commerce mappings and offer snapshots. It also runs resumable item setup, initial pricing, price changes, and item publication while preserving stock, editorial privacy, and provider identity.

This is the completed read-only review for module **19/29: catalog-sync**, assigned to `openspec/changes/simplify-main-site-modules`. Five concrete simplifications are suitable for a fresh implementation thread to verify. No files, task records, graphs, services, or repository reports were changed. Every existing test case should remain.

The checkout is `C:/Users/SVall/WebstormProjects/blackbox-records`, on `main`. The owned root is `apps/backend/src/application/commerce/catalog-sync`. Its closed public entrypoint is `index.ts`; its declared module dependency is `commerce-domain`, with the public `@blackbox/content-model` workspace interface also allowed. The proposals below require no interface, ownership, dependency, or configuration changes.

**Should fix**

1. **Delete the unreachable candidate-price diagnostic machinery.** [catalog-reconciler.ts:113](C:/Users/SVall/WebstormProjects/blackbox-records/apps/backend/src/application/commerce/catalog-sync/catalog-reconciler.ts:113), lines 107–119, 135–181, 497–529, and 736–742.

   - **What this is:** Reconciliation creates a candidate array containing either the bound Product’s default Price or nothing. The missing-price error passes that array to a formatter that can describe ten Prices, custom amounts, identity signals, and omitted candidates.
   - **Problem and proof:** `resolvedPrice` starts as `defaultPrice` at line 144. Its only later assignment is the bootstrap result at line 163, in a branch requiring it to be absent. Therefore, whenever the formatter is reached under `!resolvedPrice` at line 170, `defaultPrice` was absent and `candidates` is empty. Only the formatter’s `Stripe returned 0 candidate Prices.` branch is reachable. `describeCustomUnitAmount` has one caller, inside the unreachable formatter branch. The candidate array’s other use is a `.some()` check over at most one default Price.
   - **Smaller change:** Put the exact existing empty-candidate sentence directly in the missing-price detail. Delete `describePriceCandidates` and `describeCustomUnitAmount`. Replace the candidate-array conflict check with a guarded check of `defaultPrice`, then delete the array.
   - **Behavior to preserve:** Keep the complete error text, punctuation, issue order, issue count, bootstrap actions, provider calls, and dry-run behavior. Keep the existing identity-conflict predicate. `scripts/stripe-catalog-verify.ts:352–359` exposes issue details in operator reports, so wording is observable.
   - **Focused validation:** Run `pnpm test catalog-sync`. Strengthen the existing missing-default test at `catalog-reconciler.test.ts:517–524` with the exact diagnostic text. Cover the dry-run bootstrap case too: it must still report the planned creation and a missing Price without performing writes. Run `pnpm test apps/backend/test/scripts/stripe-catalog-verify.test.ts` for report compatibility.
   - **Expected net reduction:** About **48 lines**, before small regression assertions.
   - **If skipped:** The module continues maintaining a substantial formatter whose detailed branch cannot execute.

2. **Prune obsolete implementations from the private Stripe test fake while retaining its negative-call checks.** [catalog-reconciler.test.ts:109](C:/Users/SVall/WebstormProjects/blackbox-records/apps/backend/src/application/commerce/catalog-sync/catalog-reconciler.test.ts:109), lines 114–165, 240–274, and 355–363.

   - **What this is:** The unit-test fake still implements the old account scans, Price identity mutations, Product inventory, and archival behavior.
   - **Problem and proof:** The current `StripeCatalogGateway` contract in `types.ts:150–162` contains default-price retrieval, Price creation/retrieval, and Product projection updates. The fake’s `archivePrice`, `products`, and `listOwnedProducts` have no active test caller. Its `updatePriceLookupKey` and `updatePriceMetadata` are used only by the “not called” assertions at lines 481–482. Its three Price scan methods are used only by the spies and negative assertions at lines 487–496. Their result-producing implementations never run. The fake’s `hasMetadata` and `hasCatalogMetadataHint` helpers exist solely to support those obsolete implementations.
   - **Smaller change:** Delete the unused archival implementation, Product map, and Product-list method. Replace the two identity mutation methods and three scan methods with `vi.fn()` sentinels, preserving their names and all existing assertions. Delete the resulting unused helpers and type import. Retain the active gateway implementations, Price/default maps, and every test case.
   - **Behavior to preserve:** The tests must still fail if reconciliation starts scanning account Prices or modifying Price identity. Keep the older-active-Price assertion and the foreign-object scenario. The real bound-default retrieval remains supported by `stripe-catalog-gateway.ts:395–410`.
   - **Focused validation:** Run `pnpm test catalog-sync`. Review that the negative spies and assertions at lines 481–496 remain intact and that no test title or scenario disappears.
   - **Expected net reduction:** Approximately **95–105 lines**.
   - **If skipped:** The test fixture continues maintaining provider operations that its retained scenarios never execute.

**Nice to have**

3. **Use the existing mutation-context builder directly and remove the unused private repair suffix.** [catalog-reconciler.ts:154](C:/Users/SVall/WebstormProjects/blackbox-records/apps/backend/src/application/commerce/catalog-sync/catalog-reconciler.ts:154), lines 154–161, 244–254, 665–681, and 720–734.

   - **What this is:** A private positional-argument wrapper forwards values unchanged to `createStripeCatalogMutationContext`. A separate private creation-identity helper accepts an optional repair identity.
   - **Problem and proof:** The wrapper has exactly two callers. Both supply their identity explicitly; neither uses its default. Its body only constructs the object expected by the already imported builder. The creation-identity helper has one caller, at line 158, which explicitly passes `null` for `repairIdentity`. Its suffix branch cannot run. Other module flows already call the underlying builder directly, including `setup-catalog-item.ts:126`, `change-catalog-price.ts:108`, and `initialize-catalog-price.ts:180`.
   - **Smaller change:** Call `createStripeCatalogMutationContext` directly at the two sites, forwarding the same fields. Delete the positional wrapper. Remove the private `repairIdentity` parameter and return the current base identity directly. Preserve both revision-based and fingerprint-based base identities.
   - **Behavior to preserve:** Generated idempotency keys and fingerprints must remain identical, including optional creation scope, projection shape, currency normalization, and child-key behavior. Keep the exported builder’s general `identity` support and the test that supplies a repair identity directly to it; that is a separate supported contract.
   - **Focused validation:** Run `pnpm test catalog-sync`, retaining the deterministic-key checks at `catalog-reconciler.test.ts:382–443` and UAT/PRD bootstrap checks at lines 563–574. Run the catalog report tests, including the mutation evidence assertions at `apps/backend/test/scripts/stripe-catalog-verify.test.ts:493–502`.
   - **Expected net reduction:** About **20–22 lines**.
   - **If skipped:** Readers continue tracing a forwarding layer and an option that this private helper never receives.

4. **Inline the one-use synchronous per-item delegate into the existing sequential verifier.** [catalog-reconciler.ts:330](C:/Users/SVall/WebstormProjects/blackbox-records/apps/backend/src/application/commerce/catalog-sync/catalog-reconciler.ts:330), lines 312–365.

   - **What this is:** `verifyBuyableCatalog` awaits a sequential loop. The loop calls another private method solely to look up expected inputs and forward four options to `reconcileVariant`.
   - **Problem and proof:** `verifyCatalogStoreItem` has one caller at line 342. It performs no independent policy, error handling, asynchronous work, or reusable operation. It repeats the verifier’s input shape and adds an extra navigation step for each item’s options. Its observable result comes entirely from `reconcileVariant`.
   - **Smaller change:** Move the existing expected-price lookup and `reconcileVariant` call into the loop. Delete `verifyCatalogStoreItem`. Retain `verifyCatalogSequentially` and the outer await rather than changing the asynchronous structure more broadly.
   - **Behavior to preserve:** Keep `search(null, 500)`, repository order, one awaited item at a time, stopping on the first rejection, the exact forwarded options, and current handling of an omitted `now`. Preserve the lookup’s evaluation order. Do not parallelize the loop or compute one new shared timestamp.
   - **Caller evidence:** `scripts/stripe-catalog-verify.ts:178–182` and 255–258 consume ordered verification results. `apps/backend/scripts/backfill-runtime-catalog.ts:246–257` consumes those results in reconciliation output and its reviewed plan fingerprint. The unit test at `catalog-reconciler.test.ts:576–580` checks coverage of multiple listed items.
   - **Focused validation:** Run `pnpm test catalog-sync` and the focused catalog verification script tests. Check ordered results and forwarded expected inputs; a deferred-promise scenario is appropriate if existing coverage does not demonstrate that the next item waits for the previous one.
   - **Expected net reduction:** Approximately **8–12 lines**, depending on formatting.
   - **If skipped:** The per-item forwarding method and third copy of the input shape remain.

5. **Define desired pricing as the existing expected-price union with a required revision.** [types.ts:65](C:/Users/SVall/WebstormProjects/blackbox-records/apps/backend/src/application/commerce/catalog-sync/types.ts:65), lines 65–95.

   - **What this is:** `StripeCatalogExpectedPrice` and `DesiredPrice` repeat the same fixed/custom pricing union. Their only difference is optional versus required `revision`.
   - **Problem and proof:** Currency, both `kind` values, the fixed amount, and all three custom bounds are identical. Repeating those arms creates two definitions that must remain synchronized. `scripts/stripe-catalog-contract.ts:441–449` constructs a desired price by spreading an expected price and supplying its revision; `scripts/stripe-catalog-verify.ts:470–479` subsequently consumes desired prices as expected prices.
   - **Smaller change:** Keep the exported name and use `export type DesiredPrice = StripeCatalogExpectedPrice & { revision: string };`.
   - **Behavior to preserve:** `revision` remains required for desired prices. Both discriminated union arms and their fields remain intact. Keep all exports, serialization, runtime validation, and consumers unchanged.
   - **Focused validation:** The implementation’s normal `pnpm validate` must pass affected type checks. Run the focused catalog-contract/verification tests selected by the change. No new runtime test is needed for this type-only deduplication.
   - **Expected net reduction:** **14 lines**.
   - **If skipped:** Future pricing-shape changes continue requiring duplicate edits.

**Rejected risky ideas**

- Keep operation claims, lease checks, phase-specific writes, retained-result validation, and journal rereads. The setup, price-change, initialization, and publication tests demonstrate different acknowledgement-loss, concurrency, rollback, and replay cases. Similar-looking checks protect different boundaries.
- Keep the distinct projection schemas and command validation. Persisted records, approved publication presentation, browser commands, and initial setup have different acceptance rules. Sharing them would alter accepted data or errors.
- Keep amount, EUR, tax, identity, active-state, and image validation. In particular, the approved Local media exception is tested separately from UAT/PRD URL policy.
- Keep the identity match and partial-conflict distinction. A mixture of matching and conflicting signals produces different diagnostics from wholly missing or foreign identity. An isolated 27-state comparison confirmed one possible consolidation’s Boolean equivalence, but it adds repeated matching work; I am not recommending that rewrite. Preserve existing diagnostic order and multiplicity.
- Keep `normalizeExpectedPrice` for this pass. Removing it changes the current runtime fallback for a missing `kind`; typed callers alone do not establish that deleting compatibility behavior is authorized.
- Keep exported action variants, issue codes, ownership data, and promotion types. Limited use inside this module is insufficient proof that a public contract can be deleted.
- Do not change checkout’s apply flag, provider call order, publication status handling, or stock initialization. These would be behavior changes. Existing spec wording also disagrees about public reconciliation writes: `commerce-checkout/spec.md:746–759` describes read-only reconciliation, while current `start-checkout.ts:212–216` uses `apply: true` and the Stripe catalog spec requires authoritative reads to refresh snapshots. This review follows current source behavior and does not resolve that product-contract discrepancy.
- No test deletion is proposed. Field-ownership checks and the integration failure scenarios have distinct regression value. No formatter cache, new abstraction, dependency, or performance claim is proposed.

**Inspection coverage and method**

Every owned file was read completely. The 12 source files are `catalog-identifiers.ts`, `catalog-product-projections.ts`, `catalog-reconciler.ts`, `change-catalog-price.ts`, `field-ownership.ts`, `index.ts`, `initialize-catalog-price.ts`, `money.ts`, `publish-catalog-item.ts`, `runtime-catalog-product-projections.ts`, `setup-catalog-item.ts`, and `types.ts`. Both owned tests were read completely: `catalog-reconciler.test.ts` (582 lines) and `field-ownership.test.ts` (52 lines). `project.json` was inspected. No nested module roots or generated files are present in the owned inventory.

All seven related tests under `apps/backend/test/integration/catalog-sync` were also read completely: `catalog-operation.worker.test.ts`, `change-catalog-price.worker.test.ts`, `internal-setup-routes.worker.test.ts`, `opening-stock.worker.test.ts`, `runtime-catalog-reader.worker.test.ts`, `setup-catalog.worker.test.ts`, and `setup-command.worker.test.ts`. This directory is the separate `catalog-sync-integration` project; no edit there is required by these findings.

Connected evidence included complete reads of `apps/backend/src/interfaces/http/routes/initialize-catalog-price.worker.test.ts`, `apps/backend/test/integration/cms/publish-item.worker.test.ts`, and `apps/backend/src/interfaces/http/routes/cms-item-source-gateway.worker.test.ts`. Relevant caller and callee sections were traced through protected setup/price/publication routes, their CMS adapters, public commerce composition, `read-store-offer.ts`, `start-checkout.ts`, Stripe webhook composition/acknowledgement, the Stripe catalog gateway, repository contracts, catalog contract generation, catalog verification/reporting, and runtime backfill. Staff and CMS implementation changes remain outside scope.

The reviewed flows were bound-default resolution; legacy mapping backfill; fixed/custom price validation; dry-run and apply planning; ordered mapping/projection/snapshot writes; resumable source → catalog → Product → Price → stock setup; retained initial pricing; replacement pricing; approved presentation → content publication → Live completion; and runtime presentation privacy/URL checks. The assumed load is one selected item per commerce command/read, plus an explicitly bounded sequential catalog verification of up to 500 items. No production performance was measured.

Required personal and repository instructions, the saved Ponytail review/coding guides, and the applicable Graphify, Cloudflare, Worker, and Stripe guidance were read. Graphify queries used budget 2500. Broad results truncated; targeted explanations and complete paths established setup-route → setup, publication-route → publication, and offer-reader → reconciler connections. CodeGraph supplied exact symbol/caller evidence, with omitted source sections filled by bounded current-file reads. Neither graph was initialized, enriched, or manually refreshed.

Official retrieval confirmed that Product retrieval returns the selected Product object and that Stripe idempotency keys have bounded length and retention. These support retaining the provider identity and retry machinery. [Stripe Product retrieval](https://docs.stripe.com/api/products/retrieve), [Stripe idempotent requests](https://docs.stripe.com/api/idempotent_requests). Awaited write sequencing was assessed against [Cloudflare Worker promise guidance](https://developers.cloudflare.com/workers/best-practices/workers-best-practices/#always-await-or-waituntil-your-promises).

**Source fingerprint and handoff limits**

- Recorded at `2026-10-10T13:38:32+03:00`.
- HEAD remained `3355c335226838f996efb5536f55271f819a3e14`; branch remained `main`.
- All 15 owned files matched their initial SHA-256 values. Final scoped Git status was clean for both reviewed roots.
- Owned-root manifest SHA-256: `415f3c2ea0933cdd8fdb22086a871877cd322ab2725ccef1bea9946f3658b88a`.
- Related integration-root manifest SHA-256, eight files including its project metadata: `d8514d158039b634b6df864b7ac3ed31b2534ee34ef4feddf68c72e127e1c688`.

Each manifest hashes UTF-8 text containing the PowerShell `Sort-Object` file order, normalized `/` paths, one TAB, the lowercase raw-file SHA-256, and one LF per entry, including the final LF.

The files proposed for change have these raw-file SHA-256 values:

| File under the owned root    | SHA-256                                                            |
| ---------------------------- | ------------------------------------------------------------------ |
| `catalog-reconciler.ts`      | `331d6211fec42f5ebd26d7e6d6e3bcf355012b2f060515b40136117252cf3b7b` |
| `catalog-reconciler.test.ts` | `10f51759eca4914aa18306c71f0898c4c8950881ce884e1f357b12b904e3c24d` |
| `types.ts`                   | `9f0517162c395a0355194731f595838ccd143631f95eb3cadd5eeea3aa421399` |

Repository tests, shared validation, browser acceptance, provider smoke, and hosted operations were not run, as required for this concurrent read-only assignment. The only executable equivalence check was the isolated in-memory identity-state comparison described above; it is not repository test evidence. The Stripe CLI documentation lookup returned HTTP 401; public official documentation supplied the fallback. No credentials or provider account state were inspected.

The fresh implementer should verify the findings against the current files, run `pnpm openspec:guard` before edits, and use focused module/file tests. The parent’s verification workflow owns shared `pnpm validate` and graph refreshes. No browser or release acceptance can be inferred from this review.

Verdict: review completed; findings 1–5 are ready for independent implementation verification. Lean: approximately **180–200 lines** can be removed before small regression additions, with **zero existing test cases deleted**.
