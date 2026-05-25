## 1. Baseline Audit and Change Alignment

- [x] 1.1 Re-read `openspec/changes/automate-cms-catalog-promotion/proposal.md`, `design.md`, and all delta specs before implementation starts.
- [x] 1.2 Inspect current Decap release and distro collection builders to list every field currently available to maintainers.
- [x] 1.3 Inspect `apps/web/src/content.config.ts` release and distro schemas to identify the schema changes needed for commerce fields.
- [x] 1.4 Inspect current catalog generation in `scripts/stripe-catalog-contract.ts` and document which fields are derived, hardcoded, or missing for production automation.
- [x] 1.5 Inspect current generated artifacts in `apps/backend/src/application/commerce/catalog-sync/catalog-product-projections.ts` and `apps/backend/prisma/seeds/sandbox-uat-commerce-state.sql`.
- [x] 1.6 Inspect current catalog apply guard in `scripts/stripe-catalog-verify.ts` and identify the exact code path that blocks `--env production --apply`.
- [x] 1.7 Inspect current Stripe catalog gateway mutation methods and record which can be reused safely for live mode.
- [x] 1.8 Inspect current D1 seed/migration commands in `apps/backend/package.json` and `apps/backend/wrangler.jsonc`.
- [x] 1.9 Inspect current GitHub workflows for Cloudflare Pages, sandbox Worker deploy, GitHub Pages rollback/UAT, and any Stripe smoke workflow.
- [x] 1.10 Inspect current smoke runner scenarios and determine which assertions can run safely in live production without submitting payment.
- [x] 1.11 Record audit findings in an implementation note inside this change if any current behavior contradicts the design.

## 2. Canonical Language and Documentation Skeleton

- [x] 2.1 Update baseline `openspec/specs/project-language/spec.md` with Catalog Promotion terms after implementation proves the terminology.
- [x] 2.2 Add code-facing type names for `DesiredCatalogState`, `DesiredCatalogEntry`, `DesiredPrice`, `ProviderCatalogState`, `PromotionRun`, and `PromotionEvidence`.
- [x] 2.3 Replace ad hoc wording such as "sandbox expected price" where it now refers to environment-neutral Desired Price.
- [x] 2.4 Keep existing `StoreOffer`, `StoreCart`, `CartDraft`, `OnlineStock`, `VariantStripeMapping`, and Product Projection terms unchanged.
- [x] 2.5 Add README or docs placeholders for the automated CMS-to-UAT-to-production promotion flow.
- [x] 2.6 Add a short maintainer-facing status explanation for "published content", "UAT buyable", "production buyable", and "promotion failed".

## 3. CMS Commerce Contract

- [x] 3.1 Add a reusable commerce field schema for release and distro content.
- [x] 3.2 Add `commerce.enabled` with a safe default that does not make existing content newly production-buyable by accident.
- [x] 3.3 Add `commerce.publish_target` with allowed values for draft, UAT-only, and UAT-plus-production so production never skips UAT proof.
- [x] 3.4 Add `commerce.price.amount_minor` with integer validation, positive minimum, and clear CMS hint text.
- [x] 3.5 Add `commerce.price.currency` with an initial allowed set containing `EUR`.
- [x] 3.6 Add a deterministic price revision input or derived revision hash so Price replacement idempotency can be tested.
- [x] 3.7 Add `commerce.option_label` or map existing release/distro format fields into an explicit option label with validation.
- [x] 3.8 Add `commerce.tax_code` with a default for physical goods and an explicit override path.
- [x] 3.9 Add `commerce.stock.initial_online_quantity` for first publication only, with validation that it cannot be negative.
- [x] 3.10 Add `commerce.smoke_candidate` so smoke workflows can choose a deterministic promoted item.
- [x] 3.11 Add `commerce.retired` or equivalent checkout-retirement intent.
- [x] 3.12 Update Decap release collection fields to expose the commerce section with maintainer-safe labels and hints.
- [x] 3.13 Update Decap distro collection fields to expose the same commerce section with maintainer-safe labels and hints.
- [x] 3.14 Update CMS preview data so maintainers see target environments, generated slug/variant, Desired Price, tax code, and stock initialization intent before publishing.
- [x] 3.15 Add content-schema tests for missing commerce fields, invalid amounts, invalid currencies, invalid target environments, and retired items.
- [x] 3.16 Add Decap config tests proving release and distro commerce fields render in generated `/admin/config.yml`.

## 4. Desired Catalog State Generation

- [x] 4.1 Design the generated Desired Catalog State TypeScript module location under backend catalog-sync ownership.
- [x] 4.2 Extend `scripts/stripe-catalog-contract.ts` so it reads explicit commerce fields from release markdown and distro JSON.
- [x] 4.3 Preserve existing store item slug and variant ID behavior unless a content item explicitly opts into a new approved identity.
- [x] 4.4 Generate Product Projection fields from CMS content, including stable absolute image URLs and `txcd_99999999` default where applicable.
- [x] 4.5 Generate Desired Price from explicit commerce fields for production-targeted entries.
- [x] 4.6 Preserve format-derived defaults only for UAT entries that intentionally rely on sandbox/UAT price policy.
- [x] 4.7 Generate environment targets per entry so UAT-only items do not mutate production and production items still get UAT proof when configured.
- [x] 4.8 Generate first-publication stock initialization intent without treating it as ongoing stock authority.
- [x] 4.9 Generate retired/non-buyable intent separately from editorial visibility.
- [x] 4.10 Validate that every checkout-enabled entry has Product Projection, Desired Price, target environment, image, tax code, and app identity.
- [x] 4.11 Validate that Product image URLs are absolute, stable, and public enough for Stripe-hosted Checkout.
- [x] 4.12 Add generated output for environment-aware D1 readiness seed or migration input.
- [x] 4.13 Update `pnpm stripe:catalog:artifacts:generate` to write all Desired Catalog State artifacts.
- [x] 4.14 Update `pnpm stripe:catalog:artifacts:check` to fail on drift for the new artifacts.
- [x] 4.15 Add script tests for Desired Catalog State stability, sorting, validation failures, price revision behavior, and target environment filtering.

## 5. Artifact Commit Automation

- [x] 5.1 Add a GitHub workflow triggered by Decap/CMS-relevant content and media paths.
- [x] 5.2 Configure the workflow to install dependencies with the repo's pinned pnpm and Node versions.
- [x] 5.3 Run `pnpm stripe:catalog:artifacts:generate` in the workflow.
- [x] 5.4 Detect whether generated artifacts changed.
- [x] 5.5 Commit only generated artifact files with a bot Conventional Commit message when drift exists.
- [x] 5.6 Skip bot commit creation when `pnpm stripe:catalog:artifacts:check` already passes.
- [x] 5.7 Prevent infinite workflow loops on the bot artifact commit.
- [x] 5.8 Ensure provider promotion waits for the artifact commit SHA, not the original CMS-only SHA.
- [x] 5.9 Add concurrency so multiple CMS publishes cannot race artifact commits on the same branch.
- [x] 5.10 Add workflow tests or dry-run validation for path filters, generated file allowlist, bot commit author, and loop prevention.

## 6. Catalog Verify/Apply Environment Parity

- [x] 6.1 Refactor catalog verify arguments to support `--env sandbox` and `--env production` consistently.
- [x] 6.2 Keep dry-run behavior as the default for every environment.
- [x] 6.3 Replace the blanket production apply rejection with a promotion-context guard.
- [x] 6.4 Require production apply to receive promotion context such as artifact commit SHA, run ID, and explicit CI environment marker.
- [x] 6.5 Reject local or unscoped production apply attempts with an actionable message.
- [x] 6.6 Extend expected Product Projection maps to read Desired Catalog State for the selected environment.
- [x] 6.7 Extend expected Desired Price maps to read environment-targeted Desired Price entries.
- [x] 6.8 Reuse the same `CatalogReconciler` planning path for sandbox and production.
- [x] 6.9 Add mutation policy that permits production Product Projection updates only for app-owned Product objects.
- [x] 6.10 Add mutation policy that creates or resolves production replacement Prices from Desired Price revisions.
- [x] 6.11 Add mutation policy that archives or deactivates only stale app-owned active production Prices after replacement verification.
- [x] 6.12 Reject any production mutation involving Stripe objects without expected app metadata or lookup keys.
- [x] 6.13 Reject ambiguous active Price matches before D1 mapping changes.
- [x] 6.14 Add idempotency keys based on environment, variant ID, operation, and Desired Catalog State revision.
- [x] 6.15 Ensure post-apply verification rereads current Stripe/D1 state rather than trusting planned actions.
- [x] 6.16 Keep full provider IDs, secrets, webhook secrets, and raw API payloads redacted in dry-run and apply reports.
- [x] 6.17 Add unit tests for production dry-run immutability, production apply guard context, idempotency, ambiguous active Prices, replacement Prices, stale Price retirement, and redaction.

## 7. D1 Readiness and Stock Policy

- [x] 7.1 Add environment-aware D1 readiness generation for StoreItemOption, ItemAvailability, VariantStripeMapping prerequisites, StoreOfferSnapshot expectations, and Stock initialization.
- [x] 7.2 Keep sandbox/UAT stock defaults suitable for repeated testing.
- [x] 7.3 Require explicit initial production stock or existing production stock before a variant becomes checkout-ready.
- [x] 7.4 Ensure production stock initialization inserts only when no stock row exists.
- [x] 7.5 Ensure production content edits do not overwrite existing stock quantities.
- [x] 7.6 Add production D1 seed/readiness command under the backend package.
- [x] 7.7 Add production D1 readiness dry-run/report mode before mutation.
- [x] 7.8 Add tests for new-variant stock initialization, existing-stock preservation, missing-stock failure, and retirement availability updates.
- [x] 7.9 Verify D1 migrations are applied before readiness seed/apply runs in each environment.
- [x] 7.10 Document that D1/operator stock remains authoritative after first publication.

## 8. Webhook and Runtime Configuration Verification

- [x] 8.1 Extend webhook verification command support to production without creating, deleting, rotating, or logging secrets.
- [x] 8.2 Verify production webhook endpoint URL, mode, event subscriptions, and Worker secret presence where provider APIs allow it.
- [x] 8.3 Keep the limitation that existing webhook signing secrets cannot be retrieved from Stripe APIs documented in production evidence.
- [x] 8.4 Verify production `STRIPE_PAYMENT_METHOD_CONFIGURATION_ID`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `CHECKOUT_RETURN_ORIGINS`, `FLAGS`, and `COMMERCE_DB` configuration categories without printing values.
- [x] 8.5 Verify production scheduled catalog verification is configured if production Worker cron remains part of the backstop.
- [x] 8.6 Add tests for missing config classification and redacted output.
- [x] 8.7 Add workflow steps that run config verification before provider apply for each environment.

## 9. GitHub Actions Promotion Orchestration

- [x] 9.1 Add a workflow or reusable workflow for `catalog-promotion` with environment input.
- [x] 9.2 Add a UAT job that runs from the artifact commit and targets sandbox Stripe, sandbox D1, sandbox Worker, and UAT site URL.
- [x] 9.3 Add a production job that runs only after UAT proof passes for the same artifact commit.
- [x] 9.4 Configure production secrets and variables through GitHub Actions environment or repository settings without adding manual approval as the default path.
- [x] 9.5 Run `pnpm test:unit`, `pnpm check`, and `pnpm build` on the artifact commit before provider mutation.
- [x] 9.6 Run target-environment webhook/config verification before D1 or Stripe mutation.
- [x] 9.7 Run target-environment D1 migration/readiness preparation.
- [x] 9.8 Run target-environment catalog dry-run and upload the redacted plan summary.
- [x] 9.9 Run target-environment catalog apply only when dry-run has no blocking ambiguity.
- [x] 9.10 Run target-environment post-apply catalog verification.
- [x] 9.11 Deploy the target Worker only after post-apply verification passes.
- [x] 9.12 Deploy or confirm the static frontend from the same artifact commit.
- [x] 9.13 Run target-environment smoke tests after deployment.
- [x] 9.14 Upload Promotion Evidence for success, failure, skipped, and superseded runs.
- [x] 9.15 Add concurrency keys so production promotions cannot overlap.
- [x] 9.16 Ensure newer CMS/artifact commits supersede older pending promotion runs safely.
- [x] 9.17 Add workflow documentation for reruns from a specific artifact commit.

## 10. Smoke Tests and Promotion Evidence

- [x] 10.1 Extend smoke runner configuration to accept target environment, site URL, backend URL, expected item identity, and evidence output path.
- [x] 10.2 Keep UAT `checkout_surface` smoke proving hosted Checkout amount, currency, Product display, and payment-method surface before payment submission.
- [x] 10.3 Keep UAT `happy_path_paid` smoke proving Stripe test payment, webhook delivery, order reconciliation, and stock decrement behavior.
- [x] 10.4 Add production `checkout_surface` smoke that reaches live hosted Checkout without submitting payment.
- [x] 10.5 Make production `checkout_surface` assert Product name, image presence or expected image URL, amount, currency, shipping/contact collection, and payment-method surface.
- [x] 10.6 Add production paid smoke only behind an explicit live smoke policy configuration.
- [x] 10.7 Make absent production paid smoke policy report `not_configured` rather than `passed`.
- [x] 10.8 Add smoke evidence files that redact session IDs, provider object IDs, payment details, and account-private values.
- [x] 10.9 Add tests for smoke scenario selection and production no-payment behavior.
- [x] 10.10 Add failure messages that tell maintainers whether content, D1, Stripe, Worker deploy, frontend deploy, or smoke caused the failed promotion.

## 11. Rollback, Pause, and Retirement Paths

- [x] 11.1 Add a promotion operation or documented workflow to pause checkout for affected variants through D1 availability.
- [x] 11.2 Add a CMS retirement path that leaves editorial pages visible but makes Store Offers non-buyable.
- [x] 11.3 Ensure retirement promotion does not delete Stripe Products, Stripe Prices, orders, stock ledger rows, or Promotion Evidence.
- [x] 11.4 Add a corrective promotion path for fixing wrong Product Projection, Desired Price, or commerce target fields.
- [x] 11.5 Document when static frontend rollback is enough and when catalog pause/retirement is also required.
- [x] 11.6 Add tests for retired variants, paused variants, and checkout rejection after rollback.

## 12. Documentation and Maintainer UX

- [x] 12.1 Update README catalog/CMS sections with the new CMS-only product publication flow.
- [x] 12.2 Update `docs/stripe-sandbox-uat.md` or successor docs so UAT is described as the first leg of the shared promotion pipeline.
- [x] 12.3 Add production catalog promotion docs covering automatic apply, live smoke limits, rollback, and evidence.
- [x] 12.4 Update AGENTS or repo handoff notes if command expectations, workflows, or provider boundaries change.
- [x] 12.5 Add a maintainer checklist for creating a new release in Decap with commerce fields.
- [x] 12.6 Add a maintainer checklist for creating a new distro/merch item in Decap with commerce fields.
- [x] 12.7 Add examples of promotion success, content validation failure, provider ambiguity failure, and production smoke failure.
- [x] 12.8 Document that pushing the repo is no longer enough and that Promotion Evidence is the source for buyable status.
- [x] 12.9 Document that production reset does not exist and sandbox reset remains separate from normal promotion.

## 13. Validation and Test Gates

- [x] 13.1 Run targeted web/admin tests for Decap config and CMS commerce field generation.
- [x] 13.2 Run targeted content schema tests for commerce-enabled release and distro entries.
- [x] 13.3 Run targeted script tests for Desired Catalog State generation and artifact drift.
- [x] 13.4 Run targeted backend catalog reconciler tests for production apply planning and idempotency.
- [x] 13.5 Run targeted D1 readiness tests for stock initialization and existing-stock preservation.
- [x] 13.6 Run targeted workflow or actionlint-equivalent validation for catalog promotion workflows.
- [x] 13.7 Run targeted smoke-runner tests for UAT paid and production no-payment scenarios.
- [x] 13.8 Run `pnpm test:unit`.
- [x] 13.9 Run `pnpm check`.
- [x] 13.10 Run `pnpm build`.
- [x] 13.11 Run `openspec validate automate-cms-catalog-promotion --type change --strict`.
- [x] 13.12 Run `openspec validate --all --strict`.

## 14. Provider Proof and Rollout

- [x] 14.1 Run the full UAT Promotion Run against sandbox credentials and record redacted Promotion Evidence.
- [x] 14.2 Verify the UAT run creates or updates the expected sandbox Stripe Products/Prices without reset.
- [x] 14.3 Verify the UAT run seeds/prepares sandbox D1 and deploys the sandbox Worker/static surface from the artifact commit.
- [x] 14.4 Verify UAT `checkout_surface` smoke passes for a promoted item.
- [x] 14.5 Verify UAT `happy_path_paid` smoke passes for a promoted item.
- [ ] 14.6 Run the full production Promotion Run against production credentials after UAT proof passes for the same artifact commit.
- [ ] 14.7 Verify the production run creates or updates only app-owned live Stripe Products/Prices.
- [ ] 14.8 Verify the production run prepares production D1 without overwriting existing stock for existing variants.
- [ ] 14.9 Verify the production Worker/static surface deploys from the artifact commit.
- [ ] 14.10 Verify production `checkout_surface` smoke passes without submitting payment.
- [x] 14.11 If live paid smoke policy exists, verify production paid smoke and reconciliation; otherwise record `not_configured`.
- [x] 14.12 Verify a failed or retired promotion disables checkout without deleting provider/order/stock evidence.

## 15. Closeout

- [x] 15.1 Review Promotion Evidence for leaked secrets, full provider IDs, raw payment details, or account-private values.
- [x] 15.2 Confirm no legacy planning files, duplicate workflows, or stale sandbox-only docs contradict the new promotion path.
- [x] 15.3 Confirm the final implementation still satisfies the core user story: maintainer creates a buyable item in Decap and UAT/production promotion happens in the background.
- [x] 15.4 Update this task list with final validation notes and any provider-side limitations discovered during live proof.
- [ ] 15.5 Archive the OpenSpec change only after implementation, strict validation, repository gates, UAT proof, and production proof are complete.

Validation notes:

- 2026-05-25: GitHub Actions catalog promotion run `26408123001` succeeded for artifact commit `521d8592ee2a13f528c6654f232482603eb225b7`.
- 2026-05-25: UAT `verify-artifact`, webhook/payment config verification, sandbox D1 readiness, provider catalog plan/apply, sandbox Worker deploy, Playwright install, and UAT smoke all passed.
- 2026-05-25: UAT smoke evidence passed `checkout_surface`, `happy_path_paid`, `three_d_secure`, `card_declined`, `insufficient_funds`, `expired_card`, `incorrect_cvc`, and `processing_error`.
- 2026-05-25: Downloaded Promotion Evidence from run `26408123001` was scanned for Stripe secrets, webhook secrets, full Stripe object IDs, raw card test numbers, and the Cloudflare account ID; no full sensitive values were found. Redacted `price_...` summaries are present by design.
- 2026-05-25: PRD job recorded `status=not_configured` because `PRD_OPEN_GATE` remains closed in the `catalog-promotion-prd` credential scope. Production live provider mutation, production D1 apply, production Worker deploy, and production no-payment smoke are intentionally not proven yet.
- 2026-05-25: `pnpm catalog:checkout:pause -- --variant-id variant_disintegration-black-vinyl-lp_standard --env sandbox` verified the non-destructive pause plan: `ItemAvailability` only, with Stripe Products, Stripe Prices, orders, stock rows, and Promotion Evidence preserved.
