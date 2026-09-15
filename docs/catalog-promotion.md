# Catalog release

The operating model is:

- Local/UAT EmDash workspace: titles, descriptions, artwork, and guided Store Item creation. PRD still uses its pre-cutover source until the [approved migration](cms-cutover.md) completes.
- Items workspace: selling-price commands backed by Stripe. Each variant has one Product; its **default Price** is the selling price.
- BlackBox stock operations: stock and intentional checkout pauses. D1 owns orders and reservations.

## Publishing

For routine Local/UAT content changes, save and publish through the workspace; no Git commit or Worker deployment is required. For Software Release: commit code → review UAT → explicitly promote the candidate. **Release BlackBox** in `.github/workflows/pages.yml` runs repository gates, builds paired UAT/PRD public and Worker artifacts plus PRD staff, synchronizes UAT release items, deploys UAT, and runs the canonical paid/newsletter/static smoke. Review `https://blackbox-records-web-uat.pages.dev/`. Every artifact records one full source SHA. Generated catalogs and SQL remain transitional build inputs until their cutover retirement; they are not member edit points.

To promote, dispatch that workflow on `main` with `target=prd`, the reviewed full `artifact_commit_sha`, the successful UAT `candidate_run_id`, and `confirm_code_promotion=true`. Leave `confirm_live_catalog_changes=false`. PRD consumes the retained bundle without rebuilding, checks every file digest and the configuration fingerprint, applies compatible migrations, uploads a Worker version tagged with the promotion run and attempt, deploys that exact tag to 100% without reconciling routes, verifies readiness, then deploys public and staff artifacts. It never changes DNS or the holding branch.

Candidate bundles and smoke evidence expire after seven days. An expired, failed, foreign, superseded, or configuration-mismatched candidate cannot promote. Dispatch `target=uat` with the same full SHA to rebuild and revalidate it as a new run, then review again. The run's workflow revision and selected source revision are recorded separately for this recovery path.

The same rebuild handles a newer content publication. Candidate preparation restores each target's own immutable published snapshot, using authenticated read-only snapshot/media requests. It never substitutes current editable CMS data or UAT content for PRD content. The new bundle retains the reviewed source SHA, gets a new candidate run, and includes the target snapshot identity in `release.json`. Promote that new run only after review and explicit confirmation. Promotion still does not rebuild an artifact in place. If content changes again before promotion, the content precondition rejects it and another refresh is needed.

Targets without a first CMS publication retain the pre-cutover repository source. Once the public release identifies a CMS snapshot, missing credentials, invalid/missing snapshots, and exceeded budgets stop the build; there is no repository fallback. Snapshot builds keep the legacy CMS writer disabled. Restore uses the target's `CMS_PUBLICATION_EXPORT_TOKEN`, Access service credentials, and explicit `CMS_PUBLICATION_MAX_REQUESTS` limit from README. Budget one public identity read, one CMS manifest read, and one CMS read per unique media object; each media request also reads its manifest for authorization. These are D1/R2 reads, with no native token activity write or KV session. Restore credentials are passed only to trusted tooling and are absent from build steps.

For compatible application rollback, rebuild the last known-good source as a new UAT candidate. Its migration inventory and runtime configuration must remain compatible with the deployed schema. Compare existing D1 stock, reservations, and orders before and after; do not delete or reseed them. After fresh UAT acceptance, select that new candidate for code promotion. Do not rerun an older mutation job after a newer candidate: monotonic release headers reject it.

Each mutation rechecks identity under a non-cancelling release lock. If the Worker succeeds and Pages fails, the workflow summary records both actual revisions, including unavailable surfaces. Retry the same candidate while it remains current, or validate a compatible rollback candidate. Additive schema changes remain in place; this is not atomic rollback across providers.

One shared release lock prevents overlapping stateful runs. An invalid release item stops deployment. Zero stock or a D1 checkout pause does not invalidate an otherwise configured catalog. Unrelated Stripe objects are ignored; a conflicting bound Product is rejected.

## Changing a price

In the Local/UAT Items workspace, open the item and use **Change price**. Check the retained operation after an interruption instead of creating another item. This creates/selects the replacement default Price through the backend; older Prices can remain active. Direct Stripe Dashboard changes remain a provider diagnostic path: use the existing Product and an EUR Price with inclusive tax, leaving app identifiers and Product presentation alone. PRD member price operations begin after cutover acceptance.

Signed Product/Price events refresh only the bound item. Detail and checkout reads fetch the current default and repair the D1 projection if a webhook was missed. Checkout still uses the validated concrete Price ID.

For a targeted check or repair:

```sh
pnpm stripe:catalog:verify --env uat --store-item <store-item-slug>
pnpm stripe:catalog:verify --env uat --store-item <store-item-slug> --apply
```

Routine synchronization never resets stock, clears pauses, archives catalog objects, or replaces an existing selling amount. UAT can initialize genuinely new items with explicit test prices. PRD initial prices must already be configured in Stripe.

## Credentials and PRD

For a read-only Disintegration cutover plan using the live key held in GitHub, dispatch **Release BlackBox** on `main` with `target=prd` and all confirmation inputs left false. The `catalog-prd-plan` job runs `apps/backend/scripts/prepare-prd-initial-price.ts` and writes its report and SHA-256 to the run summary. This explicit migration uses the approved EUR 28.00 initial price, inventories up to 300 Stripe Products, rejects existing Products needing separate binding review, and preserves the retained stock 15/12. It reads Stripe and D1 without applying migrations, creating Products/Prices, deploying code, or enabling checkout. It needs the environment's `STRIPE_SECRET_KEY` and Cloudflare credentials; payment-method and webhook configuration are not needed for this plan.

Only after one-run approval of that report, dispatch the same reviewed source with `target=prd`, `confirm_live_catalog_changes=true`, `confirm_cms_cutover=true`, and its `catalog_plan_sha256`; leave `confirm_code_promotion=false`. This path uses the existing confirmed-live setup/price gateway to create or resume the exact operation, bind the retained variant and refresh its offer. It does not seed stock, apply schema migrations, enable checkout or deploy anything. Routine catalog reconciliation still cannot bootstrap live prices.

After the approved CMS import and schema migration, pass its read-only verification JSON as `cms_import_report` to the same workflow. This selects `backfill-runtime-catalog.ts`, keeping the live key in the GitHub environment. With all confirmations false it reports the exact linkage plan and hash. For the authorized apply, use the same source SHA, report and `catalog_plan_sha256`, with only `confirm_live_catalog_changes=true`. The existing backfill validates all import identities and current provider state, fills only uninitialized runtime catalog fields, and checks every commerce table for unintended changes. This path neither creates another Price nor runs inventory seeds.

Keep the existing GitHub environments `catalog-promotion-uat` and `catalog-promotion-prd`. UAT Worker/D1 and provider steps use the UAT environment credential. PRD Worker/D1 steps use the PRD environment credential. Separate Pages jobs use the repository Pages credential after the corresponding Worker job succeeds. PRD code promotion requires its environment credential to cover PRD Worker versions/deployments and D1; the repository credential covers both PRD Pages projects. Existing staff routes remain provisioned separately; routine code promotion does not require zone-route mutation permission. `STRIPE_SECRET_KEY` and `STRIPE_PAYMENT_METHOD_CONFIGURATION_ID` are required only for provider operations; disabled PRD code promotion does not need Stripe credentials. `CLOUDFLARE_ACCOUNT_ID` is non-secret and included in the candidate configuration fingerprint. Worker runtime secrets remain separate.

Live Stripe/D1 mutation requires the false-by-default `confirm_live_catalog_changes` input for that exact run. It never enables checkout: `PRD_LAUNCH_APPROVED=true` and `native_checkout_enabled` remain separate launch controls. Without live confirmation, the PRD catalog remains unchanged and the disabled frontend can still publish.

## Migration and retry

The additive D1 migration retains existing Price mappings and adds a unique nullable Product binding. Run `pnpm catalog:bindings:migrate --env uat` for a dry run; add `--apply` after reviewing it. PRD apply also requires `--confirm-live-catalog-changes`.

Migration exports affected D1 tables and validates all selected bindings before provider writes. A trusted Price mapping supplies the Product and preserves the current amount. Missing or conflicting mappings/defaults stop the migration. Backups and provider IDs stay in ignored `.codex-artifacts/catalog-migration/` files.

Reset recovery is an exceptional operator repair from reviewed backups and provider history. It is deliberately absent from the release workflow; ordinary retries never reactivate archived objects or infer identities from Product names.

Rerun **Release BlackBox** with the same full source SHA after fixing a reported problem. Stable Product identities and Product-scoped Price checks allow interrupted new-item creation to resume. Stripe idempotency keys are additional protection, not permanent deduplication.

The workflow summary records completed stages. Stripe, D1, Workers, and static hosts are separate systems: this is a readiness gate, not an atomic deployment. Preparation is additive; existing frontend artifacts remain until their replacement deploys.
