## 1. Baseline and Measurement

- [x] 1.1 Preserve the 2026-06-26 baseline report under `.codex-artifacts/ci-speed-analysis/` for comparison.
- [x] 1.2 Add or document a repeatable CI speed measurement command that uses GitHub Actions run, job, and step timing data through `gh`/GitHub API.
- [x] 1.3 Ensure the measurement command handles reruns by using latest-attempt job spans instead of raw run wall-clock gaps.
- [x] 1.4 Ensure the report outputs median, p75, p90, sample counts, conclusion counts, confidence labels, and runner-minute/job-duration estimates.
- [x] 1.5 Run the measurement command before workflow edits and record the baseline for UAT Pages, PRD Pages, UAT provider smoke, and Catalog promotion.
- [x] 1.6 Record per-job dependency install, cache restore/save, artifact upload, and artifact download timings so caching changes are judged by data.

## 2. UAT Pages Workflow

- [x] 2.1 Replace `withastro/action` in `.github/workflows/pages.yml` with explicit setup, install, gate, build, artifact upload, and deploy steps.
- [x] 2.2 Split independent UAT work into parallel jobs for unit tests, workspace checks, unused audit, and UAT static artifact build.
- [x] 2.3 Keep the UAT static build using the existing GitHub Pages target variables: `ASTRO_SITE_URL`, `ASTRO_BASE_PATH`, and `PUBLIC_BACKEND_BASE_URL`.
- [x] 2.4 Upload the UAT `apps/web/dist` artifact with the GitHub Pages artifact action after the UAT build succeeds.
- [x] 2.5 Make the UAT deploy job wait for unit tests, workspace checks, unused audit, and the UAT artifact build.
- [x] 2.6 Use `actions/setup-node` pnpm caching with `cache-dependency-path: pnpm-lock.yaml` in every UAT job that runs `pnpm install --frozen-lockfile`.
- [x] 2.7 Set explicit least-privilege permissions, concurrency, and timeouts for UAT jobs based on their role and measured p90 duration.
- [x] 2.8 Verify UAT workflow timing now separates repository verification, Astro build, artifact upload, and GitHub Pages deploy latency.

## 3. PRD Pages Workflow

- [x] 3.1 Split `.github/workflows/cloudflare-pages.yml` into parallel jobs for unit tests, workspace checks, unused audit, and PRD static artifact build.
- [x] 3.2 Keep the PRD static build using the existing Cloudflare Pages target variables and browser-safe public env.
- [x] 3.3 Upload the PRD `apps/web/dist` artifact from the build job and download it in the deploy job.
- [x] 3.4 Make the Cloudflare Pages deploy job wait for unit tests, workspace checks, unused audit, and the PRD artifact build.
- [x] 3.5 Keep deployment through `wrangler pages deploy` and keep Cloudflare credentials scoped to the deploy job.
- [x] 3.6 Use `actions/setup-node` pnpm caching with `cache-dependency-path: pnpm-lock.yaml` in every PRD job that runs `pnpm install --frozen-lockfile`.
- [x] 3.7 Set explicit least-privilege permissions, concurrency, and timeouts for PRD jobs based on their role and measured p90 duration.

## 4. Cache and Artifact Policy

- [x] 4.1 Do not cache `node_modules`, `.astro`, `.vite`, build output, or Playwright browsers in the first implementation pass.
- [x] 4.2 Keep dependency caching limited to setup-node's pnpm store cache unless post-change measurement proves a material bottleneck.
- [x] 4.3 Keep uploaded static artifacts scoped to deploy output only and set short retention suitable for deployment diagnostics.
- [x] 4.4 Measure artifact upload/download overhead and reject cross-job splitting if artifact overhead erases the wall-clock gain.

## 5. Reliability-First Workflows

- [x] 5.1 Classify Catalog promotion failures from the baseline window before attempting speed optimization in that workflow.
- [x] 5.2 Classify UAT provider smoke failures from the baseline window before attempting speed optimization in that workflow.
- [x] 5.3 Add only low-risk reliability fixes needed for stable measurement, not broad promotion or smoke rewrites.
- [x] 5.4 Defer Playwright browser caching unless post-classification measurement shows browser install is a material bottleneck.
- [x] 5.5 Move Catalog PRD open-gate checking before unnecessary setup/install work only if the small diff remains isolated and measurable.

## 6. Validation and Acceptance

- [x] 6.1 Run workflow syntax/static validation for all edited workflow files with `actionlint` or an equivalent GitHub Actions workflow linter.
- [x] 6.2 Run `pnpm test:unit`.
- [x] 6.3 Run `pnpm check`.
- [x] 6.4 Run `pnpm build`.
- [x] 6.5 Run `openspec validate improve-ci-pipeline-speed --type change --strict`.
- [x] 6.6 Run `openspec validate --all --strict`.
- [x] 6.7 Trigger enough post-change workflow runs to collect at least 5 successful runs for each optimized static deploy workflow.
- [x] 6.8 Re-run the CI speed measurement and compare pre-change vs post-change median, p75, p90, success rate, and runner-minute/job-duration impact.
- [x] 6.9 Accept the change only if PRD Pages wall-clock median improves materially without gate removal and UAT Pages validated-build feedback improves or stays stable while deploy-tail latency is reported separately.
- [x] 6.10 Update the report with final measured outcome and any remaining low-confidence workflows.

## 7. Runner-minute Follow-up

- [x] 7.1 Use the 5-run post-change timing report to identify runner job-duration regressions by job and step.
- [x] 7.2 Keep cache policy unchanged; reject `node_modules`, generated output, and Playwright cache work because install time is not the measured bottleneck.
- [x] 7.3 Fold UAT and PRD `pnpm audit:unused` into `workspace-checks` so the audit still gates deploy without a separate runner job.
- [x] 7.4 Replace PRD deploy job checkout/setup/install with the official pinned Wrangler action while keeping Cloudflare credentials scoped to the deploy job.
- [x] 7.5 Run workflow syntax/static validation for the edited workflow files.
- [x] 7.6 Run `pnpm test:unit`, `pnpm check`, and `pnpm build`.
- [x] 7.7 Push one evidence commit and collect UAT/PRD static workflow timings for the runner-minute fix.
- [x] 7.8 Compare post-fix runner job-duration and wall-clock timing against the 5-run split-workflow report and confirm UAT smoke/Catalog promotion are not changed.
