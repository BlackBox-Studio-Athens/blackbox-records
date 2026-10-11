# Storefront catalog implementation handoff

**Outcome:** Findings 1–7 implemented. Assigned implementation and focused checks are complete; **module acceptance remains pending**. Shared tasks were not changed.

## Role and authority

- Module 9/29: `storefront-catalog`; existing `main` checkout at `C:/Users/SVall/WebstormProjects/blackbox-records`.
- Same fresh implementer: `01a12666-5b83-7800-a28a-0640366791cd`; execution turn `01a126c3-8870-7f82-a71a-2bbd99478cf2`.
- Separate reviewer: `01a12571-e0ac-78b2-a414-70b3e9ae7dc2`; review turn `01a12571-fb3e-7410-898d-638f5628304a`.
- Completed preparation turn: `01a12666-6c95-7f11-b47c-8c81939df862`.
- The explicit execution release defers preceding acceptance, without completing any shared task. Current guarded apply context is `ready`, 10/60 accepted tasks. Proposal, design and tasks were read; the verifier owns all markers and final gates.
- Edits stay in owned `apps/web/src/lib` source/tests. Nested Nx modules, application roots, generated sources, configuration, content and unrelated work were preserved.

The [complete received review](../reviews/storefront-catalog.md) includes its original reviewer/source identity. Immutable raw review SHA-256: `172fc65792eafa48fdf8d221944cf99c1315d5db871f39a49bc19ef7b9384fa9`. Immutable preparation SHA-256: `b64ca609e065168e87b738bc5390cdffac57f7d223f2c61b71115a2b9c2ab673`. Both receipts matched before edits and at closeout; the canonical review contains the complete original report.

## Coverage and finding decisions

Before implementation, all 367 owned paths and the 15 recorded caller/test inputs matched preparation. The reviewer’s 364 unchanged owned files therefore retain completed inspection coverage; the already-inspected logo export, global CSS and touch-test deltas were unchanged. All candidate sources/tests matched the reviewer. Retained Graphify budget-2500 relationships, CodeGraph source/callers, exact source proofs and domain instructions were reused without rebuilding graphs or rescanning unchanged code.

| ID  | Decision and concrete proof                                                                                                                                                                                                                                                                                                             | Retained behavior/coverage                                                                                                                                                                                                                                  |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Accepted. Runtime tax mapping constants/functions/types had only their own test consumer. The sole production import is type-only, and the file is not a declared public entrypoint. Kept `StoreItemTaxCategory = 'physical_goods'`; removed unused implementation and its three-test file.                                             | Release/Distro/combined projection tax fields remain covered. The operational script’s separate physical-goods tax constant and backend tax-contract assertions remain intact. No browser bundle saving is claimed.                                         |
| 2   | Accepted. Removed two catalog tests whose exact Release fixtures, canonical slugs, paths and legacy rejection remain asserted at the retained cases; removed the primary-price test covered by full list-record equality and primary/list equality. The retained Caregivers case already asserts `sourceId`, so no assertion was added. | Canonical identity, legacy rejection, native paths, placeholder shape, primary/list agreement, structured-price exclusion, collision/reserved errors, artwork and provider identity coverage remain.                                                        |
| 3   | Accepted. Distinct validated slugs necessarily generate distinct `variant_${storeItemSlug}_standard` IDs, so the second uniqueness pass cannot produce a reachable additional failure. Specialized the private helper to slugs and changed source membership from Map to Set because stored candidate values were never read.           | Exact reachable error wording/order, empty input, duplicate sources, physical conflicts, invalid/reserved slugs and generated variants remain. Cross-source conflict traversal was not changed.                                                             |
| 4   | Accepted. Constructor input already comes from the validated unique projection; every classifier result is nonempty or throws. Removed only its extra invariant call.                                                                                                                                                                   | Missing sources/facets, current membership, preview-image choice, availability and ordering remain. Public selector and artist-sorter checks, copying and duplicate regressions remain.                                                                     |
| 5   | Accepted. Both private sort helpers receive fresh local buckets, never the caller’s input array. Removed both copies and kept comparators/public functions unchanged.                                                                                                                                                                   | Input order, element identity, UTC-day and stage classification, undated handling, title/date ties, fallback and remainder order remain protected by source ownership and existing release tests.                                                           |
| 6   | Accepted. Each private alias array contained exactly its group name. Removed seven arrays and the nested membership callback in favor of direct equality.                                                                                                                                                                               | Seven exact formats/order, separate small-vinyl groups, intro keys, authored order/title ties, item identity, empty-group omission, counts and heading IDs remain covered.                                                                                  |
| 7   | Accepted. The first sort already establishes name order. Stable activity-only sorting preserves that order and equal-name ties within activity groups while retaining the original async structure/defaults.                                                                                                                            | Active-first order, missing activity, homogeneous groups, empty input, source preservation, Home first-three selection and Artists presentation order remain. Historical comparator evidence is supporting equivalence evidence, not a new test-suite pass. |

No entire finding was rejected or deferred across ownership roots. All reviewer exclusions remain: public availability exports, trust-boundary validation, publication/cache/retry protections, form lifecycle, search callbacks, editorial/media validation and meaningful CSS regressions. Current source/spec presentation differences were not treated as permission for unrelated fixes. Stable sorting is specified by the [ECMAScript sorting contract](https://tc39.es/ecma262/multipage/indexed-collections.html#sec-sortindexedproperties).

## Changed files and reductions

Paths below are relative to `apps/web/src/lib/`. Counts exclude audit Markdown and formatting-only changes.

| Path                         | Production lines removed | Test lines removed | File action                                  |
| ---------------------------- | -----------------------: | -----------------: | -------------------------------------------- |
| `store-tax-category.ts`      |                       20 |                  0 | Modified; retained type                      |
| `store-item-ownership.ts`    |                        4 |                  0 | Modified                                     |
| `store-collection.ts`        |                        2 |                  0 | Modified                                     |
| `release-feature.ts`         |                        0 |                  0 | Modified; removed two copy expressions       |
| `distro-data.ts`             |                        0 |                  0 | Modified; removed arrays/callback            |
| `catalog-data.ts`            |                        2 |                  0 | Modified                                     |
| `catalog-data.test.ts`       |                        0 |                 26 | Modified; two repeated cases removed         |
| `item-availability.test.ts`  |                        0 |                  8 | Modified; one repeated case removed          |
| `store-tax-category.test.ts` |                        0 |                 30 | Deleted; three dead-helper cases             |
| **Total**                    |                   **28** |             **64** | **0 production files / 1 test file deleted** |

Net substantive reduction: **92 lines**. Physical source/test diff removes 30 production and 65 test lines; excluded formatter-only compaction is two Distro-chain lines and one blank catalog-test line. No tests, dependencies or abstractions were added. Redundant passes, membership arrays, copies and comparisons were removed; no measured route-speed improvement is claimed.

## Source and caller identity

HEAD before and after: `f7b019ca043e5f082c5b7aca67c4f0dbb3685ed0`.

| Covered inputs                       | Before                                                                         | After                                                                          |
| ------------------------------------ | ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------ |
| Owned source/test + project metadata | `88c18bbfed3b26e4d8767c5e0bce293207b7b0a2d9ec5a8fb69413ecb8c0555d` (73 files)  | `90cf699aad1534ad0a133c947f277e375872032e71ee47ffcf453ca64c36e3bf` (72 files)  |
| All owned paths                      | `5a921607c0c9d7b6a1a57118fdacede071910ac53c78a3d938448bd279aff7a5` (367 files) | `de08ef3cfcd51a3010a35a0138e2d75ff900af5998166a63ac45a50169353b92` (366 files) |
| 15 caller/test inputs                | `3a8493dfe1afeec097d6a073eee001aecbcb0d0a1ffbb8bb3c3ec7cfa884704b`             | `3a8493dfe1afeec097d6a073eee001aecbcb0d0a1ffbb8bb3c3ec7cfa884704b`             |

These execution aggregates hash UTF-8 path + NUL + lowercase file SHA-256 + LF, with JavaScript codepoint path sorting. Preparation’s different PowerShell sorting aggregate remains preserved in its immutable report; per-file hashes established reuse. Only the eight intended modified paths and one deletion differ from execution baseline. No recorded caller changed. Shared tasks, logo metadata, global CSS and touch tests retain their pre-execution hashes.

Evidence: [corrected before identities](../../../../.codex-artifacts/simplify-main-site-modules/storefront-catalog-implementation/before-corrected.json), [after identities, reductions and checks](../../../../.codex-artifacts/simplify-main-site-modules/storefront-catalog-implementation/after.json). An oversized initial capture truncated embedded source bodies; its original `before.json` is retained as error history, not authoritative source text. The corrected record removes those bodies and reconstructs nine source descriptors using `git show` at the recorded HEAD, requiring equality to every captured pre-edit SHA-256.

## Commands and results

All shell commands used `login:false` and the explicit Windows PowerShell path. RTK wrapped noisy commands; no admission/grant bypass was used.

| Command/check                                                                   | Actual result                                                                         |
| ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `pnpm openspec:guard`                                                           | Passed                                                                                |
| Guarded OpenSpec `status` and `instructions apply`                              | Passed; ready, 10/60 accepted                                                         |
| `pnpm test storefront-catalog`                                                  | **29 files / 162 tests passed**, exit 0; 0/1 Nx cache hits, 29.3s runner duration     |
| `pnpm exec eslint <eight surviving changed source/test files> --max-warnings=0` | Passed, exit 0; existing boundary-configuration deprecation notices retained          |
| Scoped Prettier write                                                           | Passed; only assigned files/review processed                                          |
| Removed-tax-symbol reference search                                             | Only retained type import remains in production                                       |
| Scoped `git diff --check`                                                       | Passed                                                                                |
| Receipt/review/task/owned/caller integrity                                      | Passed; complete review, unchanged receipts/tasks/callers; no unexpected owned deltas |

Logs: [module tests](../../../../.codex-artifacts/simplify-main-site-modules/storefront-catalog-implementation/test.log), [focused lint](../../../../.codex-artifacts/simplify-main-site-modules/storefront-catalog-implementation/lint.log). Counts come from the completed runner output; no passing test or lint run was repeated for counts. There is no published module typecheck target. Mandatory package/global type checking remains verifier-owned; no bespoke compiler loader or new audit framework was introduced.

## Acceptance gaps and resources

The final Prettier check passed for all eight surviving changed source/test files and both module reports; see the [format log](../../../../.codex-artifacts/simplify-main-site-modules/storefront-catalog-implementation/format.log). No source changed afterward.

| Acceptance row                   | Remaining verifier evidence                                                                                                                          |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Public presentation / ordering   | Store format/category acceptance; Home/Artists direct-load and shell ordering; artist release selection as selected by the affected slice            |
| Commerce discovery compatibility | Existing `StorePurchaseFlow.test.ts` and backend `stripe-catalog-contract.test.ts` against final inputs, plus required normal Local union acceptance |
| Integration / boundaries         | Both-graph freshness, affected/package/types checks, final-current-tree `pnpm validate`, strict OpenSpec and tasks 30 gates                          |

Provider mutation, CMS/staff publication and release/launch acceptance are outside these internal deletions. No shared/browser/Local/provider checks or graph writes were started by this thread.

All own test and lint processes exited normally; no own service/browser was started and no own validation slot remains held. No other owner’s process was stopped. No commits, push, deployment, provider mutation, branch/worktree, controller launch, shared task edit or unrelated report edit occurred.

**Completion boundary:** assigned implementation and owned focused checks complete. Module task acceptance and combined final-tree gates remain unchecked until the verifier establishes their actual evidence.
