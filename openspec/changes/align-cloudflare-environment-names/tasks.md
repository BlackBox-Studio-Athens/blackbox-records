## 1. OpenSpec And Naming Contract

- [x] 1.1 Validate the new OpenSpec change artifacts.
- [x] 1.2 Update baseline OpenSpec specs to use Cloudflare/Wrangler `uat` and `prd` target names.
- [x] 1.3 Keep Stripe test/live terms only where they describe Stripe provider mode.

## 2. Runtime Config And Scripts

- [x] 2.1 Rename Wrangler env keys and Worker/D1 names in `apps/backend/wrangler.jsonc`.
- [x] 2.2 Update backend environment profile mapping, including `WorkerRuntimeTarget` and `stripeModeSchema`.
- [x] 2.3 Update package scripts so preferred commands use `uat` / `prd` and cheap legacy aliases call the new targets.
- [x] 2.4 Update runtime config verification and environment model validation.

## 3. Catalog And Smoke Tooling

- [x] 3.1 Rename Desired Catalog target values from `sandbox` / `production` to `uat` / `prd`.
- [x] 3.2 Rename Stripe UAT catalog reset and smoke command surfaces while keeping legacy aliases.
- [x] 3.3 Update webhook verification, promotion smoke, Resend smoke, local stack, and Stripe listener defaults to the new Worker URLs.
- [x] 3.4 Regenerate committed catalog artifacts.

## 4. Workflows And Docs

- [x] 4.1 Rename UAT Worker deploy and UAT smoke workflow files, labels, concurrency groups, artifact names, and URLs.
- [x] 4.2 Update README and docs for the new UAT/PRD Cloudflare names and manual cutover checklist.
- [x] 4.3 Update observability instructions to use `wrangler tail --env uat|prd`.

## 5. Cloudflare Cutover

- [x] 5.1 Create or discover D1 databases `blackbox-records-commerce-uat` and `blackbox-records-commerce-prd`.
- [x] 5.2 Copy old D1 data to the new D1 databases using ignored local exports.
- [x] 5.3 Deploy renamed UAT/PRD Worker scripts.
- [ ] 5.4 Re-enter Worker secrets, update GitHub Actions variables, and update Stripe webhook endpoints for the new Worker URLs.
  - Verified 2026-06-24: `pnpm runtime:config:verify --env uat` passes; the renamed UAT Worker reports required runtime categories present, including Stripe, D1, Resend, and return-origin config.
  - Verified 2026-06-24: `pnpm runtime:config:verify --env prd` passes for disabled PRD readiness; the renamed PRD Worker has D1, Resend, and return-origin config needed while PRD checkout/live mutation remain closed.
  - Missing 2026-06-24: `pnpm runtime:config:verify --env prd --require-live-secrets` fails because PRD live checkout/promotion still lacks `STRIPE_PAYMENT_METHOD_CONFIGURATION_ID`, `STRIPE_SECRET_KEY`, and `STRIPE_WEBHOOK_SECRET` on the deployed PRD Worker.
  - Verified 2026-06-24: repo-level GitHub Actions variables `UAT_PUBLIC_BACKEND_BASE_URL` and `PRD_PUBLIC_BACKEND_BASE_URL` point at the renamed UAT/PRD Worker URLs.
  - Missing 2026-06-24: repo-level GitHub Actions variable `PUBLIC_BACKEND_BASE_URL` still exists and points at the old sandbox Worker URL. Workflows no longer consume it for UAT/PRD builds, but it remains stale naming drift.
  - Verified 2026-06-24: `catalog-promotion-uat` GitHub environment has `CLOUDFLARE_ACCOUNT_ID`, `STRIPE_PAYMENT_METHOD_CONFIGURATION_ID`, `CLOUDFLARE_API_TOKEN`, and `STRIPE_SECRET_KEY`.
  - Missing 2026-06-24: `catalog-promotion-prd` GitHub environment has `CLOUDFLARE_ACCOUNT_ID` and `PRD_OPEN_GATE=closed`, but lacks the PRD `STRIPE_PAYMENT_METHOD_CONFIGURATION_ID` variable and `STRIPE_SECRET_KEY` secret required when `PRD_OPEN_GATE=open`.
  - Missing 2026-06-24: old GitHub environment `catalog-promotion-production` still exists with `CLOUDFLARE_ACCOUNT_ID`; it is no longer referenced by workflows but remains a legacy environment-name artifact.
  - Blocked 2026-06-24: `pnpm stripe:webhooks:verify --env uat|prd` cannot run from this local shell because no local `STRIPE_SECRET_KEY` is loaded. UAT has the GitHub environment secret needed for CI verification; PRD does not yet have the live Stripe secret.
  - Still required: verify or update persistent Stripe webhook endpoints for `https://blackbox-records-backend-uat.blackboxrecordsathens.workers.dev/api/stripe/webhooks` and `https://blackbox-records-backend-prd.blackboxrecordsathens.workers.dev/api/stripe/webhooks` with provider credentials, without printing signing secrets.
- [x] 5.5 Record any external cutover steps that remain manual because secrets or provider dashboards are required.

## 6. Validation

- [x] 6.1 Run focused env/script/catalog tests.
- [x] 6.2 Run `pnpm openspec -- validate align-cloudflare-environment-names --type change --strict`.
- [x] 6.3 Run `pnpm test:unit`.
- [x] 6.4 Run `pnpm check`.
- [x] 6.5 Run `pnpm build`.
