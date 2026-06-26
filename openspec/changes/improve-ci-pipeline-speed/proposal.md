## Why

The CI speed report measured 96 GitHub Actions runs over 14 days and found that the slowest high-confidence pain is not dependency install, but UAT Pages deploy tail latency and opaque deploy/build timing. We should improve feedback time with measured workflow changes, while preserving the existing UAT/PRD deployment gates and avoiding speculative CI rewrites.

## What Changes

- Make CI timing measurement repeatable so future optimizations compare against median, p75, and p90 baselines instead of one-off runs.
- Restructure UAT Pages workflow observability so verify/build time and GitHub Pages deploy latency are measured as separate stages.
- Keep the existing required repository gates for deployment, but avoid hiding them inside composite steps when step-level timing matters.
- Standardize GitHub Actions conventions for changed workflows: explicit least-privilege permissions, workflow/job concurrency, pinned action versions, setup-node pnpm store caching, artifact handoff between build and deploy jobs, and bounded artifact retention.
- Add a small reliability-first pass for high-failure workflows before treating their speed numbers as trustworthy.
- Defer custom dependency-cache work unless measurement shows install time has become material; current median install time is about 3 seconds.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `static-site-and-deployment`: Deployment workflows must expose measurable verify/build/deploy stages and preserve artifact/deploy correctness while improving feedback time.
- `tooling-validation`: CI performance measurement must be repeatable, statistically useful, and tied to acceptance criteria for workflow optimization work.

## Impact

- GitHub Actions workflows under `.github/workflows/`, especially `pages.yml`, `cloudflare-pages.yml`, `uat-smoke.yml`, and `catalog-promotion.yml`.
- Existing package scripts only where needed to reuse current gates; no new CI dependency should be added unless measurement proves it is necessary.
- Measurement artifacts under `.codex-artifacts/ci-speed-analysis/` or a committed script/docs location selected during implementation.
- GitHub Actions cache/artifact behavior, limited to pnpm store caching and static build artifact handoff.
- No changes to runtime app code, checkout behavior, deployment targets, Product Environment model, or required repository gates.
