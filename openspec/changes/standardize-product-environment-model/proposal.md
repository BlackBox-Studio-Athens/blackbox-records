## Why

`apps/backend/src/env.ts` already treats Local, UAT, and PRD as the product environments, but it still exposes Worker targets, provider modes, routing modes, CLI aliases, and display labels as competing environment concepts. This makes runtime code, scripts, tests, docs, and operator commands easier to misread and harder to validate.

## What Changes

- Make `ProductEnvironment = 'LOCAL' | 'UAT' | 'PRD'` the only canonical product environment type and runtime value across backend runtime config, scripts, validation output, tests, and docs.
- Replace ambiguous runtime binding use of `APP_ENV` with a product-environment binding, tentatively `PRODUCT_ENVIRONMENT`, whose accepted canonical values are `LOCAL`, `UAT`, and `PRD`.
- Keep platform/provider terms such as `sandbox`, `production`, `mock`, `test`, `live`, `direct`, and `uat-sink` as derived profile traits or boundary-specific compatibility aliases, not product-environment choices.
- Prefer product-environment CLI targets such as `--env local|uat|prd`; compatibility parsing may accept legacy `sandbox` and `production` only at explicit edge adapters with deprecation output.
- Rename or reorganize profile fields so provider and delivery policy traits are clear, for example `stripeMode`, `emailDeliveryPolicy`, and `workerDeploymentTarget`, instead of presenting them as peer environment axes.
- Update validation scripts, smoke/catalog tooling, Wrangler config, docs, OpenSpec specs, and tests so operator-facing output consistently names Local, UAT, and PRD first.
- Add drift checks that fail when new code branches directly on raw `sandbox`, `production`, `test`, or `live` environment aliases outside documented platform/provider boundary adapters.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `environment-model`: Strengthen the canonical Product Environment contract from documentation language into code/runtime/config expectations.
- `project-language`: Clarify that uppercase `LOCAL`, `UAT`, and `PRD` are the canonical code/config values, while Local, UAT, and PRD remain prose labels.
- `tooling-validation`: Require environment validation and CLI tooling to prefer product-environment targets, normalize compatibility aliases only at edges, and detect raw alias branching drift.
- `static-site-and-deployment`: Require Worker deployment config and frontend/backend deployment docs to map platform targets under `LOCAL`, `UAT`, and `PRD`.
- `commerce-checkout`: Require checkout, provider mutation, capability evaluation, catalog verification, and smoke evidence to evaluate against canonical Product Environment values, with provider modes derived from profile policy.

## Impact

- Affected backend runtime and tests: `apps/backend/src/env.ts`, runtime binding types, email config, feature flags, checkout services, catalog scheduling/webhook services, and related unit tests.
- Affected config and scripts: `apps/backend/wrangler.jsonc`, backend deploy scripts, runtime config verification, Stripe catalog verification, environment model verification, Stripe promotion smoke, local stack launchers, and any script parsing `--env`.
- Affected docs/specs: `README.md`, `docs/environment-model.md`, relevant command docs, OpenSpec baseline specs, and active changes that still use platform/provider aliases as product environment substitutes.
- No new runtime dependency is expected. This is a model and naming cleanup plus migration of non-secret environment/config values.
