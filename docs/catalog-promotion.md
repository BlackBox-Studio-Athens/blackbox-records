# Catalog release

Code candidates retain the renderer and Pages gateway alongside public assets and the CMS Worker. Promotion preserves the environment-owned content pointer. Routine publication does not use this workflow. See [content publication](content-publication.md).

The operating model is:

- Local/UAT/PRD EmDash workspace: titles, descriptions, artwork, and guided Store Item creation. The [cutover completion record](cms-cutover.md) records the successful first PRD publication and released editorial write freeze.
- Items workspace: selling-price commands backed by Stripe. Each variant has one Product; its **default Price** is the selling price.
- BlackBox stock operations: stock and intentional checkout pauses. D1 owns orders and reservations.

## Publishing

For routine Local/UAT content changes, save and publish through the workspace; no Git commit or Worker deployment is required. For Software Release: commit code → review UAT → explicitly promote the candidate. **Release BlackBox** in `.github/workflows/pages.yml` runs repository gates, then prepares the UAT and PRD public/CMS artifacts independently from their own published snapshots. The UAT target bundle can deploy while PRD preparation is still running. The whole `pnpm test:e2e` suite (`e2e`, two shards) and the staff previews in Chromium and Firefox against the PRD staff build (`staff-previews`) run in parallel with the checks and builds, and `uat-release` needs them, so a failing suite stops the UAT deploy. After UAT serves the candidate and `verify-hosted uat` confirms its identity, `uat-static-smoke` (`pnpm smoke:uat-static`) runs against it; a red smoke fails the run, which cannot then be promoted. Provider smoke is not part of the release. Final assembly verifies both target manifests and digests before creating the retained schema-2 bundle. Review `https://blackbox-records-web-uat.pages.dev/`. Every artifact records one full source SHA. No compiled catalog is required. Repository migration data is read only by explicit recovery tooling and Local/UAT fixtures. Routine deployment does not seed or apply it.

To promote, dispatch that workflow on `main` with `target=prd`, the reviewed full `artifact_commit_sha`, the successful UAT `candidate_run_id`, and `confirm_code_promotion=true`. Promotion carries no catalog mutation, and runs no browser or provider suite: `accept-uat-identity` verifies that UAT still serves the selected candidate run, then `deploy-prd` and `deploy-prd-static` deploy. If UAT moved to a newer candidate, promote the candidate UAT serves or redeploy the selected one. PRD consumes the retained bundle without rebuilding, checks every file digest and the configuration fingerprint, applies compatible migrations, uploads a Worker version tagged with the promotion run and attempt, deploys that exact tag to 100% without reconciling routes, verifies readiness, then deploys the public Pages artifact; staff assets are already inside the combined Worker. It never changes DNS or the holding branch.

Release contract v2 requires `uat/worker` and `prd/cms` combined artifacts and excludes `prd/staff` and commerce-only `prd/worker`. Older bundles are incompatible and require a fresh accepted candidate. Candidate bundles expire after seven days. An expired, failed, foreign, superseded, or configuration-mismatched candidate cannot promote. Dispatch `target=uat` with the same full SHA to rebuild it as a new run, which reruns the push suites and smoke, then review again. The run's workflow revision and selected source revision are recorded separately for this recovery path.

The same rebuild handles a newer content publication. Candidate preparation restores each target's own immutable published snapshot, using authenticated read-only snapshot/media requests. It never substitutes current editable CMS data or UAT content for PRD content. The new bundle retains the reviewed source SHA, gets a new candidate run, and includes the target snapshot identity in `release.json`. Promote that new run only after review and explicit confirmation. Promotion still does not rebuild an artifact in place. If content changes again before promotion, the content precondition rejects it and another refresh is needed.

Targets without a first CMS publication retain the pre-cutover repository source. Once the public release identifies a CMS snapshot, missing credentials, invalid/missing snapshots, and exceeded budgets stop the build; there is no repository fallback. Public artifacts contain no legacy CMS writer; former `/admin/*` routes return 404. Restore uses the target's `CMS_PUBLICATION_EXPORT_TOKEN`, Access service credentials, and explicit `CMS_PUBLICATION_MAX_REQUESTS` limit from README. Budget one public identity read, one CMS manifest read, and one CMS read per unique media object; each media request also reads its manifest for authorization. These are D1/R2 reads, with no native token activity write or KV session. A media file is taken from the per-target Actions cache instead only when its sha256 equals the snapshot's digest, so request counts can only fall; the snapshot itself is always read from the target, and the cache is saved only when its contents changed and stay within 512 MiB. Restore credentials are passed only to trusted tooling and are absent from build steps.

For compatible application rollback, rebuild the last known-good source as a new UAT candidate. Its migration inventory and runtime configuration must remain compatible with the deployed schema. Compare existing D1 stock, reservations, and orders before and after; do not delete or reseed them. After the new candidate's push run is green, select it for code promotion. Do not rerun an older mutation job after a newer candidate: monotonic release headers reject it.

The non-cancelling `blackbox-release` lock spans UAT Worker and Pages deployment through hosted identity verification. PRD code promotion holds it from the identity check through the last PRD deployment, so no UAT deployment can replace the candidate being promoted. The PRD holding-page deploy shares the same lock; content publication is a runtime CMS Worker operation and takes no release lock. Preparation jobs use separate branch/role concurrency groups; automatic runs can cancel obsolete preparation, while manual UAT preparation uses a run-specific group. Mutations recheck identity and monotonic run order immediately before writing. If the Worker succeeds and Pages fails, the workflow summary records both actual revisions, including unavailable surfaces. Retry the same candidate while it remains current, or validate a compatible rollback candidate. Additive schema changes remain in place; this is not atomic rollback across providers.

One shared release lock prevents overlapping stateful runs. An invalid release item stops deployment. Zero stock or a D1 checkout pause does not invalidate an otherwise configured catalog. Unrelated Stripe objects are ignored; a conflicting bound Product is rejected.

## Changing a price

In the Items workspace, open the item and use **Change price**. Check the retained operation after an interruption instead of creating another item. This creates/selects the replacement default Price through the backend; older Prices can remain active. Direct Stripe Dashboard changes remain a provider diagnostic path: use the existing Product and an EUR Price with inclusive tax, leaving app identifiers and Product presentation alone. PRD credentials and Disintegration linkage are configured; PRD price commands are live provider writes and retain their explicit confirmation.

Signed Product/Price events refresh only the bound item. Detail and checkout reads fetch the current default and repair the D1 projection if a webhook was missed. Checkout still uses the validated concrete Price ID.

For a read-only runtime check (including EmDash-created items absent from repository files):

```sh
pnpm stripe:catalog:verify --env uat --store-item <store-item-slug>
```

For repository migration/recovery only, `pnpm catalog:readiness:generate` creates ignored SQL on demand. `stripe:catalog:verify --plan-apply` and `--apply` explicitly use repository migration inputs, not current member edits; review the selected identities and plan before either operation. PRD `--apply` is refused. Normal readiness never supplies repository expected prices. Routine synchronization never resets stock, clears pauses, archives catalog objects, or replaces an existing selling amount. UAT can initialize genuinely new items with explicit test prices. PRD initial prices must already be configured in Stripe.

## Credentials and PRD

The one-time PRD catalog and CMS cutover (initial Price, CMS linkage backfill, Stripe key installation) finished on 2026-09-15; see [the completion record](cms-cutover.md). The release workflow no longer has a catalog job or confirmation input, and `stripe:catalog:verify` refuses PRD `--apply`. Do not repeat the cutover. A future live PRD catalog change needs its own reviewed one-run workflow with a false-by-default confirmation; that confirmation never enables checkout, and `PRD_LAUNCH_APPROVED=true` and `native_checkout_enabled` remain separate launch controls. Such a workflow also owns persisting `STRIPE_SECRET_KEY` into the PRD Worker, which the retired job did with `wrangler secret put`.

Keep the existing GitHub environments `catalog-promotion-uat` and `catalog-promotion-prd`. UAT Worker/D1 steps use the UAT environment credential; the suites and the static smoke use no secret, and the manual provider smoke (`uat-smoke.yml`) uses the UAT credential. PRD Worker/D1 steps use the PRD environment credential. Separate Pages jobs use the repository Pages credential after the corresponding Worker job succeeds. PRD code promotion requires its environment credential to cover PRD Worker versions/deployments and D1; the repository credential covers the public PRD Pages project. Existing staff routes remain provisioned separately; routine code promotion does not require zone-route mutation permission. `STRIPE_SECRET_KEY` and `STRIPE_PAYMENT_METHOD_CONFIGURATION_ID` are required only for provider operations; disabled PRD code promotion does not need Stripe credentials. `CLOUDFLARE_ACCOUNT_ID` is non-secret and included in the candidate configuration fingerprint. Worker runtime secrets remain separate.

Release candidates and code promotion never change the live PRD catalog; the disabled frontend publishes without it.

## Migration and retry

The additive D1 migration retains existing Price mappings and adds a unique nullable Product binding. Run `pnpm catalog:bindings:migrate --env uat` for a dry run; add `--apply` after reviewing it. PRD apply also requires `--confirm-live-catalog-changes`.

Migration exports affected D1 tables and validates all selected bindings before provider writes. A trusted Price mapping supplies the Product and preserves the current amount. Missing or conflicting mappings/defaults stop the migration. Backups and provider IDs stay in ignored `.codex-artifacts/catalog-migration/` files.

Reset recovery is an exceptional operator repair from reviewed backups and provider history. It is deliberately absent from the release workflow; ordinary retries never reactivate archived objects or infer identities from Product names.

Rerun **Release BlackBox** with the same full source SHA after fixing a reported problem. Stable Product identities and Product-scoped Price checks allow interrupted new-item creation to resume. Stripe idempotency keys are additional protection, not permanent deduplication.

The workflow summary records completed stages. Stripe, D1, Workers, and static hosts are separate systems: this is a readiness gate, not an atomic deployment. Preparation is additive; existing frontend artifacts remain until their replacement deploys.
