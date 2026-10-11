# Email application implementation

Implementation and published scoped checks are complete. **Module acceptance remains pending** with the persistent verifier; tasks 22.1/22.2 and shared checkpoints were not edited. Work stays in the existing main checkout. All four findings were implemented within the assigned root.

## Provenance and source identity

Implementer: `01a12681-0be2-7293-b52d-822d2e684496`; reviewer: `01a12582-cc15-7a33-a1ad-3e8119934819`, review turn `01a12582-d591-7d22-ba15-5edbc0dcb50e`. The [complete received review](../reviews/email-application.md) is preserved verbatim after its provenance header. Its immutable JSON raw SHA-256 is `bd3a5a4bd20bac9964b17016fbc6573d479171a8f6df81f1537646e8346e053b`. The same-role [preparation](../../../../.codex-artifacts/simplification/parallel-high-22-email-application-preflight.result.json), turn `01a12681-1c02-7d10-9352-a7b2acf9cd4a`, has raw SHA-256 `8c5ddb7f30e5158d0b7c49c9b8f6e687afb4ed33efe939be628e7ac7aad255ce`. Both supplied hashes matched before editing.

Before and after HEAD: `f7b019ca043e5f082c5b7aca67c4f0dbb3685ed0`.

| Inputs                           | Before SHA-256                                                     | After SHA-256                                                      |
| -------------------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------ |
| Entire owned module, 25 files    | `475597777c9b4e7c39438946e516004477a37000e037967db035ccecfd3860ee` | `041b44caa2e6b43b6514cc1bf3ebffd9ba3b8096842426535ae8240a2120d1e8` |
| Ten connected sources            | `7165a99887bf5f3b5ebdc033ad294f9dff9e81854e651bd33593b3e5fa7d962c` | Same                                                               |
| Three connected regression tests | `db34f03fda0af6bee3d05ebb879b9ca4efb3b775e4586c9e2ae367709055b282` | Same                                                               |

Aggregates hash sorted repository-relative path + NUL + file SHA-256 + LF. [Before](../../../../.codex-artifacts/simplify-main-site-modules/email-application/before.json) and [after](../../../../.codex-artifacts/simplify-main-site-modules/email-application/after.json) retain exact per-file identities; the [summary](../../../../.codex-artifacts/simplify-main-site-modules/email-application/summary.json) retains check outcomes and reduction accounting.

The whole-module inspection, Graphify relationships, CodeGraph source/callers, independent preparation proofs and connected assertions were reused only after all covered owned/caller/test inputs matched. No owned or connected delta existed at execution entry. All five changed owned deltas were subsequently inspected. No nested roots exist. Boundary metadata, `index.ts`, provider SPI, dependencies, all tests and snapshots remain unchanged.

## Finding decisions and proof

1. **Accepted: one HTML escape implementation.** The three chained helpers had the same five replacements; withdrawal had the same character/entity mapping. Ampersands are escaped first, so later inserted entity ampersands are not revisited. Exported the existing internal `templates.ts` helper, imported it in the three consumers, removed two copied functions and withdrawal's inline table. Insertion points, plain text and withdrawal's security comment remain. No new public entrypoint was added.
2. **Accepted: one routing decision.** Both routers used the identical UAT-policy/truthy-override condition. Newsletter now translates the transactional result into its original `contactEmail`, `intendedSubscriberEmail`, `isSinkRouted` shape and property order. Caller validation, provider writes, consent properties, sink evidence and PRD suppression remain unchanged.
3. **Accepted: remove ineffective private settings.** The only summary caller always supplied `includeVariant: true`; its private row helper had no other caller. Removed the option allocation/parameters/false branch while retaining variant metadata, ordering, filtering, image/no-image markup and alt text. The private palette had 52 direct property reads and no computed/whole-object use; only unread `accent` and `textSubtle` entries were deleted. Every used visual value remains.
4. **Accepted: build ops money once.** The synchronous renderer repeatedly formatted the same saved plain order facts with no mutation/external work. One local rows array now supplies HTML and text; one formatter after the unchanged missing-breakdown guard formats its three amounts. Preserved `en-IE`, EUR, division by 100, labels/order/VAT wording and separate total/shopper formatting. Complete breakdown construction falls from three to one and its formatter construction from nine to one; this is a source-proven count, not measured CPU or latency evidence.

No numbered finding was rejected or crossed ownership. Rejected alternatives remain rejected: merging distinct frames; deleting trust-boundary validation, configuration schemas or optional-result fallbacks; collapsing non-idempotent tag sanitization; parallelizing shopper/ops sends; deleting fixtures, exported fields or tests without distinct-coverage proof. No abstraction, dependency, provider operation, persistence change or unrelated behavior fix was introduced.

## Exact changes and reductions

All production paths below are relative to `apps/backend/src/application/email`.

| File                      | Raw net lines removed | Nonblank net lines removed |
| ------------------------- | --------------------: | -------------------------: |
| `paid-order-templates.ts` |                    16 |                         16 |
| `routing.ts`              |                     7 |                          6 |
| `services-inquiry.ts`     |                     9 |                          8 |
| `templates.ts`            |                     0 |                          0 |
| `withdrawal-email.ts`     |                     3 |                          3 |
| **Total**                 |                **35** |                     **33** |

**Production reduction excluding formatting: 27 lines. Test reduction: 0 lines. Deleted production/test files: 0/0.** The conservative production figure subtracts six layout-only contractions from the 33 nonblank-line reduction: two in the shortened row-helper signature and four in the metadata array. Blank-line changes and both required audit Markdown files are excluded. No test case or scaffolding was removed.

## Retained behavior and focused evidence

The final module run passed all five files / 79 tests, uncached. Existing seven preview snapshots remained unchanged, preserving complete HTML/text for shopper, ops, estimates and availability, including ops variant metadata and omitted-breakdown output. Retained assertions also cover escaping, direct/sink routing, consent, complete/manual/zero-VAT monetary output, failures, retry identity, ordering and privacy. The review's missing-money/zero-delivery assertions specifically cover shopper output; ops omitted-breakdown coverage is the retained snapshot.

| Command                                                                           | Actual result                                                    | Evidence                                                                                                                       |
| --------------------------------------------------------------------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `pnpm openspec:guard`; guarded status/apply context reads                         | Passed; spec-driven, ready, 10/60 shared tasks checked           | Execution tool output; all current returned context files read                                                                 |
| `pnpm test email-application`, final formatted source                             | Passed, 5 files / 79 tests, 0/1 cache hits                       | [Final log](../../../../.codex-artifacts/simplify-main-site-modules/email-application/test-email-final.log)                    |
| `pnpm test apps/backend/src/application/commerce/orders/order-withdrawal.test.ts` | Passed, all 7 selected projects, 0/7 cache hits                  | [Connected log](../../../../.codex-artifacts/simplify-main-site-modules/email-application/test-withdrawal.log)                 |
| `pnpm exec eslint apps/backend/src/application/email --max-warnings=0`            | Passed; existing boundary-configuration deprecation notices only | [Lint log](../../../../.codex-artifacts/simplify-main-site-modules/email-application/lint.log)                                 |
| Scoped Prettier check of five changed source files                                | Passed after scoped normalization                                | [Formatter log](../../../../.codex-artifacts/simplify-main-site-modules/email-application/format.log); final check tool output |
| `git diff --check -- apps/backend/src/application/email`                          | Passed                                                           | Execution tool output                                                                                                          |

The published file selector ran orders, checkout-integration, public-commerce-http, catalog-sync-integration, stock-integration, backend-runtime and cms-integration. `orders:test` includes both withdrawal and paid-order-delivery regressions; a second broad paid-order selector was not started. These passing selected tasks are partial evidence, not final combined acceptance.

Historical [first module run](../../../../.codex-artifacts/simplify-main-site-modules/email-application/test-email.log) passed 79 tests before final formatting. The first formatting check identified two files; the scoped formatter resolved them, and the final-source module run was fresh and uncached. These earlier outcomes remain recorded rather than relabelled as final-source evidence.

## Acceptance gaps and resource state

| Acceptance row                                       | Disposition                                                                                              |
| ---------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Owned email behavior and connected order regressions | Scoped checks above passed; source proofs and meaningful coverage retained                               |
| Commerce/environment runtime                         | Verifier owns source-bound normal Local union acceptance after writers are idle                          |
| Boundaries/tooling and integration                   | Verifier owns combined affected checks, both-graph freshness and strict OpenSpec                         |
| Backend/package/global types                         | Deferred to verifier; no module-specific typecheck target exists; no bespoke compiler loader was created |
| Browser/email-client/provider delivery               | Not established; no hosted/provider mutations authorized                                                 |
| Final task 30 and module acceptance                  | Verifier owns final-current-tree `pnpm validate`, package/types and strict gates; tasks remain unchecked |

Graphify's preparation query used budget 2500; its truncation was resolved for the relevant relationships through targeted explains and bounded adjacency reads. CodeGraph omissions in templates/tests/barrel source were filled with exact reads during preparation. Byte-matched evidence was reused; no graph write or refresh ran here.

All started test/lint/formatter command sessions finished. No own checks remain running; no services, browsers, controllers or persistent helpers were started. Other owners' processes and work were preserved. No shared task/config/tooling/generated edits, commits, pushes, deployments or provider mutations occurred.

Not checked here: final combined tree, package/global types, normal Local/browser/email-client acceptance and hosted delivery. Completed means assigned implementation and scoped checks only.
