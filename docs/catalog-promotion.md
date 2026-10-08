# Catalog release

A release deploys the renderer, Pages gateway and CMS Worker from one source SHA. It preserves the environment-owned content pointer. Routine publication does not use this workflow. See [content publication](content-publication.md).

The operating model is:

- Local/UAT/PRD EmDash workspace: titles, descriptions, artwork, and guided Store Item creation. The [cutover completion record](cms-cutover.md) records the successful first PRD publication and released editorial write freeze.
- Items workspace: selling-price commands backed by Stripe. Each variant has one Product; its **default Price** is the selling price.
- BlackBox stock operations: stock and intentional checkout pauses. D1 owns orders and reservations.

## Publishing

For routine Local/UAT content changes, save and publish through the workspace; no Git commit or Worker deployment is required. For Software Release: commit code, review UAT, then promote.

A push to `main` runs **Release BlackBox** (`.github/workflows/pages.yml`): `check-candidate` (lint, typecheck, tests), the whole `pnpm test:e2e` suite (`e2e`, four shards), the staff previews against the PRD staff build (`staff-previews`, one leg each for Chromium and Firefox) and a content-free `build-uat`. `deploy-uat` needs only the checks and the build, so failing validation stops the deploy; the browser suites run beside it, and a failing suite turns the run red, which promotion refuses. It is one job under the `catalog-promotion-uat` environment: a read-only Pages credential check first, UAT runtime and Stripe verification, D1, CMS application, EmDash and catalog-field migrations, the renderer and CMS Workers, the Pages gateway (renderer binding and fail-closed mode, set and read back) and deployment, then `verify-worker`, listing readiness and `verify-hosted`, then a cached, apt-free Chromium install bounded at five minutes, `pnpm smoke:uat-static` and an identity re-check. A red smoke fails the run, and promotion refuses a failed run. Provider smoke is not part of the release. Before pushing, run `pnpm build:web` on the final tree: route isolation, the runtime bundle budgets and the image-markup check run only in the push run's fixture build, and a red push still deploys UAT. Review `https://blackbox-records-web-uat.pages.dev/`. Builds restore no CMS content, media or secrets: the renderer reads the environment's accepted snapshot from R2 at runtime, so a release moves code only and never changes the live snapshot pointer. Routine deployment does not seed or apply repository catalog data.

To promote, run `gh workflow run promote-prd.yml` on `main`. It takes no inputs; dispatching it is the confirmation. `deploy-prd` reads `release.json` from UAT, which names the SHA and push run UAT serves, and refuses unless that run is a successful `pages.yml` push run on `main` whose SHA is an ancestor of `main` and whose `e2e (1)` to `e2e (4)`, `staff-previews (chromium)`, `staff-previews (firefox)` and `deploy-uat` jobs passed. It checks all of this with `main` tooling before any candidate code is checked out or installed. It then checks out that SHA and builds PRD from it, content-free and stamped with the candidate's run id and number, so PRD reports the same release as UAT. Next come a read-only Pages credential check, `verify prd` (the checkout-disabled assertion, then monotonic run order against what PRD and its Worker already serve), D1, CMS application, EmDash and catalog-field migrations, the renderer and a CMS Worker version tagged with the promotion run and attempt deployed to 100% without reconciling routes, the Pages gateway (renderer binding and fail-closed mode) and deployment, then `verify-worker prd` and `verify-hosted prd` (no `[UAT]` marker, same identity). Promotion carries no catalog mutation and runs no browser or provider suite. It took 2.0 minutes in run 37546197141; run 37539133505 took 7:53 while `verify-worker` still read a lagging Durable Object (see Locks). It never changes DNS or the holding branch. The first promotion after the simplified pipeline landed must promote a SHA built by it, which the first push provides.

The job resolves UAT once, at its start, and promotes that release even if a newer push reaches UAT while it runs; dispatch again for the newer one. PRD is rebuilt, not copied: the bytes UAT served are never promoted, so UAT review covers behaviour and the identical source SHA, and the candidate's push run supplies the browser evidence.

HOST-11 is decided fail-closed. No static route HTML ships, so the Pages upload is the renderer client assets plus the gateway (`_worker.js`, `_routes.json`) and a prerendered `robots.txt`; the renderer serves `/release.json` through the gateway. Fail-closed is set once in the Cloudflare dashboard on both Pages projects (the API rejects `fail_open` in a PATCH), and every UAT deploy and PRD promotion verifies it: `scripts/configure-public-gateway.mjs` reads the production configuration back and fails the run unless `fail_open` is `false`, before `wrangler pages deploy` uploads anything. See [environment model](environment-model.md). `/assets/catalog/*` is no longer served: product images come from `/media/` URLs, the three release mockups are bundled `/_astro` assets, and the Stripe projection image URLs already point at `/media/`.

Rollback. Routine rollback is a revert commit, a push and a promotion; schema stays additive. Emergency rollback is paired: roll the renderer Worker version and the Pages deployment back to the same run together, and roll the CMS Worker back only when no migration ran between the two releases, never across a migration. The seven-day rebuild path is gone: there is no retained bundle, so any older release is rebuilt by reverting to its source and pushing.

Compare existing D1 stock, reservations and orders before and after a rollback; do not delete or reseed them. Monotonic release headers reject an older run's mutation after a newer one.

Locks. `deploy-uat` holds the non-cancelling `release-uat` group and `deploy-prd` holds `release-prd`; a newer push replaces a waiting UAT run and never cancels one that is deploying. `prd-holding-page.yml` keeps its own `blackbox-release` group, so it can never cancel a pending push or promotion. Content publication is a runtime CMS Worker operation and takes no release lock. Build and check jobs use branch concurrency groups that cancel obsolete runs. `verify` runs once per deploy job, before the first mutation, and checks monotonic run order against the release the target's site and Worker already serve; `verify-worker` and `verify-hosted` then check the deployed identity, and there is no separate observe step. Every Worker check reads the Worker entry's identity from its `OPTIONS /api/store/capabilities` preflight and the store Durable Object's from a GET of the same route, and retries 24 times at 5 seconds, about two minutes, for the new version to reach the runner's edge. Both Worker configs set `durable_objects.code_update_strategy` to `immediate`, so a deploy restarts running Durable Objects onto the new code at once; Wrangler's default defers the update until an object hibernates, up to five minutes, which kept the busy store object on the previous release's code. A run that still fails `verify-worker` after that wait is a real fault, not propagation. If the Worker succeeds and Pages fails, rerun the failed run within three days (the UAT build artifact expires then); otherwise push again. Additive schema changes remain in place; this is not atomic rollback across providers.

An invalid release item stops deployment. Zero stock or a D1 checkout pause does not invalidate an otherwise configured catalog. Unrelated Stripe objects are ignored; a conflicting bound Product is rejected.

## Changing a price

In the Items workspace, open the item and use **Change price**. Check the retained operation after an interruption instead of creating another item. This creates/selects the replacement default Price through the backend; older Prices can remain active. Direct Stripe Dashboard changes remain a provider diagnostic path: use the existing Product and an EUR Price with inclusive tax, leaving app identifiers and Product presentation alone. PRD credentials and Disintegration linkage are configured; PRD price commands are live provider writes and retain their explicit confirmation.

Signed Product/Price events refresh only the bound item. Detail and checkout reads fetch the current default and repair the D1 projection if a webhook was missed. Checkout still uses the validated concrete Price ID.

For a read-only runtime check (including EmDash-created items absent from repository files):

```sh
pnpm stripe:catalog:verify --env uat --store-item <store-item-slug>
```

`pnpm stripe:catalog:verify --env uat --apply` re-syncs UAT Stripe Product name, description and images from the D1 runtime projection (add `--store-item` to bound it), then re-verifies. It never creates Prices or writes D1 mappings or snapshots (checkout start repairs those); PRD `--apply` is refused.

For repository migration/recovery only, `pnpm catalog:readiness:generate` creates ignored SQL on demand. `stripe:catalog:verify --plan-apply` is a dry run that explicitly uses repository migration inputs, not current member edits; review the selected identities and plan. Normal readiness never supplies repository expected prices. Routine synchronization never resets stock, clears pauses, archives catalog objects, or replaces an existing selling amount. UAT can initialize genuinely new items with explicit test prices. PRD initial prices must already be configured in Stripe.

## Credentials and PRD

The one-time PRD catalog and CMS cutover (initial Price, CMS linkage backfill, Stripe key installation) finished on 2026-09-15; see [the completion record](cms-cutover.md). The release workflow no longer has a catalog job or confirmation input, and `stripe:catalog:verify` refuses PRD `--apply`. Do not repeat that backfill. The separately reviewed account migration below has a one-run live confirmation; it never enables checkout. `PRD_LAUNCH_APPROVED=true` and `native_checkout_enabled` remain separate launch controls. Install matching Worker credentials explicitly during the frozen configuration switch; software promotion does not install them.

Keep the GitHub environments `catalog-promotion-uat` and `catalog-promotion-prd`. Each environment's `CLOUDFLARE_API_TOKEN` covers D1, Workers Scripts and Cloudflare Pages write, so one deploy job per environment deploys the Workers and then Pages; there is no separate Pages credential or job. The token is set only on the steps that use it, never on install, build or the static smoke. The manual provider smoke (`uat-smoke.yml`) uses the UAT credential. Only `promote-prd.yml` binds `catalog-promotion-prd`, and no push-triggered workflow reads a `PRD_*` secret. The repository-level `CLOUDFLARE_API_TOKEN` remains only for `prd-holding-page.yml`. Existing staff routes remain provisioned separately; routine releases do not require zone-route mutation permission. `STRIPE_SECRET_KEY` and `STRIPE_PAYMENT_METHOD_CONFIGURATION_ID` are required only for UAT provider verification and operations; disabled PRD promotion does not need Stripe credentials. `CLOUDFLARE_ACCOUNT_ID` is non-secret. Worker runtime secrets remain separate.

Release candidates and code promotion never change the live PRD catalog; the disabled frontend publishes without it.

## Migration and retry

### Stripe account migration

`pnpm stripe:catalog:migrate` is the plan/apply/restore operator for [migrate-stripe-to-blackboxrecords](../openspec/changes/migrate-stripe-to-blackboxrecords/design.md). It defaults to a read-only plan. Use the primary `main` checkout; this is separate from Software Release and needs no new Actions workflow.

Provide `SOURCE_STRIPE_SECRET_KEY`, `TARGET_STRIPE_SECRET_KEY`, `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_API_TOKEN` privately. The source key needs account/balance/Product/Price reads; the destination also needs Product/Price writes. D1 reads cover configured `COMMERCE_DB` and the separate `CMS_DB`; writes target current commerce mappings/offers only. Every run asserts exact full accounts and test/live mode and pins both database identities. Use the change's account map; keep full IDs out of Git.

Check account-wide [Free-tier headroom](cloudflare-free-tier.md) and record the expected request/row budget before hosted commands. Plans and boundary verification paginate D1 tables in 1,000-row pages, with the unchanged 100,000-row per-table ceiling. Budget one full commerce/CMS state read for a plan, two for prepare-only and three for each full apply or restore, including an idempotent invocation. Stripe recovery exhausts Product inventory and Product/lookup-scoped Price pagination, including archived Prices. Each distinct runtime media URL is fetched once per invocation; its body is canceled after image headers are checked. Reserve ordinary-service headroom and stop/reduce the run if measured use exceeds the budget.

Create and review a private dry run (PowerShell):

```powershell
pnpm stripe:catalog:migrate --env uat --source-account $env:SOURCE_STRIPE_ACCOUNT_ID --target-account $env:TARGET_STRIPE_ACCOUNT_ID --manifest .codex-artifacts/catalog-migration/uat-reviewed.json
$reviewedHash = (Get-Content .codex-artifacts/catalog-migration/uat-reviewed.json -Raw | ConvertFrom-Json).hash
```

Read the manifest before authorizing that hash. It contains every `StoreItemOption`, its revision and original mapping/offer, source Product/default-Price facts, target Product identity and runtime presentation. CMS-created, withheld, paused, sold-out and uninitialized rows are included. The compact `cmsSources` inventory records native source IDs/slugs, versions, live/draft revision pointers and content fingerprints, including sources with no catalog identity. These sources gain no Store Item, variant or Price. Product-only unfinished setup remains in its original `CatalogOperation`, without an invented mapping. Missing/conflicting source identities stop the plan. Fixed/custom amounts, nullable bounds, active flags and inclusive EUR tax come from that environment's source authority.

Zero-revision drafts keep any partial source mapping/offer unchanged and gain no destination objects. Retain a source-account handling path for their unfinished setup through the drain/disposition journal; this command does not complete setup or rewrite its receipt.

Protected fingerprints cover all other commerce and CMS tables/schema: stock, `zeroStockState`, `expectedMonth`, preorder fields, pauses, content/publication data, pending AvailabilityAlert consent/retry fields, send-day counters, orders, monetary facts and retained events/operations. Plan files refuse overwrite. Journals/provider IDs stay under `.codex-artifacts/catalog-migration/`; keep an approved private copy with usable source rollback credentials.

Version 2 records raw CMS bookkeeping separately in the private manifest and at each journal verification boundary. Its protected fingerprints normalize only `value` and `revision` on the `options` row named `system:scheduler:last_completed_at`, and `next_eligible_at`, `last_started_at`, `last_completed_at`, `last_duration_ms` and `updated_at` on `_emdash_media_usage_cleanup` task `projection_gc`. Row presence, identities, counts, schema and every other field remain protected, including other options, cleanup leases/cursors, failures and deletion counters. Apply and restore reject version 1 manifests/journals; retain those artifacts and create a fresh version 2 plan in new files for review.

Stage destination objects before changing current links:

```powershell
pnpm stripe:catalog:migrate --env uat --source-account $env:SOURCE_STRIPE_ACCOUNT_ID --target-account $env:TARGET_STRIPE_ACCOUNT_ID --manifest .codex-artifacts/catalog-migration/uat-reviewed.json --mode apply --prepare-only --reviewed-hash $reviewedHash
```

Deterministic Product IDs, migration metadata, exhaustive Price recovery and the journal prevent duplicates after lost responses or expired idempotency. Ambiguous identities, conflicting defaults or source drift stop the run. Inactive objects stay inactive; uninitialized items gain no prices. Published artwork `/media/published/<sha>` uses the Product Environment profile's backend Worker origin: `blackbox-records-backend-uat.blackboxrecordsathens.workers.dev` for UAT and `blackbox-records-backend-prd.blackboxrecordsathens.workers.dev` for PRD. Public content `/media/content/<sha>` uses its Pages origin: `blackbox-records-web-uat.pages.dev` for UAT and `blackbox-records-web.pages.dev` for PRD. The command derives these origins from the existing profile, checks HTTPS image reachability without redirects and preserves each stored URL. Inspect actual live Product images during PRD acceptance.

Freeze every independent writer. Coordinate `release-uat`/`release-prd`, the separate `uat-provider-smoke` group, Content/Items edits/publication and scheduled activity. Close checkout, drain source Sessions/holds/pending payments, CatalogOperation leases and payable retries, and assign retained review/history cases. For PRD, deploy and verify the launch change's availability-alert suppression before rebinding; checkout closure alone does not stop alerts. Keep safe unrelated delivery recovery running under its owner. Record legitimate drain/delivery, retention cleanup or later probe events separately. If these change the protected baseline, review a fresh manifest/journal in new files; matching staged objects resume without duplication.

Stage the target webhook by creating it, privately capturing its secret, updating `disabled=true` and verifying disabled status. Disable an existing source endpoint only after drain. Stop target payment/catalog activity during staging. Switch the Worker key/PMC/signing secret and matching GitHub key/PMC coherently, then apply the final reviewed manifest:

```powershell
pnpm stripe:catalog:migrate --env uat --source-account $env:SOURCE_STRIPE_ACCOUNT_ID --target-account $env:TARGET_STRIPE_ACCOUNT_ID --manifest .codex-artifacts/catalog-migration/uat-reviewed.json --mode apply --reviewed-hash $reviewedHash
```

Each mapping/offer pair changes in one [D1 transaction batch](https://developers.cloudflare.com/d1/worker-api/d1-database/#batch) with exact item/revision, mapping, offer, stock and pause preconditions. A failed precondition aborts the batch. The command verifies every manifest row and CMS source plus protected table fingerprints before/after apply; the published-only normal verifier is an additional check. Interrupted/repeated apply resumes from actual links and retained target IDs. On error, keep checkout closed and inspect the safe reason/private journal. Do not edit an old reviewed manifest to make it pass.

The current inverse rehearsal is **pre-event**, before signed probes advance protected webhook history or any destination payment. Hold the freeze, disable the destination endpoint and restore coherent source Worker/GitHub configuration. Restore only inverse current catalog fields:

```powershell
pnpm stripe:catalog:migrate --env uat --source-account $env:SOURCE_STRIPE_ACCOUNT_ID --target-account $env:TARGET_STRIPE_ACCOUNT_ID --manifest .codex-artifacts/catalog-migration/uat-reviewed.json --mode restore --reviewed-hash $reviewedHash
```

Restore preserves provider objects/history and removes only a current offer created here when its original was absent. Repeated/interrupted restore is safe. Restore the former source endpoint and verify identity/data, then reapply the same journal in UAT and check for duplicates. A private journal lock prevents concurrent operators; dead same-host locks recover automatically, while live/other-host ownership must be resolved by the operator.

For PRD, use `--env prd`, its own accounts/manifest/hash and add `--confirm-live-catalog-changes` to **every** prepare/apply/restore invocation. The normal verifier's PRD apply refusal stays unchanged. Once protected webhook history advances, the old manifest refuses restore. Ordinary planning while mappings point at target cannot construct an inverse successor; no successor-baseline recovery is implemented. Keep checkout closed and repair forward thereafter, including after a destination payment, preserving both histories. A source configuration restore alone with target D1 mappings is not recovery. Bound or resolve this limit for exact PRD readiness; representative UAT needs no historical audit. See the [prepared procedure and limits](../.codex-artifacts/stripe-migration-delegation/uat-configuration-next-mutation-20261008.md).

Enable the target endpoint only after configuration and links agree. Prove a signed reversible catalog event and replay, then restore probe metadata. Run runtime, PMC, webhook and normal catalog checks against the recorded deployed SHA. Provider purchase/receipt/refund smoke is explicit through `uat-smoke.yml` or `pnpm smoke:stripe-uat` after stock/recipient checks; release/static smoke does not establish destination-account acceptance. PRD remains closed pending technical acceptance, live smoke and final activation for the [current requested scope](../openspec/changes/migrate-stripe-to-blackboxrecords/evidence.md#owner-decisions--2026-10-08).

### Retained same-account binding backfill

The additive D1 migration retains existing Price mappings and adds a unique nullable Product binding. Run `pnpm catalog:bindings:migrate --env uat` for a dry run; add `--apply` after reviewing it. PRD apply also requires `--confirm-live-catalog-changes`.

Migration exports affected D1 tables and validates all selected bindings before provider writes. A trusted Price mapping supplies the Product and preserves the current amount. Missing or conflicting mappings/defaults stop the migration. Backups and provider IDs stay in ignored `.codex-artifacts/catalog-migration/` files.

This completed repository-contract backfill is not account-rebinding authority. Do not use it, `backfill-runtime-catalog.ts`, or `stripe:catalog:verify --plan-apply` for the command above: the repository loader still emits retired `/assets/catalog/` URLs. Repair that path only for an identified recovery using actual CMS media identities.

Reset recovery is an exceptional operator repair from reviewed backups and provider history. It is deliberately absent from the release workflow; ordinary retries never reactivate archived objects or infer identities from Product names.

Rerun the failed **Release BlackBox** run within three days (otherwise push again), or push a fix, after correcting a reported problem. Stable Product identities and Product-scoped Price checks allow interrupted new-item creation to resume. Stripe idempotency keys are additional protection, not permanent deduplication.

The workflow summary records completed stages. Stripe, D1, Workers, and static hosts are separate systems: this is a readiness gate, not an atomic deployment. Releases are additive; the existing frontend stays until its replacement deploys.
