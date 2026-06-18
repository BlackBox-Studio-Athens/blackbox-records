## Context

OpenSpec already defines Local/UAT/PRD, module boundaries, validation gates, smoke evidence, and commerce terms. Current implementation still has several small readability debts: raw `sandbox`/`production` checks in app policy, runtime config types written beside schemas, repeated email gateway assembly, primitive string formatting for visible order references, and scattered decisions about when a library would help.

This change is a refactor epic. It is broader than `simplify-runtime-environment-profile`; that work becomes one slice. The broader aim is continuous refactoring: behavior-preserving, targeted improvements made near the code that hurts, with tests and audits after each slice.

## Goals / Non-Goals

**Goals:**

- Create a prioritized portfolio of targeted refactors backed by code evidence.
- Make Product Environment the one app-wide environment identity for product policy.
- Keep raw platform/provider aliases at boundary adapters, CLI parsing, workflow config, and provider calls.
- Infer config types from Zod schemas where schemas validate runtime input.
- Remove repeated runtime construction where a tiny composition factory is clearer.
- Promote value objects only where they own useful invariants.
- Leave the codebase smaller or easier to follow after each slice.

**Non-Goals:**

- No broad rewrite.
- No framework migration.
- No rename of Cloudflare Wrangler targets or GitHub Actions environment names.
- No PRD-open gate change.
- No new Spring Boot style profile framework.
- No new Result, idempotency, DI, or pattern-matching library by default.
- No conversion of every primitive identifier into a class.

## Decisions

### Refactor portfolio, not sweep

Each refactor needs a specific reason: duplicated policy, drift risk, unclear boundary, repeated assembly, external formatting rule, or a primitive with real invariants. Cosmetic rewrites and preference-only renames stay out unless they unlock one of those goals.

Alternatives considered:

- Run a broad cleanup pass: rejected because it makes review harder and risks behavior drift.
- Create many tiny unrelated OpenSpec changes now: rejected because the candidates are connected by the same simplicity standard and should be triaged together.

### Product Environment remains the one thing

Use `ProductEnvironment` as the canonical identity: `local`, `uat`, and `prd` in code, displayed as Local, UAT, and PRD in maintainer-facing prose. A `ProductEnvironmentProfile` can be the value object that derives implementation details such as Worker runtime target, provider mode, static host, checkout defaults, UAT sink policy, and PRD-disabled policy. The profile is not a fourth environment and not another public vocabulary; it is the typed mapping for the one Product Environment.

Alternatives considered:

- Keep `AppEnvironment = local | sandbox | production`: rejected because it preserves the provider/platform leak.
- Add a Spring-style profiles library: rejected because TypeScript does not need a container to map three known values.
- Add `ts-pattern`: useful for exhaustive matching, but rejected for the initial pass because a typed map plus `satisfies Record<ProductEnvironment, ...>` is smaller. Reconsider only if later logic becomes nested enough that pattern matching removes code.

### Use Zod and existing env tooling in their proper scopes

Worker/runtime config keeps using Zod. Types such as email runtime config should be inferred from schema output when the schema owns the shape. Existing `@t3-oss/env-core` remains valid for Node scripts, launchers, and preflight checks that read `process.env` or local ignored files; it should not be stretched into Worker binding validation or secret storage.

Alternatives considered:

- `envalid` or `env-var`: rejected because they duplicate the existing `@t3-oss/env-core` role.
- Hand-maintained type aliases beside schemas: rejected where they can drift from runtime validation.

### Use composition roots, not DI containers

Create a tiny email runtime factory that reads validated config and builds the email gateway once per caller boundary. Keep dependencies explicit in use cases. Do not add Awilix, Inversify, or a service locator.

Alternatives considered:

- Full DI container: rejected because current object graph is small and explicit factories are easier to follow.
- Continue repeated `readEmailRuntimeConfig` plus `createResendEmailGatewayFromConfig`: rejected because it repeats the same assembly detail in route modules.

### Value objects must earn their place

Implement a value object for the order reference token currently built through `compactId`, because it owns visible formatting, sanitization, fallback behavior, and external readability. Evaluate these candidates during implementation and promote only those that reduce duplication or protect a real invariant:

- `ProductEnvironmentProfile`: yes, because it owns the app-wide environment mapping.
- `CheckoutOrderReferenceToken`: yes, because order reference formatting is externally visible and should be testable.
- `EmailIdempotencyKey`: likely if Resend key length/provider-safe formatting remains a repeated contract.
- `ProviderSafeMetadataTag`: maybe, only if provider-safe string shaping is used outside email.
- `StoreItemSlug`, `VariantId`, `CartQuantity`: maybe, only if validation is dispersed and no existing local helper already owns the invariant.

Do not introduce value objects for one-off primitives that merely wrap a string without behavior.

### Libraries stay boring

No new library is planned for idempotency because Resend already provides idempotency keys and the repo only needs deterministic key construction. No Result library is planned because local discriminated unions are readable and TypeScript-native. No DI library is planned because explicit factories are simpler today. Any future library must be actively maintained, reduce code, and be approved by a separate OpenSpec decision.

## Risks / Trade-offs

- Refactor portfolio can become vague -> Every task must name a concrete code smell, files touched, and verification.
- Raw alias migration touches many files -> Start with a complete inventory, migrate one boundary at a time, and keep unit tests green after each slice.
- Shared profile module could create package churn -> Prefer the smallest shared location that works for backend and scripts; update module boundaries only if a new package/module is introduced.
- Profile object could become a dumping ground -> Keep it limited to environment-derived policy, not general app config.
- Refactor could change UAT/PRD behavior by accident -> Add mapping tests and rerun runtime config verification plus relevant smoke suites.
- Value-object enthusiasm could add ceremony -> Apply the value-object standard before creating each wrapper.

## Migration Plan

1. Inventory refactor candidates with codegraph plus scoped `rg`.
2. Rank candidates by readability gain, behavior risk, and verification cost.
3. Implement Product Environment profile first because it affects several later slices.
4. Refactor schema/type drift and email runtime composition.
5. Add the order reference token value object.
6. Evaluate remaining value-object candidates and implement only those that earn their place.
7. Add drift checks for raw platform aliases and any new refactor standards.
8. Run `pnpm test:unit`, `pnpm check`, and `pnpm build`; run focused smoke or runtime verification for touched behavior.

## Open Questions

None for planning. Stop for owner approval before adding a new runtime dependency, introducing a DI container, changing public Local/UAT/PRD environment names, changing Wrangler target names, changing PRD checkout/live-provider gates, or expanding the refactor beyond the approved candidate list.
