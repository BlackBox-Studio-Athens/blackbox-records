## Why

Maintainers can already create release and distro content through Decap, but making a new item buyable still requires a developer/operator to regenerate catalog artifacts, seed D1, apply Stripe catalog state, deploy the Worker, and run smoke tests by hand. That gap makes CMS publishing only half-automated and leaves UAT less production-like than it should be.

## What Changes

- Add a CMS-driven Catalog Promotion pipeline that starts from Decap-authored Astro content and automatically promotes buyable catalog changes through UAT and production.
- Make UAT and production use the same promotion shape: generated artifacts, repository gates, environment D1 seed/migration readiness, Stripe catalog dry-run, Stripe catalog apply, post-apply verification, Worker deploy, frontend deploy when needed, and smoke evidence.
- Replace the current sandbox-only catalog apply policy with an environment-scoped apply policy that supports production after production-specific guards, idempotency, evidence capture, rollback, and failure isolation are implemented.
- Add CMS fields and validation for explicit commerce intent, target price, currency, stock readiness policy, and publish target so production automation does not infer live prices from vague editorial content.
- Keep checkout runtime authority intact: the browser never receives Stripe IDs or secrets, Stripe active Prices remain the payment authority at checkout time, and D1/Worker state remains the source for Store Offer readiness.
- Add workflow and script tasks for bot-generated artifact commits, provider mutation reports, production-safe redaction, GitHub Actions concurrency, environment protection, and actionable failure reporting back to maintainers.
- Require production smoke evidence for a newly promoted item before the pipeline can mark the catalog promotion successful.

## Capabilities

### New Capabilities

- `catalog-promotion-automation`: Defines CMS-to-provider catalog promotion across UAT and production, including Decap input contracts, generated artifacts, environment parity, apply safety, deployment sequencing, smoke evidence, and rollback.

### Modified Capabilities

- `commerce-checkout`: Checkout readiness must support CMS-promoted live catalog items while preserving Worker, D1, and Stripe authority boundaries.
- `static-site-and-deployment`: Deployment workflows must coordinate static frontend, Worker, D1, and provider catalog promotion instead of treating content deploy and backend/provider state as separate manual tracks.
- `tooling-validation`: Validation gates must include automated UAT and production catalog promotion proof, not only local checks or sandbox operator commands.
- `project-language`: Add canonical terms for Catalog Promotion, Desired Catalog State, Provider Catalog State, Promotion Run, and Promotion Evidence.

## Impact

- Decap collection builders under `apps/web/src/lib/admin/**`
- Astro content schemas in `apps/web/src/content.config.ts`
- Catalog projection and artifact scripts under `scripts/stripe-catalog-*.ts` and `scripts/generate-stripe-uat-catalog-artifacts.ts`
- Generated Product Projection manifests and environment seed SQL under `apps/backend/src/application/commerce/catalog-sync/**` and `apps/backend/prisma/seeds/**`
- Backend catalog reconciliation and Stripe catalog gateway under `apps/backend/src/application/commerce/catalog-sync/**` and `apps/backend/src/infrastructure/stripe/**`
- Worker deploy, D1 seed/migration, Stripe verification/apply, and smoke workflows under `.github/workflows/**`
- Existing sandbox UAT and production go-live documentation, which must be updated to describe the automated promotion path and evidence boundaries
