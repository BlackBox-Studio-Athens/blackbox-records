## 1. Inventory And Compatibility

- [x] 1.1 Inventory current smoke commands, script entrypoints, scenario names, workflow invocations, evidence paths, screenshots/traces, and redaction behavior.
- [x] 1.2 Record which current `smoke:stripe-sandbox` options and scenario names are public compatibility surface.
- [x] 1.3 Record which current `smoke:stripe-promotion` options and evidence statuses are public compatibility surface.
- [x] 1.4 Decide the transition plan for legacy evidence directories versus `.codex-artifacts/smoke/<environment>/<suite>/<run-id>/`.

## 2. Shared Smoke Harness

- [x] 2.1 Add shared helpers for URL normalization, route URL construction, positive integer parsing, scenario selection primitives, and screenshot/trace mode parsing.
- [x] 2.2 Add shared Playwright helpers for browser launch, context/page setup, timeout defaults, console-error capture, page-error capture, screenshot capture, and cleanup.
- [x] 2.3 Add shared route probing and text-reading helpers for static route checks.
- [x] 2.4 Add shared redaction and high-risk secret exposure detection for provider IDs, checkout/session IDs, Stripe secrets, Cloudflare tokens, Access tokens, D1 binding names, and runtime secret variable names.
- [x] 2.5 Add shared evidence helpers for run IDs, per-scenario `evidence.json`, run `summary.json`, and artifact-safe paths.
- [x] 2.6 Add focused tests for all shared harness behavior.

## 3. UAT Static Smoke Suite

- [x] 3.1 Add `pnpm smoke:uat-static` with `--site-url`, `--scenario`, `--timeout-ms`, `--evidence-dir`, `--screenshots`, and optional `--headed`.
- [x] 3.2 Implement `cms_admin` coverage for deployed `/admin/#/`, Decap login/bootstrap visibility, console/page errors, and screenshots on failure.
- [x] 3.3 Implement `cms_assets` coverage for `/admin/config.yml`, `/admin/init.js`, admin CSS, preview CSS, representative media, config placeholder checks, and secret exposure scanning.
- [x] 3.4 Implement `public_routes` coverage for home, releases, representative release, artists, representative artist, distro, store, services, about, sitemap, and robots.
- [x] 3.5 Implement `checkout_shell` coverage for the checkout shell route without starting payment or creating provider state.
- [x] 3.6 Write redacted summary and per-scenario evidence under the standard smoke evidence contract.
- [x] 3.7 Add focused tests for scenario selection, route generation, config placeholder detection, secret-pattern detection, and evidence shape.

## 4. Existing Provider Smoke Refactor

- [x] 4.1 Refactor `smoke:stripe-sandbox` to use shared harness helpers for low-risk common behavior while preserving scenario names, CLI options, preflight checks, payment flows, D1 checks, and pass/fail semantics.
- [x] 4.2 Refactor `smoke:stripe-promotion` to use shared evidence/redaction helpers while preserving PRD-open gate, no-payment behavior, and paid-smoke policy status behavior.
- [x] 4.3 Keep provider smoke evidence redacted and avoid committing provider IDs, session IDs, secrets, or private order/provider payloads.
- [x] 4.4 Add/update tests proving existing provider smoke compatibility is preserved.

## 5. Workflow Integration

- [x] 5.1 Add a manual UAT static smoke GitHub Actions workflow with `site_url`, scenario, timeout, and screenshot inputs.
- [x] 5.2 Update catalog promotion UAT to run Stripe sandbox smoke and UAT static smoke as separate steps.
- [x] 5.3 Update artifact upload paths to include standard smoke evidence and any temporary legacy paths.
- [x] 5.4 Keep UAT static smoke out of the default GitHub Pages deployment gate unless a later change promotes it.
- [x] 5.5 Ensure fork/secret behavior remains safe and no static smoke path requires provider secrets.

## 6. Documentation And Baseline Updates

- [x] 6.1 Update README or validation docs with the smoke suite taxonomy, commands, evidence paths, and acceptance boundaries.
- [x] 6.2 Update OpenSpec baseline specs with Smoke Harness, Smoke Suite, Smoke Scenario, Smoke Evidence, Static Smoke, Provider Smoke, and Promotion Smoke terminology.
- [x] 6.3 Update tooling-validation requirements for shared smoke harness and evidence behavior.
- [x] 6.4 Update static-site-and-deployment requirements for UAT static/CMS smoke.
- [x] 6.5 Update commerce-checkout requirements so shared harness refactors do not dilute Stripe provider smoke authority.

## 7. Verification

- [x] 7.1 Run focused smoke harness and runner tests.
- [x] 7.2 Run `pnpm test:unit`.
- [x] 7.3 Run `pnpm check`.
- [x] 7.4 Run `pnpm build`.
- [x] 7.5 Run `pnpm openspec -- validate standardize-smoke-testing --type change --strict`.
- [x] 7.6 Run `pnpm openspec -- validate --all --strict`.
- [x] 7.7 Run `pnpm smoke:uat-static -- --site-url https://blackbox-studio-athens.github.io/blackbox-records` when deployed UAT is reachable.
- [x] 7.8 Run existing Stripe sandbox smoke scenarios or record exact provider/environment blockers. Blocked in this environment by Cloudflare D1 API authorization failure (`code 7403`) when the smoke runner tried to ensure sandbox stock.
