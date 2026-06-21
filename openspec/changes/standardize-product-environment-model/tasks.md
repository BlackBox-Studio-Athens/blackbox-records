## 1. Inventory and Decisions

- [x] 1.1 Inventory current Product Environment consumers in `apps/backend/src/env.ts`, backend runtime services, tests, scripts, workflows, docs, and OpenSpec specs.
- [x] 1.2 Decide whether legacy CLI aliases `sandbox` and `production` emit deprecation warnings immediately or remain silent compatibility aliases for this slice.
- [x] 1.3 Identify the smallest approved boundary-adapter allowlist for platform/provider terms in environment drift validation.

## 2. Canonical Environment Model

- [x] 2.1 Change `ProductEnvironment` to the uppercase string union `LOCAL | UAT | PRD` and update the Zod schema/constants in `apps/backend/src/env.ts`.
- [x] 2.2 Replace separate display-label behavior with canonical Product Environment values and helper formatting where prose output needs Local/UAT/PRD labels.
- [x] 2.3 Rename profile traits so platform/provider policy reads as derived data, including Stripe mode, email delivery policy, Worker deployment target, catalog verification policy, and deployed-secret requirements.
- [x] 2.4 Add centralized parsers that normalize lowercase product inputs and legacy `sandbox`/`production` aliases to canonical Product Environment values.
- [x] 2.5 Update `apps/backend/test/env.test.ts` to cover uppercase values, profile mapping, alias normalization, invalid aliases, and profile schema validation.

## 3. Backend Runtime Binding Migration

- [x] 3.1 Introduce the canonical non-secret Worker binding `PRODUCT_ENVIRONMENT` and migrate `AppBindings` away from `APP_ENV`.
- [x] 3.2 Update email runtime config to read canonical Product Environment policy and preserve UAT recipient sink behavior.
- [x] 3.3 Update feature flag evaluation to target Product Environment values while keeping provider/platform traits internal.
- [x] 3.4 Update public commerce services, Stripe webhook services, scheduled catalog verification, and related use cases to resolve policy from canonical Product Environment.
- [x] 3.5 Update backend HTTP/application/scheduled tests that construct bindings so they use `PRODUCT_ENVIRONMENT: 'LOCAL' | 'UAT' | 'PRD'`.

## 4. Config, Scripts, and Workflows

- [x] 4.1 Update `apps/backend/wrangler.jsonc` so repository-owned runtime vars set `PRODUCT_ENVIRONMENT` to `LOCAL`, `UAT`, or `PRD`.
- [x] 4.2 Update package scripts and helper scripts so normal operator commands use product targets such as `local`, `uat`, and `prd`.
- [x] 4.3 Keep Cloudflare Worker names, D1 database names, Stripe modes, and existing external resource names mapped as platform/provider traits without renaming provider resources.
- [x] 4.4 Update `scripts/verify-runtime-config.ts` to parse product targets first, print Product Environment first, and classify Worker deployment target separately.
- [x] 4.5 Update `scripts/stripe-catalog-verify.ts`, Stripe promotion smoke, sandbox smoke helpers, local stack helpers, and catalog contract tooling to use canonical Product Environment at their public parser/report boundary.
- [x] 4.6 Update GitHub Actions workflow references only where they describe product targets; keep GitHub Actions environment names when they are credential/protection scopes.

## 5. Drift Validation and Tests

- [x] 5.1 Extend environment-model validation to fail raw Product Environment branching on `sandbox`, `production`, `test`, or `live` outside approved platform/provider boundary adapters.
- [x] 5.2 Add focused tests for allowed boundary adapter alias use and disallowed domain/application/test/script alias branching.
- [x] 5.3 Update existing runtime config, catalog verification, environment model, and smoke script tests for new parser output and usage text.
- [x] 5.4 Run targeted test files for env model, runtime config verification, catalog verification, email config, feature flag reader, and environment drift validation.

## 6. Docs and OpenSpec Reconciliation

- [x] 6.1 Update `README.md`, `docs/environment-model.md`, and command docs so Local, UAT, and PRD are the only product environment choices.
- [x] 6.2 Update baseline OpenSpec specs touched by this migration so uppercase code values and prose labels are consistent.
- [x] 6.3 Review active OpenSpec changes for stale product-environment wording and adjust only wording that conflicts with the canonical model.
- [x] 6.4 Update any handoff or operator notes that list `sandbox` or `production` as equal `--env` options.

## 7. Verification

- [x] 7.1 Run `pnpm openspec validate standardize-product-environment-model --type change --strict`.
- [x] 7.2 Run `pnpm test:unit`.
- [x] 7.3 Run `pnpm check`.
- [x] 7.4 Run `pnpm build`.
- [x] 7.5 Run or document targeted dry-runs for changed environment commands, including runtime config verification and catalog verification in dry-run mode. `pnpm runtime:config:verify --env local` passed; `pnpm stripe:catalog:verify --env uat` reached the expected credential boundary and stopped on missing `STRIPE_SECRET_KEY`; `pnpm smoke:stripe-promotion -- --env prd --help` printed canonical PRD usage.
