# Generated Catalog Artifacts

Generated catalog artifacts are the repo-owned path for projecting current Store Item content into UAT provider state. Decap is editorial-only: it does not expose commerce fields, publish targets, smoke candidate flags, retirement controls, Stripe IDs, D1 authority, or provider mutation controls.

## Maintainer Statuses

- Published content: the Astro content entry exists and can render on the static site. This does not mean checkout is enabled.
- UAT buyable: generated Desired Catalog State includes the Store Item for UAT, UAT D1 readiness has been applied through the UAT Worker runtime target, Stripe test-mode catalog verification passes, and post-merge UAT smoke evidence exists.
- PRD buyable: disabled until the explicit PRD-open gate exists. Before that gate, PRD evidence is readiness-only, disabled, or `not_configured`; it is not successful PRD Promotion Evidence.
- Promotion failed: content may still be visible, but checkout must be treated as not promoted until the Promotion Evidence failure category is fixed and rerun.

## Editorial Fields

Release and distro entries carry editorial Store Item content only:

- releases: title, artist, release date, cover image, summary, formats, embeds, credits, and optional direct merch URL.
- distro: title, group, artist or label, image, summary, eyebrow, format, release date, and order.
- generated catalog policy: every current visible Store Item generates a UAT Desired Catalog Entry by default.
- Generated Desired Price derives from format or option labels for promotion/apply mode: cassette/tape `1200 EUR`, T-shirt/tee `2000 EUR`, and other physical goods `2800 EUR`. Day-to-day UAT price checks treat one valid active Stripe Dashboard replacement Price as Price Authority.
- default Stripe Tax code for generated physical goods remains `txcd_99999999`.
- smoke selection uses the first published entry for the target environment.

## Release Checklist

1. Create or update the release entry in Decap with title, artist, release date, cover image, summary, and formats.
2. Publish the Decap entry.
3. Let catalog artifact generation refresh Desired Catalog State and readiness SQL.
4. Read Promotion Evidence before treating the release as buyable.

## Distro and Merch Checklist

1. Create or update the distro entry in Decap with title, group, artist or label, image, summary, format, release date when known, and order.
2. Publish the Decap entry.
3. Let catalog artifact generation refresh Desired Catalog State and readiness SQL.
4. Use Promotion Evidence, not the content commit alone, to confirm buyable status.

## Automation Shape

1. Decap commits editorial content or media changes.
2. `Catalog artifact regeneration` generates Desired Catalog State, Product Projection, UAT readiness SQL, and PRD readiness SQL.
3. If generated artifacts drift, the workflow commits only those artifacts as `chore(catalog): regenerate promotion artifacts`.
4. `Catalog promotion` runs from the artifact commit, not the original content-only commit.
5. UAT runs repository gates, config verification, D1 readiness, Stripe dry-run/apply/post-verify, and Worker deploy. GitHub Pages UAT validation then happens in a separate `workflow_run` smoke workflow that runs `pnpm smoke:stripe-uat -- --scenario happy_path_paid --screenshots on-failure` against the deployed site and `pnpm smoke:resend-uat` against the deployed UAT Worker.
6. PRD starts only after UAT proof for the same artifact commit on the normal `all` target. Until `PRD_OPEN_GATE=open` exists in the `catalog-promotion-prd` credential scope, the job records `not_configured` readiness evidence and skips live provider mutation.
7. PRD smoke is no longer part of catalog promotion. The `pnpm smoke:stripe-promotion -- --env prd --scenario all` script remains available for manual operator runs or a later dedicated workflow.

Pushing the repo is not the buyable-status source of truth. Promotion Evidence from the catalog promotion workflow is the source for UAT buyable status and, after the PRD-open gate exists, PRD buyable status.

## Provider Setup

The `Catalog promotion` workflow expects two GitHub Actions credential scopes. The post-merge UAT provider smoke workflow reuses `catalog-promotion-uat`; no new GitHub Actions environment is needed:

- `catalog-promotion-uat`
- `catalog-promotion-prd`

The `catalog-promotion-uat` environment already carries the UAT Cloudflare and Stripe values used by the smoke runner.

Each promotion environment needs these non-secret variables:

- `CLOUDFLARE_ACCOUNT_ID`
- `STRIPE_PAYMENT_METHOD_CONFIGURATION_ID`

Each promotion environment needs these secrets:

- `CLOUDFLARE_API_TOKEN`
- `STRIPE_SECRET_KEY`

The target Worker environment must also have the required Wrangler runtime configuration before promotion runs:

- `STRIPE_PAYMENT_METHOD_CONFIGURATION_ID`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `CHECKOUT_RETURN_ORIGINS`
- `COMMERCE_DB`

Use `pnpm runtime:config:verify --env uat` and `pnpm runtime:config:verify --env prd` as the non-mutating readiness probes. The disabled PRD probe does not require live Stripe secrets; opened PRD promotion runs use `pnpm runtime:config:verify --env prd --require-live-secrets`.

These values must be entered more than once because the stores are intentionally isolated. GitHub Actions secrets are available only to workflow jobs, Cloudflare Worker secrets are available only to the deployed Worker runtime, ignored local files are available only on one developer machine, and Stripe Dashboard/Workbench values remain inside Stripe. The repo validates names and presence, but it must not copy sensitive values between stores, print them, or commit them.

Current manual provider checklist before final proof:

1. Add `CLOUDFLARE_API_TOKEN` and `STRIPE_SECRET_KEY` to both `catalog-promotion-uat` and `catalog-promotion-prd`.
2. Add `STRIPE_PAYMENT_METHOD_CONFIGURATION_ID` to both catalog promotion environments as a variable or secret according to the account policy.
3. Add PRD Worker secrets for `STRIPE_PAYMENT_METHOD_CONFIGURATION_ID`, `STRIPE_SECRET_KEY`, and `STRIPE_WEBHOOK_SECRET` from `apps/backend` with `wrangler secret put --env prd`.
4. Re-run `pnpm runtime:config:verify --env prd` and only set `PRD_OPEN_GATE=open` when the production-readiness change approves live PRD checkout and live provider mutation.

The current PRD D1 database and Worker shell exist under the `prd` Worker runtime target. If the PRD provider resources are rebuilt from scratch, recreate `blackbox-records-commerce-prd`, update the `COMMERCE_DB` binding in `apps/backend/wrangler.jsonc`, apply D1 migrations, and deploy `blackbox-records-backend-prd` before adding Worker secrets.

## Reruns

Rerun catalog promotion from the artifact commit that contains generated Desired Catalog State, not the original content-only commit. Use the `Catalog promotion` workflow with `artifact_commit_sha` set to that commit and `target` set to `uat`, `prd`, or `all`. PRD reruns should use `all` unless UAT proof for the same artifact commit is already accepted and the rerun is a PRD-only recovery.

## Evidence Examples

- Promotion success: UAT finishes from the artifact commit and, after PRD is opened, PRD finishes from the same artifact commit; catalog verification reports no blocking drift, and smoke evidence records the promoted item.
- Content validation failure: the artifact workflow fails before provider mutation because required Store Item identity, copy, format, or image data cannot be resolved.
- Provider ambiguity failure: catalog dry-run finds multiple active provider Prices or non-app-owned provider objects for one variant, so apply does not run.
- PRD disabled: the PRD job records `not_configured` because `PRD_OPEN_GATE` is absent; this is expected before go-live and does not mutate live providers or PRD catalog read models.
- PRD smoke failure: provider apply may have succeeded after PRD was opened, but the live checkout surface proof failed; treat the item as not PRD buyable until a corrective promotion passes.
- PRD paid smoke not configured: live checkout surface proof may pass after PRD was opened, but paid smoke evidence records `not_configured`; this is expected until a live paid smoke policy is approved.

## Rollback and Retirement

Static frontend rollback is enough only for editorial rendering regressions. If checkout must stop, use the D1/operator checkout pause flow or a corrective promotion so D1 availability makes the affected Store Offer non-buyable without deleting Stripe Products, Stripe Prices, orders, stock ledger rows, or evidence.

For an immediate operational pause, run `pnpm catalog:checkout:pause -- --variant-id <variantId>` to preview the D1 availability mutation, then rerun with `--apply` for the target environment. This command updates only `ItemAvailability` to `sold_out` / `canBuy = false`; it does not delete provider catalog objects, order state, stock rows, or Promotion Evidence.

PRD reset does not exist. Sandbox reset remains a separate explicit UAT maintenance command and is not part of normal item promotion.
