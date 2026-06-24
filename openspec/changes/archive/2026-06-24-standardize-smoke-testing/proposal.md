## Why

Current smoke coverage is valuable but split by provider workflow: `smoke:stripe-sandbox` owns most Playwright, redaction, browser, and evidence behavior; `smoke:stripe-promotion` owns production no-payment evidence; and the pending UAT static smoke work adds another runner with similar concerns. That makes new smoke coverage more likely to copy script plumbing, drift evidence shape, or miss deployed static/CMS failures that are outside Stripe Checkout.

Maintained frontend and deployment-heavy projects generally separate smoke scope by suite while standardizing the harness around Playwright setup, scenario selection, report artifacts, deployment URLs, and uploaded evidence. BlackBox should follow that pattern: one shared smoke core, several small domain runners.

## What Changes

- Add a shared smoke harness for URL normalization, scenario selection, Playwright browser lifecycle, route probing, console/page-error capture, screenshot/trace policy, redaction, secret scanning, evidence writing, and failure summaries.
- Keep provider-specific runners separate:
  - `smoke:stripe-sandbox` for UAT hosted Stripe Checkout and paid sandbox evidence.
  - `smoke:stripe-promotion` for PRD no-payment checkout readiness and paid-smoke policy evidence.
  - `smoke:uat-static` for deployed GitHub Pages UAT static, Decap/admin, public route, sitemap/robots, and no-payment checkout-shell coverage.
- Standardize evidence output under a common `.codex-artifacts/smoke/<environment>/<suite>/<run-id>/` contract while preserving backward-compatible artifact paths or workflow uploads during migration.
- Add focused tests for the shared harness and each runner's scenario selection, redaction, evidence shape, and non-mutating boundaries.
- Update catalog promotion and manual smoke workflows so static/CMS smoke and provider smoke are separate steps with consistent artifact upload.

## Capabilities

### Modified Capabilities

- `tooling-validation`: Defines the shared smoke harness, evidence contract, suite boundaries, and validation expectations.
- `static-site-and-deployment`: Adds deployed UAT static/CMS smoke as a manual and promotion-integrated verification path without turning it into a default GitHub Pages deploy gate.
- `commerce-checkout`: Keeps Stripe sandbox and PRD promotion smokes authoritative for checkout/provider evidence while moving common plumbing into the shared smoke harness.
- `project-language`: Adds canonical smoke terminology: Smoke Harness, Smoke Suite, Smoke Scenario, Smoke Evidence, Static Smoke, Provider Smoke, and Promotion Smoke.

## Impact

- `scripts/smoke-core.ts` or equivalent shared harness.
- Existing smoke runners under `scripts/smoke-*.ts`.
- Root `package.json` smoke and focused smoke-test scripts.
- `.github/workflows/catalog-promotion.yml` and a new/manual UAT static smoke workflow if implementation includes that runner.
- Script tests under `apps/backend/test/scripts/`.
- OpenSpec baseline specs for smoke vocabulary, static deployment validation, checkout/provider evidence, and tooling validation.
