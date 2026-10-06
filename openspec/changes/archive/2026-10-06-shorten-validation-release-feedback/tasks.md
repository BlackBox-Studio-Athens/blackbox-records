Sections 1–8 record the earlier implementation. The September 28 user decision supersedes their full-local requirement: targeted local completion, full suite in CI. Preserve applicable browser/publication acceptance.

## 1. Measure and revise validation policy

- [x] Fix CI run/job collection pagination and attempt identity; keep only complete successful runs in successful timing
      percentiles.
- [x] Report local first-failure/total time and hosted queue, setup, transfer, runner cost, UAT quick feedback, and
      promotion readiness where evidence exists.
- [x] Cover success, failure, cancellation, rerun, incompletion, and missing timestamps; capture existing baselines
      without dispatching workflows.
- [x] Allow targeted checks between implementation milestones while retaining full final local validation and all
      applicable CI/browser/publication gates.

## 2. Scope local iteration

- [x] Keep `validate` and `validate:checks` complete; single-package fast runs only that package's tests/types, `all`
      also runs contracts.
- [x] Overlap the two fast lanes within the existing bounded cancellation behavior.
- [x] Add `test:watch --scope` for one required package using every package Vitest config.
- [x] Cover scopes, contract selection, bad input, cancellation, partial evidence, and watch rerun.

## 3. Add opt-in validation phase reuse

- [x] Add `--resume` and `--no-cache`, with fresh default runs.
- [x] Reuse only eligible successful phases using conservative file/config/toolchain/environment fingerprints; never
      cache builds, editor/browser/hosted work, unknown phases, or build outputs.
- [x] Require completed, stable provenance; malformed/missing/canceled/changed evidence is a cache miss.
- [x] Cover source/config/lockfile/toolchain/file-set changes, failed retry, corruption, no-cache, and source mutation.

## 4. Move advisory unused-code audit

- [x] Remove `audit:unused` from candidate preparation.
- [x] Run the existing audit weekly and manually, publish its report, and fail visibly on tool errors.
- [x] Update required-gate docs and workflow tests.

## 5. Split target preparation

- [x] Build UAT and PRD in independent workspaces from their own published snapshots, preserving each target's build
      checks.
- [x] Add verified `pack-target uat|prd` and `assemble` commands with full candidate identity and file digests.
- [x] Reject missing, tampered, wrong-target, mixed-candidate, or migration-conflicting bundles.
- [x] Preserve schema-2 final promotion artifacts; assembly verifies and combines bytes only.
- [x] Permit UAT deployment after UAT preparation without waiting for PRD; candidate success still requires both
      bundles, assembly, and complete UAT acceptance.
- [x] Test artifacts and workflow dependencies.

## 6. Reduce setup and expose quick UAT result

- [x] Reduce redundant checkout/install/download inside current credential boundaries; keep Pages and Worker jobs
      separate.
- [x] Run read-only readiness and static smoke after Pages deploy, before sequential provider smoke; quick success
      remains informational.
- [x] Preserve all provider scenarios and evidence upload; install only needed browser engines while retaining both
      staff preview browsers.
- [x] Test workflow identity, transfer targets, order, credential scope, and failures.

## 7. Cancel obsolete preparation, protect mutation

- [x] Use cancellable branch/role-scoped preparation concurrency and a shared non-cancelling lock for every
      deploy/catalog mutation sequence through acceptance.
- [x] Avoid duplicate caller/child concurrency groups; retain immediate monotonic ordering checks.
- [x] Test cancellation, lock coverage, late candidates, and promotion eligibility; update CI measurement job names and
      recovery docs.

## 8. Final acceptance and handoff

- [x] Run a fresh full validation on exact final source and applicable editor/publication checks.
- [x] Strictly validate OpenSpec and verify schema-2 promotion consumes retained bytes without weakening confirmations
      or launch gates.
- [x] Record all milestone commits and final evidence, measured outcomes, unobserved hosted behavior, and remaining work.

## 9. Shorten the remaining edit and release waits

- [x] Add native affected-test selection to the existing package runner; cover imported-source failure propagation, unrelated-test exclusion, explicit refs, and partial status.
- [x] Overlap checks with UAT/PRD preparation; retain immutable-source verification and dependency gates before deployment and candidate assembly.
- [x] Remove the duplicate PRD staff build while checking the target-configured staff artifact inside the canonical CMS build; verify the Local build remains usable.
- [x] Restore the existing image-transform cache for PRD, retain all final gates, and document the smaller development loop and measured versus estimated effects.
- [x] Verify fixed-port background startup, reuse, hot updates, and cleanup in the native browser; preserve the full Local stack for acceptance boundaries.

## 10. Make the larger workflow cuts the default

- [x] Make `pnpm validate` select affected tests/types/lint with source-stable local evidence; retain `validate:full` and the full CI gates.
- [x] Cover committed/staged/unstaged/deleted/untracked selection, dynamic-file broadening, failed checks, and local versus full evidence.
- [x] Move the shared UAT lock to the complete reusable deployment/acceptance call, inherit secrets, and preserve job environments and PRD direct promotion.
- [x] Update agent instructions, operating docs, workflow contracts, environment verification, and full-suite benchmark commands.
- [x] Delegate native incremental backend/API-client checks to a Luna implementor; verify cold/warm success, warm-cache error detection, and exact probe cleanup.
- [x] Delegate native image-cache fingerprint comparison to a Luna implementor; skip unchanged/empty uploads, retain the byte cap, and pass workflow contracts and actionlint.
- [x] Delegate cached formatter writes and standalone source-bound lint reuse to a Luna implementor; verify stale-input failure, write repair, and warm lint reuse.
- [x] Run targeted validation and strict OpenSpec validation; record measured local results separately from unobserved hosted gains, and confirm the exact final tree in the ignored evidence file.

Record the final summary and fingerprint in ignored `.codex-artifacts/feedback-speed/final-verification.json` rather than editing validated source afterward. No hosted deployment is part of this follow-up.

## 11. Replace custom orchestration with module-owned Nx tasks

- [x] Pin Nx and establish native module projects, explicit non-import inputs, and actual dependency selection without copying architectural allow-lists.
- [x] Derive module roots from native project locations, split frontend/backend platform ownership, and enforce complete ownership and module boundaries.
- [x] Give every test one native suite, retain real Worker/D1 integration coverage, and split the mixed repository tests and unrelated checkout exports.
- [x] Replace custom affected selection, test fan-out, scheduling, and phase-cache reuse with Nx; preserve source-stable evidence and full CI gates.
- [x] Verify changed-file forms, implicit inputs, illegal boundaries, missing/duplicate suites, failures, invalidation, and native cache behavior.
- [x] Update personal/project guidance and OpenSpec contracts; measure affected task counts, cold/warm timing, and net custom-code reduction.
- [x] Define the final-source verification gate and ignored evidence record in `nx-migration-validation.md`. Migration completion requires that record to contain a passed full run and source-unchanged local run.

## 12. Review module development readiness

- [x] Correct native cache inputs for filesystem-read workflow contracts; deduplicate shared inputs and include workspace libraries in cycle checks.
- [x] Stream native validation output immediately, stop queuing after failure, and reject contradictory or ignored CLI options.
- [x] Make native watch mode explicit for agent execution and provide the API-client watch target.
- [x] Reconcile native test/spec discovery, remove duplicate runner definitions and dead files, and align operational guidance with module-first iteration.
- [x] Verify a real watch failure/repair loop and define the final full/unchanged-source gate in `module-review.md`; completion requires a passed ignored `.codex-artifacts/module-review/final-verification.json` record.

## 13. Module-owned backend tests and measured feedback

- [x] Co-locate backend tests with the module that owns them; move real cross-module tests into feature-scoped integration projects under `apps/backend/test/integration/<feature>/` (catalog-sync, stock, checkout, cms).
- [x] Give composition roots (public-commerce-http, backend-runtime including `apps/backend/src/cms-worker.ts`, cms-runtime) ownership of composed-app tests.
- [x] Split root tests into `workspace:test-tooling` (narrow `workspaceTooling` inputs) and `workspace:test-content` (conservative inputs); check both are owned exactly once in `scripts/check-module-projects.mjs`.
- [x] Run the validation wrapper with `NX_DAEMON=false` so a freshly started daemon cannot inherit piped stdio and hang; assert it in `scripts/validate.test.mjs`.
- [x] Measure uncached full and affected runs at Nx parallelism 2, 3 and 4; set `parallel` to 3 and keep Vitest `maxWorkers: 1`.
- [x] Record baseline, per-scenario timings and remaining bottlenecks in `module-review.md`.
- [x] ~~Run final affected and full validation on the exact final tree and record the ignored evidence file `.codex-artifacts/perf/final-verification.json`.~~ Superseded by `simplify-software-release`, which replaces this change's release-gate shape; final evidence is recorded there.
