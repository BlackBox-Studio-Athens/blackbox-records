# Stock implementation handoff

What this change does: Removes two repeated quantity parses from recount validation and replaces unused unit-test repository behavior with typed mocks. The stock unit suite retains every existing case and adds three invalid-recount cases plus an exact search-delegation assertion.

## Status and role

Assigned implementation and scoped checks are complete. **Module acceptance remains pending**; tasks 20.1/20.2 and shared markers were not edited. This is the same fresh implementer thread `01a12660-ff0a-7761-90cf-d9b3f6f7076c`, following the explicit execution release with preceding checkpoint acceptance deferred.

Reviewer: `01a1256b-29d2-7a43-8be5-983d885194a5`; review turn `01a1256b-31ad-7ed3-8d2a-541ac83866b1`. Completed preparation turn: `01a12661-0a42-7382-84e5-47b5da114c0d`.

Ownership is `apps/backend/src/application/commerce/stock`, including its unit tests. Its unchanged closed `project.json` exports `./index.ts` and permits `commerce-domain` and `backend-platform`; no other implementation root, generated file, dependency or boundary was edited.

## Source identity and preserved review

Before and after HEAD: `f7b019ca043e5f082c5b7aca67c4f0dbb3685ed0`, branch `main`. The owned root was clean at execution entry.

| Covered inputs                    | Before                                                             | After                                                              |
| --------------------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------ |
| 14 owned files                    | `38383c2699528b579079d0b244946b0833e307319359ec51d3e703e3d41ef98b` | `9fd3914223abcf10ab954c4e35ec9d0c4fb1d3acb6612675951e24e0e144d733` |
| Ten connected source/caller files | `3b6c9374ca5a0a573bad9d513dfc2527228209e7321a703edcf2512546f32712` | `3b6c9374ca5a0a573bad9d513dfc2527228209e7321a703edcf2512546f32712` |

The manifests hash sorted filenames, TAB, lowercase SHA-256 of raw bytes, LF including the final row. Owned filenames are relative to the stock root; connected filenames are relative to the repository root. [Before](../../../../.codex-artifacts/simplification/stock-implementation/before.json) and [after](../../../../.codex-artifacts/simplification/stock-implementation/after.json) retain every covered file hash and observation time. Only the two intended owned files changed; all ten connected hashes stayed fixed.

The immutable full review [raw result](../../../../.codex-artifacts/simplification/20-stock-review.result.json) matched supplied SHA-256 `eba42578aeaf82da92942b2f74d74151a0fb43b7c1a13d3c488a83f63f7f0f35`. The complete report, reviewer identity and source identity are saved in [reviews/stock.md](../reviews/stock.md). Its saved body was compared exactly against the formatted immutable report and matched; formatting did not omit review content.

The immutable [preparation result](../../../../.codex-artifacts/simplification/parallel-high-20-stock-preflight.result.json) matched SHA-256 `d5c4b3e77991128d34d7b1a8a84ab11648c91a57076a4681003f5030f8ee8628`. All owned files, ten connected files and the two repository contracts matched preparation at execution entry. Full-module inspection and both-graph evidence were therefore reused. Preparation had already inspected the two historical connected deltas: checkout-only fingerprint sorting and reuse of the Prisma search stock lookup. Neither changed during this implementation.

## Finding decisions

1. **Accepted — redundant recount parses.** `record-stock-count.ts` now passes the two unknown command quantities directly to `createStockState`; the unused `createStockQuantity` import name is removed. The unchanged constructor validates both quantities through the same non-coercing schema and checks online quantity against physical quantity. The production HTTP caller builds an ordinary command from validated JSON. All failures retain `InvalidStockOperationError('Online stock cannot exceed counted stock.')`, and variant lookup, revision validation, notes normalization, request fingerprinting, idempotency translation and repository-result handling retain their positions and behavior.

   The retained 576-pair probe had 16 accepted pairs and zero differences. Its quantity-constructor SHA-256 `3b92593f4de9efc407781a3a933e777d7ae2c66b338de1d074e77e99db1886a2`, Zod 4.6.5 and TypeScript 5.9.3 matched execution inputs. That expression proof was reused without a new compiler loader or probe. The new three-case unit check verifies invalid counted quantity, invalid online quantity and online quantity above count produce the exact application error without calling `recordCount`. Successful recounts now perform two quantity schema parses instead of four; no latency gain is claimed.

2. **Accepted — unused fake implementations.** The file-local `findBySource`, `findByStoreItemSlug` and `listOpenPreorders` bodies had no calls in the stock application or owned suite. They now use `vi.fn<Interface['method']>()`, retaining both repository `implements` declarations. The unused calendar and source-reference imports were removed. Used lookup/save/ledger state, revision increments, dates and preorder state remain intact.

3. **Accepted — approximate fake search algorithm.** The fake's trimming, folding, filtering and limiting were used only by the application delegation test; production search remains persistence-owned. It now uses a typed mock configured to return the existing fixture. The retained result assertion is joined by `toHaveBeenCalledExactlyOnceWith('disintegration', 20)`, detecting wrong query/limit forwarding or duplicate calls.

No received candidate was rejected or deferred to another implementation owner. The review's rejected deletions remain rejected: required revision/race checks, keyed replay handling, error translation, null-result guards, explicit history projection, sequential read failure ordering and exported boundaries all retain distinct behavior. Every pre-existing keyless-repeat, negative-stock, preorder lifecycle, Athens-midnight, no-op/race and history case remains.

## Changed files and reductions

| Changed owned path                                                    | Added lines | Removed lines |  Net removed |
| --------------------------------------------------------------------- | ----------: | ------------: | -----------: |
| `apps/backend/src/application/commerce/stock/record-stock-count.ts`   |           3 |             3 | 0 production |
| `apps/backend/src/application/commerce/stock/stock-use-cases.test.ts` |          25 |            29 |       4 test |

Production net reduction: **0 whole lines**, with two parser calls, one import name and 63 characters removed. Test net reduction: **4 lines**: 23 net scaffold lines removed before adding the 19-line recount regression. Deleted production files: **0**. Deleted test files: **0**. Deleted existing test cases: **0**; added cases: **3**, taking the suite from 19 to 22. No formatting or audit Markdown is counted. Prettier left both code files unchanged.

## Commands and results

[checks.json](../../../../.codex-artifacts/simplification/stock-implementation/checks.json) retains command outcomes, covered source aggregates, reused proof and deferred gates. All shell calls used `login:false` and explicit Windows PowerShell.

| Command                                                                            | Observed result                                                                                                                                                                                                                                                                                    |
| ---------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm openspec:guard`                                                              | Exit 0.                                                                                                                                                                                                                                                                                            |
| `pnpm openspec -- status --change simplify-main-site-modules --json`               | Exit 0; spec-driven planning complete.                                                                                                                                                                                                                                                             |
| `pnpm openspec -- instructions apply --change simplify-main-site-modules --json`   | Exit 0; ready, 10/60 tasks recorded complete. All returned current proposal/design/tasks context was read; no markers changed.                                                                                                                                                                     |
| `rtk test pnpm test stock`                                                         | Exit 0; fresh stock test run. RTK's condensed output showed only runner warnings.                                                                                                                                                                                                                  |
| `rtk proxy pnpm test stock`                                                        | Exit 0; matching Nx cache output confirmed **1 file / 22 tests passed**, 1/1 cache hit. [Retained output](../../../../.codex-artifacts/simplification/stock-implementation/test-stock.log). This evidence capture preceded the efficiency closeout instruction; no further test runs were started. |
| `pnpm exec eslint <the two changed stock files> --max-warnings 0`, through RTK     | Exit 0; no lint diagnostics. Existing boundary configuration deprecation notices were emitted.                                                                                                                                                                                                     |
| `pnpm exec prettier --write <two changed stock files> <stock review>`, through RTK | Exit 0; both code files unchanged, review formatting normalized.                                                                                                                                                                                                                                   |
| `git diff --check -- <stock root> <stock review>`                                  | Exit 0; no whitespace errors.                                                                                                                                                                                                                                                                      |
| Saved full review comparison                                                       | Exact match to the formatted immutable complete report.                                                                                                                                                                                                                                            |

Runner output also contained existing NO_COLOR/FORCE_COLOR and Vite native-config-loader warnings. They did not fail the scoped run and were not changed. The published module target names Node and Worker projects; the observed selection contained one unit-test file. This is not D1/HTTP integration acceptance.

Stock has no separate typecheck target. No raw package compiler command or bespoke type loader was introduced. Backend package types remain with the final verifier, as explicitly assigned.

## Acceptance and resource state

| Acceptance row / gate                                                        | State                                                                                              |
| ---------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Commerce/checkout/stock: owned unit behavior                                 | Scoped suite passed, including exact error/no-write regressions and delegation.                    |
| Shared affected/API/D1/checkout tests and normal Local mock acceptance       | Pending persistent verifier on the final stable tree.                                              |
| Backend/package types, final-current-tree `pnpm validate`                    | Pending persistent verifier; no typecheck pass claimed.                                            |
| Both-graph freshness, shared task markers, strict OpenSpec / tasks 30.1–30.2 | Pending persistent verifier with source writers idle. Graphs were not rewritten or refreshed here. |
| Public shell/player/visual/accessibility checks                              | No changed surface in this patch; verifier selects any combined-tree obligations.                  |
| Provider/release acceptance                                                  | Outside this assignment; no hosted services were used or mutated.                                  |

All checks started by this thread finished. No validation/check process or serving process remains owned by this thread; the published test runner returned and released its lease. No controller, browser, Local stack or background helper was started. Other workers and shared processes were left alone. No commit, push, branch/worktree, deploy or publication occurred.

Not checked here: shared integration/runtime/browser acceptance, package types or final global gates. Assigned implementation completion does not mark module acceptance complete.
