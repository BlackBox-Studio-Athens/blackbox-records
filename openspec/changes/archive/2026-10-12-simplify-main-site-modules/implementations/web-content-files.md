# web-content-files implementation

Implemented received findings **1 and 2** in the existing `main` checkout. The module still verifies file snapshots and media, projects Astro collection data, and supplies the same slug exports. No validation, error handling, exported interface, dependency, or existing test was removed.

- Change: `simplify-main-site-modules`; assigned tasks: **1.1 and 1.2 only**.
- Checkout: `C:/Users/SVall/WebstormProjects/blackbox-records`.
- Reviewer thread: `01a12524-49fa-7883-950a-71af3550af22`.
- Implementation thread: `01a12535-2601-7973-b4e2-d87655ba8c73`.
- Complete received review: [reviews/web-content-files.md](../reviews/web-content-files.md).
- Source HEAD: `3355c335226838f996efb5536f55271f819a3e14`.
- Product Environment: **Local**. No hosted or provider operation was performed.

## Accepted findings and independent proof

**1 — Index Store Item bindings once per collection projection.** The original `snapshotCollection` searched the same binding array for each Release or Distro record, matching source kind and the record's slug. The replacement builds one local `Map` from newly mapped tuples in reverse order, then uses `.get()`. This follows the existing `packages/content-model/src/published-content.ts` pattern without introducing a helper or crossing module ownership.

The original `loaded.snapshot.storeItems` guard remains. Missing bindings leave `store_item` absent; an empty array assigns `null`. The key includes source kind, and reversing the newly created tuple array retains the earliest duplicate without reversing the snapshot's array. Every call builds a fresh index, and record iteration and returned data stay unchanged.

The added assertions passed against the original production implementation before the refactor. They cover empty and omitted bindings for both collections, the same slug in Release and Distro, earliest duplicate selection, and unchanged input binding order. Existing mutation-based assertions still cover fresh projections after changes to records, dates, tracklists, and bindings. Snapshot parsing still rejects duplicate bindings at the trust boundary; the duplicate projection assertion uses the already loaded in-memory object to retain the previous `.find()` behavior.

Read connected `publicContentLoader` and its collection configuration, `getStoreItemForRelease`/`listStoreItems`, shared `publishedCollection`, and the seed/catalog slug consumers. In particular, `catalog-data.ts` distinguishes `null` from omitted Store bindings, and consumes the persisted slug and variant identity. No caller adjustment was necessary.

**2 — Remove the redundant lowercase slug option.** Installed package metadata, the lockfile, and installed source independently confirm `@sindresorhus/slugify` **3.0.1** supplies `lowercase: true`. [Official versioned source](https://github.com/sindresorhus/slugify/blob/v3.0.1/index.js) confirms the default is applied before caller options. Context7 resolved a different package (`/simov/slugify`), so that result was not used as evidence.

`createSlugSuggestion(value: string): string` now returns `slugify(value)`. Its signature and export remain. An independent in-memory check under Node **v24.21.0** compared 14 strings and five invalid input cases: output, error type, and error message matched with and without the option. Existing accented-label, explicit-slug fallback, canonical Store path, mock seed, and `caregivers-vinyl-2000-eur` price-revision assertions remain.

No elapsed-time performance improvement is claimed. The change removes repeated binding searches and the explicit options allocation; no catalog latency benchmark was run.

## Rejected alternatives retained from the review

No numbered actionable finding was rejected. The review's seven rejected alternatives remain rejected after independent source/test inspection; the IDs below identify those existing alternatives rather than additional proposals.

- **R1 — Remove `readContentSnapshot` checks:** retained. Checksum syntax, pre-read file size, file/media checksums, directory containment, media size, and decoded image metadata validate filesystem input. Shared schema parsing does not replace them or preserve their earlier error sequencing/messages.
- **R2 — Replace the file projection with `publishedCollection`:** retained separately. The shared projection emits image metadata and Artist reference objects, normalizes dates/body content, and changes singleton IDs. The file projection provides relative image paths and an Artist slug string for Astro parsing.
- **R3 — Remove recursive field conversion/null filtering:** retained. Owned assertions protect nested galleries, optional dates, and service objects whose `id` does not identify the entire object as an image.
- **R4 — Cache projections across calls:** rejected. The owned test mutates the loaded snapshot between calls and requires updated output.
- **R5 — Delete schema-only snapshot assertions:** retained. They protect exact environment errors, strict manifest paths, missing revision failure, and enriched native-image validation at distinct entry points.
- **R6 — Remove slug exports or change collision grouping:** retained. Connected consumers and owned contract tests use the exports; existing `Map` grouping preserves slug/owner order and error formatting, including the behavior of numeric-looking slugs.
- **R7 — Parallelize media verification:** rejected. Sequential validation preserves which failure is reported first; no measurement justifies changing it.

## Exact changes and reduction

Production/test edits are limited to:

- `apps/web/src/lib/content-files/content-snapshot.ts`: four added lines, five removed; a local binding index replaces the repeated search. **88 → 87 lines**.
- `apps/web/src/lib/content-files/slugs.ts`: one added line, three removed; default-only option removed. **78 → 76 lines**.
- `apps/web/src/lib/content-files/content-snapshot.test.ts`: **26 added lines**, no removed assertions or cases. **257 → 283 lines**.

Production code decreased **166 → 163 lines (−3)**. Owned test cases remain **six across two files**; test lines increased by 26, for a total code/test change of **+23 lines**. `slugs.test.ts` and `project.json` are unchanged. The module remains closed with the same two entrypoint files and existing `@blackbox/content-model` permission. No nested module, caller implementation, staff/CMS implementation, generated file, migration, content, or operational tooling was edited.

Task records also changed: this implementation note, the saved complete received review (Markdown table formatting only after saving), and the checkboxes for tasks 1.1/1.2. Other tasks remain untouched.

## Checks and artifacts

Artifacts are retained under `.codex-artifacts/simplify-main-site-modules/web-content-files/` so later module checks cannot overwrite this slice's evidence.

- `pnpm openspec:guard`: **passed** before any OpenSpec/code edit. OpenSpec status/apply instructions used schema `spec-driven`, state `ready`, and named `proposal.md`, `design.md`, and `tasks.md`; all context files were read. No additional runtime context or operation guidance was returned.
- `pnpm test web-content-files`: initial clean baseline passed from Nx cache; the added assertions then passed against original production code (**2 files, 6 tests**, `regressions-before-refactor.log`). After implementation and final formatting, the final run passed **2 files, 6 tests**, uncached (`module-tests-final.log`). The earlier post-refactor result is also retained as `module-tests.log`.
- `pnpm test apps/web/src/lib/content-loader.test.ts`: **passed**, selecting eight affected web test targets (`content-loader-tests.log`).
- `pnpm test apps/web/src/lib/catalog-data.test.ts`: **passed** on the final source, selecting the same eight affected targets (`catalog-data-tests.log`): storefront-catalog, app-shell, web-layouts, web-pages, web-editorial, web-artists, web-store, and commerce-web-integration.
- `pnpm test apps/backend/test/scripts/local-mock-commerce-seed.test.ts`: selected backend-tooling plus workspace contract dependencies. The first run had **274 passed, 1 failed** in 37 files due to an unrelated migration CLI timeout (`mock-seed-tests.log`); this command is not recorded as a pass.
- `pnpm test apps/backend/test/scripts/stripe-catalog-contract.test.ts`: **passed on retry with other work finished**, including the entire backend-tooling suite and workspace dependencies (`catalog-contract-tests.log`). Cached output was then retrieved with the same command plus `--output-style=static`, without rerunning tests: **37 files, 275 tests passed**, all seven targets restored from cache (`catalog-contract-tests-cached-evidence.log`). This suite covers the five mock seed cases and 14 catalog contract cases. Earlier validation JSON found during investigation was from an older run and was not reused for acceptance.
- `pnpm test:e2e e2e/routes.spec.ts -g '(renders|phone sweep of) /(releases|store)'`: **30 passed, 0 skipped, 0 failed, 0 flaky** (`route-browser-tests.log`). Chromium desktop ran six cases, Chromium mobile 12, and WebKit mobile 12. Tested `/releases/`, `/releases/disintegration/`, `/store/`, `/store/blackbox-releases/`, `/store/distro/`, and `/store/disintegration-black-vinyl-lp/`. Phone sweeps checked 320px/390px overflow and target sizes; route cases checked response status and expected content. The original `.codex-artifacts/e2e/summary.json` was copied to `route-browser-summary.json`. Firefox has no selected cases for this spec in repository configuration.
- Scoped `pnpm exec prettier --check` for all three changed source/test files: **passed** (`source-format.log`). An initial formatting warning for the expanded map chain was corrected with native `apply_patch` before final source evidence/tests.
- Scoped `pnpm exec eslint` for the same three files: **passed**, exit 0 (`scoped-lint.log`). Existing boundary-plugin deprecation warnings remain; no lint error was reported.
- Independent slug equivalence check: **14 output comparisons and five invalid-input error comparisons passed** (`slug-equivalence.log`).
- Both Graphify and CodeGraph were used before source edits. Graphify queries used budget **2500**; truncated results were narrowed to complete `snapshotCollection` and `createSlugSuggestion` explanations, and CodeGraph supplied exact source/callers. One `graphify update .` ran after the meaningful edit batch: **passed**, local AST only, **25,446 nodes / 41,187 edges** (`graphify-refresh.log`). No graph was initialized, enriched, or labeled through an API.
- Strict OpenSpec: `pnpm openspec -- validate simplify-main-site-modules --type change --strict` **passed** after this note was saved (`openspec-strict.log`). The CLI accepted the change's existing `skip_specs: true` setting and zero spec deltas.
- Scoped Prettier check of the saved review, implementation note, and tasks: **passed** (`record-format.log`). `git diff --check` passed, and an independent hash assertion confirmed every final owned file still matches `final-source.json` after the recorded checks.

The unrelated failed test is `apps/backend/test/scripts/stripe-account-migration.test.ts:453`, “prints a safe actionable CLI reason and never echoes raw provider messages.” Its synchronous child process exceeded Vitest's 5,000ms limit during the concurrent run (8,247ms reported). It launches `migrate-stripe-account.ts --unknown`; `parseAccountMigrationArgs` throws before snapshot/slug processing, provider setup, or writes. Both source files have no diff. The subsequent full tooling run passed and Nx marked the task flaky. Concurrency as the cause is an inference, not a proven root cause; the transient failure remains in the handoff.

Graphify also warned about partial extraction of unchanged `scripts/pages-workflow-contract.test.ts:93`, unsupported/data files, and changed community labels. These warnings do not establish a TypeScript/test failure; the affected module's source was read exactly through CodeGraph, and the repository release-contract task passed from its declared cache. No unrelated graph/parser/tooling source was changed and no suggested LLM labeling was run.

## Source identity

`final-source.json` contains the five owned paths in received-review table order, individual SHA-256 hashes, line counts, HEAD, and the implementation thread ID. The combined recipe is SHA-256 over `path + space + lowercase file SHA-256` rows joined by LF, without trailing LF.

- Independent clean baseline fingerprint: `d450a148d403b44d492a5adcd3c83d3347749f268e966b83b8214669bb9c6fb1`.
- Final owned-module fingerprint: `b0ea4c8b5f5f79280bfb062d1c6aa84573fd600746adf2c92bb69e131f7b7200`.
- The received review reports `e71d82b0d427ee008bc645fc810cc254d920fbafbb11d0c9f211238938bb3d6f`. That combined digest was not reproduced by the stated ordered-row recipe. Initial owned files had no Git diff and their independent combined fingerprint matches HEAD blobs. The review was saved unchanged in substance; acceptance here uses fresh independent checks and the final fingerprint, not the received review's test evidence or digest.

## Acceptance matrix and remaining limits

- **Shell/player/routing:** the selected Local route/browser smoke passed for the affected Release/Store surfaces, including both phone engines. Navigation implementation, player lifecycle, focus/history logic, cart persistence, and visuals were not changed; broader continuity/visual suites were not required for this data/helper slice.
- **CMS/schema/publication:** filesystem snapshot validation and projection were exercised by owned tests against a generated checksum-bound manifest and media. CMS schemas, publication state, accepted pointer ordering, draft privacy, and restart reuse were not changed; normal-stack publication/editor scenarios were not applicable. Static route fixtures do not prove hosted snapshot/publication acceptance.
- **Commerce/checkout/stock:** read-only mock seed/catalog contract regressions passed through backend-tooling. Worker authority, stock/order writes, checkout gates, and provider integration were not changed; full Local mock checkout and provider scenarios were not applicable.
- **Boundaries/tooling/instructions:** scoped source lint/format passed; native boundaries are unchanged. Workspace contract tasks passed on the final tooling selection. No agent command/guidance contract was edited, so an additional standalone `pnpm agent:check` was not required. Strict OpenSpec validation is the closeout check above.
- **Staff/editor and release/environment:** not applicable; no editing, preview, identity, environment, release, or hosted configuration behavior changed.

The parent explicitly owns the final combined **`pnpm validate`**, including affected package type/lint checks and integration evidence. This worker did not run it, did not mark task 30.1/30.2, and does not claim a final-tree validation summary. No unresolved functional blocker remains in this slice. Hosted/provider/release acceptance and elapsed-time performance remain unmeasured. No commit, push, deploy, publication, hosted mutation, branch, or worktree was made.

Subsequent shell calls after the orchestration steering used explicit `C:/Windows/System32/WindowsPowerShell/v1.0/powershell.exe` with `login:false`. Existing work continued without restarting processes or changing global profiles. Carry that profile-free launch instruction into future worker prompts.
