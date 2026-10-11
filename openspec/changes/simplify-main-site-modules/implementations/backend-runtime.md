# Backend-runtime implementation handoff

Assigned implementation and scoped checks are complete. **Module acceptance remains pending**; tasks 29.1/29.2 and final integration markers were not changed. Work stayed on existing `main` in `C:/Users/SVall/WebstormProjects/blackbox-records`.

Implementer: `01a126b3-3ce1-7692-848a-6adb8165187a`. Reviewer: `01a125d6-2f56-78b3-8ff8-8a4a76802544`. The parent explicitly released execution with preceding acceptance deferred. This report accounts for the native test-only precursor and subsequent cleanup together.

## Review preservation and current scope

The [complete received review](../reviews/backend-runtime.md) preserves the immutable report from `.codex-artifacts/simplification/29-backend-runtime-review.result.json`, reviewer turn `01a125d6-3a96-7703-b94b-ccad3b0e9b0e`, raw SHA-256 `bc91ac9796cd5fad53b88bcdcf387320a7254086d63d4edd401b6df6de42d649`. Its complete report text was verified as present without alteration. The preparation artifact remains unchanged: `parallel-high-29-backend-runtime-preflight.result.json`, raw SHA-256 `56cf30e3b3ac1ccd030698446f0c30525d0907049a7fdd3069c0c84367421a9b`.

Ownership follows current `apps/backend/src/project.json`: application-root source/tests, excluding all nested modules, generated source and CMS implementation. Public exports and boundary metadata are unchanged. All eight original owned files matched the full reviewed/prepared inspection before edits. The additional 96-line precursor test also matched its completed baseline identity. No unchanged whole-module scan or probe was repeated. Both existing graphs' retained preparation evidence was reused for matching inputs; exact current source covered graph omissions and each edit. Shared graph freshness after this batch belongs to the verifier.

The 26 recorded connected files matched the precursor closing manifest. Since original review, only the previously inspected Prisma test deletion and operator verifier JWKS URL simplification differ; neither changes the relevant Local rewrite path. The current Stripe24 diff was inspected: price type narrowing, private catalog checks, line-item mapping, optional-string cleanup and unused mocks leave exported signatures/composition unchanged. No Stripe source was edited. Its three production hashes were captured and remained stable through the checks.

## Finding decisions and retained behavior

| ID  | Decision and proof                                                                                                                                                                                                                                                                                                                                                                                                                                                    | Retained contract                                                                                                                                                                                                                       |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| F1  | Accepted. The initial request reconstruction removes Content-Length. Between it and the two later reconstructions, draft translation modifies payload only and the Release schema callback reads schema only. Removed two repeated Headers allocations/deletions and the later headers initializer. The two existing native regressions pass after cleanup.                                                                                                           | Initial sanitization, all other headers, method/URL, both serialization points, schema lookup order, legacy/relation choice, normalization/validation, revision and exact 400/422 paths remain.                                         |
| F2  | Accepted. The earlier `invoke` and later `cms` rows both rejected CMS maintenance while commerce resolved. One local table now tests `orders`, `cms` and synchronous `binding` failure. Both mocks reset to resolving defaults. Original failure remains in AggregateError.errors; exact controller/bindings forwarding and reachable invocation counts remain asserted.                                                                                              | Three distinct regressions retained; commerce always runs once, CMS runs once for promise failures and zero for binding lookup failure. Production allSettled/deferred lookup stays unchanged.                                          |
| F3  | Accepted. The private fetchCommerce mock had only its declaration/destructuring/default-property references, with no configuration/assertion; routing uses Durable Object fetchWithBindings and the dynamic commerce import uses scheduled only. deliver.mockClear followed beforeEach.mockReset without an intervening call. Actual scheduled invocations in commerce-runtime.test.ts subsume the function-type assertion. Removed its now-unused Worker import too. | Empty-queue execution, scalar replacement/overlap, forwarding/preflight behavior, published names, native RPC/signatures, queue limits/order, persisted delivery/alerts, gates, recipients, retention and redacted logs remain covered. |

No whole meaningful test or production file was deleted. Scheduler generated failure cases fell from four to three, preserving all distinct failure modes and combining their useful assertions.

Every other received proposal remains rejected/deferred:

- Token-export classification cache: deferred; adds declarations without proven latency benefit.
- CMS error helper substitution: rejected; loses `success: false` or explicit problem-detail semantics.
- Scalar filtering removal/environment mutation: rejected; removed settings must clear without replacing bindings or mixing overlapping calls.
- Prisma scope/provider construction cleanup: rejected; request cleanup must retain object clients and preserve construction order.
- Native RPC suite deletion: rejected; real secret replacement and unchanged signed-body verification have distinct coverage.
- Auth, hostname, PAT, body, revision, publication/discard/upload guards: rejected; entry and directly callable object methods protect distinct boundaries.
- Fail-fast scheduler/direct binding lookup: rejected; can suppress independent work or lose synchronous failure aggregation.
- Alarms, single-flight, preview ownership/persistence and HEAD cancellation: rejected; lifecycle/privacy/stream semantics require them.
- Eager preview alias decoding/traversal changes: rejected; malformed-input evaluation and logged failure phase/order could change.
- Routing abstractions, cached stubs or partitioned objects: rejected; no smaller equivalent result established.

## Combined changes and accounting

The baseline is the original eight reviewed/prepared owned files, before the precursor. Counts below include the precursor exactly once and exclude both audit Markdown files.

| Path                                                                           | Production physical delta | Test physical delta | Nonblank code delta |
| ------------------------------------------------------------------------------ | ------------------------: | ------------------: | ------------------: |
| apps/backend/src/cms-worker.ts                                                 |                        −5 |                   0 |                  −5 |
| apps/backend/src/emdash-checkpoint.test.ts                                     |                         0 |                 −14 |                 −13 |
| apps/backend/src/commerce-runtime.test.ts                                      |                         0 |                  −1 |                  −1 |
| apps/backend/src/paid-order-delivery-schedule.worker.test.ts                   |                         0 |                  −3 |                  −2 |
| apps/backend/src/editorial-request-rewrite.worker.test.ts (precursor addition) |                         0 |                 +96 |                 +92 |
| **Combined**                                                                   |                    **−5** |             **+78** |       **+71 total** |

Main cleanup alone removes **5 production and 16 nonblank test lines** (18 physical test lines). Combined code accounting, excluding blank/formatting-only lines, is **5 production lines removed, 76 test lines added, 71 net lines added**. Physical accounting is **5 production lines removed, 78 test lines added, 73 net lines added**. The precursor's four blank lines and the cleanup's two removed blank lines explain the two-line difference. No unrelated formatting reflow is counted as a reduction.

File effect: **four existing code/test files modified, one native test file added, zero files deleted**; net file count +1. The native file remains untracked/uncommitted and is explicitly included here, despite being absent from ordinary tracked-file numstat.

## Native precursor and post-cleanup proof

The immutable [precursor evidence](../../../../.codex-artifacts/simplification/backend-runtime-native-precursor-20261010-03/evidence.json) records the completed baseline: 45/45 tests across five files, including both native cases before production cleanup. Earlier failed fixture attempts and raw result history are preserved unchanged.

The unchanged [native regression file](../../../../apps/backend/src/editorial-request-rewrite.worker.test.ts) has SHA-256 `1340efc62b8ecd07e5a0250f3b8bd73f5cb8f4e7b922ef59774882aa59fdd39c`. Both cases passed again in **backend-runtime:worker**, through the published Cloudflare pool/workerd harness and exported CmsRuntime.fetch:

- POST `http://127.0.0.1/_emdash/api/content/artists`: null image omitted; slug/title/empty bio retained in exact serialized JSON.
- PUT `http://127.0.0.1/_emdash/api/content/releases/native-release`: Artist moves to `references.artist: ['artist-one']`; `_rev: 'saved-revision'` and title retained in exact serialized JSON.

Each case observes the downstream request's exact method/URL, complete Origin/auth/Access/EmDash/custom/Content-Type header map, absent stale Content-Length, unchanged original request header, single downstream handoff, branch-appropriate schema lookup, and private/no-store response.

Request, Headers, Response and streams remain native. Local auth/loopback, Origin/EmDash guards, bounded reads, shared draft validation, PUT revision guard and isolated D1 pending-publication query execute production code. Explicit doubles remain for the constructor-only Durable Object fixture, Astro adapter and EmDash runtime/schema lookup. This establishes native reconstruction on the actual path; it does not establish registered DO lifecycle, real downstream editorial persistence, rendering or hosted authentication. Node-only probes are not claimed as native proof.

## Source identity

HEAD before and after: `f7b019ca043e5f082c5b7aca67c4f0dbb3685ed0` (review HEAD was `1dc943972e0c8cd28bc82c3d16bc964909d37963`).

| Manifest                                                                | SHA-256                                                            |
| ----------------------------------------------------------------------- | ------------------------------------------------------------------ |
| Original eight owned files at review/preparation/precursor-before       | `1f11de1e082051503706d5f66f80c5dc0a25747465d1e929cb3d9df750685f29` |
| Nine owned files before main edits, including precursor                 | `4f3d056eaa073a1b1c952444c7b508dc07b1909e5223acb33f8e8ba05e41dac1` |
| Nine owned files at check start and closeout                            | `58a66ca8d21710367c0b869e951b007bfd754396f9c43f6c82acefcb9b569b43` |
| 26 connected caller/contract/config files before/after                  | `8fb8ae4a0b0cde9a2147085787d6e9b7d78a1502d01b17fa7303f98455644eb4` |
| Three inspected current Stripe production files at check start/closeout | `b6a396a92e65cc10b47dff99d3ce6299e13862e2bc94bb384a524781b0ac6e4b` |

Manifests hash sorted UTF-8 `path<TAB>file-SHA256<LF>` records, final LF. Full individual hashes and exact per-file counts are retained in [source-inputs.json](../../../../.codex-artifacts/simplification/backend-runtime-main-20261010/source-inputs.json) and [results.json](../../../../.codex-artifacts/simplification/backend-runtime-main-20261010/results.json). Owned, connected and inspected Stripe inputs matched through closeout. Unrelated work was preserved.

## Commands and acceptance gaps

| Check                                                                       | Actual result                                                                                                        |
| --------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| pnpm openspec:guard                                                         | Passed before edits                                                                                                  |
| Guarded OpenSpec status / instructions apply for simplify-main-site-modules | Passed; ready; all apply context read; no task markers changed                                                       |
| pnpm test backend-runtime                                                   | Passed uncached, 44/44 tests, five files, both Node and Worker projects; 0/1 Nx cache hits; 24.49s Vitest / 27.0s Nx |
| pnpm exec eslint, the five changed/added owned files listed above           | Passed; existing boundaries deprecation warnings only                                                                |
| pnpm exec prettier --check, those five files                                | Passed                                                                                                               |
| git diff --check, four modified owned files                                 | Passed                                                                                                               |

The module run includes 1 native RPC test, 5 commerce composition tests, 18 checkpoint cases, 2 native rewrite cases and 18 Worker schedule cases. It covers the requested checkpoint file, so no duplicate focused run or broad consumer selection was started. Existing module metadata offers no separate focused type target; mandatory package/global types remain with the verifier under the parent's policy.

Actual assertion results: [backend-runtime.json](../../../../.codex-artifacts/simplification/backend-runtime-main-20261010/backend-runtime.json), SHA-256 `f822b2134f4de60d260a88d97dd83510dfa98f8268e8d506a799e5b00f942340`. Logs: [test.log](../../../../.codex-artifacts/simplification/backend-runtime-main-20261010/test.log), [lint.log](../../../../.codex-artifacts/simplification/backend-runtime-main-20261010/lint.log), [format-check.log](../../../../.codex-artifacts/simplification/backend-runtime-main-20261010/format-check.log).

| Acceptance row                                  | This thread's evidence                                                    | Remaining owner/action                                                                                                         |
| ----------------------------------------------- | ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| CMS/schema/publication request rewriting        | Baseline and post-cleanup native exact headers/JSON/revision proof passed | Verifier: affected content-contract selection, normal Local/private CMS/browser union on final stable tree                     |
| Commerce/runtime scheduling and configuration   | Owned composition/native RPC/D1 schedule selection passed                 | Verifier: final affected dependency union and stable runtime acceptance                                                        |
| Types, boundaries, graphs and final integration | Focused ESLint/format and retained graph investigation only               | Verifier: final package/global types, both-graph freshness, policy-compliant pnpm validate and strict OpenSpec/tasks 30.1/30.2 |

No browser/provider/release acceptance is claimed. Shared tasks, config/tooling/generated sources and graph outputs were untouched. No commit, push, deployment, service mutation or controller start occurred.

All owned commands finished. At closeout, validation slots were **0/3 held**, Local stack stopped, port 4321 free, Chrome lease free and no maintainer grant active. No persistent process was started by this slice.
