# web-platform implementation handoff

**Status: completed for the assigned implementation and focused checks.** Findings 1 and 2 were independently verified against current sources and implemented in the existing `main` checkout at `C:/Users/SVall/WebstormProjects/blackbox-records`. Combined-tree validation and browser acceptance remain with the persistent verifier. This report does not mark OpenSpec task 4.2 complete.

- Change: `simplify-main-site-modules`; module 4/29, `web-platform`.
- Ownership: `apps/web/src/platform`; no nested project root was present.
- Reviewer thread: `01a1254f-c525-7510-b076-d9680a842172`.
- Fresh implementer thread: `01a1257e-ee26-73e1-8251-37104454413d` (observed `CODEX_THREAD_ID`).
- Date: 2026-10-10.
- Complete received review, including its source identity and rejected alternatives: [reviews/web-platform.md](../reviews/web-platform.md).

## Verified decisions

| Finding ID | Decision | Current proof and resulting change                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| ---------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1          | Accepted | Repository-wide symbol/path searches immediately before deletion found only `createConfiguredPublicApiFetcher` and its isolated tests. The exact Graphify symbol has only the retained resolver/factory, its containing file and its test as neighbors. CodeGraph returned the current wrapper and connected public clients. The wrapper is absent from the module's declared public entrypoints. Deleted the wrapper and its owned test file without changing any caller. |
| 2          | Accepted | Both branches selected the same `information?.terms.delivery.summary ??` fallback. Store Item renders the default branch; checkout's `DeliverySummary` renders the compact branch. The static reader returns a JSON-backed record or `null`, and the shared schema requires dispatch and delivery sections. Hoisted the existing value above the presentation branch and reused it in both branches. Complete static markup matched in 24 before/after cases.              |

**Rejected actionable finding IDs: none. Deferred actionable finding IDs: none.** The received review's unnumbered rejected alternatives remain rejected and untouched: scroll interface/cleanup, modal-lock tokens and idempotent release, scroll alignment/fallbacks, preview validation/readiness, hosted/static purchase-reader contracts, image allowlists and fallback stages, date wording, estimate ordering/withheld values, safe prose rendering, and URL matching/base handling. The final source manifest proves those owned files were not changed. Their original reasons remain in the received review; no behavior fix or ownership expansion was needed.

The live public API paths still instantiate `createPublicApiFetcher` directly at `public-checkout-api.ts:29`, `:77`, `:157` and `:164`. `public-checkout-presentation.ts:11–12` still resolves absent configuration to `''`; `StorePreorderShowcase.tsx:21` still calls `getPublicBackendBaseUrl` directly. The retained factory still configures `cache: 'no-store'`. Its creation, MSW success/error-response and public/internal no-store tests were re-read from the concurrently updated shared-package file. Those shared files were not edited by this implementer.

## Exact final edits and reductions

| File                                                       | Final edit                                                 | Added lines | Removed lines | Net reduction                        |
| ---------------------------------------------------------- | ---------------------------------------------------------- | ----------- | ------------- | ------------------------------------ |
| `apps/web/src/platform/lib/backend/api-client.ts`          | Deleted unused private wrapper                             | 0           | 13            | 13 production lines                  |
| `apps/web/src/platform/lib/backend/api-client.test.ts`     | Deleted the two tests of that unused wrapper               | 0           | 16            | 16 test lines                        |
| `apps/web/src/platform/components/PurchaseInformation.tsx` | Reused the existing delivery-summary value in both layouts | 4           | 9             | 5 production lines                   |
| Total                                                      | Two files removed; one source file simplified              | 4           | 38            | **34 lines: 18 production, 16 test** |

Also saved this implementation report and the complete received review at their assigned change paths. A temporary owned rendering probe was removed after comparison and its exact source archived under ignored evidence. It is not a retained source/test change. No other implementation root, content file, generated source, migration, configuration or module metadata was edited. No new dependency, helper abstraction, interface or compatibility facade was introduced. No performance or bundle-size improvement is claimed.

## Retained behavior and regression coverage

The deleted test file contained only two assertions about an unexercised internal wrapper: absent configuration produces `null`, and a created fetcher exposes `.configure`. Retained `public-backend-config.test.ts` covers unset/blank configuration, trimming and trailing-slash normalization. Retained `packages/api-client/src/client-factories.test.ts` covers actual factory creation, mocked checkout responses, error JSON and no-store configuration. No exercised production-path regression is lost.

All seven remaining owned test files are byte-identical to the pre-edit versions and passed. They retain URL/base handling, availability copy, date and preorder estimates, image sizing, public-image fallback/security, backend configuration, rich prose/escaping, purchase documents, production draft suppression and the inline-data build contract. `DeliverySummary.test.tsx` remains unchanged and passed within the named checkout suite, covering quoted amounts and tax modes, loading/unavailable quotes, drawer copy and custom-price states.

The temporary probe compared `renderToStaticMarkup` output for **24 cases**: default and checkout presentations × `null`, schema-validated ordinary text and schema-validated rich delivery prose × development/production flags × `/` and `/blackbox-records/` base paths. The ordinary text included `<` and `&`; the rich fixture contains formatting, links, lists and alignment. Each complete HTML string matched exactly. This preserves classes, visible copy, escaping, link URLs/order/attributes, conditional privacy links, draft notices, `data-purchase-information`, and dispatch-before-delivery markup. The nullish-coalescing operator, fallback text and Prose renderer are unchanged. This proves renderer equivalence for those cases, not live browser or hosted acceptance.

## Commands and actual results

Every shell call used `login:false` and the explicit Windows PowerShell path. Ordinary edits used native `apply_patch`.

| Command/check                                                                                                         | Result                                                                                               | Evidence                                                                 |
| --------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| `pnpm openspec:guard`                                                                                                 | Passed before OpenSpec/source edits                                                                  | Tool result; guard exited successfully                                   |
| `pnpm openspec -- status --change simplify-main-site-modules --json`                                                  | `spec-driven`, repo-local planning                                                                   | All returned context paths were read                                     |
| `pnpm openspec -- instructions apply --change simplify-main-site-modules --json`                                      | Ready; 6/60 complete, 54 remaining at start                                                          | Read proposal, design and tasks; no shared checkbox updates              |
| Graphify exact wrapper symbol and PurchaseInformation file explanations, `--budget 2500`                              | Relevant extracted relationships resolved without relying on omitted edges                           | `graphify-wrapper.txt`, `codegraph-owned.txt`, `codegraph-connected.txt` |
| Scoped repository-wide wrapper symbol/import search before deletion                                                   | Only the wrapper and its own tests                                                                   | `pre-deletion-reference-check.txt`                                       |
| `BLACKBOX_PLATFORM_RENDER_PHASE=before pnpm test apps/web/src/platform/lib/purchase-information-equivalence.test.tsx` | Passed; wrapper selected 12 affected web projects, **0/12 cache hits**; saved 24 baseline HTML cases | `before-test.log`, `before-html.json`                                    |
| `BLACKBOX_PLATFORM_RENDER_PHASE=after pnpm test web-platform` with temporary probe                                    | Passed: **8 files, 48 tests**, **0/1 cache hits**; all 24 HTML cases equal                           | `after-equivalence-test.log`, `after-html.json`                          |
| `pnpm test web-platform` after removing probe                                                                         | Passed: **7 files, 47 tests**, **0/1 cache hits**                                                    | `final-module-test.log`                                                  |
| `pnpm test checkout-web`                                                                                              | Passed: **8 files, 130 tests**, **0/1 cache hits**; includes unchanged `DeliverySummary.test.tsx`    | `checkout-consumer-test.log`                                             |
| `pnpm exec eslint apps/web/src/platform/components/PurchaseInformation.tsx`                                           | Exit 0; existing boundaries-plugin deprecation warnings only                                         | `eslint.log`                                                             |
| `pnpm exec prettier apps/web/src/platform/components/PurchaseInformation.tsx --check`                                 | Passed                                                                                               | `prettier.log`                                                           |
| `git diff --check -- apps/web/src/platform`                                                                           | Exit 0                                                                                               | `after-source-identity.txt`                                              |
| Post-edit wrapper reference search / owned untracked-file check                                                       | No wrapper references in code; no untracked module source files                                      | `owned-diff-and-final-reference-check.txt`, `after-source-identity.txt`  |

The file-based baseline test command expanded to 12 consumers through the repository's affected-file wrapper. Later runs deliberately used named module targets to keep selection bounded. The named `checkout-web` target includes the requested DeliverySummary regression file without repeating the file wrapper's broader affected selection. Baseline consumer results do not establish acceptance of the final combined tree.

No module-scoped lint/typecheck target exists in `web-platform/project.json`; it declares `test` and `test-watch`. Scoped changed-file lint passed. Package TypeScript/Astro checks are deferred to the verifier's `pnpm validate`: feedback policy prohibits standalone `tsc`/`astro check` and whole-package check bypasses, and this assignment reserves shared validation for the verifier. No guard override or maintainer grant was attempted.

## Source identity and evidence

- Branch before/after: `main`.
- HEAD before/after: `3355c335226838f996efb5536f55271f819a3e14`.
- Pre-edit module fingerprint: `32e04d089ad30dc35d38159dae3d1f2311de0d3b130f83990b15d120da2bae4e` (**24 tracked files**, exactly matching the review).
- Post-edit module fingerprint: `0989d428b9098a9d0981b824291a2734f4045219fd732a6656538ab499da8571` (**22 present tracked files**, with both deleted tracked paths recorded separately).
- Fingerprint algorithm: ordered `git ls-files -- apps/web/src/platform` paths; lowercase SHA-256 of each present file's raw bytes; `path + SPACE + hash`; join with LF without a final LF; SHA-256 of the UTF-8 manifest. Absent deleted files are omitted after deletion and listed explicitly in the evidence. The transient probe is excluded from these tracked-source fingerprints and was removed from final source.

| Finding file                         | Before SHA-256                                                     | After SHA-256                                                      |
| ------------------------------------ | ------------------------------------------------------------------ | ------------------------------------------------------------------ |
| `lib/backend/api-client.ts`          | `f872a8b147c2b683aa6d35a6f7a5070eaba697c1f019018f548f8710c5871b71` | Deleted                                                            |
| `lib/backend/api-client.test.ts`     | `993dbc5d337f180350ad2877645853179efc52db33c8657dba00534bddd1909d` | Deleted                                                            |
| `components/PurchaseInformation.tsx` | `f63831ea6ceb38cb9be36930aff3650f001158d8302f4712880634029f0efd51` | `9015f3398ba4f4dcfd7703cfa2b5bf6432e53fb4b13bdd8c92ea21c03d42825f` |

All transient evidence is under `.codex-artifacts/simplify-main-site-modules/web-platform/`. It contains raw command logs, before/after source manifests, complete before/after HTML outputs, `html-equivalence-summary.json`, the archived probe source, graph excerpts, and the owned diff/reference check. The latter also records final raw-byte hashes for connected checkout sources/tests, the shared factory and its retained test, and the purchase schema. These results cover their recorded module/consumer source identities; concurrent edits in other modules remain outside this implementation's acceptance claim.

## Acceptance rows and verifier follow-up

| Acceptance row                  | This implementation's evidence                                                                                                                  | Remaining coordinated acceptance                                                                                                           |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Commerce/checkout/stock         | Module tests, 24 complete renderer comparisons and 130 checkout consumer tests passed; live client/configuration and Worker authority unchanged | Verifier-owned Local browser acceptance of affected Store Item/checkout surfaces; provider/payment mutation is not needed for this cleanup |
| Boundaries/tooling/instructions | Wrapper is not a declared entrypoint; boundary metadata unchanged; scoped ESLint and owned diff/reference checks passed                         | Final combined `pnpm validate`, package lint/type checks, architecture/boundary checks and strict OpenSpec validation                      |
| Shell/player/routing            | No scroll, routing, overlay, player or lock source changed; baseline selected shell consumers passed                                            | Verifier chooses required combined-tree continuity checks; no browser acceptance was claimed here                                          |
| CMS/schema/publication          | Owned content, schema, readers, draft gating and inline-data contracts unchanged; retained publication/prose tests passed                       | Hosted/private-preview acceptance was not run; no CMS/staff/provider mutation was performed                                                |
| Release/environment             | Two base-path renderer variants matched; no environment/release code changed                                                                    | No release or hosted acceptance requested or claimed                                                                                       |

While implementers are idle, the verifier should refresh Graphify once for the combined code batch, run source-bound `pnpm validate`, and run the applicable Local browser paths. The received review recommends `e2e/international-order-item.spec.ts` and the `the checkout pay control fills in place when the shipping quote arrives` case in `e2e/store-cart.spec.ts`. The verifier owns strict `pnpm openspec -- validate simplify-main-site-modules --type change --strict`, shared task updates and the final validation record.

No implementation blocker or unrelated failure remains in this module. Shared checks, live browser/private-preview acceptance, hosted builds/providers and final combined-tree acceptance were not performed by this implementer. No shared graph output, tasks.md, external service, branch/worktree, commit, push, deployment, publishing action or API credential was changed.
