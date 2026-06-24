## Why

Cloudflare and Wrangler targets still use `sandbox` and `production` while product language has standardized on Local, UAT, and PRD. This mismatch leaks into commands, workflows, URLs, logs, and operator docs, causing avoidable mistakes like running Wrangler from the wrong target name.

## What Changes

- Rename repo-owned Wrangler environment keys from `sandbox` / `production` to `uat` / `prd`.
- Rename repo-owned Worker and D1 resource names to `blackbox-records-backend-uat`, `blackbox-records-backend-prd`, `blackbox-records-commerce-uat`, and `blackbox-records-commerce-prd`.
- Align the app-owned backend `stripeModeSchema` with `local` / `uat` / `prd`; keep Stripe test/live wording only where it describes actual Stripe provider mode.
- Keep old Cloudflare Workers and D1 databases undeleted during cutover so rollback remains possible.
- Update repo commands, workflows, scripts, generated catalog targets, docs, tests, and validation to use `uat` / `prd`.
- Keep cheap legacy package-script aliases for old command names during transition, pointing to the new targets.
- **BREAKING**: direct raw Wrangler commands must use `--env uat` / `--env prd` after the new config is deployed.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `environment-model`: Cloudflare Worker runtime targets, D1 stores, and app-owned Stripe target values become `uat` / `prd`.
- `project-language`: `sandbox` and `production` stop being accepted Cloudflare/Wrangler environment names; they remain valid only as provider concepts where true, such as Stripe test/live mode.
- `static-site-and-deployment`: UAT and PRD backend URLs point at the renamed Worker resources.
- `tooling-validation`: validation must reject drift back to old Cloudflare/Wrangler names and verify renamed workflow/command contracts.
- `commerce-checkout`: generated Desired Catalog targets use `uat` / `prd` while Stripe mode remains test/live.
- `stripe-catalog-field-ownership`: UAT catalog alignment uses UAT-named catalog targets instead of sandbox-named targets.

## Impact

- Affects `apps/backend/wrangler.jsonc`, backend environment mapping, catalog scripts/artifacts, smoke scripts, workflows, docs, and tests.
- Requires manual Cloudflare cutover: create/copy D1 databases, deploy renamed Workers, re-enter Worker secrets, update GitHub Actions variables, and update Stripe webhook endpoints.
- Does not delete old Workers, old D1 databases, or old webhook endpoints in this slice.
