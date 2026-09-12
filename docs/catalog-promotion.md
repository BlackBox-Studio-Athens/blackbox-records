# Catalog release

The operating model is:

- Sveltia/repository: titles, descriptions, artwork, and Store Item identities.
- Stripe Dashboard: selling prices. Each variant has one Product; its **default Price** is the selling price.
- BlackBox stock operations: stock and intentional checkout pauses. D1 owns orders and reservations.

## Publishing

Commit → review UAT → explicitly promote this candidate. Push content or code to main. **Release BlackBox** in `.github/workflows/pages.yml` runs repository gates, builds paired UAT/PRD public and Worker artifacts plus PRD staff, synchronizes UAT release items, deploys UAT, and runs the canonical paid/newsletter/static smoke. Review `https://blackbox-records-web-uat.pages.dev/`. Every artifact records one full source SHA; generated catalogs and SQL remain build inputs.

To promote, dispatch that workflow on `main` with `target=prd`, the reviewed full `artifact_commit_sha`, the successful UAT `candidate_run_id`, and `confirm_code_promotion=true`. Leave `confirm_live_catalog_changes=false`. PRD consumes the retained bundle without rebuilding, checks every file digest and the configuration fingerprint, applies compatible migrations, deploys the Worker, verifies readiness, then deploys public and staff artifacts. It never changes DNS or the holding branch.

Candidate bundles and smoke evidence expire after seven days. An expired, failed, foreign, superseded, or configuration-mismatched candidate cannot promote. Dispatch `target=uat` with the same full SHA to rebuild and revalidate it as a new run, then review again. The run's workflow revision and selected source revision are recorded separately for this recovery path.

For compatible application rollback, rebuild the last known-good source as a new UAT candidate. Its migration inventory and runtime configuration must remain compatible with the deployed schema. Compare existing D1 stock, reservations, and orders before and after; do not delete or reseed them. After fresh UAT acceptance, select that new candidate for code promotion. Do not rerun an older mutation job after a newer candidate: monotonic release headers reject it.

Each mutation rechecks identity under a non-cancelling release lock. If the Worker succeeds and Pages fails, the workflow summary records both actual revisions, including unavailable surfaces. Retry the same candidate while it remains current, or validate a compatible rollback candidate. Additive schema changes remain in place; this is not atomic rollback across providers.

One shared release lock prevents overlapping stateful runs. An invalid release item stops deployment. Zero stock or a D1 checkout pause does not invalidate an otherwise configured catalog. Unrelated Stripe objects are ignored; a conflicting bound Product is rejected.

## Changing a price

Open the existing Stripe Product, add an EUR Price with inclusive tax, and choose **Set as default price**. Older Prices can remain active. Leave app identifiers and Product presentation alone.

Signed Product/Price events refresh only the bound item. Detail and checkout reads fetch the current default and repair the D1 projection if a webhook was missed. Checkout still uses the validated concrete Price ID.

For a targeted check or repair:

```sh
pnpm stripe:catalog:verify --env uat --store-item <store-item-slug>
pnpm stripe:catalog:verify --env uat --store-item <store-item-slug> --apply
```

Routine synchronization never resets stock, clears pauses, archives catalog objects, or replaces an existing selling amount. UAT can initialize genuinely new items with explicit test prices. PRD initial prices must already be configured in Stripe.

## Credentials and PRD

Keep the existing GitHub environments `catalog-promotion-uat` and `catalog-promotion-prd`. Each holds `CLOUDFLARE_API_TOKEN` and `STRIPE_SECRET_KEY`, with `CLOUDFLARE_ACCOUNT_ID` and `STRIPE_PAYMENT_METHOD_CONFIGURATION_ID` as variables. Worker runtime secrets remain separate.

Live Stripe/D1 mutation requires the false-by-default `confirm_live_catalog_changes` input for that exact run. It never enables checkout: `PRD_LAUNCH_APPROVED=true` and `native_checkout_enabled` remain separate launch controls. Without live confirmation, the PRD catalog remains unchanged and the disabled frontend can still publish.

## Migration and retry

The additive D1 migration retains existing Price mappings and adds a unique nullable Product binding. Run `pnpm catalog:bindings:migrate --env uat` for a dry run; add `--apply` after reviewing it. PRD apply also requires `--confirm-live-catalog-changes`.

Migration exports affected D1 tables and validates all selected bindings before provider writes. A trusted Price mapping supplies the Product and preserves the current amount. Missing or conflicting mappings/defaults stop the migration. Backups and provider IDs stay in ignored `.codex-artifacts/catalog-migration/` files.

Reset recovery is an exceptional operator repair from reviewed backups and provider history. It is deliberately absent from the release workflow; ordinary retries never reactivate archived objects or infer identities from Product names.

Rerun **Release BlackBox** with the same full source SHA after fixing a reported problem. Stable Product identities and Product-scoped Price checks allow interrupted new-item creation to resume. Stripe idempotency keys are additional protection, not permanent deduplication.

The workflow summary records completed stages. Stripe, D1, Workers, and static hosts are separate systems: this is a readiness gate, not an atomic deployment. Preparation is additive; existing frontend artifacts remain until their replacement deploys.
