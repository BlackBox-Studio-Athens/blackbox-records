# Catalog Promotion

Catalog Promotion is the CMS-to-provider path for making a Decap-authored release or distro item buyable.

## Maintainer Statuses

- Published content: the Astro content entry exists and can render on the static site. This does not mean checkout is enabled.
- UAT buyable: the generated Desired Catalog State targets sandbox, sandbox D1 readiness has been applied, Stripe test-mode catalog verification passes, and UAT smoke evidence exists.
- Production buyable: the same artifact commit has passed UAT proof, production D1 readiness, live Stripe catalog apply, deployment, and production checkout-surface smoke without submitting payment.
- Promotion failed: content may still be visible, but checkout must be treated as not promoted until the Promotion Evidence failure category is fixed and rerun.

## CMS Fields

Use the Commerce section on release and distro entries:

- Enable checkout: turns promotion intent on.
- Publish target: choose Draft, UAT only, or UAT plus production. Production never skips UAT.
- Price: amount in cents, currency, and optional revision for replacement Price idempotency.
- Option label: explicit sellable option text, such as `Black Vinyl LP`.
- Tax code: defaults to Stripe physical goods tax code `txcd_99999999`.
- Initial stock: first-publication online stock only. Later stock remains D1/operator-owned.
- Smoke candidate: lets workflows pick a deterministic promoted item.
- Retired from checkout: keeps the editorial page visible while making Store Offers non-buyable.

## Release Checklist

1. Create or update the release entry in Decap with title, artist, release date, cover image, summary, and formats.
2. In Commerce, turn on checkout only when the release should enter promotion.
3. Set Publish target to UAT only for test publication, or UAT plus production for live publication after UAT proof.
4. Set Price amount minor, Currency, Option label, Tax code, Initial stock when needed, and Smoke candidate when this is the item workflows should prove.
5. Publish the Decap entry and read Promotion Evidence before treating the release as buyable.

## Distro and Merch Checklist

1. Create or update the distro entry in Decap with title, group, artist or label, image, summary, Fourthwall URL history, format, and order.
2. In Commerce, turn on checkout only when the item should enter promotion.
3. Use an explicit Option label for the sellable format, such as `LP`, `Cassette`, or `Black tee`.
4. Set Price amount minor, Currency, Tax code, Initial stock when needed, and Smoke candidate when this item should be the deterministic smoke target.
5. Publish the Decap entry and use Promotion Evidence, not the content commit alone, to confirm buyable status.

## Automation Shape

1. Decap commits content or media changes.
2. `Catalog artifact regeneration` generates Desired Catalog State, Product Projection, sandbox readiness SQL, and production readiness SQL.
3. If generated artifacts drift, the workflow commits only those artifacts as `chore(catalog): regenerate promotion artifacts`.
4. `Catalog promotion` runs from the artifact commit, not the original CMS-only commit.
5. UAT runs repository gates, config verification, D1 readiness, Stripe dry-run/apply/post-verify, Worker deploy, and sandbox smoke.
6. Production runs only after UAT proof for the same artifact commit on the normal `all` target. It runs `pnpm production:catalog-readiness:check -- --phase pre-apply`, applies production readiness SQL without overwriting existing stock, then reruns D1 readiness in `post-apply` mode after catalog apply.
7. Production smoke uses `pnpm smoke:stripe-promotion -- --env production --scenario all` to create a live hosted Checkout Session, verify the pre-payment checkout surface through Stripe APIs, and record paid smoke as `not_configured` unless an explicit live paid smoke policy exists.

Pushing the repo is not the buyable-status source of truth. Promotion Evidence from the catalog promotion workflow is the source for UAT and production buyable status.

## Provider Setup

The `Catalog promotion` workflow expects two GitHub Actions environments:

- `catalog-promotion-uat`
- `catalog-promotion-production`

Each environment needs these non-secret variables:

- `CLOUDFLARE_ACCOUNT_ID`
- `STRIPE_PAYMENT_METHOD_CONFIGURATION_ID`

Each environment needs these secrets:

- `CLOUDFLARE_API_TOKEN`
- `STRIPE_SECRET_KEY`

The target Worker environment must also have the required Wrangler runtime configuration before promotion runs:

- `STRIPE_PAYMENT_METHOD_CONFIGURATION_ID`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `CHECKOUT_RETURN_ORIGINS`
- `COMMERCE_DB`

Use `pnpm runtime:config:verify --env sandbox` and `pnpm runtime:config:verify --env production` as the non-mutating readiness probes. They classify missing or unverified categories without printing secret values.

These values must be entered more than once because the stores are intentionally isolated. GitHub Actions secrets are available only to workflow jobs, Cloudflare Worker secrets are available only to the deployed Worker runtime, ignored local files are available only on one developer machine, and Stripe Dashboard/Workbench values remain inside Stripe. The repo validates names and presence, but it must not copy sensitive values between stores, print them, or commit them.

Current manual provider checklist before final proof:

1. Add `CLOUDFLARE_API_TOKEN` and `STRIPE_SECRET_KEY` to both GitHub Actions environments.
2. Add `STRIPE_PAYMENT_METHOD_CONFIGURATION_ID` to both GitHub Actions environments as a variable or secret according to the account policy.
3. Add production Worker secrets for `STRIPE_PAYMENT_METHOD_CONFIGURATION_ID`, `STRIPE_SECRET_KEY`, and `STRIPE_WEBHOOK_SECRET` from `apps/backend` with `wrangler secret put`.
4. Re-run `pnpm runtime:config:verify --env production` and only continue to production promotion when it passes.

The current production D1 database and Worker shell already exist. If the production provider resources are rebuilt from scratch, recreate `blackbox-records-commerce-production`, update the `COMMERCE_DB` binding in `apps/backend/wrangler.jsonc`, apply D1 migrations, and deploy `blackbox-records-backend` before adding Worker secrets.

## Reruns

Rerun catalog promotion from the artifact commit that contains generated Desired Catalog State, not the original CMS-only commit. Use the `Catalog promotion` workflow with `artifact_commit_sha` set to that commit and `target` set to `uat`, `production`, or `all`. Production reruns should use `all` unless UAT proof for the same artifact commit is already accepted and the rerun is a production-only recovery.

## Evidence Examples

- Promotion success: UAT and production jobs finish from the same artifact commit, catalog verification reports no blocking drift, and smoke evidence records the promoted item.
- Content validation failure: the artifact workflow fails before provider mutation because a commerce field has an invalid target, currency, amount, image URL, or missing production price.
- Provider ambiguity failure: catalog dry-run finds multiple active provider Prices or non-app-owned provider objects for one variant, so apply does not run.
- Production smoke failure: provider apply may have succeeded, but the live checkout surface proof failed; treat the item as not production buyable until a corrective promotion passes.
- Production paid smoke not configured: live checkout surface proof may pass, but paid smoke evidence records `not_configured`; this is expected until a live paid smoke policy is approved.

## Rollback and Retirement

Static frontend rollback is enough only for editorial rendering regressions. If a bad promotion makes checkout unsafe, use the Commerce retirement path or a corrective promotion so D1 availability makes the affected Store Offer non-buyable without deleting Stripe Products, Stripe Prices, orders, stock ledger rows, or evidence.

For an immediate operational pause, run `pnpm catalog:checkout:pause -- --variant-id <variantId>` to preview the D1 availability mutation, then rerun with `--apply` for the target environment. This command updates only `ItemAvailability` to `sold_out` / `canBuy = false`; it does not delete provider catalog objects, order state, stock rows, or Promotion Evidence.

Production reset does not exist. Sandbox reset remains a separate explicit UAT maintenance command and is not part of normal item promotion.
