# Operator-stock implementation

**Assigned implementation and scoped checks complete; module acceptance remains deferred.** Applied all six proven findings in the existing `main` checkout. Removed **112 net production lines**, with **zero test changes and zero deleted files**. Shared tasks remain unchanged.

Implementer: `01a1269a-3eb3-7202-976e-ab29aca49895`; reviewer: `01a125bd-c48a-79d0-9a01-8ce64b5f6dfa`. The parent's explicit execution release permits implementation while preceding checkpoint acceptance is pending; it does not grant acceptance.

## Review preservation and preparation reuse

The [complete received review](../reviews/operator-stock.md) was saved using native `apply_patch`, with reviewer/turn identity and immutable raw source SHA-256 `101c4f5c822f1002dd636790e90bd9953f0871b7fabf716eb68ec62651adf5d4`. An exact comparison confirmed the entire original report text remains intact after the provenance header. No historical findings, results or gaps were rewritten.

Reused SAME-thread [READONLYPREP](../../../../.codex-artifacts/simplification/parallel-high-27-operator-stock-preflight.result.json), raw SHA-256 `5ad8d00fb81558488954e480794b11613852adfc65099f6a7a557fcaa05af7b2`. Before edits, all four owned file hashes matched preparation/review exactly. This retains complete three-file production coverage, the relevant Graphify/CodeGraph evidence and bounded equivalence proofs without repeating unchanged scans. Current guarded OpenSpec status/apply context was read; state was `ready`, schema `spec-driven`, 10/60 tasks accepted.

The 35-file connected manifest was recovered from retained reviewer events and rehashed. Five files differ from review: recount application validation, its stock-use-case tests, catalog search, operator JWKS URL construction, and the authorized HTTP regression precursor. The catalog delta was already inspected in preparation. The remaining exact deltas were inspected now; none changes the selected error shape, history union, response helper, service consumer or projection semantics. Existing unrelated work was preserved.

## Finding decisions and behavior proof

| ID  | Decision and implementation                                                                                                                                                                                                        | Retained behavior                                                                                                                                                               |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Accepted: six adapters now pass `routeError` directly to `jsonError`. The classified object already contains exactly code/message/status; the helper reads it without mutation.                                                    | Route-specific safe messages, 400/404 status, earlier 409 handling, log fields/severity, request ID, problem media type, no-store and unknown-error propagation.                |
| 2   | Accepted: import the already-exported `VariantStockHistoryEntry` through the allowed stock entrypoint and dispatch to existing change/count serializers. Both former branches selected identical fields in identical order.        | Literal discriminators, null notes, ISO timestamps and invalid-date exceptions; upstream history sorting/limit; omission of service-only fields.                                |
| 3   | Accepted: existing detail projector now adds the same links/actions; four handlers pass the validated route `variantId` explicitly.                                                                                                | Separate body/link identities, path encoding, link/action order, current revision, projection/calendar evaluation order, fresh readback, success logging and JSON 200/no-store. |
| 4   | Accepted: remove unused private group names/records and flatten the four readonly path arrays directly.                                                                                                                            | All 20 paths and ordering, discovery route references, mutable exported array, inferred path type and OpenAPI contracts.                                                        |
| 5   | Accepted: replace two conditional temporary-object spreads with ordinary optional quantity properties. Installed Hono 4.13.9 serializes them through `JSON.stringify`; the intermediate helper does not inspect property presence. | Undefined omitted from wire JSON; zero retained; no new defaults; optional schemas and display-name condition unchanged.                                                        |
| 6   | Accepted: delete the service's discarded detail `itemType` member. Its only production consumer explicitly projects it away; catalog lookup returns a plain record.                                                                | Catalog query and validated display name remain; inventory/search item types and filters unchanged; no detail field added.                                                      |

No finding was rejected. Retained application validation, null/zero/omitted revisions, retry identities, authentication, atomic persistence, request-scoped services, trace/log order and awaited `finally` cleanup. No generic handler factory, new dependency, interface, configuration or abstraction was added. No runtime speed improvement is claimed.

## Regression precursor and scoped results

Inspected the authorized connected-test delta and immutable [precursor handoff](../../../../.codex-artifacts/simplification/http-stock-regression-precursor.result.json) plus completion events, source-bound report and native evidence. Raw precursor SHA-256: `6569362cb97ab23fabf1cc0ada22ba793463c140ff378fa8469a3ad289dde15e`. The current test hash matched its recorded `72932ee3dcd973c72ee6733cd14fd2e1bce9d3e0e34969cc44c67d2200accbd1`.

Its five meaningful success cases protect empty/mixed history, successful count serialization, and both low-stock settings with undefined/zero quantities, fresh revision, complete explicit fields, ordered links/actions and omission of private fields. All pre-existing authentication/revision/idempotency/error tests remain. Baseline 226/226 passing evidence was reused only as pre-deletion proof; it was not treated as implementation acceptance. No duplicate or undiscovered nested-root tests were added.

| Command/check                                                                         | Actual result                                                                                                                                                                                                    |
| ------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm openspec:guard`; guarded status and apply instructions                          | Exit 0; current context read before edits.                                                                                                                                                                       |
| `pnpm test operator-stock`                                                            | Exit 0; delegated public-commerce-http ran with **0/2 Nx cache hits**. Native JSON: **226/226 tests, 0 failures, 20 files**; all 29 stock HTTP cases and all five precursor cases passed after production edits. |
| Changed-file `pnpm exec eslint` for the three owned TypeScript files                  | Exit 0; existing boundary descriptor/rule deprecation warnings only.                                                                                                                                             |
| Changed-file `pnpm exec prettier ... --check` for those same three files              | Exit 0; no formatter writes or formatting-only reduction credit.                                                                                                                                                 |
| Scoped `git diff --check`, full-review preservation, final owned/connected comparison | Passed. Production hashes match the linted/tested tree; all 35 tracked connected hashes match execution-start bytes.                                                                                             |

[Checks and native counts](../../../../.codex-artifacts/simplification/operator-stock-implementation/checks.json), [post-refactor native HTTP report](../../../../.codex-artifacts/simplification/operator-stock-implementation/native-reports/public-commerce-http.json), [test log](../../../../.codex-artifacts/simplification/operator-stock-implementation/test.log), [lint log](../../../../.codex-artifacts/simplification/operator-stock-implementation/lint.log) and [format log](../../../../.codex-artifacts/simplification/operator-stock-implementation/format.log) retain actual outcomes. No broader consumer selections or repeated passing runs were started.

## Changes and source identities

| Exact changed production path                                              |  Added | Deleted | Net removed |
| -------------------------------------------------------------------------- | -----: | ------: | ----------: |
| `apps/backend/src/interfaces/http/stock/internal-contracts.ts`             |     26 |      38 |          12 |
| `apps/backend/src/interfaces/http/stock/internal-stock-services.ts`        |      0 |       1 |           1 |
| `apps/backend/src/interfaces/http/stock/register-internal-stock-routes.ts` |     51 |     150 |          99 |
| **Production total**                                                       | **77** | **189** |     **112** |

Test additions/deletions: **0/0**. Source files added/deleted: **0/0**. The module-28 precursor's 145 physical test lines and five cases belong to that owner and are excluded from this module's totals. Audit Markdown and ignored evidence are also excluded. Actual reduction is one line greater than the review estimate because the history dispatcher/import layout is smaller; no arbitrary deletion quota was used.

Before/after HEAD: `f7b019ca043e5f082c5b7aca67c4f0dbb3685ed0`.

- Owned before: `1cc7f34bc983e54b067be0d56df4595c66872273489e8a33a2d7ff211ea58a44`.
- Owned after: `a38c3cd475cec6aee4067f8507b3e1e59b08d3e36eb01372ac69895292324009`.
- Connected before/after: `e3e9569e23f3908f576f494cd6dbcd705fec82c081eebf0fa7b07ee3946a19e1`.
- Full manifests: [before.json](../../../../.codex-artifacts/simplification/operator-stock-implementation/before.json), [after.json](../../../../.codex-artifacts/simplification/operator-stock-implementation/after.json). Aggregation uses sorted repo-relative forward-slash paths, a space and lowercase raw-byte SHA-256, LF joined without a trailing LF, then UTF-8 SHA-256.

These identities cover the recorded owned/connected inputs, not a claim that the entire concurrently edited checkout was stable.

## Acceptance gaps and resource state

| Acceptance row                                                    | Scoped evidence                                                                                                      | Remaining verifier-owned gate                                                                                         |
| ----------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Commerce/checkout/stock                                           | Post-deletion delegated API/Worker tests; distinct wire regressions and protected routes retained.                   | Combined affected evidence and normal Local/runtime/browser union acceptance; required stock/D1 integration evidence. |
| Boundaries/contracts                                              | Existing module metadata unchanged; permitted type entrypoint; OpenAPI ordered-path suite; changed-file lint passed. | Final backend/package types, architecture/global checks and final-current-tree `pnpm validate`.                       |
| Workflow/graph                                                    | Complete full review and source-bound implementation evidence saved.                                                 | Both-graph final freshness, strict OpenSpec and task-30 gates; verifier alone updates module acceptance markers.      |
| Shell/player, visual design, CMS/publication and release/provider | No selected behavior changed.                                                                                        | Not applicable to this module's edits.                                                                                |

The module has no dedicated typecheck target. No bespoke compiler loader or package-wide bypass was used; backend/package types remain an explicit final verifier gate. The retained bounded reviewer probes are historical equivalence evidence, not post-edit HTTP/D1/type acceptance.

All launched test/lint/format sessions exited; the scoped runner released its managed slot on exit. No runtime/browser/provider resources were started. No shared tasks, other reports, operational tooling, generated sources, graph outputs, commits, pushes, branches/worktrees, deployments or external services were changed. Module acceptance remains unchecked.
