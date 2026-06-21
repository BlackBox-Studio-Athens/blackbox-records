## Context

BlackBox Records has the pieces needed for automated catalog publication, but they are not yet connected into a maintainer-facing workflow:

- Decap edits the same Astro content files that render public release and distro pages.
- `scripts/stripe-catalog-contract.ts` derives Product Projection data and Desired Price state from Astro content.
- `pnpm stripe:catalog:artifacts:generate` writes committed backend catalog artifacts and sandbox UAT seed SQL.
- `pnpm check` fails when those generated artifacts drift from current content.
- `pnpm stripe:catalog:verify --env uat --apply` can create or update sandbox Stripe Products/Prices and sync sandbox D1 mappings/snapshots.
- Production catalog mutation is currently blocked by script policy and deferred to go-live readiness.

The target model now keeps Decap editorial-only. Generated catalog artifacts derive from current Astro Store Item content, UAT uses sandbox provider apply, and PRD provider mutation remains disabled until the explicit PRD-open gate defines live provider policy.

## Goals / Non-Goals

**Goals:**

- Make current Store Item content the entry point for generated sandbox catalog artifacts.
- Define a Desired Catalog State generated from repo content and explicit generated policy.
- Preserve production catalog apply shape while keeping live mutation disabled until PRD-open policy exists.
- Preserve runtime authority boundaries: Stripe active Price is still checkout payment authority, D1/Worker still own Store Offer readiness, and browser state never owns Stripe IDs, prices, stock, payment state, or secrets.
- Keep CMS validation editorial; payment-critical provider policy stays in generated artifact code and runtime/operator controls.
- Automate generated artifact commits after content changes so Decap commits do not leave `pnpm check` red.
- Make production promotion idempotent, redacted, auditable, retryable, and fail-closed.
- Deploy the Worker/static frontend only from the same committed Desired Catalog State that was verified and applied.
- Run environment-appropriate smoke tests after provider apply and deployment, including production live Checkout surface proof and UAT paid-path proof.

**Non-Goals:**

- Building a generic PIM or bidirectional Stripe/CMS sync.
- Importing Stripe Dashboard edits back into Astro content.
- Letting browser code or static Astro pages send Stripe Price IDs or authoritative prices to checkout.
- Using `stripe:catalog:reset-sandbox` as part of normal item publication.
- Hard-deleting production Stripe Products or Prices.
- Automatically refunding real customer orders or mutating fulfilled production orders during rollback.
- Replacing hosted Stripe Checkout, the Worker checkout gateway, D1 stock, or existing order reconciliation.

## Decisions

### Desired Catalog State remains the promotion input

Add a generated Desired Catalog State artifact that covers every buyable variant across releases and distro items. It should include:

- `storeItemSlug`, `variantId`, `sourceKind`, and `sourceId`
- Product Projection: name, description, image URL, metadata, tax code
- Desired Price: amount minor, currency, and price intent revision
- Desired availability policy: whether the generated variant should be published for sandbox
- Desired stock seed policy for first publication only, not ongoing physical stock authority
- target environments from generated policy

The artifact is generated from Astro content plus explicit generated policy. It is committed by automation and checked by `pnpm check`. The Worker does not read Astro content at runtime; it continues using committed backend artifacts and D1.

Alternative considered: keep CMS-authored commerce fields. Rejected for the current production cleanup because Decap should remain editorial-only until a future explicit PRD-open provider policy exists.

Alternative considered: infer production prices from format labels. Rejected because format-based prices are acceptable sandbox defaults but too implicit for live commerce.

### Desired Price is not checkout authority

Desired Price is the repo/provider-policy instruction for provisioning the provider catalog. Stripe active Price remains the authority used by checkout after apply.

Promotion can create a new Stripe Price or move the app-owned lookup key/metadata to a replacement Price when Desired Price changes. It must not edit an immutable historical Stripe Price amount. After apply, D1 `VariantStripeMapping` and `StoreOfferSnapshot` follow the resolved active Stripe Price. Store Offer reads and checkout start still revalidate against Stripe/D1 and fail closed on ambiguity.

This preserves the existing runtime rule while allowing generated artifact automation:

```text
Astro content + generated policy
  -> Desired Catalog State
  -> Stripe Product/Price apply
  -> D1 mapping/snapshot
  -> Worker Store Offer
  -> hosted Checkout
```

Alternative considered: treat the generated Desired Price as the runtime source of truth. Rejected because hosted Checkout charges Stripe Prices, and the Worker must never trust static content over provider state at payment time.

### UAT and production use the same promotion state machine

Implement one promotion state machine with environment parameters:

1. Detect catalog-relevant content changes.
2. Generate catalog artifacts.
3. Commit bot-generated artifacts if they drift.
4. Run repository gates.
5. Verify webhook and runtime configuration for the target environment.
6. Apply D1 migrations/seeds required for catalog readiness.
7. Run catalog dry-run against provider and D1 state.
8. Apply catalog changes for the target environment.
9. Run post-apply catalog verification.
10. Deploy Worker for the target environment.
11. Deploy or confirm the static frontend for the same commit.
12. Run environment smoke tests.
13. Record redacted Promotion Evidence and status.

UAT and production differ only by configuration:

| Concern     | UAT                                | Production                                                                    |
| ----------- | ---------------------------------- | ----------------------------------------------------------------------------- |
| Stripe mode | test                               | live                                                                          |
| Worker env  | sandbox                            | production                                                                    |
| D1 binding  | sandbox database                   | production database                                                           |
| site URL    | UAT surface                        | production surface                                                            |
| paid smoke  | Stripe test paid path              | live surface required; live paid path only with approved smoke payment policy |
| reset       | sandbox-only explicit manual reset | prohibited                                                                    |

Alternative considered: keep production as a separate hand-run checklist. Rejected because it makes UAT structurally unlike production and leaves catalog publication incomplete.

### Normal production promotion is automatic, not manually approved

The normal UAT path after a content publish does not require a developer to click through Stripe, Wrangler, D1, or a manual GitHub approval gate. GitHub Actions environments can still scope secrets and concurrency, but required reviewers are not part of the default UAT catalog-promotion path unless the repo owner later chooses a stricter release policy.

The safety mechanism is not manual approval. It is strict validation, idempotency, redacted evidence, fail-closed checkout behavior, and rollback commands that can pause or retire a bad promotion.

Alternative considered: keep production behind a required reviewer after UAT passes. Rejected for the requested maintainer-only workflow. It remains acceptable as an optional organization policy, but the OpenSpec target is fully automated production promotion.

### Decap remains editorial-only

Release and distro CMS collections expose editorial content only. Generated catalog policy derives sandbox entries for current Store Items, including Product Projection, default physical goods tax code, and format-derived sandbox prices. Checkout pausing, stock operations, provider mutation, and PRD-open live policy stay outside Decap.

Alternative considered: expose commerce intent, publish target, tax code, smoke candidate, and checkout retirement controls in Decap. Rejected because the current production cleanup removes CMS-authored commerce authority and keeps runtime/operator systems responsible for buyability.

### Bot commits own generated artifacts

After Decap writes editorial content, a workflow runs artifact generation and creates a bot commit on the same branch if generated files drift. That commit must be the one used for provider apply and deployment. This keeps the repo source of truth complete without requiring the maintainer to run commands locally.

To avoid infinite workflow loops:

- generated artifact commits use a conventional bot message, for example `chore(catalog): regenerate promotion artifacts`
- workflows detect bot-only artifact commits and skip re-generation if `pnpm stripe:catalog:artifacts:check` passes
- concurrency is keyed by branch/environment
- provider apply waits for the artifact commit's repository gates, not the original content-only commit

Alternative considered: generate artifacts only inside CI without committing them. Rejected because the Worker catalog manifest and D1 seed files are currently committed source artifacts, and uncommitted CI-only generation would make local checks and code review less truthful.

### Provider apply must be idempotent and production-safe

Production apply must use the same reconciler concepts as sandbox apply, with stricter mutation policy:

- update app-owned Stripe Product fields from Product Projection
- create a new active Price when Desired Price revision changes
- transfer or assign app-owned lookup key/metadata only when identity is unambiguous
- archive or deactivate stale app-owned Prices only after the replacement active Price is verified
- never hard-delete production Products or Prices
- never touch Stripe objects that do not carry the expected BlackBox environment metadata or lookup key
- update D1 `VariantStripeMapping` and `StoreOfferSnapshot` only after provider state is resolved
- fail if multiple active Prices match one variant
- fail if production D1 stock/availability says the item is not ready

Idempotency keys must include environment, variant, operation, and Desired Catalog State revision so reruns do not duplicate live Stripe objects.

Alternative considered: let production apply mutate whatever drift it finds. Rejected because live provider mutation needs narrow ownership, deterministic identities, and no silent cleanup of ambiguous external objects.

### Stock seeding is a first-publication aid only

The automation can seed initial D1 `Stock` and `ItemAvailability` rows for a new variant under an approved provider policy. After a variant exists in production, D1/operator stock remains authoritative. Later content edits must not overwrite production stock counts unless an explicit stock initialization or retirement operation is being performed.

UAT keeps large synthetic stock defaults for repeated testing. Production uses explicit operator/provider policy for first publication stock or keeps the item non-buyable until operator stock exists.

Alternative considered: keep production stock at UAT defaults such as `99/99`. Rejected because synthetic UAT stock is not real inventory.

### Production smoke is environment-compatible, not fake

UAT keeps `checkout_surface` and `happy_path_paid` because Stripe test mode can complete payment safely.

Production must always run a live `checkout_surface` smoke that creates a real hosted Checkout Session, verifies Product Projection, amount, currency, shipping/contact configuration, and payment-method surface, then exits before submitting payment. A production paid smoke runs only when a configured live smoke payment policy exists, such as a dedicated internal smoke SKU, payment instrument, stock isolation, and automatic refund/reconciliation procedure. If that policy does not exist, production promotion succeeds on live pre-payment proof and records paid smoke as `not_configured`.

Alternative considered: use Stripe test cards against production. Rejected because live mode does not accept test cards and pretending otherwise would create false evidence.

### Promotion evidence is machine-readable and redacted

Each Promotion Run writes or uploads redacted evidence with:

- source commit and artifact commit
- environments targeted
- content files changed
- generated artifact diff summary
- Desired Catalog State entries affected
- D1 migration/seed status
- Stripe dry-run action summary
- Stripe apply action summary
- post-apply verification status
- Worker/static deploy versions
- smoke scenario URLs and outcomes
- failure reason and rerun instructions

Evidence lives as GitHub Action summaries/artifacts and optional ignored local artifacts. Committed docs include durable process rules, not full provider IDs, secrets, or account-private payloads.

Alternative considered: rely on GitHub logs only. Rejected because logs are noisy and can expose too much. A structured redacted summary makes maintainer support and rollback faster.

## Risks / Trade-offs

- [Risk] A future provider policy sets the wrong production price. -> Mitigation: require explicit amount/currency policy, generated artifact diff, production smoke amount assertion, and fail-closed checkout revalidation. Optional later policy can add thresholds or reviewer rules for large changes without changing the core automation.
- [Risk] Bot artifact commits race with additional content edits. -> Mitigation: use branch/environment concurrency, rebase or rerun on latest branch head, and apply only from the commit whose artifacts and gates passed.
- [Risk] Production apply creates duplicate Prices on rerun. -> Mitigation: idempotency keys include Desired Catalog State revision; verifier resolves existing matching Prices before creating new ones.
- [Risk] Production apply touches non-BlackBox Stripe objects. -> Mitigation: mutation requires app-owned environment metadata and lookup keys; ambiguous matches fail without mutation.
- [Risk] Production stock gets overwritten by a content edit. -> Mitigation: separate first-publication seed from ongoing D1/operator stock authority; updates to existing stock require stock-specific operator flows.
- [Risk] Production smoke cannot prove paid webhook/order reconciliation without a real live transaction. -> Mitigation: require live Checkout surface smoke for normal promotion and define an optional controlled paid smoke policy before automating real live payments.
- [Risk] UAT diverges from production again. -> Mitigation: one promotion state machine, shared command implementation, environment matrix tests, and identical dry-run/apply/report shapes.
- [Risk] A bad production promotion needs rollback. -> Mitigation: add retire/pause operations that disable checkout through D1 availability and active Price lookup without deleting orders or historical Stripe state.

## Migration Plan

1. Extend OpenSpec language and requirements for Catalog Promotion, Desired Catalog State, Provider Catalog State, Promotion Run, and Promotion Evidence.
2. Keep Decap editorial-only and validate generated Store Item inputs for releases/distro.
3. Replace sandbox-only generated artifacts with environment-aware Desired Catalog State and generated seed/projection artifacts.
4. Add bot artifact commit workflow for content changes.
5. Refactor `stripe:catalog:verify` into environment parity mode with dry-run/apply support for sandbox and production.
6. Add production mutation safeguards, idempotency keys, redaction, and tests.
7. Add production D1 migration/seed/readiness commands that do not overwrite existing stock authority.
8. Add GitHub Actions workflows for UAT and production promotion from the same artifact commit.
9. Add UAT and production smoke scenarios and evidence reporting.
10. Update docs and runbooks.
11. Validate the full OpenSpec change, unit/script tests, repository gates, and live provider proof where credentials exist.

Rollback strategy:

- For failed pre-apply runs: stop before mutation; maintainer fixes content and republishes.
- For failed post-apply UAT: rerun the promotion after fixing content/config, or use sandbox reset only when recreating the whole sandbox catalog.
- For failed post-apply production before shopper exposure: pause the affected variant in D1 availability, deploy Worker/static rollback if needed, and leave historical Stripe Prices/Products intact.
- For failed production after shopper exposure: disable checkout for the affected variant, preserve orders, inspect Promotion Evidence, and run a corrective promotion from a new content commit.

## Resolved Policy Points

- Production-targeted changes require an explicit PRD-open provider policy; production promotion never skips UAT proof for the same artifact commit.
- Production live paid smoke is optional and requires an explicit live smoke payment policy; live pre-payment Checkout surface proof is the required normal production smoke.
- Large Desired Price changes do not require a manual approval gate in this change; later policy can add thresholds without changing the default maintainer-only automation path.
- Retired items remain editorially visible and become non-buyable through D1 availability and Store Offer readiness.
