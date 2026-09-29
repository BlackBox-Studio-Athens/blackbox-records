# Validation and release feedback

## Historical baseline before the Nx migration

The corrected 2026-09-19 through 2026-09-26 workflow sample contains 28 UAT candidate attempts: 22 successful and 6 failed. Successful UAT attempts had 955 seconds median execution time (p75 1092s, p90 1163s), 3 seconds median queue time, and 984 seconds median from run creation to promotion readiness. Early UAT quick-check timing is unavailable because that stage did not exist. PRD promotion had 11 successful, 1 failed, and 1 cancelled attempt, with 183 seconds median successful duration. Run creation is the available proxy for push time. Unrelated workflows are excluded.

Across those attempts, jobs accumulated 25,910 runner-seconds for UAT and 2,241 for PRD promotion. Setup used 4,539 and 651 runner-seconds; artifact transfers used 1,364 and 230. Successful-attempt median setup time was 60s for UAT and 28s for PRD; median transfer time was 12s and 9s. Setup/transfer elapsed measures the largest per-job sum of matching active step durations, excluding post-job cleanup and gaps between steps. Runner cost sums all jobs, including failed attempts. These differ from total workflow wall time.

The initial local full-validation run did not produce a completed summary within WebStorm's 120-second wait. Its output showed `environment:model:verify` in 1.8 seconds and `check:boundaries` in 36.9 seconds. Local total and first-failure time for that attempt are unavailable. The corrected machine-readable sample is retained in ignored `.codex-artifacts/ci-speed-baseline-corrected/`; it supersedes `.codex-artifacts/ci-speed-baseline/`, which included unrelated workflows and mislabeled skipped PRD jobs. No updated hosted sample exists yet, so no hosted speed improvement is established.

Historical local samples are not post-Nx measurements: full validation completed in 408.8s; a targeted run completed in 93.7s with explicitly reduced coverage; two implementation-tree runs completed in 176.6s and 247.9s. These are individual, non-comparable samples, not before/after medians. Keep them as historical context only.

## Current local validation

Nx 23.2.1 owns affected selection, task scheduling and deterministic local caching. The workspace caps task parallelism at three (measured: two was slower, four gave no reliable gain) and does not use Nx Cloud. `project.json` files define source and integration-test roots, targets and task inputs. Vitest discovers tests within those roots. Backend module targets depend on their test projects through native Nx task dependencies; the full run deduplicates shared integration suites. This keeps test imports in the affected graph without creating production-module cycles. `*.worker.test.ts` files use the Cloudflare pool, `*.request.test.ts` files use the browser API mock setup, and other tests use Node. The Worker pool has no unused application entrypoint; tests import the runtime they exercise and retain real D1 migrations and transactions. Root tests run as `workspace:test`, a dependency-only alias: `test-tooling` (tooling and configuration tests, cached on the `workspaceTooling` input) and `test-content` (tests that import or read app and package source, cached on the whole workspace); `pnpm test:contracts` runs both.

- `pnpm test <project>` runs that project's Nx test target. `pnpm test:watch <project>` uses its native test-watch target. `pnpm test:changed` selects tests through Nx affected calculation.
- `pnpm validate` records source-fingerprinted evidence and runs affected module tests, package-level lint and type checks, plus required architecture checks. `pnpm validate --plan` prints the native Nx task graph without running tasks.
- `pnpm validate:full` runs module-level tests and package-level lint, type and build targets through Nx `run-many`. Native local caching is on by default. `--resume` remains a compatibility option; `--no-cache` disables Nx cache reuse for the selected mode and never changes affected/full selection.
- The validation wrapper retains source fingerprinting, change invalidation and evidence reporting. Nx owns task selection, execution and cache; the wrapper has no separate selector or phase cache. Local evidence remains partial where browser, provider, publication or release acceptance was not run.

### Module iteration

- Find the nearest `project.json` to identify a module; inspect its effective Nx targets with `pnpm exec nx show project stock --json`.
- Run `pnpm test stock` for a focused pass or keep `pnpm test:watch stock` running while editing. The native watch target works in agent and CI sessions. Use `pnpm test:changed` or `pnpm validate` afterward to check affected consumers.
- Co-locate backend tests next to the module source, such as `apps/backend/src/application/commerce/stock/*.test.ts`; cross-module tests go under `apps/backend/test/integration/<feature>/`. Use `.worker.test.ts` and `.request.test.ts` for Worker and request runtimes. Prefix Astro page tests with `_`, such as `_catalog-media.test.ts`.
- Native Vitest discovery accepts `.test` and `.spec` TypeScript files. Keep root-level contract tests conservative; add behavior tests to the owning module.
- A new module needs a native Nx root and test target, declared non-import dependencies, and matching boundary policy. The test inventory fails when a test is omitted from its root or appears more than once.
- `test:changed` and `validate` use `origin/main` by default; `--since` overrides the base. Nx caps task concurrency at three; the validation wrapper rejects the obsolete `--jobs` option. Full CI and applicable browser acceptance gates remain required.

The existing `--scope` compatibility path is partial. Use named Nx projects and affected commands for current guidance; do not infer complete scope coverage from a legacy scoped result.

For public frontend edits, check `pnpm site:dev:status`, reuse the server if present, otherwise start `pnpm site:dev:bg`, and inspect the affected route. Use `pnpm dev` for CMS, checkout or publication behavior. The full Local stack can own port 4321; the Astro server rejects an occupied canonical port instead of moving to another one.

Record post-migration local time to first failure and total duration separately from hosted queue, setup, transfer, runner cost, UAT quick-check and promotion-ready time. The September 29 migration measurements and their limits are recorded in the change's `nx-migration-validation.md`. Compare samples with equivalent selection and report counts; do not infer speed gains from the task graph.

## Hosted release feedback

The candidate workflow runs checks and UAT/PRD preparation independently where allowed; candidate assembly still waits for checks and both target bundles. Failed validation cannot reach deployment or produce an assembled candidate. Each target builds the public frontend once and includes the staff build in the combined CMS build. This may spend runner time preparing bundles for a candidate that later fails.

UAT continues through Pages inspection and the `uat-release` reusable workflow while PRD preparation runs. Worker and provider-smoke jobs bind `catalog-promotion-uat`; the Pages job uses the repository Pages token. PRD promotion retains the direct jobs and schema-2 `release-<sha>` artifact without rebuilding. Hosted credential resolution remains unmeasured until an authorized workflow run.

Automatic preparation uses cancellable branch-and-role concurrency groups. UAT mutations and acceptance hold `blackbox-release`; PRD dispatch, content publication and holding-page deployment share the release lock. Monotonic run-number checks reject late candidates. Cancellation can discard preparation but cannot interrupt active mutation and acceptance.

For local recovery, inspect `.codex-artifacts/validation/<run>/summary.json`, then the named failure log. Rerun `pnpm validate` after source changes; use `pnpm validate:full --no-cache` for a fresh full-suite diagnosis. For hosted failures, inspect run and UAT smoke evidence, then prepare a fresh candidate after rollback. Never bypass release verification, reseed data or reuse incompatible evidence.
