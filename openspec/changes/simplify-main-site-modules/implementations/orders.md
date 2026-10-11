# Orders implementation handoff

What this change does: Removes duplicated delivery-result mapping, the readback test repository and transition scaffolding, one redundant monetary-policy guard, a repeated provider-line lookup, and a duplicated alert-test rejection override. Exact public behavior and meaningful regression coverage remain required. **Assigned implementation and owned scoped checks are complete; module acceptance is not complete.**

## Identity and release

- Module 25/29: `orders`; owned root `apps/backend/src/application/commerce/orders`. No other implementation root, generated source, shared config, tooling, or task marker was edited.
- Implementer: `01a1268b-0589-7711-9367-96dd1ff73006`; same fresh role as the completed READONLYPREP.
- Reviewer: `01a125a0-bae1-7242-8489-c4d4b6bef69c`, review turn `01a125a0-c5f2-7663-bbff-67c77adcfa9c`.
- Full received review preserved in [reviews/orders.md](../reviews/orders.md). Its immutable raw source is `.codex-artifacts/simplification/25-orders-review.result.json`, SHA-256 `6cf7cda7fa3083c4247be1e71a9768993833db8f6d4c317d2eafa7c03bba8bbe`; original review HEAD `3355c335226838f996efb5536f55271f819a3e14`.
- Verified READONLYPREP source: `.codex-artifacts/simplification/parallel-high-25-orders-preflight.result.json`, turn `01a1268b-1bd3-7283-883f-a37b6e119c21`, raw SHA-256 `2c3c1b4c9f2cba63c3f615b4084c84f1f3d68421e8be9f83c269b55d08ff1760`.
- Parent explicitly released execution with preceding checkpoint acceptance deferred. This authorizes implementation, not acceptance. Orders tasks 25.1/25.2 remain untouched.

## Source binding and coverage reuse

Before/after HEAD is `f7b019ca043e5f082c5b7aca67c4f0dbb3685ed0`, branch `main`, existing checkout. At execution opening, all 32 owned files, 20 selected caller/dependency files, six connected suites, and seven configurations byte-matched preparation. Owned and connected diffs from preparation were empty. The completed full-module inspection and both-graph relationships were therefore reused; no unchanged full scan or graph rebuild ran.

Only the seven owned files below changed. All other owned bytes and all selected connected bytes remained unchanged through the passing scoped checks. Full path/hash manifests and physical line counts are retained in [before](../../../../.codex-artifacts/simplification/orders-execution-before.json) and [after](../../../../.codex-artifacts/simplification/orders-execution-after.json).

| Covered set                                             | Before                                                             | After                                                              |
| ------------------------------------------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------ |
| Owned: 20 production files, 11 test files, project.json | `12cf43082c147e25e9d0277e0db86a9272bdbcd6d33f6b7efc1182bf685fe6bd` | `589ba7b78c1783082f711414b65205d66d34c41257cb0f54118c04f04b7b95b8` |
| Selected 20 callers/dependencies/fixture                | `2be78e2a9b0bd4bb4edc979f1bcf70c84edaa17f0517f59b458bac4b761f9b44` | Unchanged                                                          |
| Six connected regression suites                         | `cd5e47dd45446aa19611383f2a26885db8c234aff8c61acfc5bd877220709d32` | Unchanged                                                          |
| Seven package/runtime/type configurations               | `df8275f21f38a183760b00c2d88d9f6ee732ccf9f9d34f03960a27b72b31e1a8` | Unchanged                                                          |

Fingerprint algorithm: SHA-256 over sorted, slash-normalized `path:file-SHA256` entries, joined with LF and a trailing LF. The closed module metadata, three public entrypoints, dependencies, exports and result variants remain unchanged.

[Closeout evidence](../../../../.codex-artifacts/simplification/orders-execution-closeout.json) confirms all covered check inputs still match and the complete saved review equals the immutable source after formatting normalization. Both immutable raw report hashes remain unchanged.

## Finding decisions

1. **Accepted and implemented — identical delivery-result adapters.** The email/newsletter application producers construct closed `sent`/`failed` and `registered`/`failed` statuses. Both former adapters produced identical delivered and failed objects. One existing private adapter now handles their union; its three call sites were renamed and the duplicate function deleted. Consent rejection, provider awaits, newsletter logging before conversion, independent shopper/ops work, stable identities, sink routing, retryability, null provider-message ID and missing-reason fallback remain. Two added newsletter failure cases cover an explicit retryable reason and an omitted reason yielding `unknown`, with no email send.
2. **Accepted and implemented — readback fake repository.** The production readers parse/forward the session or forward the query with omitted status normalized to null. The removed class implemented sorting/filtering and creation/transitions used only by setup. Existing paid-order fixture overrides and typed Vitest mocks replace it. All three scenarios and original field expectations remain, now asserting repository arguments and exact returned record/array identity. Actual sorting, filtering, tied-date ordering, limits and cursor coverage remains in the unchanged D1 order-search suite; combined forwarding remains in the unchanged owned use-case test.
3. **Partially accepted — monetary-policy guard only.** Removed `!order.monetaryPolicyReference`: the preceding mode check already rejects every falsy reference, and ordinary repository record mappers establish the supported input shape. All category, tax, money, identity, discount, quantity and consistency checks remain. **Rejected the two numeric truthiness deletions:** both amounts are `number | null`; installed `Number.isInteger` returns boolean, not a type predicate, under strict TypeScript configuration. Those terms provide required null narrowing before comparisons, finalization and aggregation. Retained them without replacement guards or assertions. No integer-domain change was made.
4. **Accepted and implemented — repeated finalized-line search.** Each mapper iteration now finds its provider line once, then reads VAT/rate with the same null fallbacks. Ordinary mapped arrays, unchanged predicate and no intervening mutation/await establish equivalence. First-match selection, zeros, persisted line ordering, quantity/amount aggregation and finalizer calls remain. An added legacy duplicate-price regression distinguishes first-match selection from last-write-wins indexing and preserves zero fields; an existing quantity case now asserts absent tax fields become null. Real saved VAT/rate, concurrency, replay and transactional evidence remains in the unchanged D1 integration suite for shared verification.
5. **Accepted and implemented — duplicated alert lookup rejection.** Removed the first rejection override and unused destructured binding. The unpublished slug's default lookup resolves to null, while the second setup still rejects. Both no-send/no-budget/refund/reschedule assertions and the missing-item warning remain. Production alert delivery is unchanged.

The review's broader rejected reductions remain rejected: public APIs/result variants, paid-review write/readback checks, notice lease/window checks, distinct drain policies, trust-boundary fulfillment/money/consent validation, withdrawal clock evaluations around awaited digests, and response/history/retry/shipping contracts all remain.

## Changes and reductions

Physical file line deltas below use minus for removal and plus for addition:

| Owned file                              | Physical line delta |
| --------------------------------------- | ------------------: |
| `apply-paid-checkout-reconciliation.ts` |                  +1 |
| `availability-alert-delivery.test.ts`   |                  -1 |
| `order-readback.test.ts`                |                 -80 |
| `paid-checkout-reconciliation.test.ts`  |                 +31 |
| `paid-order-delivery.test.ts`           |                 +24 |
| `paid-order-delivery.ts`                |                  -8 |
| `reconcile-monetary-snapshot.ts`        |                  -1 |

Git reports 123 insertions and 157 deletions across seven owned files: **34 physical net lines removed**. Reported code-reduction totals conservatively exclude nine lines due solely to compacting the three retained readback expected-object literals (three lines each):

- **Production: 8 net lines removed.**
- **Tests: 17 net lines removed after excluding formatting**; physical test reduction is 26.
- **Combined code reduction excluding formatting: 25 lines.**
- **Deleted files: 0.** No distinct test scenario or test file was deleted; three regression cases were added.
- Audit Markdown, evidence files and formatting-only changes are excluded.

The raw per-file hashes, deltas and source manifests are linked above rather than repeated here.

## Checks and evidence

`pnpm openspec:guard`, guarded status and apply-instructions commands exited 0. Current schema is `spec-driven`, state `ready`, progress 10/60. Every current apply context file was read. The parent assignment overrides the apply workflow's shared task-update steps.

| Check                                                                            | Result                                                  | Retained evidence                                                                                            |
| -------------------------------------------------------------------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `pnpm test orders`                                                               | Passed; 11 files, 121 tests; Nx 1 target, 0/1 cache hit | [test log](../../../../.codex-artifacts/simplification/orders-execution-test.log)                            |
| ESLint on the seven changed owned TS files, `--max-warnings=0 --no-warn-ignored` | Passed, exit 0                                          | [lint log](../../../../.codex-artifacts/simplification/orders-execution-lint.log)                            |
| Prettier on the seven changed owned TS files                                     | Scoped write completed; subsequent check passed         | Tool transcript and [check record](../../../../.codex-artifacts/simplification/orders-execution-checks.json) |
| `git diff --check -- apps/backend/src/application/commerce/orders`               | Passed, exit 0                                          | Check record                                                                                                 |

Counts came from the existing Vitest/Nx run report. No passing test or lint run was repeated for counts. Existing Vite/native-loader, color-environment and boundary-configuration deprecation notices did not fail these checks; their owners were not edited.

There is no orders-owned typecheck target. The required backend package/global type gates remain deferred to the verifier; no bespoke compiler loader, raw package type bypass, broad consumer selection or unrelated-failure fix ran.

Both graphs were consulted during the byte-matched preparation. Exact Graphify explains resolved relevant truncation; exact source filled CodeGraph's omitted function/test spans. Graph refresh and post-edit graph freshness remain verifier-owned.

## Acceptance gaps and resources

- **Commerce/checkout/stock row:** owned behavior checks passed. Shared affected checks, D1 checkout integration, persistence order search, HTTP acknowledgement/routes, backend scheduling and normal Local mock acceptance remain with the verifier on the stable tree.
- **Boundaries:** project metadata and public contracts are unchanged; source lint passed. Combined architecture/strict gates remain deferred.
- **Shell/player, visual design, staff/CMS implementation:** no behavior or implementation edits; no independent browser/design acceptance was undertaken.
- **Provider/release:** no hosted/provider mutation, send, credential, commit, push, deploy or publication occurred. No provider or release acceptance is claimed.
- Mandatory final-current-tree `pnpm validate`, package/global types, strict OpenSpec task 30 gates and the shared runtime/browser union remain open. Preceding checkpoint acceptance and orders task markers are not inferred from this scoped pass.

Owned test session 71761 and lint session 67915 both finished with exit 0. The published scoped runner releases its test lease in its normal completion path. No persistent process, controller, Local stack or browser was started; other threads/resources were left alone.

**Handoff:** assigned implementation and owned scoped checks complete. Parent/verifier can consume the canonical full review, this report and source-bound evidence; module acceptance stays unchecked until its required shared evidence passes.
