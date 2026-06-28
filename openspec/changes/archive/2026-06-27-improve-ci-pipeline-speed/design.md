## Context

The CI speed report at `.codex-artifacts/ci-speed-analysis/ci-speed-report.md` measured 96 workflow runs, 140 jobs, and 1299 steps from 2026-06-12 through 2026-06-26. Useful findings:

- UAT Pages is the slowest high-confidence workflow: median 3m 39s, p90 9m 56s.
- UAT Pages build/verify work is stable around 2m 17s, but GitHub Pages deploy has high tail latency: median 1m 05s, p90 7m 26s.
- PRD Pages is stable at median 2m 34s and p90 2m 42s; `pnpm test:unit` plus `pnpm check` account for about 1m 37s.
- Dependency install is not worth optimizing now: explicit `pnpm install --frozen-lockfile` steps are about 3s median with the existing cache.
- Catalog promotion and UAT provider smoke have high failure rates, so speed claims there are low-confidence until reliability is fixed.

Current deployment contracts still matter more than raw speed: UAT remains GitHub Pages, PRD remains Cloudflare Pages, and both static deploy workflows must keep `pnpm test:unit`, `pnpm check`, and `pnpm build` protection before deployment.

GitHub Actions guidance for this slice:

- Use `actions/setup-node` built-in dependency caching for pnpm store cache, keyed from the lockfile.
- Do not cache `node_modules`; pnpm store caching plus `pnpm install --frozen-lockfile` is the safer default.
- Use upload/download artifacts for cross-job build outputs.
- Keep permissions least-privilege at workflow/job level.
- Use concurrency to cancel stale deploy/smoke work where only the newest commit matters.

## Goals / Non-Goals

**Goals:**

- Reduce measured PRD Pages wall-clock time by running independent repository gates and build work in parallel.
- Reduce UAT Pages validated-build feedback time and make deploy tail latency visible as a separate provider-hosting concern.
- Keep UAT/PRD deploy correctness: deployment must wait for unit tests, workspace checks, unused audit where already required, and the target-specific static artifact.
- Make CI speed measurement repeatable with enough sample size and explicit confidence rules.
- Keep dependency caching simple and measurable: setup-node pnpm store cache first, no custom cache unless data justifies it.
- Modernize edited workflows around explicit permissions, pinned actions, artifact retention, concurrency, and timeouts.
- Stabilize high-failure workflows before using their timing as optimization evidence.

**Non-Goals:**

- Removing `pnpm test:unit`, `pnpm check`, `pnpm build`, or `pnpm audit:unused` from workflows where they currently protect deployment.
- Replacing GitHub Pages, Cloudflare Pages, Wrangler, pnpm, or Node 24.
- Adding a new cache layer for dependencies while install time remains about 3s median.
- Caching `node_modules` or generated build directories as an optimization shortcut.
- Optimizing app runtime, tests, lint rules, or build output without timing proof.
- Treating GitHub Pages external deploy tail latency as a repo-owned build regression.

## Decisions

### Use parallel jobs before deeper build/test rewrites

Split deploy workflows into independent jobs for unit tests, workspace checks, unused audit, target-specific static build, and deployment. The deploy job waits on all required verification jobs and consumes the built artifact.

Rationale: the PRD Pages workflow currently runs `pnpm test:unit`, `pnpm check`, audit, build, and deploy serially in one job. Parallel jobs can reduce wall-clock time without changing the commands or app behavior. This is less risky than refactoring tests, lint, Astro build, or package scripts.

Alternative considered: optimize pnpm install/cache. Rejected for now because measured install time is already about 3s median.

Alternative considered: remove duplicate gates from deploy workflows. Rejected for this change because the deployment specs require those gates before deploy; any future artifact-promotion gate unification should be a separate policy change.

### Keep caching boring and lockfile-driven

Use `actions/setup-node` with `cache: pnpm` and `cache-dependency-path: pnpm-lock.yaml` for jobs that install dependencies. Do not add `actions/cache` for `node_modules`, `.astro`, `.vite`, Playwright browsers, or build output in the first implementation pass.

Rationale: GitHub's native setup-node cache handles package-manager store caching with less YAML and lower corruption risk. The measured install cost is already tiny, so custom caches are more likely to add complexity than speed.

Alternative considered: cache `node_modules` per job. Rejected because it is brittle across Node/pnpm/package changes and current data does not justify it.

Alternative considered: cache Playwright browsers immediately. Rejected because browser install was about 23s median and only appears in the medium-confidence smoke workflow; classify smoke failures first.

### Replace opaque UAT Pages composite build with explicit steps

Replace `withastro/action` in `pages.yml` with explicit pnpm setup/install, gate jobs, `pnpm build:web` with UAT environment variables, `actions/upload-pages-artifact`, and `actions/deploy-pages`.

Rationale: `withastro/action` hides test/check/audit/build timing in one composite step, which makes optimization noisy. Explicit steps also let build and gates run in parallel while deploy still waits for all required work.

Alternative considered: keep `withastro/action` and accept coarse timing. Rejected because the report already identified opacity as a blocker to reliable measurement.

### Treat UAT Pages deploy tail as external latency

Do not try to "fix" GitHub Pages deploy p90 inside build scripts. Instead, measure and report UAT deploy latency separately from repository verification latency.

Rationale: UAT deploy p90 is high while build/verify is stable. Repo changes can improve validated feedback time, but provider deploy tail may remain noisy.

### Use artifact handoff deliberately

The static build job should upload only the built static artifact needed by deploy. The deploy job should download that artifact and deploy it without reinstalling app dependencies unless the provider CLI requires them.

Rationale: artifacts are the standard cross-job handoff. They make deploy jobs smaller and preserve the same-commit build/deploy contract.

Trade-off: artifact upload/download adds overhead. Acceptance must measure that overhead and reject the split if it erases the wall-clock gain.

### Apply modern workflow hygiene only where touched

Edited workflows should use explicit permissions, exact action versions already matching repo style, scoped env/secrets, workflow/job timeouts for bounded jobs, and concurrency groups that cancel stale work where safe.

Rationale: this keeps modernization close to the speed change without broad unrelated churn across every workflow.

### Stabilize before optimizing low-confidence workflows

Catalog promotion and UAT provider smoke should get failure classification before speed work. Speed targets for those workflows are not accepted until each has at least 5 successful post-change runs and a materially better success rate.

Rationale: failed runs were excluded from the speed baseline, so optimizing current medians could hide the real pipeline pain.

### Measure before and after

Keep a repeatable GitHub Actions timing collector that records workflow, job, and step durations using GitHub API data. Acceptance compares pre-change and post-change median/p75/p90 with sample counts and confidence labels.

Rationale: this avoids false positives from single runs, manual rerun gaps, or provider-tail outliers.

## Risks / Trade-offs

- More parallel jobs can increase total runner minutes even while reducing wall-clock time. Mitigation: report both wall-clock duration and job-minute estimate before accepting the change.
- Artifact upload/download between build and deploy jobs can erase some savings. Mitigation: measure post-change p50/p75/p90 before declaring success.
- UAT Pages deploy p90 may remain high because the slow part is external. Mitigation: acceptance distinguishes validated-build time from deploy-complete time.
- Splitting workflows can break environment variable propagation. Mitigation: keep target-specific build env on the build job and deploy secrets only on the deploy job.
- `pnpm openspec:guard` currently fails through pnpm because local dependency install hits lockfile config mismatch after `node_modules` recreation. Mitigation: resolve local dependency state before implementation validation, and do not treat that as part of the CI speed change itself.

## Runner-minute follow-up

Post-change evidence showed the static workflow split improved wall-clock time but raised runner job-duration medians: UAT Pages `3m35s -> 4m10s`, PRD Pages `2m34s -> 4m22s`.

The avoidable cost is duplicated job scaffolding, not dependency install or a missing cache:

- UAT `unused-audit` job median: `27s`, while the audit command itself is `3s`.
- PRD `unused-audit` job median: `29s`, while the audit command itself is `3s`.
- PRD deploy job median: `40s`, but it installs the full workspace only to run Wrangler. The actual Cloudflare deploy command is about `8s`.

The runner-budget follow-up keeps deploy gates intact and avoids a custom cache:

- Fold `pnpm audit:unused` into `workspace-checks` as a separately timed step.
- Remove the standalone `unused-audit` jobs from UAT and PRD deploy workflows.
- Replace PRD deploy job checkout/setup/install with the official `cloudflare/wrangler-action@v4.0.0`, pinned and running Wrangler `4.94.0`.

Expected impact from current medians:

- UAT Pages runner job-duration should drop by about `24s` with no wall-clock regression because `workspace-checks` remains below the current unit-test critical path.
- PRD Pages runner job-duration should drop by about `40s-50s` and wall-clock should improve because the deploy job no longer performs a full workspace install.
- UAT provider smoke and Catalog promotion are untouched.

## Shared static deploy follow-up

After the runner-minute fix, UAT Pages and PRD Pages still duplicated the expensive repository gates in separate workflows. Move both static targets into `.github/workflows/pages.yml` so `unit-tests` and `workspace-checks` run once per commit, then gate separate UAT and PRD build/deploy jobs.

The target boundaries stay unchanged:

- UAT builds with GitHub Pages site/base values and deploys through `actions/deploy-pages`.
- PRD builds with Cloudflare Pages site/base values and deploys through the pinned Wrangler action.
- `.github/workflows/cloudflare-pages.yml` is retired so PRD does not deploy twice.
- UAT provider smoke stays in `.github/workflows/uat-smoke.yml`; only the upstream workflow name changes.

No Playwright browser cache is present or introduced. The smoke workflows keep installing browsers at runtime.

Future smoke policy idea: if the shared static workflow makes UAT provider smoke too dependent on unrelated PRD deploy failures, propose a separate smoke-policy change that either runs provider smoke from a `deploy-uat`-scoped job or lets the smoke workflow inspect the `deploy-uat` job conclusion. That future change should decide cadence and gate semantics first; Playwright browser caching remains rejected unless timing data shows browser install is a material bottleneck.
