# @blackbox/api-client implementation

Status: completed for the assigned module and focused verification. Combined repository acceptance remains with the persistent verifier.

- Module: 3/29, `@blackbox/api-client`, root `packages/api-client`.
- Implementation/thread ID: `01a12553-729e-7ed0-9a04-e5a28e2620fa`.
- Reviewer/thread ID: `01a1253b-8cee-7121-811a-41e57c1d0f03`; [full received review](../reviews/api-client.md).
- Date: 2026-10-10. Checkout: existing `main` at `C:/Users/SVall/WebstormProjects/blackbox-records`.
- HEAD: `3355c335226838f996efb5536f55271f819a3e14`.

## Decision and change

Accepted finding 1 after independently checking current source, owned tests and connected public/staff callers. Replaced the two no-store configuration test bodies with one two-row `it.each` table and removed the unused request-builder mock chains.

Only [client-factories.test.ts](../../../../packages/api-client/src/client-factories.test.ts:77) changed in the package: 7 inserted lines, 39 deleted lines, a net reduction of **32 test lines**. No production lines changed. No distinct test case or assertion was deleted.

The public and internal cases keep their original labels and HTTP/HTTPS URLs. Each case creates its own `configure` mock and `Fetcher.for` spy, calls its factory once, asserts one `Fetcher.for` call and the exact `{ baseUrl, init: { cache: 'no-store' } }` configuration, then restores the spy in `finally`. The first six cases remain unchanged: two factory-surface checks, real public POST/internal GET requests and both problem/legacy error media types.

Both current factory bodies call only `Fetcher.for()` and `configure()` during construction, then return the fetcher. The removed `path → method → create` mock chains have no calls or assertions in these tests. Request construction remains covered by the separate real MSW request tests. Parameterization retains two independently collected no-store cases rather than reducing their coverage to one case.

The review's rejected production changes remain rejected. Factory isolation and generated path types, declared exports, mutable fixtures, JSON-body parsing, handler ordering, dynamic stock fields, null handling, delivery constants/disclosures and differing legacy/problem messages all remain unchanged. There is no proven production simplification or performance improvement to claim.

## Independent checks of scope

Read all seven handwritten owned source/test files in full through CodeGraph source or bounded exact reads, plus `package.json`, `tsconfig.json` and `vitest.config.ts`. The package inventory contains 13 files and no nested module roots or `project.json`; Nx targets and tags live in `package.json`, and the boundary manifest identifies the package and its public interfaces.

Connected reads covered the complete public checkout API and platform wrapper, the complete internal order API, public request-suite sections for cancellation/no-store, shared reads and settlement, and preferred problem detail/retained legacy body, plus the complete internal-order API test file. Staff middleware and protected request options still consume the same factory contract. The original reviewer inspected further presentation/backend consumers; this test-only implementation did not repeat unrelated consumer internals. Generated schemas and the generator were fingerprinted without edits or generation.

Used the existing Graphify index before substantive investigation/edits:

- `graphify explain 'createPublicApiFetcher' --budget 2500`.
- `graphify explain 'createInternalApiFetcher' --budget 2500`.
- `graphify explain 'createApiClientHandlers' --budget 2500`.

All three returned bounded extracted caller relationships without truncation. CodeGraph then supplied current factory and public/staff caller source. Its factory query omitted the symbol-free tests and also selected an unrelated CMS file; bounded exact reads supplied the omitted owned test/barrel/lifecycle files. No graph initialization, enrichment, refresh or paid API call was performed.

The existing error test already uses `it.each`. Also checked [official Vitest 4.1.6 documentation](https://github.com/vitest-dev/vitest/blob/v4.1.6/docs/api/test.md) through Context7 for table cases and `%s` labels; 4.1.6 was the closest available versioned documentation, while the installed runner is 4.1.11. Current-runner collection confirms the exact eight case names.

## Focused evidence

Product Environment: Local, without starting the Local stack. This slice changes test setup only; it does not change product, transport, browser, provider or release behavior.

| Check                                                                                                  | Observed result                                                                                                                 |
| ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm openspec:guard`                                                                                  | Passed before edits.                                                                                                            |
| Guarded OpenSpec status and apply instructions                                                         | `spec-driven`, state `ready`, 2/60 tasks complete when read; only assigned module 3 handled here.                               |
| `pnpm test '@blackbox/api-client'`                                                                     | Passed, one file and **8/8 cases**, fresh execution with **0/1 Nx cache hits**. Vitest 1.83 s; Nx run 10.7 s.                   |
| `pnpm exec vitest list src/client-factories.test.ts --json` from `packages/api-client`                 | Collected eight cases, including separate public/internal no-store names. Collection only; this is not a second test execution. |
| `pnpm exec eslint packages/api-client/src/client-factories.test.ts --max-warnings=0 --no-warn-ignored` | Passed, exit 0. Existing boundary-plugin deprecation notice; no file diagnostic.                                                |
| Scoped Prettier checks                                                                                 | Changed test and both unique reports pass; received review body preserved unchanged inside an ignore range.                     |
| `git diff --check -- packages/api-client`                                                              | Passed.                                                                                                                         |

Evidence artifacts:

- [Fresh focused test transcript](../../../../.codex-artifacts/simplify-main-site-modules/api-client-01a12553/focused-tests.txt).
- [Collected case names](../../../../.codex-artifacts/simplify-main-site-modules/api-client-01a12553/collected-tests.json).
- [Fingerprint records](../../../../.codex-artifacts/simplify-main-site-modules/api-client-01a12553/fingerprints.json).

The focused wrapper emitted no validation-summary JSON because the validation reporter directory was unset. The retained transcript is captured tool output, not a combined validation result. The review's older cached JSON is preserved as historical review evidence only.

A first test-name collection attempt from the repository root combined a relative config path with a package root and failed config resolution before collecting tests. The corrected package-directory command passed. The first review-format check found an extra final blank line; removing it made the check pass without changing the received review. Neither issue changed the passing module test result.

## Source fingerprint

The pre-edit finding-file hash matched the received review and the pre-edit package diff was empty. Repository-relative paths reproduce the review's aggregate exactly.

| Fingerprint                            | Before                                                             | After                                                              |
| -------------------------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------ |
| `src/client-factories.test.ts` SHA-256 | `e8e43006c160079f9b5123afc97aabcf3b27a9042efe3f657e352cb3d082e11f` | `39afdbd82b0587faf09640902fe0f021e68a88160c58cf8c8260c60ff0a3adb7` |
| Package aggregate SHA-256              | `273ca727b2a04897c33b879756928da69dbecf937a1abe41087d2df931f781bd` | `03cc6c3ba58b69be603501afebdaa12f4ef10f3b227a301f83e5b41593b71de9` |

The aggregate covers the same 13 files as the review, sorted by repository-relative path. Hash UTF-8 records of `path + NUL + lowercase file SHA-256 + LF`. All other package files remain unchanged. These fingerprints bind the focused results to this module; they do not freeze the concurrently edited whole repository.

## Handoff and remaining acceptance

The persistent verifier must coordinate the combined graph refresh, `pnpm validate` including affected lint/typechecks/architecture checks, strict OpenSpec validation and shared task completion. This thread did not edit `tasks.md`, proposal/design or another module's reports, and did not run those shared gates or issue a maintainer grant.

Browser/Local-stack acceptance is not needed for this test-only slice because no runtime or visual code changed. Consumer test execution, generation/typecheck, hosted/provider and release acceptance were not run here and are not claimed. No branch/worktree, commit, push, deployment, publication, hosted mutation or message to another thread was made. Concurrent edits in other modules were left untouched.
