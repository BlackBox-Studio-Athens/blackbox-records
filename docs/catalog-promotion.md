# Catalog release

A release deploys the renderer, Pages gateway and CMS Worker from one source SHA. It preserves the environment-owned content pointer. Routine publication does not use this workflow. See [content publication](content-publication.md).

The operating model is:

- Local/UAT/PRD EmDash workspace: titles, descriptions, artwork, and guided Store Item creation. The [cutover completion record](cms-cutover.md) records the successful first PRD publication and released editorial write freeze.
- Items workspace: selling-price commands backed by Stripe. Each variant has one Product; its **default Price** is the selling price.
- BlackBox stock operations: stock and intentional checkout pauses. D1 owns orders and reservations.

## Publishing

For routine Local/UAT content changes, save and publish through the workspace; no Git commit or Worker deployment is required. For Software Release: commit code, review UAT, then promote.

A push to `main` runs **Release BlackBox** (`.github/workflows/pages.yml`): `check-candidate` (lint, typecheck, tests), the whole `pnpm test:e2e` suite (`e2e`, four shards), the staff previews against the PRD staff build (`staff-previews`, one leg each for Chromium and Firefox) and a content-free `build-uat`. `deploy-uat` needs only the checks and the build, so failing validation stops the deploy; the browser suites run beside it, and a failing suite turns the run red, which promotion refuses. It is one job under the `catalog-promotion-uat` environment: a read-only Pages credential check first, UAT runtime and Stripe verification, D1, CMS application, EmDash and catalog-field migrations, the renderer and CMS Workers, the Pages gateway (renderer binding and fail-closed mode, set and read back) and deployment, then `verify-worker`, listing readiness and `verify-hosted`, then `pnpm smoke:uat-static` and an identity re-check. A red smoke fails the run, and promotion refuses a failed run. Provider smoke is not part of the release. Review `https://blackbox-records-web-uat.pages.dev/`. Builds restore no CMS content, media or secrets: the renderer reads the environment's accepted snapshot from R2 at runtime, so a release moves code only and never changes the live snapshot pointer. Routine deployment does not seed or apply repository catalog data.

To promote, run `gh workflow run promote-prd.yml` on `main`. It takes no inputs; dispatching it is the confirmation. `deploy-prd` reads `release.json` from UAT, which names the SHA and push run UAT serves, and refuses unless that run is a successful `pages.yml` push run on `main` whose SHA is an ancestor of `main` and whose `e2e (1)` to `e2e (4)`, `staff-previews (chromium)`, `staff-previews (firefox)` and `deploy-uat` jobs passed. It checks all of this with `main` tooling before any candidate code is checked out or installed. It then checks out that SHA and builds PRD from it, content-free and stamped with the candidate's run id and number, so PRD reports the same release as UAT. Next come a read-only Pages credential check, `verify prd` (the checkout-disabled assertion, then monotonic run order against what PRD and its Worker already serve), D1, CMS application, EmDash and catalog-field migrations, the renderer and a CMS Worker version tagged with the promotion run and attempt deployed to 100% without reconciling routes, the Pages gateway (renderer binding and fail-closed mode) and deployment, then `verify-worker prd` and `verify-hosted prd` (no `[UAT]` marker, same identity). Promotion carries no catalog mutation and runs no browser or provider suite. It is estimated at about 2.5 minutes, to be replaced by a measured value; run 37539133505 took 7:53 while `verify-worker` still read a lagging Durable Object (see Locks). It never changes DNS or the holding branch. The first promotion after the simplified pipeline landed must promote a SHA built by it, which the first push provides.

The job resolves UAT once, at its start, and promotes that release even if a newer push reaches UAT while it runs; dispatch again for the newer one. PRD is rebuilt, not copied: the bytes UAT served are never promoted, so UAT review covers behaviour and the identical source SHA, and the candidate's push run supplies the browser evidence.

HOST-11 is decided fail-closed. No static route HTML ships, so the Pages upload is the renderer client assets plus the gateway (`_worker.js`, `_routes.json`) and a prerendered `robots.txt`; the renderer serves `/release.json` through the gateway. Fail-closed is set once in the Cloudflare dashboard on both Pages projects (the API rejects `fail_open` in a PATCH), and every UAT deploy and PRD promotion verifies it: `scripts/configure-public-gateway.mjs` reads the production configuration back and fails the run unless `fail_open` is `false`, before `wrangler pages deploy` uploads anything. See [environment model](environment-model.md). `/assets/catalog/*` is no longer served: product images come from `/media/` URLs, the three release mockups are bundled `/_astro` assets, and the Stripe projection image URLs already point at `/media/`.

Rollback. Routine rollback is a revert commit, a push and a promotion; schema stays additive. Emergency rollback is paired: roll the renderer Worker version and the Pages deployment back to the same run together, and roll the CMS Worker back only when no migration ran between the two releases, never across a migration. The seven-day rebuild path is gone: there is no retained bundle, so any older release is rebuilt by reverting to its source and pushing.

Compare existing D1 stock, reservations and orders before and after a rollback; do not delete or reseed them. Monotonic release headers reject an older run's mutation after a newer one.

Locks. `deploy-uat` holds the non-cancelling `release-uat` group and `deploy-prd` holds `release-prd`; a newer push replaces a waiting UAT run and never cancels one that is deploying. `prd-holding-page.yml` keeps its own `blackbox-release` group, so it can never cancel a pending push or promotion. Content publication is a runtime CMS Worker operation and takes no release lock. Build and check jobs use branch concurrency groups that cancel obsolete runs. `verify` runs once per deploy job, before the first mutation, and checks monotonic run order against the release the target's site and Worker already serve; `verify-worker` and `verify-hosted` then check the deployed identity, and there is no separate observe step. Every Worker check reads the Worker's identity from its `OPTIONS /api/store/capabilities` preflight, which the Worker entry answers itself, and retries 24 times at 5 seconds, about two minutes, for the new version to reach the runner's edge. A run that still fails `verify-worker` after that wait is a real fault, not propagation. The commerce and CMS Durable Objects may still run the previous code for minutes after a deploy, so API changes stay compatible with the previous release. If the Worker succeeds and Pages fails, rerun the failed run within three days (the UAT build artifact expires then); otherwise push again. Additive schema changes remain in place; this is not atomic rollback across providers.

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

The one-time PRD catalog and CMS cutover (initial Price, CMS linkage backfill, Stripe key installation) finished on 2026-09-15; see [the completion record](cms-cutover.md). The release workflow no longer has a catalog job or confirmation input, and `stripe:catalog:verify` refuses PRD `--apply`. Do not repeat the cutover. A future live PRD catalog change needs its own reviewed one-run workflow with a false-by-default confirmation; that confirmation never enables checkout, and `PRD_LAUNCH_APPROVED=true` and `native_checkout_enabled` remain separate launch controls. Such a workflow also owns persisting `STRIPE_SECRET_KEY` into the PRD Worker, which the retired job did with `wrangler secret put`.

Keep the GitHub environments `catalog-promotion-uat` and `catalog-promotion-prd`. Each environment's `CLOUDFLARE_API_TOKEN` covers D1, Workers Scripts and Cloudflare Pages write, so one deploy job per environment deploys the Workers and then Pages; there is no separate Pages credential or job. The token is set only on the steps that use it, never on install, build or the static smoke. The manual provider smoke (`uat-smoke.yml`) uses the UAT credential. Only `promote-prd.yml` binds `catalog-promotion-prd`, and no push-triggered workflow reads a `PRD_*` secret. The repository-level `CLOUDFLARE_API_TOKEN` remains only for `prd-holding-page.yml`. Existing staff routes remain provisioned separately; routine releases do not require zone-route mutation permission. `STRIPE_SECRET_KEY` and `STRIPE_PAYMENT_METHOD_CONFIGURATION_ID` are required only for UAT provider verification and operations; disabled PRD promotion does not need Stripe credentials. `CLOUDFLARE_ACCOUNT_ID` is non-secret. Worker runtime secrets remain separate.

Release candidates and code promotion never change the live PRD catalog; the disabled frontend publishes without it.

## Migration and retry

The additive D1 migration retains existing Price mappings and adds a unique nullable Product binding. Run `pnpm catalog:bindings:migrate --env uat` for a dry run; add `--apply` after reviewing it. PRD apply also requires `--confirm-live-catalog-changes`.

Migration exports affected D1 tables and validates all selected bindings before provider writes. A trusted Price mapping supplies the Product and preserves the current amount. Missing or conflicting mappings/defaults stop the migration. Backups and provider IDs stay in ignored `.codex-artifacts/catalog-migration/` files.

Reset recovery is an exceptional operator repair from reviewed backups and provider history. It is deliberately absent from the release workflow; ordinary retries never reactivate archived objects or infer identities from Product names.

Rerun the failed **Release BlackBox** run within three days (otherwise push again), or push a fix, after correcting a reported problem. Stable Product identities and Product-scoped Price checks allow interrupted new-item creation to resume. Stripe idempotency keys are additional protection, not permanent deduplication.

The workflow summary records completed stages. Stripe, D1, Workers, and static hosts are separate systems: this is a readiness gate, not an atomic deployment. Releases are additive; the existing frontend stays until its replacement deploys.
