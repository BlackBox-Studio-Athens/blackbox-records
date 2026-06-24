## Context

Current `main` has two smoke commands:

- `pnpm smoke:stripe-sandbox`: a large Playwright-backed UAT/sandbox runner that creates hosted Checkout sessions, observes Stripe Checkout, optionally submits test payments, checks remote D1 order state, writes redacted evidence under `.codex-artifacts/stripe-sandbox-smoke/**`, and is invoked from UAT catalog promotion.
- `pnpm smoke:stripe-promotion`: a PRD-oriented no-payment runner that checks production checkout surface/readiness when the PRD-open gate allows it and writes evidence under catalog promotion artifacts.

The pending UAT static smoke work adds `pnpm smoke:uat-static`, a manual workflow, and reusable helper concepts. That work covers a gap: deployed GitHub Pages static/admin failures, including Decap boot/config/media failures, representative public routes, sitemap/robots, checkout shell visibility, console errors, and high-risk public-secret exposure.

External research on maintained projects supports consolidation of harness behavior without collapsing suite boundaries:

- Playwright CI guidance standardizes browser install, CI execution, reports, screenshots/traces, and artifacts.
- Vercel's app examples keep a dedicated Playwright workflow with browser caching and uploaded reports.
- Astro separates normal tests, E2E, and smoke jobs.
- Cloudflare deployment examples run deployment smoke as a separate post-deploy job.
- Shopify Hydrogen separates E2E, deployed-environment E2E, scaffolding smoke, and artifact upload.

The pattern is not "one giant smoke test." The pattern is shared infrastructure, domain-specific suites, and evidence that can be inspected after CI.

## Goals / Non-Goals

**Goals:**

- Make smoke runners consistent and easier to extend without duplicating Playwright setup, route probing, redaction, screenshots, traces, and evidence writing.
- Add UAT static/CMS smoke as a first-class suite alongside Stripe provider smoke.
- Keep existing Stripe sandbox scenario names and behavior stable unless a test proves a compatibility reason to change them.
- Preserve explicit UAT/PRD evidence boundaries and avoid accepting preview or branch deploys as product evidence.
- Keep smoke artifacts redacted and structured enough for CI, promotion review, and local debugging.

**Non-Goals:**

- Do not replace unit tests, repository gates, OpenSpec validation, or Browser Use acceptance checks.
- Do not submit production payments or make live provider mutations outside existing PRD-open and paid-smoke policy gates.
- Do not make UAT static smoke a mandatory GitHub Pages deploy gate in this change.
- Do not rewrite all Stripe sandbox browser automation in one high-risk pass.
- Do not commit provider IDs, secrets, checkout session IDs, raw order rows with private data, screenshots containing secrets, or unredacted provider responses.

## Decisions

### Decision 1: Use shared harness plus separate runners

Create a shared smoke harness for common mechanics, then keep suite runners small and domain-owned.

Rationale: Provider smokes and static smokes have different authority boundaries, setup needs, and failure meanings. A single runner would mix responsibilities. A shared harness removes duplication while keeping each suite clear.

### Decision 2: Standardize evidence, migrate paths carefully

New evidence should use:

```text
.codex-artifacts/smoke/<environment>/<suite>/<run-id>/
```

Each run should include a `summary.json`; each scenario should include `evidence.json`; screenshots and traces should be controlled by runner options and written only when configured or on failure. Existing workflow upload paths may temporarily include legacy directories until all consumers move to the new structure.

Rationale: Existing evidence paths are suite-specific. A standard contract improves artifact upload, comparison, and debugging without breaking current promotion evidence immediately.

### Decision 3: Keep UAT static smoke non-mutating

The UAT static suite should only read deployed static routes and browser-visible assets. It may open `/admin/#/`, fetch Decap config/assets/media, probe public routes, inspect console/page errors, scan for high-risk secret exposure, and open the checkout shell. It must not authenticate to CMS, edit content, create checkout sessions, mutate D1, call webhooks, or touch Stripe.

Rationale: This suite catches static deploy and CMS bootstrap failures without changing provider state.

### Decision 4: Keep provider smoke authoritative for commerce evidence

Stripe sandbox smoke remains the UAT authority for hosted Checkout amount, currency, payment-method surface, paid test-card outcomes, webhook delivery, order reconciliation, and stock effects. PRD promotion smoke remains readiness/no-payment evidence unless explicit production paid-smoke policy is enabled.

Rationale: Static route probes cannot prove provider state. Provider smokes need their own preflight, remote D1, Stripe, and Worker assertions.

### Decision 5: Test harness behavior separately from hosted smoke

Add fast unit tests for harness functions and runner selection/evidence contracts. Hosted smoke runs remain operator or CI environment checks because they depend on deployed URLs, provider readiness, and browser automation.

Rationale: Fast tests catch regressions in parser/redaction/evidence logic; hosted smoke catches deployment/provider drift.

## Migration Plan

1. Inventory current smoke scripts, workflows, evidence paths, test files, and redaction logic.
2. Add shared smoke harness for URL normalization, CLI parsing helpers where useful, browser launch/close, console/page-error capture, route probing, screenshot/trace policy, redaction, secret scanning, evidence writing, and summary formatting.
3. Add or migrate UAT static smoke onto the shared harness.
4. Refactor `smoke:stripe-sandbox` to use the shared harness only for low-risk common pieces first: redaction, evidence writing, screenshot/trace path policy, URL normalization, and browser lifecycle.
5. Refactor `smoke:stripe-promotion` to use common evidence/redaction helpers without changing PRD-open or paid-smoke policy behavior.
6. Add root scripts for `smoke:uat-static` and focused smoke tests.
7. Update catalog promotion so UAT runs static smoke and Stripe sandbox smoke as separate steps, with both artifact trees uploaded.
8. Add a manual UAT static smoke workflow with `site_url`, scenario, timeout, and screenshot options.
9. Update OpenSpec baseline specs and docs with smoke suite boundaries and evidence terminology.
10. Validate with focused smoke tests, OpenSpec strict validation, `pnpm test:unit`, `pnpm check`, and `pnpm build`.

## Risks / Trade-offs

- [Risk] Refactoring the large Stripe sandbox runner changes behavior. Mitigation: keep public scenario names stable, add tests before refactor, and migrate only shared plumbing first.
- [Risk] Evidence path changes break CI artifact collection. Mitigation: upload both legacy and new paths during transition or add compatibility writes.
- [Risk] Static smoke becomes a false product acceptance gate. Mitigation: document it as static/CMS deployment evidence only; provider smoke remains commerce evidence.
- [Risk] Secret scanning creates false positives from variable names in public docs. Mitigation: classify high-risk patterns explicitly and make failures actionable.
- [Risk] Hosted smoke can be flaky due to deploy propagation. Mitigation: keep manual rerun support, scenario selection, timeouts, and clear skipped/blocked states.

## Validation Notes

- Browser Use is not required to create or validate this OpenSpec plan.
- Implementation that changes smoke scripts or workflows must run focused smoke script tests and the standard repository gates.
- Running deployed hosted smoke is acceptance evidence for the implementation only when the target UAT/PRD URLs and provider prerequisites are available.
