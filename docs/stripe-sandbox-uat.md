# Stripe Sandbox UAT Guide

This guide is for label-member testing of UAT checkout on GitHub Pages. `sandbox` means Stripe test-mode provider behavior here, not a Cloudflare or Wrangler Product Environment.

## Test URL

Use the GitHub Pages UAT site:

https://blackbox-studio-athens.github.io/blackbox-records/

The site is static, but checkout calls the UAT Worker/API. That Worker is deployed through the Wrangler `uat` runtime target:

https://blackbox-records-backend-uat.blackboxrecordsathens.workers.dev

## Important Rules

- This is Stripe test mode only.
- Do not enter real card details.
- No real charges are created.
- Orders, stock changes, and webhook evidence are UAT-only and backed by UAT D1 plus Stripe test mode.
- Report buyer-facing UI issues, confusing wording, broken flows, and anything that feels unsafe or unclear.

## Operator Webhook Readiness

UAT paid-order and catalog webhook evidence must use the persistent Stripe Dashboard/Workbench test-mode webhook endpoint:

```text
https://blackbox-records-backend-uat.blackboxrecordsathens.workers.dev/api/stripe/webhooks
```

The endpoint must be a Stripe test-mode account endpoint and include these catalog events:

```text
product.created
product.updated
product.deleted
price.created
price.updated
price.deleted
```

Before accepting UAT webhook readiness, run:

```sh
pnpm stripe:webhooks:verify --env uat
pnpm stripe:catalog:verify --env uat
```

If the endpoint is newly created, recreated, or its signing secret is rotated, update the UAT Worker from `apps/backend`:

```sh
pnpm exec wrangler secret put STRIPE_WEBHOOK_SECRET --env uat
```

Do not paste the signing secret into docs, chat, screenshots, evidence files, Astro public env vars, or committed files. For an existing endpoint, reveal/copy the signing secret from Stripe Dashboard/Workbench and put it directly into Wrangler. Stripe endpoint list/retrieve APIs do not return an existing endpoint secret, so `pnpm stripe:webhooks:verify --env uat` separates endpoint configuration proof from signing-secret match proof.

Catalog correctness is layered: persistent webhooks provide near-real-time sync, Store Offer reads reconcile stale snapshots, checkout start revalidates the active Stripe Price, scheduled UAT catalog verification reports drift every six hours without mutating Stripe, and `pnpm stripe:catalog:verify --env uat --apply` remains the explicit Product Environment command for current UAT catalog alignment. PRD uses the same current-state read path, but catalog mutations stay disabled until `PRD_OPEN_GATE=open`.

UAT is also the first leg of the generated catalog artifact pipeline described in [`docs/catalog-promotion.md`](catalog-promotion.md). Normal content publication should use the generated artifact commit and promotion workflow instead of treating sandbox apply as a detached manual checklist.

Catalog Field Ownership keeps UAT alignment explicit:

- Product Projection is repo-owned and may update Stripe Product name, description, image URLs, and metadata only through a reviewed UAT apply. UAT Product image URLs use the GitHub Pages UAT asset base.
- Price Authority is Stripe-owned. Change prices by creating a replacement Stripe Price, moving lookup key or app metadata to that Price, archiving the stale Price, and rerunning catalog verification.
- Stripe Dashboard edits to Product presentation are drift unless repo content/projection is updated first.
- `pnpm stripe:catalog:verify --env uat` is day-to-day current-state verification; it accepts one valid active Stripe replacement Price as authority even when generated Desired Price still has the old amount.
- `pnpm stripe:catalog:verify --env uat --apply` is UAT-only promotion/apply mode and should follow a reviewed dry-run plan. In this mode generated Desired Price is enforced again.
- Full-catalog sandbox reset is a deactivation flow, not hard deletion. It only targets Stripe test-mode objects identified by BlackBox sandbox metadata, lookup keys, or documented catalog-derived legacy sandbox names.

## Dashboard Price Change Runbook

Use this when a colleague needs to change a buyable UAT Store Item price without a repo, Decap, or static deploy change.

1. In Stripe Dashboard test mode, open the Product for the Store Item variant.
2. Add a replacement Price with the intended amount and `EUR` currency.
3. Preserve either the deterministic lookup key or complete app identity metadata on the new Price.
4. Archive or deactivate the stale active Price so only one active Price identifies the variant.
5. Run `pnpm stripe:webhooks:verify --env uat`.
6. Run `pnpm stripe:catalog:verify --env uat`.
   The current UAT catalog has unrelated legacy identity and Product Projection drift, so the global command may exit nonzero. For this exercise, require the target variant to have no Price Authority, D1 readiness, or Store Offer snapshot issue. Do not use `--apply`.
7. Read `/api/store/items/<storeItemSlug>` on the UAT Worker and confirm the browser-safe price/readiness.
8. Run the non-payment Checkout surface smoke with the temporary amount in minor units and confirm hosted Checkout displays the new amount before payment submission:

   ```sh
   pnpm smoke:stripe-uat -- --scenario checkout_surface --expected-checkout-amount-minor <amount-minor>
   ```

   When local Cloudflare credentials are unavailable, dispatch the credentialed GitHub Actions proof instead:

   ```sh
   gh workflow run uat-smoke.yml --ref main -f expected_checkout_amount_minor=<amount-minor>
   ```

   The override changes only the smoke assertion for the Stripe Checkout Session. The browser cart snapshot and generated Desired Price remain stale on purpose, proving checkout uses the current Worker-owned Store Offer and Stripe Price.

Required app identity metadata:

- `appEnv`: `uat`
- `sourceId`: repo source ID
- `sourceKind`: `release` or `distro`
- `storeItemSlug`: public Store Item slug
- `variantId`: canonical variant ID

Decap remains editorial-only. Editors can change item information and page copy, but must not edit checkout price, Stripe IDs, D1 IDs, stock, provider mutation controls, or any runtime secret.

Stripe has no Product-catalog-only built-in team role. Use Support Specialist only as the least-broad built-in candidate, and assign it only to the isolated UAT Stripe Sandbox. It still grants broader refund, customer, dispute, and connected-account permissions. Do not assign it on the live parent account, and do not substitute Developer or Administrator access. Require two-step authentication. Before handoff, use the colleague's actual sandbox login to prove replacement-Price creation, required metadata entry, stale-Price archival, and absence of live-account access. See Stripe's [team role permissions](https://docs.stripe.com/get-started/account/teams/roles) and [sandbox-specific access](https://docs.stripe.com/sandboxes/dashboard/manage-access).

If Dashboard permissions do not allow lookup-key transfer, give the replacement Price all five app identity metadata fields. When current-state reconciliation finds exactly one active metadata-identified Price with no lookup key, it atomically transfers the canonical lookup key to that Price. A different non-empty lookup key remains a fail-closed identity conflict; do not overwrite it manually.

Troubleshooting:

- Missing metadata or lookup key: add `storeItemSlug` and `variantId` identity to the active replacement Price, then rerun catalog verification.
- Multiple active Prices: archive or deactivate stale matching Prices until only one active Price identifies the variant.
- Wrong currency: create a replacement `EUR` Price and archive the wrong-currency active Price.
- Webhook signature failure: rotate the Stripe endpoint signing secret into the UAT Worker with `wrangler secret put STRIPE_WEBHOOK_SECRET --env uat`.
- Stale Store Offer snapshot: run `pnpm stripe:catalog:verify --env uat`; checkout start still revalidates current Stripe state before creating a hosted session.
- PRD disabled: UAT proof is not PRD acceptance. PRD catalog webhooks are readiness-only, public Store Offer/checkout catalog reconciliation is no-mutation, and `pnpm stripe:catalog:verify --env prd --apply` is blocked until `PRD_OPEN_GATE=open`.

## Catalog Mutation Forensics

Use this when Stripe test-mode Products or Prices are unexpectedly created, reactivated, archived, or moved to a different lookup key. This is separate from Dashboard price replacement and webhook propagation; that active change lives in [`openspec/changes/stripe-dashboard-price-webhook-propagation/`](../openspec/changes/stripe-dashboard-price-webhook-propagation/).

Start with a local report:

```sh
pnpm stripe:catalog:verify --env uat
```

The report includes Product Environment, Store Item identity, lookup key, planned action kind, idempotency key, request shape, request ID when Stripe exposes it, replay status when Stripe exposes it, drift classification, and redacted Stripe object IDs. It must not print Stripe secrets, webhook signatures, raw provider payloads, card data, shopper PII, or full `prod_...`, `price_...`, `evt_...`, or `we_...` IDs.

In Stripe Workbench or Dashboard Events, start with these filters around the suspected timestamp:

```text
POST /v1/products
POST /v1/prices
product.created
price.created
product.*
price.*
```

Capture these fields before cleanup:

- timestamp and event type
- redacted Product or Price ID
- lookup key and metadata identity (`appEnv`, `sourceId`, `sourceKind`, `storeItemSlug`, `variantId`)
- `api_version`
- `request.id`
- `request.idempotency_key`
- API key label when visible
- source, endpoint, method, IP when visible, and status

Stripe Events API full-payload access is limited to 30 days. Keep older operator evidence as ignored local exports under `.codex-artifacts/` or another ignored evidence path, redacted before sharing. Stripe Search may help with diagnostics, drift discovery, duplicate scans, or backfill; it does not replace current-state checkout reconciliation by lookup key, metadata, and D1 mapping.

Product IDs remain Stripe-generated for existing catalog objects. Do not switch to deterministic Product IDs unless a future full recreate/import explicitly approves it and covers collision behavior.

Stripe idempotency keys are retry protection for mutating `POST` requests, not long-term audit storage, actor attribution, or an independent-run lock. Catalog tooling keeps Stripe SDK retry behavior at the default client setting and relies on verify dry-runs, run identity, and operator review for independent apply runs.

Cleanup order:

1. Run `pnpm stripe:catalog:verify --env uat` and review the dry-run report.
2. Capture the Workbench/Event fields above before mutating anything.
3. Classify ownership and environment. Cleanup may target only confirmed BlackBox-owned UAT test-mode objects.
4. Refuse unclassified objects and foreign-environment objects.
5. Run the explicit cleanup/apply command only after dry-run review.
6. Rerun `pnpm stripe:catalog:verify --env uat` and confirm current active catalog state.

## Full Catalog UAT Alignment

The UAT catalog is generated from current Astro Store Item content. The placeholder `___.json` distro file remains excluded by the projection loader until it becomes an explicit content decision.

Sandbox test Price defaults:

- Cassette/tape: `1200 EUR`
- T-shirt/tee: `2000 EUR`
- Vinyl, LP, releases, and unknown physical goods: `2800 EUR`

Sandbox stock defaults:

- `afterglow-tape`: `quantity = 1`, `onlineQuantity = 1`
- every other current Store Item: `quantity = 99`, `onlineQuantity = 99`

Sandbox Product category / Stripe Tax default:

- every current physical Store Item uses `General - Tangible Goods` / `txcd_99999999`
- `General - Electronically Supplied Services` / `txcd_10000000` is not the default for shipped vinyl, cassettes, CDs, shirts, or similar merch

Static pages may show items as available with `Worker-confirmed at checkout`. They must not expose Stripe Price IDs, D1 IDs, stock authority, secrets, or authoritative prices.

Operator sequence for a full UAT catalog reset:

```powershell
git status --short
git push origin main
pnpm stripe:webhooks:verify --env uat
pnpm stripe:catalog:verify --env uat
pnpm stripe:catalog:reset-uat --env uat --dry-run
pnpm stripe:catalog:reset-uat --env uat --confirm
pnpm --filter @blackbox/backend d1:seed:uat:catalog
pnpm stripe:catalog:verify --env uat --apply
pnpm stripe:catalog:verify --env uat
pnpm deploy:backend:uat
```

Provider execution notes:

- Repo-complete is not provider-complete. A pushed commit does not mutate Stripe Products, Stripe Prices, D1 stock, D1 mappings, or Store Offer snapshots.
- Start from a clean final tree that already passed `pnpm test:unit`, `pnpm check`, `pnpm build`, and OpenSpec validation. `git status --short` should print nothing before provider mutation begins.
- Run the provider sequence from the final pushed commit. If reset/apply/smoke work requires a code or script fix, rerun `pnpm test:unit`, `pnpm check`, and `pnpm build`, push the fix, redeploy the UAT Worker, and rerun catalog verification.
- Reset cleanup must cover current ownership metadata and documented legacy sandbox names such as `BlackBox UAT - ...`. Keep that fallback until there are no legacy sandbox catalog objects left.
- `pnpm stripe:catalog:verify --env uat` and `pnpm stripe:catalog:verify --env uat --apply` are intentionally throttled. If Stripe returns a rate-limit error after reset or apply work, wait for a short cooldown and rerun verification instead of trusting Dashboard row counts.
- Stripe Dashboard product counts are diagnostic only. Acceptance proof is the CLI report showing every expected variant checked with zero Product Projection, Price Authority, D1 readiness, and Store Offer snapshot issues, plus UAT smoke evidence.
- `pnpm stripe:webhooks:verify --env uat` proves endpoint shape, mode, status, and event coverage. Existing endpoint signing-secret match is proven by `happy_path_paid` reaching a paid Worker order, not by Stripe endpoint list/retrieve APIs.
- Keep `afterglow-tape` reserved for low-stock behavior. Generic happy-path smoke should use a high-stock item so repeated proof runs do not consume the low-stock test case.

GitHub Pages UAT smoke:

```powershell
pnpm smoke:stripe-uat -- --site-url https://blackbox-studio-athens.github.io/blackbox-records/ --scenario checkout_surface
pnpm smoke:stripe-uat -- --site-url https://blackbox-studio-athens.github.io/blackbox-records/ --scenario happy_path_paid
```

Run the Resend UAT smoke after the UAT Worker has `RESEND_API_KEY` and `RESEND_NEWSLETTER_TOPIC_ID` configured:

```sh
pnpm smoke:resend-uat
```

This posts one synthetic consented signup through the public Worker route and expects Resend-backed UAT sink routing to accept it. Evidence is written under `.codex-artifacts/smoke/uat/resend-uat/` and must stay ignored/redacted.

Evidence must stay ignored/redacted. Do not commit or paste Stripe secrets, webhook secrets, full `price_...`, `prod_...`, `we_...` IDs, customer payment details, or raw provider payloads.

## What To Test

Start from the store, open an item, add it to the cart, and continue to checkout.

Use any realistic Greek shipping address and phone number in Stripe Checkout. The address is only sandbox test data.

Expected UAT checkout items: every current visible Astro Store Item should reach hosted Stripe Checkout after the full catalog reset/seed/apply sequence.

Sample across formats before acceptance: one vinyl item, `afterglow-tape` for low-stock behavior, `rehearsal-room-tee` for the T-shirt price, and one release item. Sandbox UAT stock starts high for every item except `afterglow-tape`, so multiple testers can complete checkouts. Successful sandbox payments still decrement sandbox stock, just like the production flow will.

### Successful Payment

- Card number: `4242 4242 4242 4242`
- Expiry: any future date
- CVC: any three digits
- Expected result: payment completes and returns to the site.

### 3DS Payment

- Card number: `4000 0027 6000 3184`
- Expiry: any future date
- CVC: any three digits
- Expected result: Stripe shows a test 3DS challenge, then payment completes and returns to the site.

### Declined Payment

- Card number: `4000 0000 0000 0002`
- Expiry: any future date
- CVC: any three digits
- Expected result: Stripe shows a decline message and no paid order is created.

### Insufficient Funds

- Card number: `4000 0000 0000 9995`
- Expiry: any future date
- CVC: any three digits
- Expected result: Stripe shows an insufficient-funds decline and no paid order is created.

### Expired Card

- Card number: `4000 0000 0000 0069`
- Expiry: any future date
- CVC: any three digits
- Expected result: Stripe shows an expired-card decline and no paid order is created.

### Incorrect CVC

- Card number: `4000 0000 0000 0127`
- Expiry: any future date
- CVC: any three digits
- Expected result: Stripe shows an incorrect-CVC decline and no paid order is created.

## Feedback To Send

Send the page or checkout step where the issue happened, what you expected, what happened instead, and whether you were on desktop or mobile.

Good feedback topics:

- confusing checkout wording
- unclear shipping/payment expectations
- missing product/order information
- mobile layout issues
- Stripe return-page issues
- any moment that feels less trustworthy than a normal online checkout

Do not send real payment details, private customer data, Stripe secret keys, webhook secrets, or screenshots containing sensitive information.
