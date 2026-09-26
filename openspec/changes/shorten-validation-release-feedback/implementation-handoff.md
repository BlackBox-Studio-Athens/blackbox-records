# Implementation handoff

## Milestone 1 — measurements and validation policy

- **Changes:** Added attempt-aware, paginated GitHub Actions measurement; separated UAT quick feedback, promotion readiness, queue, setup, artifact transfer, elapsed time, and runner seconds. Updated validation policy and captured the existing historical baseline.
- **Checks:** CI measurement tests passed for attempt pagination, reruns, failed/cancelled/incomplete runs, missing timestamps, job-set compatibility, and low-confidence summaries. Existing local validation did not finish within the IDE's 120-second wait; its first-failure and total durations remain unavailable.
- **Evidence:** `.codex-artifacts/ci-speed-baseline-corrected/{raw.json,summary.json,report.md}` (ignored); `docs/validation-feedback.md`. The corrected workflow endpoint and attempt metadata supersede the original sample.
- **Measured effect:** Baseline only. 22 successful UAT attempts: median 955s execution, 3s queue, 60s setup, 12s transfer, 984s promotion-ready. All 28 UAT attempts consumed 25,910 runner-seconds. No post-change hosted comparison exists.
- **Next milestone:** Scope local package iteration and add a single-package test watcher.

## Milestone 2 — scoped iteration

- **Changes:** Package-only fast scopes now run only their tests and types; `all` retains contracts. Added `pnpm test:watch --scope <package>` with the package's existing Vitest configs.
- **Checks:** Scope-plan tests passed for every package, invalid scope and partial-result tests passed, and a temporary `api-client` fixture started and reran in watch mode after an edit.
- **Evidence:** Focused WebStorm runs for `scripts/validate.test.mjs`; temporary watch smoke fixture was removed after the run.
- **Measured effect:** Not measured.
- **Next milestone:** Add opt-in reuse of eligible successful phases.

## Milestone 3 — safe phase reuse

- **Changes:** Added opt-in resume evidence reuse and `--no-cache`. Only stable, successful allowlisted phases can be reused; builds and unknown phases always run. Cache identity includes full-tree fingerprint, command, toolchain, platform, and allowlisted environment.
- **Checks:** Focused WebStorm tests passed for unchanged retry, phase command changes, failed phase reruns, no-cache, package/lock/config/file-set changes, toolchain and phase environment changes, malformed/missing evidence, deleted or altered original logs, incomplete/cancelled records, and source edits during validation.
- **Evidence:** Focused results in the WebStorm run output; durable summaries/logs are written under ignored `.codex-artifacts/validation/`.
- **Measured effect:** Not measured.
- **Next milestone:** Move the advisory unused-code audit off candidate preparation.

## Milestone 4 — advisory unused-code audit

- **Changes:** Added a weekly/manual unused-code audit workflow with an uploaded report and removed the advisory audit from candidate gates.
- **Checks:** Full repository validation passed, including workflow contracts for weekly/manual scheduling, report upload, failure visibility, and removal from candidate gates.
- **Evidence:** `.github/workflows/unused-code-audit.yml`; `scripts/pages-workflow-contract.test.ts`.
- **Measured effect:** Not measured.
- **Next milestone:** Split UAT and PRD bundle preparation.

## Milestone 5 — independent target preparation

- **Changes:** Split UAT and PRD snapshots/builds into independent jobs; added verified target bundles and byte-only assembly into the retained schema-2 artifact.
- **Checks:** Target fixtures cover actual `pack-target` CLI execution for both targets and assembly, digest verification, missing files/targets, wrong target, mismatched candidate identity, conflicting migration inventory, and final schema-2 compatibility. The packing CLI regression passed through WebStorm. Workflow wiring is kept together in the milestone 6 commit.
- **Evidence:** `scripts/release-candidate.test.mjs`; `.github/workflows/pages.yml`.
- **Measured effect:** Not measured.
- **Next milestone:** Reduce repeated setup and surface quick UAT acceptance.

## Milestone 6 — setup and early UAT feedback

- **Changes:** UAT Pages smoke now runs immediately after deployment and before paid/email provider scenarios. Matching source/tooling SHAs reuse checkout; mismatches use trusted tooling checkout. UAT jobs download only the UAT bundle. The main release workflow declares Worker, Pages, provider-smoke, and PRD-promotion jobs directly so environment secrets are available in the job context; the Pages job keeps its repository-scoped token. Migration manifests retain their original paths, and the Pages job independently uploads quick-check evidence.
- **Checks:** Full repository validation passed, including workflow contracts for quick-check ordering, credentials, trusted tooling, browser installation, downloads, provider failure, and evidence upload.
- **Evidence:** `.github/workflows/pages.yml`.
- **Measured effect:** Not measured.
- **Next milestone:** Separate cancellable preparation from non-cancellable release mutation.

## Milestone 7 — concurrency and mutation protection

- **Changes:** Added cancellable preparation groups and a shared non-cancelling lock across deploy, catalog, publication, and holding-page mutations through acceptance.
- **Checks:** Full repository validation passed, including preparation cancellation, shared lock coverage, lock-through-acceptance, monotonic late-candidate rejection, and candidate failure contracts. Hosted overlap behavior remains unobserved locally.
- **Evidence:** `scripts/pages-workflow-contract.test.ts`; `docs/validation-feedback.md`.
- **Measured effect:** Not measured.
- **Next milestone:** Run final local validation and strict OpenSpec acceptance; observe hosted behavior only after an authorized push.

## Final acceptance

- **Checks:** The replacement OpenSpec configuration runs the real guarded CLI; the final delta requirements are marked as additions where appropriate. A fresh full implementation-tree run passed in 247.9s. Backend workflow tests (5 cases), packing CLI fixtures, cache regressions, and repository contracts passed through WebStorm after final wiring corrections. Final committed-tree acceptance uses **BlackBox Validate Fresh**, explicitly passing `--no-cache`.
- **Evidence:** Intermediate full pass: `.codex-artifacts/validation/2026-09-26T11-50-05-581Z-34324/summary.json`. Final committed-tree status, SHA, fingerprint, toolchain, duration, and exact summary path are recorded after verification in ignored `.codex-artifacts/validation/final-verification.json`; this avoids changing the verified tree merely to append a timing.
- **Measured effect:** Individual implementation-tree runs measured 176.6s and 247.9s. The pre-change local run did not complete, so no local before/after improvement can be claimed. Hosted post-change timing is not measured.
- **Remaining:** Hosted concurrency and early UAT reporting require observation after an authorized push. No product UI, editor, or publication behavior changed.
- **Commits:** Milestone 1 `031389c`; milestone 2 `8a88762`; milestone 3 `f54a087`; milestone 4 `9297c8d`; milestone 5 `6541c87`; milestone 6 `ef0c329`. Milestone 7 uses subject `ci(release): cancel stale preparation and retain mutation locks`; the follow-up IDE repair uses `fix(tooling): replace temporary validation run configurations`. Git history records their hashes. All commits remain local on `codex/validation-release-feedback`.
- **IDE recovery:** The blocked dialog was caused by the removed `openspec-validate-smoke.test.mjs` fixture. Persistent run configurations now call real package scripts. Git staging uses ordinary Git index patches and explicit path lists; validation still runs through WebStorm, and the original checkout and its hook configuration are unchanged.
