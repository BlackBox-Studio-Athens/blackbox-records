# Catalog release

The operating model is:

- Sveltia/repository: titles, descriptions, artwork, and Store Item identities.
- Stripe Dashboard: selling prices. Each variant has one Product; its **default Price** is the selling price.
- BlackBox stock operations: stock and intentional checkout pauses. D1 owns orders and reservations.

## Publishing

Push content or code to main. The **Release BlackBox** workflow in `.github/workflows/pages.yml` generates one catalog manifest, runs tests/checks/builds, synchronizes release items, deploys the UAT Worker and selected static hosts, then runs UAT smoke tests. Every stage uses the same full source SHA. Generated catalogs and SQL are build inputs, not bot commits.

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
