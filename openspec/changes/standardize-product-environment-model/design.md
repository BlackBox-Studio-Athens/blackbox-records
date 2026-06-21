## Context

The repository already has a Product Environment concept: Local, UAT, and PRD. The current backend env module also exposes `workerRuntimeTarget`, `providerMode`, `emailRoutingMode`, labels, and parsers that accept `sandbox` and `production`, so consumers can accidentally branch on platform/provider details as if they were product environments.

The cleanup crosses backend runtime bindings, Wrangler config, Node scripts, smoke/catalog tooling, tests, docs, and OpenSpec language. The design therefore treats this as a contract migration, not a cosmetic rename.

## Goals / Non-Goals

**Goals:**

- Make `ProductEnvironment = 'LOCAL' | 'UAT' | 'PRD'` the canonical code and config value.
- Keep Local, UAT, and PRD as the only operator-facing product environment choices.
- Centralize all mapping from Product Environment to Worker deployment target, Stripe mode, D1 database, email delivery policy, feature-gate defaults, and validation gates.
- Keep platform/provider terms available only as derived profile data or explicitly named boundary aliases.
- Update CLI help, validation output, tests, and docs so product targets are always shown before platform/provider implementation details.
- Add regression checks for raw alias branching outside boundary adapters.

**Non-Goals:**

- No checkout behavior, provider mutation policy, email delivery policy, D1 schema, Stripe catalog semantics, or frontend routing behavior changes.
- No new runtime dependency.
- No PRD-open gate change.
- No attempt to hide provider names when a script is specifically validating Stripe, Wrangler, Cloudflare, or Resend configuration.

## Decisions

### Canonical value casing

Use uppercase string values:

```ts
export const productEnvironmentSchema = z.enum(['LOCAL', 'UAT', 'PRD']);
export type ProductEnvironment = z.infer<typeof productEnvironmentSchema>;
```

Rationale: Product Environment values are enum-like configuration constants, `UAT` and `PRD` are already acronyms, and uppercase values remove the current need for a separate `ProductEnvironmentLabel` type. TypeScript has no native preference that makes lowercase string unions safer; lowercase is common for URL/query values, but this value is not a public URL segment.

Alternatives considered:

- Keep lowercase `local|uat|prd`: less migration, but preserves the split between code value and label and does not match the requested model.
- Use TypeScript `enum`: less ergonomic with Zod and existing string-literal patterns.

### Runtime binding name

Use a non-secret Worker/runtime binding named `PRODUCT_ENVIRONMENT` as the canonical source of product environment in backend runtime code. Replace `APP_ENV` usage rather than redefining `APP_ENV`, because the existing name does not say which environment layer it represents.

Implementation may include a short compatibility parser for old `APP_ENV` values while migrating tests and local config, but the completed change must leave repository-owned config and tests on `PRODUCT_ENVIRONMENT`.

Alternatives considered:

- Keep `APP_ENV`: smaller diff, but leaves the ambiguous name in place.
- Add `PRODUCT_ENVIRONMENT` while keeping `APP_ENV` permanently: safer rollout, but keeps two sources of truth.

### Profile shape

Keep one profile table keyed by Product Environment. Rename profile traits so they read as derived policy, not independent environment axes:

- `productEnvironment`
- `workerDeploymentTarget` or `workerRuntimeTarget`
- `stripeMode`
- `emailDeliveryPolicy`
- `catalogVerificationPolicy`
- `nativeCheckoutEnabledByDefault`
- `requiresDeployedSecretsByDefault`

Provider/platform values such as `mock`, `test`, `live`, `direct`, and `uat-sink` remain valid trait values only inside this profile or provider-specific adapters.

### CLI target parsing

Operator-facing commands that currently accept `--env` must prefer `local|uat|prd`, case-insensitive. Help text and reports must display Product Environment first.

Compatibility aliases are allowed only in parser functions with tests:

- `sandbox` maps to `UAT`
- `production` maps to `PRD`
- existing uppercase/lowercase product forms normalize to `LOCAL`, `UAT`, or `PRD`

Compatibility aliases must not be advertised as equal choices in normal usage text. If kept, they must be described as legacy platform aliases.

### Wrangler and deployment naming

Wrangler environment keys and package scripts should move toward product names:

- UAT Worker config should be addressed through a UAT target while it may still deploy the existing `blackbox-records-backend-sandbox` Worker name.
- PRD Worker config should be addressed through a PRD target while it may still deploy the existing `blackbox-records-backend` Worker name.
- Local mock mode remains a Local mode, not a product environment.

The Worker name `blackbox-records-backend-sandbox` can remain because it identifies the existing Cloudflare Worker resource. The product environment source of truth is still `PRODUCT_ENVIRONMENT=UAT`.

### Drift detection

Extend environment-model validation so direct branches on raw aliases fail outside approved boundary adapters. Examples of disallowed code shape:

```ts
if (bindings.PRODUCT_ENVIRONMENT === 'sandbox') {
}
if (profile.stripeMode === 'live' && productEnvironmentWasExpected) {
}
```

Allowed code shape:

```ts
if (productEnvironment === 'PRD') {
}
if (profile.stripeMode === 'live') {
  // provider adapter only
}
```

## Risks / Trade-offs

- Compatibility drift -> Keep alias parsing centralized and unit-tested until all scripts/docs use canonical targets.
- Confusing uppercase migration -> Update help text, reports, docs, and tests in the same change.
- Wrangler target rename risk -> Keep Cloudflare Worker names and D1 bindings unchanged; only change repo-owned target names and vars where safe.
- Hidden raw alias branches remain -> Add a validation check and targeted tests for allowed/disallowed alias usage.
- Active OpenSpec changes still say sandbox/production -> Reconcile only product-environment wording; preserve provider-specific terms where they truly name Stripe sandbox, Stripe live mode, or Worker resource names.

## Migration Plan

1. Add canonical `ProductEnvironment` constants, schema, parser, and profile table using `LOCAL`, `UAT`, and `PRD`.
2. Introduce `PRODUCT_ENVIRONMENT` in backend bindings and Wrangler config; migrate runtime consumers away from `APP_ENV`.
3. Rename profile fields and update consumers: email config, feature flags, public commerce services, Stripe webhook services, scheduled catalog verification, and related tests.
4. Update script parsers and command output to prefer product targets while keeping centralized compatibility aliases for `sandbox` and `production`.
5. Update Wrangler/package scripts and docs so normal commands use Local, UAT, and PRD terminology.
6. Extend environment validation to detect raw alias branching outside approved adapters.
7. Update OpenSpec baseline specs and active change wording touched by the implementation.
8. Run `pnpm test:unit`, `pnpm check`, and `pnpm build`.

## Open Questions

- Should legacy CLI aliases emit warnings immediately, or remain silent for one implementation slice to reduce noise in existing workflows?
- Should the final implementation remove `APP_ENV` compatibility in the same change, or land as add-migrate-remove within one PR after all tests pass?
