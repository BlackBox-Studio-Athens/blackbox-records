## 1. Portfolio Inventory

- [x] 1.1 Use codegraph and scoped `rg` to inventory environment/profile branches, schema/type duplication, repeated runtime assembly, primitive formatting, value-object candidates, and library-shaped local abstractions.
- [x] 1.2 Classify each candidate by concrete pain, affected files/modules, expected simplification, behavior risk, and verification cost.
- [x] 1.3 Produce the approved implementation order and stop for owner approval before adding candidates outside that list.

## 2. Product Environment Profile Slice

- [x] 2.1 Implement Product Environment and Product Environment Profile schemas/mapping with exhaustive tests for Local, UAT, and PRD.
- [x] 2.2 Add boundary mappers for Worker runtime targets, provider modes, local modes, and smoke/runtime CLI targets.
- [x] 2.3 Migrate backend feature flags, scheduled catalog verification, email routing, and runtime config reads to use Product Environment or Product Environment Profile.
- [x] 2.4 Migrate scripts and smoke runners so raw platform/provider names are parsed at the edge and product policy uses the shared profile.
- [x] 2.5 Extend environment model validation to report raw platform aliases outside approved boundaries.

## 3. Runtime Config And Composition Slice

- [x] 3.1 Refactor email runtime config so exported config types are inferred from the Zod schema output.
- [x] 3.2 Add a small email runtime composition factory that assembles validated config plus provider gateway once at route/webhook boundaries.
- [x] 3.3 Replace repeated `readEmailRuntimeConfig` plus `createResendEmailGatewayFromConfig` call sites with the composition factory.
- [x] 3.4 Keep `@t3-oss/env-core` usage limited to Node process/local env contracts and confirm existing usage still matches the spec.

## 4. Value Object Slice

- [x] 4.1 Introduce an order reference token value object for the current `compactId` behavior, including sanitization, fallback, and visible reference formatting tests.
- [x] 4.2 Evaluate `EmailIdempotencyKey`, provider-safe metadata tags, `StoreItemSlug`, `VariantId`, and `CartQuantity` against the value-object standard.
- [x] 4.3 Implement only the candidate value objects that remove duplication or protect a real invariant; leave one-off primitives alone.

## 5. Library And Abstraction Decisions

- [x] 5.1 Record explicit no-add decisions for Result, idempotency, DI, and profile libraries unless inventory evidence changes the recommendation.
- [x] 5.2 If any new library is still proposed, stop for owner approval with maintenance status, local alternative, and code reduction evidence.
- [x] 5.3 Keep composition factories and local discriminated unions unless a stronger approved alternative removes code.

## 6. Verification

- [x] 6.1 Add or update unit tests for profile mapping, schema-inferred runtime config, email sink/direct routing, order reference token formatting, and any accepted value objects.
- [ ] 6.2 Run `pnpm runtime:config:verify --env local`, `pnpm runtime:config:verify --env uat`, and `pnpm runtime:config:verify --env prd`.
  - Local and UAT passed. PRD failed because production Worker runtime config/secrets are missing `RESEND_NEWSLETTER_TOPIC_ID`.
- [x] 6.3 Run `pnpm test:unit`, `pnpm check`, and `pnpm build`.
- [x] 6.4 If email routing behavior is touched, run `pnpm smoke:resend-uat` and attach the Smoke Evidence path.
  - Evidence: `.codex-artifacts/smoke/uat/resend-uat/20260620232747/summary.json`
- [x] 6.5 Validate the OpenSpec change with `pnpm openspec -- validate targeted-codebase-refactors --strict`.
