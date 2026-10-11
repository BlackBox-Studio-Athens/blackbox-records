# web-store implementation — module 12/29

Assigned implementation and scoped checks are complete. Module acceptance remains pending with the exclusive verifier; tasks 12.1/12.2 were not changed. The parent explicitly released execution while preceding checkpoint acceptance remained deferred.

## Roles and retained inputs

- Implementer: `01a1268b-03c9-7540-9f77-dd4333c4e7a6`, same fresh preparation role.
- Reviewer: `01a12592-5a19-7743-8825-0cbe625812b8`; review turn `01a125fd-fa72-77a2-923b-8397d7c23232`.
- Preparation turn: `01a1268b-1532-7410-9183-62a54394199a`.
- [Complete received review](../reviews/web-store.md), preserved from `.codex-artifacts/simplification/12-web-store-review-refresh-01.result.json`; immutable raw SHA-256 `b53420e5c5ae40b9ea9b8aa912ad3bfacb876f5f0bd7df873d01cb66d8c92fbd`.
- Immutable preparation: `.codex-artifacts/simplification/parallel-high-12-web-store-preflight.result.json`; raw SHA-256 `f8bab3754c678f9bdcd6a28c0489514035e6b3b83dccd36e525cd93d1fc7ae3c`.

Before formatting, the saved review was checked to end with the complete received report exactly. Audit formatting changes only its Markdown presentation; the immutable full report remains unchanged.

## Source identity and coverage

Existing checkout: `C:/Users/SVall/WebstormProjects/blackbox-records`, branch `main`. Before and after HEAD: `f7b019ca043e5f082c5b7aca67c4f0dbb3685ed0`.

| Covered inputs                 | Before                                                             | After                                                              |
| ------------------------------ | ------------------------------------------------------------------ | ------------------------------------------------------------------ |
| 43 owned files                 | `ebfdd82f8f62df73eabaaf8cb29934c6711d63000e161bf37d2d1d121d34bb81` | `a7b046b9d3bf73cb2203e149f25f671c436de5dd78ae35fca4c2081ce40e97d2` |
| 35 connected source/test files | `3ff27d406c9cdab901b1075468bcf0f4fbdf46fed551e9ccc87b12731b65c8d1` | `3ff27d406c9cdab901b1075468bcf0f4fbdf46fed551e9ccc87b12731b65c8d1` |

Fingerprints hash UTF-8 records of normalized repository path, one space and lowercase file SHA-256, ordered with PowerShell Sort-Object, joined with LF and no trailing LF. [Before snapshot](../../../../.codex-artifacts/simplification/web-store-implementation/before.json) and [after snapshot](../../../../.codex-artifacts/simplification/web-store-implementation/after.json) retain the complete file hashes and exact reductions.

Ownership is `apps/web/src/components/store`, excluding nested cart and checkout roots. Crate has no nested project and remains owned. Closed metadata and all eleven public entrypoints are unchanged. No owned source changed between preparation and execution, so the full 43-file inspection and both-graph proofs were reused. Finding paths, tests and callers remain bound to the current hashes.

One connected delta since preparation was independently inspected: `apps/web/src/lib/store-collection.ts` removed the pre-selection `assertStoreCollectionInvariants(entries, 'all')` call; the selection helper still calls its invariant check. Its hash changed from `f5a70026c512e68b7865b057afe1bd05849d06f590f5b935503f2fb1dcdb3532` to `f413e23cefefc168b3e587fa56dae4fbf59442fcbad21c3331341e671a7cf77c`. This other module's edit does not alter the accepted finding proofs and was preserved. CodeGraph returned its complete current source. Other connected inputs matched preparation.

## Every finding decision

| ID  | Decision              | Proof and result                                                                                                                                                                                                                                                                                                                                                                              |
| --- | --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Superseded; no action | The Coverflow controller, controls and owned test were already retired. No remaining cleanup was applied or credited.                                                                                                                                                                                                                                                                         |
| 2   | Implemented           | Page-data's seed declaration and checkout's exported StoreItemCartSeed have identical Omit/replacement fields over the same snapshot type. Checkout is already allowed and exports this file; listing-price presentation already imports the type. A type-only import and exported alias preserve the owned name and runtime output. Retained the CartLineItemSnapshot import used elsewhere. |
| 3   | Implemented           | Production uses the real createStoreItemAvailability, which calls variant/option helpers and neither overridden predicate. Removed only the two inert mock exports. Four JSON assertions followed an exact null assertion and could establish no additional property. Kept both null scenarios, importOriginal/spread, lookup spy assertions and real seed-field/image regressions.           |
| 4   | Deferred              | Set membership could reduce repeated scans, but offers no expected code reduction or measured latency improvement. Existing order, DOM movement and focus behavior remain unchanged.                                                                                                                                                                                                          |
| 5   | Deferred              | Computing gallery thumbnail data once would reduce parser calls but add callback scaffolding. No code reduction or measured user-visible benefit was established. Retained current image/ARIA/loading/swipe behavior and tests.                                                                                                                                                               |
| 6   | Implemented           | The complete emitted type sequence already proves the second intent is letGo; ordinary literals have no intervening mutation. Removed only the subsumed second-object type assertion, retaining the test and all distinct gesture cases.                                                                                                                                                      |
| 7   | Implemented           | The private writer has exactly two local calls. Each formerly supplied the identical transition string in next.transition and as a positional argument. Removed the parameter and duplicate arguments; the cached comparison/write now uses next.transition at the same position. Other writes and their order are unchanged.                                                                 |
| 8   | Implemented           | land() performs exactly the destroy block's cancellation loop and array replacement. Reused it after both existing timer clears and before finger disposal. It adds no rendering/history effect, catch, timer or cleanup reordering.                                                                                                                                                          |

No unsafe, unrelated, visual or cross-root edit was adopted. Retain tape mechanics, unlike flip/rack paths, input/history/trust guards, async cleanup, both filter booleans, meaningful unit/browser regressions and the existing preorder-title/performance changes.

## Exact changes and reductions

Paths are relative to `apps/web/src/components/store`.

| File                        | Production net removed | Test net removed |
| --------------------------- | ---------------------: | ---------------: |
| `store-page-data.ts`        |                      5 |                0 |
| `crate/crate-view.ts`       |                      3 |                0 |
| `store-page-data.test.ts`   |                      0 |               14 |
| `crate/crate-input.test.ts` |                      0 |                1 |
| Total                       |                      8 |               15 |

Four code/test files changed; zero files and zero whole test cases deleted. Production diff: 5 additions / 13 deletions; test diff: 0 additions / 15 deletions. Total net reduction: 23 lines. No formatting-only source changes occurred. Required audit Markdown and ignored evidence are excluded from reductions.

Worker offer authority, metadata-only seeds, nullable static snapshots, variant guards, thumbnail promise deduplication and serialization remain. The same Piece cache controls transition, transform, opacity, visibility, shade, z-order, pointer events, labels and behind state. Numeric opacity and separate shade transition are retained. Animation cancellation still precedes every subsequent disposal/reset, with the same exception behavior and settlement-array identity guard. All CSS/assets and public module interfaces remain unchanged.

## Commands and actual results

All commands used login:false and explicit Windows PowerShell; tools were run through RTK. Native apply_patch made ordinary source/report edits.

| Command                                                                          | Result / evidence                                                                                                                                                                                    |
| -------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm openspec:guard`                                                            | Exit 0; existing main checkout confirmed.                                                                                                                                                            |
| `pnpm openspec -- status --change simplify-main-site-modules --json`             | Exit 0; spec-driven, planning complete.                                                                                                                                                              |
| `pnpm openspec -- instructions apply --change simplify-main-site-modules --json` | Exit 0; ready, 10/60 recorded complete; current proposal/design/tasks read. No task markers changed.                                                                                                 |
| `pnpm test web-store`                                                            | Exit 0; 9 files / 165 tests passed; fresh Nx execution, 0/1 cache hits. Vitest 12.62s; Nx run 13.9s. [Log](../../../../.codex-artifacts/simplification/web-store-implementation/tests.log).          |
| `pnpm exec eslint` with the four changed file paths and `--max-warnings=0`       | Exit 0; no file diagnostics. Existing boundary-configuration deprecation warnings were retained and not fixed. [Log](../../../../.codex-artifacts/simplification/web-store-implementation/lint.log). |
| `pnpm exec prettier --check` with the four changed file paths                    | Exit 0; no source formatting changes needed. [Log](../../../../.codex-artifacts/simplification/web-store-implementation/code-format.log).                                                            |

Audit formatting and final diff/source integrity results are recorded in [results.json](../../../../.codex-artifacts/simplification/web-store-implementation/results.json). Passing owned tests/lint/source formatting were not repeated for counts, and no broad consumer selection was started. The declared web-store project has no separate typecheck target; package/global types are expressly verifier-owned, so no ad hoc compiler loader was introduced.

## Acceptance gaps and resource state

- Commerce/checkout: verifier owns affected integration/normal Local evidence for static seed → fresh Worker offer → cart authority.
- Shell/player/routing and crate rendering: verifier owns source-bound `e2e/store-crate.spec.ts` and relevant `e2e/store-formats.spec.ts` cases on the stable tree, including switching, Grid round trips, Back restoration, end state and reduced motion. Pure model/input/pose passes do not prove DOM rendering or browser teardown. DevTools touch evidence remains Chromium-only.
- Boundaries/final integration: verifier owns both-graph freshness, package types, final-current-tree `pnpm validate`, strict OpenSpec task 30 gates and shared task markers.
- Staff/CMS, publication/provider/release acceptance: no edits or operations; outside this slice.
- All started owned checks finished. No owned check/session/server/controller remains running. The slot-controlled test runner exited successfully. No graph writes, shared browser/Local checks, providers, commits, branches/worktrees, pushes or deployment occurred.

Completed means assigned implementation and scoped checks only. Module acceptance remains unchecked until the verifier obtains all required final-tree evidence.
