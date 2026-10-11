What this change does: Module 24/29, `stripe-integration`, implements all six independently verified review findings. It removes duplicated SDK typing, unnecessary line flattening, repeated string/currency/object checks, and eight unused mock properties. Every existing test case and assertion remains.

**Status:** Assigned implementation and owned scoped checks complete. Module acceptance remains unchecked and belongs to the persistent verifier. Parent explicitly released execution while deferring preceding checkpoint acceptance; this handoff does not establish acceptance.

**Identity and scope**

- Checkout: `C:/Users/SVall/WebstormProjects/blackbox-records`, existing `main`; no branch/worktree, commit, push, deployment, or hosted/provider mutation.
- Implementer: `01a1268b-050e-7410-a500-ddda589165ad`.
- Separate reviewer: `01a1259d-cebc-7921-9d1a-aa11493d5937`, review turn `01a1259d-d625-7e82-9a97-5d152059b436`.
- Completed READONLYPREP turn: `01a1268b-2436-7cf2-ac9c-2a2c3d99c630`; preparation established no implementation/acceptance.
- Immutable review JSON SHA-256: `fb42bba3356aab4dca488411ef93a7a374cd76f3ddfff901efa0b249076720e8`.
- Immutable preparation JSON SHA-256: `ea082445e4757135809c1bba17e584b760cf633245cb5cca8e9e804e0c40cc5a`.
- Editing ownership: `apps/backend/src/infrastructure/stripe`, excluding generated/nested/other roots. Ten owned files, no nested module roots. Module declaration and public exports unchanged.

The complete received review, reviewer identity, and historical source identity are preserved in [the review](../reviews/stripe-integration.md). Formatting is normalized without removing report content; the immutable raw JSON and event history remain untouched.

**Current source recheck and retained full coverage**

All ten owned files exactly matched preparation/review before edits, with no owned diff against reviewer HEAD `3355c335226838f996efb5536f55271f819a3e14`. The completed whole-module inspection and Graphify/CodeGraph context were reused for byte-identical covered inputs. Current changed callers were inspected instead of repeating unchanged scans.

The two catalog-sync caller deltas already inspected in preparation remain: `catalog-reconciler.ts` simplifies single-default handling, mutation-context calls and its sequential wrapper; `types.ts` reuses the equivalent expected-price type. Since preparation, `checkout/start-checkout.ts` removed its duplicate tax-mode guard/import, retaining `isAcceptedDeliveryCategory` and the same gateway request. The gateway's own monetary/trust-boundary validation remains. These three changed captured files preserve compatibility; the other 26 of 29 captured caller/dependency files match review. All 29 match execution entry through closing capture.

| Identity                               | Before execution                                                   | After implementation/checks                                        |
| -------------------------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------ |
| HEAD                                   | `f7b019ca043e5f082c5b7aca67c4f0dbb3685ed0`                         | `f7b019ca043e5f082c5b7aca67c4f0dbb3685ed0`                         |
| Owned aggregate                        | `f2bc96dfe3082a16d901c6dc306ad7c917b824720f5292678469bdbd1a8901c9` | `07dba0aa0a85f4ebbab9e48ea00ccc8efdfa49da0c63a8fd51e8847259b4faf9` |
| 29 caller/dependency aggregate         | `da5bb0ffb7f98df17256cd06f9b2076dc41723674f1e6b648c96142e0f82edee` | `da5bb0ffb7f98df17256cd06f9b2076dc41723674f1e6b648c96142e0f82edee` |
| Seven recorded config/toolchain inputs | `fdc2469662b16dc0e0f472c7e509894e26e637197a49dc123a5439bb71ae72a2` | `fdc2469662b16dc0e0f472c7e509894e26e637197a49dc123a5439bb71ae72a2` |

Aggregate SHA-256 hashes sorted `relative/path:lowercase-file-sha256` entries joined with LF, without terminal LF. Full per-file entries are retained in [before evidence](../../../../.codex-artifacts/simplification/stripe-integration-execution-before.json) and [after evidence](../../../../.codex-artifacts/simplification/stripe-integration-execution-after.json). Caller/config drift was empty; shared tasks matched their entry hash.

**Every finding decision**

| ID  | Decision and concrete proof                                                                                                                                                                  | Implemented edit and retained coverage                                                                                                                                                                                                                                                                                                        |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Accepted. Installed Stripe 22.6.2 already defines `Price.product` as `string \| Product \| DeletedProduct`; the private intersection added no guarantee and was not exported.                | Delete the alias and two assertions; use `Stripe.Price` and `Stripe.Price['product']`. Both expansion requests, Product string/deletion handling, metadata/tax-code conversion and response evidence remain. SDK declaration is hash-matched.                                                                                                 |
| 2   | Accepted. Every successful line callback returned exactly one object inside a one-element array; it never filtered or expanded a line. Dense provider pages are collected before conversion. | Use `map`, returning the same object. Preserve full pagination before conversion, field-expression/evaluation order, malformed-line error, cursor guards, quantity/Price parsing and monetary evidence. Pagination/custom-bound, malformed-line and exact finalized-result cases remain and pass.                                             |
| 3   | Accepted. The private optional-string helper already rejects non-strings; both native-string trim calls produced the same value.                                                             | Pass fallback email directly and trim once. Preserve primary preference, nullish fallback, whitespace-to-null and shipping-only fulfillment sources. Blank/whitespace primary, trimmed fallback and non-string equivalence is source-proven; existing suites are retained, without claiming they cover every email normalization combination. |
| 4   | Accepted. Both private matcher paths receive `toCatalogPrice` output: bootstrap via `listPrices`, replacement via immediate mapping. Currency is already uppercase or null.                  | Remove only Price-side uppercasing; retain input uppercasing, tax/kind and fixed/custom comparisons. Null still mismatches a string; supported lowercase bootstrap input remains equivalent. Replacement retains strict EUR input validation. Interrupted bootstrap and fixed/custom recovery cases pass.                                     |
| 5   | Accepted. The not-found helper can return true only after its object/non-null/status checks.                                                                                                 | Annotate `error is object`; delete the caller's repeated object/null guards. Keep helper runtime body, numeric status coercion, `'code' in error`, exact `resource_missing` and propagation. Missing/deleted/unpriced/service-error/wrong-endpoint-404 cases remain and pass.                                                                 |
| 6   | Accepted. Constructors retain arguments; targeted creation/finalized-line paths use only `sessions.create`/`sessions.listLineItems`. Catalog bootstrap never calls `prices.update`.          | Delete six Checkout mocks and two catalog mocks. Every test, used mock, request/result assertion, shipping/contact/quantity/newsletter check and fixed/custom bound check remains and passes.                                                                                                                                                 |

No numbered finding rejected or deferred. No cross-root implementation was needed. No new helper, abstraction, dependency, test case, or assertion was added.

**Exact changed code files and reductions**

| Owned file                               | Findings | Production net lines removed | Test net lines removed |
| ---------------------------------------- | -------- | ---------------------------: | ---------------------: |
| `stripe-catalog-gateway.ts`              | 1, 4, 5  |                            5 |                      0 |
| `stripe-checkout-gateway.ts`             | 2        |                            2 |                      0 |
| `stripe-checkout-session-state.ts`       | 3        |                            0 |                      0 |
| `stripe-checkout-gateway.worker.test.ts` | 6        |                            0 |                      6 |
| `stripe-catalog-gateway.worker.test.ts`  | 6        |                            0 |                      2 |
| Total                                    | 1–6      |                        **7** |                  **8** |

Production physical net reduction is 15 lines. Excluded from the seven-line substantive reduction: one now-unused blank separator, five lines from formatter compaction of the surviving not-found condition, and two lines from formatter compaction of the surviving email expression. Indentation/reflow, audit Markdown and ignored evidence are excluded. Test physical/substantive reduction is eight lines. **Deleted files: 0. Deleted test cases/assertions: 0.** Finding 3 removes duplicate work without claiming formatter compaction as code removal.

**Checks and actual outcomes**

- `pnpm openspec:guard`: exit 0.
- Guarded `pnpm openspec -- status --change simplify-main-site-modules --json` and `pnpm openspec -- instructions apply --change simplify-main-site-modules --json`: exit 0; spec-driven, ready, 10/60 accepted tasks. All current apply context files (proposal/design/tasks) read; explicit parent execution override governs task acceptance.
- `pnpm test stripe-integration`: exit 0, **4 Worker files / 45 tests passed**, one Nx target, **0/1 cache hits**, 16.7s reported run duration. Existing [test/Nx output](../../../../.codex-artifacts/simplification/stripe-integration-execution-test.log) retains the native result. Scoped runner did not configure the optional JSON reporter; no second run was started for counts.
- `pnpm exec eslint <the five changed owned files>`: exit 0. Existing boundary-plugin deprecation warnings only; [lint log](../../../../.codex-artifacts/simplification/stripe-integration-execution-lint.log) retained.
- `pnpm exec prettier --write <five owned files and own review>`, then `pnpm exec prettier --check <same files>`: exit 0.
- Owned `git diff --check`: exit 0. Final report formatting and fidelity/integrity checks are recorded in [closeout evidence](../../../../.codex-artifacts/simplification/stripe-integration-execution-closeout.json).

No standalone module type target exists in `project.json`. Backend/package/global types remain a mandatory verifier gate; no raw whole-package compiler, bespoke loader or validation bypass ran. Source inspection establishes SDK/type equivalence; this handoff does not claim compiler acceptance.

**Preserved behavior and acceptance gaps**

Public interfaces and closed module boundaries stay unchanged. Preserve raw-body webhook verification/allowlists/errors, instance-local catalog cache, active/inactive and bounded recovery, default rereads and race detection, stable identities/fingerprints/idempotency, migration/setup differences, provider requests and ordering, Checkout legacy support, tax/shipping and money validation, incomplete/repeated pagination failures, creation-error classification and persistent paid fulfillment/replay. The expiry-policy discrepancy stays separate behavior work; the saved deadline and SDK retry request remain unchanged.

| Acceptance row               | Disposition                                                                                                                                                                    |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Commerce/checkout/stock      | Owned Worker suite passed; verifier still owns connected shipping/paid-reconciliation/catalog/migration/API checks and normal Local mock acceptance on stable combined source. |
| Boundaries/tooling           | Boundary declaration unchanged. Verifier owns affected package/global types, both-graph freshness, strict OpenSpec and final-current-tree validation.                          |
| Shell/player/routing         | No visual, accessibility, route or lifecycle change; any combined-batch browser union remains verifier-owned.                                                                  |
| Staff/CMS/publication        | No implementation edit; compatibility consumers retained. No publication acceptance claimed.                                                                                   |
| Release/environment/provider | No mutation/acceptance; hosted evidence remains unrun.                                                                                                                         |

No shared `tasks.md`, config/tooling/generated source, other module/report, graph output or external service was changed. Tasks 24.1/24.2 and preceding deferred pairs remain unchecked. The exclusive verifier owns final stable-tree affected checks, e2e/browser/normal Local union, both graphs, mandatory `pnpm validate`, package/global types and strict task 30 gates. Do not infer module acceptance from this completed implementation handoff.

Resource state: owned test session 34009 and lint session 27767 finished with exit 0. No controller, watcher, server, browser, provider process or persistent validation resource was started. No owned running process remains.

Not checked: package/global compilation, connected/shared runtime/browser acceptance, hosted/provider behavior and release readiness.
