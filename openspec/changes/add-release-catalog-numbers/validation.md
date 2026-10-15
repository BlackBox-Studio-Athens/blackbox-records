# Validation

## Owner catalog correction — 2026-10-15

The owner supplied the complete table directly: caregivers (Chronoboros)=BBR#001, disintegration (Afterwise)=BBR#002, anarchotribal (Ouranopithecus)=BBR#003, lotus (Sidus)=BBR#004. Numbers do not follow release dates (Anarchotribal: 6 June; Disintegration: 9 June). The shared legacy reader/CMS backfill table, two release records, non-UI fixtures and Store All order assertions now follow that table. Store All begins Caregivers, Disintegration, Anarchotribal, then Distro by artist.

- `pnpm openspec:guard`: passed (exit 0), on main before edits.
- `pnpm openspec -- validate add-release-catalog-numbers --strict`: passed (exit 0; change is valid).
- `rg -n "BBR#00[1-4]" apps/web apps/backend packages scripts`: reviewed all matches; named Disintegration fixtures use BBR#002 and Anarchotribal fixtures use BBR#003. Unrelated parser examples and uniqueness fixtures retain their intentional values.
- `git diff --check`: passed. All 21 correction files retain LF line endings.
- `pnpm test storefront-catalog`: blocked before tests (exit 1).
- `pnpm test web-store`: blocked before tests (exit 1).
- `pnpm test cms-runtime`: blocked before tests (exit 1).
- Each focused test used the installed wrapper `& C:/Users/SVall/.local/bin/rtk.exe test` before the exact command above. All failed with `EPERM: operation not permitted, open '.git/blackbox-feedback/slots/0.json'`. This sandbox cannot write that runner slot. No timeout/crash occurred, so no timeout/crash retry was needed; no runner or sandbox bypass was attempted.
- Full `pnpm validate` is intentionally deferred to the coordinator. Historical receipts below cover only their recorded source; they do not validate this correction. Staff components, e2e, hero film files and other-session files were not edited. No commit, push, hosted request, CMS mutation or publication was performed.

Scope: Local non-UI contracts, repository fixtures, CMS schema/backfill preparation and Store All ordering. Staff UI and browser acceptance belong to the coordinator; backfill execution, publication and Software Release acceptance belong to the owner. This task made no hosted reads and used no credentials, migrations, publication, commit or push. The 2026-10-15 follow-up records inventory evidence supplied by the owner, as distinguished below.

Source: main, HEAD `79556cfd455769b1c1dc8724f2b7b97746f7a8f8`, uncommitted shared working tree. Harness documents, e2e/store-formats.spec.ts and hero upscale work are not owned by this task. All inspected owned source files retain LF.

## Commands and evidence

- `pnpm openspec:guard`: passed before change creation and implementation.
- `pnpm openspec -- new change add-release-catalog-numbers`: created the repo-local spec-driven change; proposal/design/tasks and four capability deltas are present. Applied under the user's explicit combined planning and implementation authorization.
- Graphify architecture query was broad/truncated; focused `graphify explain "packages/content-model/src/content-snapshot.ts" --budget 2500` and `graphify explain "store-collection.ts" --budget 2500` established the relevant module relationships. CodeGraph then returned exact schema, snapshot, Store, publication and export sources/callers.
- `pnpm test storefront-catalog`: passed 171 tests at the first complete focused run. Final repository validation passes 172/172, including the added compile-time StoreItem union regression; local-file legacy coverage passes web-content-files tests.
- `pnpm test cms-runtime`: initial run passed 154/155 tests; the new publication-review mock lacked Artist data. Corrected the mock. The subsequent repository CMS run passed 155/155, including backfill tests, accepted R2 upgrades and publication-review clashes. The accepted raw-export regression and schema assertions are included in final repository validation.
- Final repository CMS validation passes 156/156, including accepted raw-export preservation and explicit schema field/idempotence assertions.
- `pnpm test web-store`: passed 143/143 after the strengthened StoreItem type exposed one omitted catalog number in store-page-data.test.ts; all full Store Item fixtures there now carry parsed values. Web type checking passes, including the two expected compile-time failures in catalog-data.test.ts.
- Initial multi-file `pnpm test apps/web/src/lib/catalog-data.test.ts apps/web/src/lib/store-collection.test.ts` was not valid runner syntax (second path became a root-relative Vitest filter). Corrected to the module command above.
- `pnpm openspec -- validate add-release-catalog-numbers --strict`: passed.
- `graphify update .`: completed after the implementation batch; final refresh produced 28,609 nodes / 45,845 edges. Extraction reports existing unsupported SQL grammar and one partial test parse; no semantic enrichment or hosted graph calls were used.
- `git diff --check`: passed.
- First `pnpm validate`: invalidated because source changed during the run. It also found the new backfill's `== null` lint error, corrected to explicit undefined/null checks. Its automatic rerun found five newly edited files requiring formatting. The next normal invocation formats those files. Initial summary: `.codex-artifacts/validation/2026-10-14T22-12-04-632Z-40896-c2c443/summary.json` (not completion evidence).
- The next `pnpm validate` run (`2026-10-14T22-32-00-659Z-70020-9ff466`) detected the omitted StoreItem test fixture above; corrected it rather than weakening the union.
- `pnpm validate` passed in Local mode at `.codex-artifacts/validation/2026-10-14T22-44-05-803Z-67920-fd389a/summary.json`: 59/59 selected tasks across 47 projects and their dependencies, 49 cached on the stable second pass; exit 0, sourceChanges empty. Source SHA is the HEAD above; the stable source fingerprint is `b2175030beb38f9a12be8bd0a350ad0cc08a057923a3f89aa6e48ef3a0afa99c`.
- After closing this evidence note and task checkbox, rerun the normal `pnpm validate` on that final documentation tree. The final run pointer, source fingerprint, complete owned-file inventory and LF check are retained in `.codex-artifacts/release-catalog-numbers/completion.json` to avoid another evidence-file fingerprint cycle. This receipt is the final-tree check; it does not establish browser/provider/release acceptance.

## Acceptance limits

Local validation does not prove staff input, browser order, native hosted backfill, private CMS inventories/revisions, next publication or release acceptance. The coordinator's existing All-order e2e assertion matches the new order but was not run by this task. The LOTUS inventory/assignment blocker is resolved by the owner evidence below; unknown future missing identities still fail closed as recorded in design.md and handover.md.

## LOTUS follow-up — 2026-10-15

- Owner decision: LOTUS (`lotus`, Sidus, released 2026-10-02) is BBR#004. The complete confirmed mapping is caregivers=BBR#001, disintegration=BBR#002, anarchotribal=BBR#003 and lotus=BBR#004. Both the accepted reader and CMS backfill use the shared legacy assignment function.
- Inventory evidence supplied in the follow-up: a read-only public GET of [PRD Releases](https://blackbox-records-web.pages.dev/releases/) on 2026-10-15 listed exactly anarchotribal, caregivers, disintegration and lotus. The owner confirms UAT holds only these same four Releases. This follow-up did not repeat the hosted request or inspect private CMS data.
- Regression coverage now includes LOTUS accepted upgrades in Local/UAT/PRD, checksum-bound R2 upgrades without stored-byte changes, and BBR#004 backfill planning/staging. Failure examples use `fictional-unmapped-release` and still reject unknown missing assignments before writes.
- Schema preparation, full CMS backfill check/review/apply and next publication remain later owner operations. This release targets UAT only; PRD promotion requires separate authorization. No rollout operation was executed here.
- Earlier full-validation receipts cover their recorded source only. The owner explicitly requested skipping `pnpm validate` in this follow-up and will run it on the final shared tree. Staff components, e2e, protected harness files and hero-video artifacts were not edited.
- `pnpm openspec:guard`: passed before follow-up edits.
- `pnpm test storefront-catalog`: passed (exit 0), invoked through `& C:/Users/SVall/.local/bin/rtk.exe test pnpm test storefront-catalog`.
- `pnpm openspec -- validate add-release-catalog-numbers --strict`: passed (exit 0; change is valid).
- Scoped Prettier check of the 12 follow-up files: passed after correcting one test's wrapping. LF check: all 12 files contain no carriage returns. `git diff --check`: passed.
- `graphify update .`: passed (exit 0), rebuilding 28,616 nodes / 45,867 edges. Existing extractor limitations remain: unavailable SQL grammar and partial parsing of `scripts/pages-workflow-contract.test.ts`; no LLM enrichment was run.
- First follow-up `pnpm test cms-runtime`: failed after 22m19s with 118 passed, 2 failed and 36 skipped tests. All failures were timeouts: `runtime-publication.worker.test.ts` D1 migration setup hook (10s), the UAT case of `public-runtime.test.ts` (30s), and `item-publication-lifecycle.worker.test.ts` (15s). The changed backfill and accepted-storage test files did not fail. Full log: `.codex-artifacts/release-catalog-numbers/lotus-cms-runtime-first.log`. A repeat of the same command was started after the other checks finished; no timeout configuration or unrelated source was changed.
- Repeat `pnpm test cms-runtime` (same RTK wrapper): exited 1 before Vitest results. The condensed Node v24.21.0 startup diagnostic referenced `node_modules/.pnpm/execa@10.0.1/node_modules/execa/index.js`; its full cause was not retained in the wrapper output. No dependency or harness repairs were attempted. The focused CMS suite therefore has no passing follow-up result; the owner's final-tree validation must resolve or reproduce these failures.
- Final documentation-only `pnpm exec prettier --check openspec/changes/add-release-catalog-numbers/validation.md` could not complete: `EPERM` opening `node_modules/.pnpm/suf-log@2.5.3/node_modules/suf-log/dist/interfaces.js`. The earlier 12-file formatting check passed; this last evidence-note revision has no completed formatter result. Dependency repairs remain outside this follow-up.

Work-state writes were denied by the current tool approval policy. Execution progress is retained in this OpenSpec change; no permission escalation was attempted.

## Coordinator checks (final shared tree, 15 October 2026)

- Staff input: Release editor field `catalog_number` (canonical case while typing, required, plain validation message) and New Item release setup (required catalog number, autosaved only once it parses, restored with the draft, sent in both submit paths; Distro and Merch never carry it). `pnpm test apps/staff/src/components/content/ContentFields.test.tsx` ran the whole `staff-content` project: passed.
- `pnpm validate` on the final tree: PASSED (59 tasks, 47 projects; summary `.codex-artifacts/validation/2026-10-15T08-23-42-778Z-34180-33184e/summary.json`). This supersedes the follow-up's timed-out `cms-runtime` runs. A first attempt failed only at Prettier on an untracked local tool folder (`.skillopt-sleep-handoff/`, excluded from git by `.git/info/exclude` only); `.prettierignore` now lists `.skillopt-sleep/` and `.skillopt-sleep-handoff/`.
- `pnpm test:e2e e2e/store-formats.spec.ts e2e/store-crate.spec.ts`: 24 passed, 1 skipped (WebKit crate swipe, skipped by design). The new All Store test checks Caregivers, Disintegration, Anarchotribal first, then Distro sorted by artist.
- An orphaned Local `astro dev` server from 14 October served a stale content cache (`ZodError` on `/store/`); after it was stopped, a fresh server rendered the new order.
