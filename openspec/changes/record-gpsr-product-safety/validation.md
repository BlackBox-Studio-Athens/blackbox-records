# Local evidence

Base: `dfea9e105f51e7e472dc08e535a479e7dbb2186b`. Review branch: `codex/gpsr-product-safety-20261014`, authorized worktree `C:/Users/SVall/.codex/worktrees/9829/blackbox-records`. Product Environment: Local only.

## Established checks

- `pnpm openspec:guard --allow-worktree` passed before OpenSpec/code edits; guarded CLI created this uniquely scoped change and reported apply state `ready`.
- `pnpm openspec -- validate record-gpsr-product-safety --type change --strict --allow-worktree` passed for the initial complete planning artifacts.
- `pnpm test:content` passed **71 tests**, including all six GPSR regression cases in the registered `scripts/cms-content-schema.test.mjs` suite. Covered legacy absent/null compatibility, private partial work, verified completeness, non-EU responsible-person contacts/EU country, explicit safety assessment, malformed links/dates, no pressing/age exemption, accepted snapshot isolation and public evidence stripping. This is contract-level evidence, not hosted or browser acceptance.
- `git diff --check` passed before formatting.
- Graphify initially had no index; the branch checkout hook then built the authorized worktree graph (27,959 nodes). An initial query was truncated; focused `explain` calls for `validateCmsRevisionContent`, `publishedCollection` and `prepareCatalogSchema` closed the relevant gaps without raising the budget. CodeGraph then supplied current symbols/callers and source for the affected validation/schema/projection flow. Index extraction warned that SQL extraction support was unavailable and one unrelated workflow-contract test had a parse warning; no SQL graph evidence was used.

## Failed/interrupted attempts retained

The first file-scoped run selected workspace/architecture/backend-tooling checks. Successful architecture and existing CMS checks did not establish the new cases: the initially separate test file was not in the root command's explicit test list, so the cases were moved into the existing CMS schema suite. The broader run failed an unrelated `stripe-account-migration.test.ts` subprocess assertion (`status` was `null` after its 15-second timeout; 280 other backend-tooling tests passed). No Stripe implementation or timeout was changed.

A CMS file-scoped attempt encountered a terminated Nx daemon (`EPIPE` in this worktree's daemon log) and was stopped. A retry with only `NX_DAEMON=false` failed before tests when three default plugin workers could not establish local socket connections. Subsequent selected checks use command-local `NX_DAEMON=false` and `NX_ISOLATE_PLUGINS=false`, both confirmed in the installed Nx implementation. No repository/global settings, guards, maintainer grants or other worktree processes were changed. The normal `pnpm validate` command and feedback slot policy remain in use.

## Final validation

`NX_DAEMON=false NX_ISOLATE_PLUGINS=false pnpm validate` passed **51 selected tasks across 39 affected projects**, with 5 cached tasks. Summary: `.codex-artifacts/validation/2026-10-14T09-23-30-605Z-67712-9c755b/summary.json`, `mode: local`, `status: passed`, source SHA `dfea9e105f51e7e472dc08e535a479e7dbb2186b`, matching before/after fingerprint `e8d15737d7bbce6431c358f1c50948f2f9f2f5cc1a66130a143a82769404d3f0` (18 changed/untracked files). The command took 3,177.0 seconds including slot wait; Nx execution was 43m49s at the one slot allocated by the shared policy. No concurrency or timeout policy was changed.

The separate CMS module attempt passed 149 tests but timed out two existing `public-runtime.test.ts` real-workerd cases at their 30-second limits. The final validation subsequently passed the complete `cms-runtime:test` target, including those cases, and `backend-tooling:test`, including the earlier migration CLI case. Schema setup, compatibility, projection, integration, package lint/type checks and architecture targets all passed in the final run. The initial attempts remain failed/interrupted evidence, not substitutes for this result.

Post-edit `graphify update .` passed: 28,013 nodes and 44,836 edges. SQL/parser warnings remained the unrelated extraction limits recorded above. No semantic enrichment was run.

This note and task-checkbox completion are documentation changes after that run. The final documentation/commit-tree validation and exact local commit identity are retained in `.codex-artifacts/gpsr-completion.json`; use its final summary and matching fingerprint for the handed-off tree. No browser or hosted acceptance is implied.

## Acceptance boundaries

CMS/schema/publication row: portable contracts, snapshot projection and schema-setup regressions are in scope. Normal Local editing/preview/selected-publication acceptance remains open with Claude's UI work. Staff/public UI, shell/player/routing and commerce behavior were not changed. No browser, provider, hosted schema setup, content publication, stock/price, checkout, VAT, launch, push or release acceptance is claimed. No real supplier data, documents, emails or orders were created.

Tasks 2.1–2.4 retain actual edition/operator/contact/safety evidence, Claude's approved presentation across buying surfaces, the reviewed incomplete-offer treatment, and Local/hosted publication acceptance. Source fixtures are not live catalogue evidence. Refer to `legal-research.md` and `handover.md`; finding 9 is not complete merely because this local data preparation passes checks.
