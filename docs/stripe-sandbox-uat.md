# Stripe Sandbox UAT Guide

This guide is for label-member testing of UAT checkout on Cloudflare Pages. `sandbox` means Stripe test-mode provider behavior here, not a Cloudflare or Wrangler Product Environment.

## Test URL

Use the Cloudflare Pages UAT site:

https://blackbox-records-web-uat.pages.dev/

The site is static, but checkout calls the UAT Worker/API. That Worker is deployed through the Wrangler `uat` runtime target:

https://blackbox-records-backend-uat.blackboxrecordsathens.workers.dev

## Important Rules

- This is Stripe test mode only.
- Do not enter real card details.
- No real charges are created.
- Orders, stock changes, and webhook evidence are UAT-only and backed by UAT D1 plus Stripe test mode.
- Report buyer-facing UI issues, confusing wording, broken flows, and anything that feels unsafe or unclear.

## Stripe Account Cutover

Treat a Stripe account switch as one account-scoped cutover. Changing only `STRIPE_SECRET_KEY` leaves invalid Payment Method Configuration, webhook, Product, Price, D1 mapping, and acceptance-evidence state.

Use the reviewed `migrate-stripe-to-blackboxrecords` change and the [manifest command and recovery procedure](catalog-promotion.md#stripe-account-migration). Its pinned UAT destination is the dedicated BlackBoxRecords sandbox. Complete repository checks first; provider acceptance names the deployed SHA separately.

1. Export source obligations, commerce/CMS baseline and rollback credential references privately. Preserve old account resources and historical order/event identities. Check current Free-tier headroom before hosted reads, media checks or writes.
2. Run the default manifest plan, review all catalog rows and explicit CMS source inventory, then stage/resume destination Products/default Prices using `--mode apply --prepare-only` and the reviewed hash. Runtime D1 presentation supplies `/media/` URLs; source defaults supply amounts and bounds. Withheld, paused, sold-out and CMS-created items remain covered. Uninitialized items and CMS sources without catalog identities gain no invented prices or publication.
3. Coordinate a freeze with `release-uat`, the separate `uat-provider-smoke` group, Content/Items writers and scheduled activity. Close checkout; drain source Sessions, holds, pending payments, CatalogOperation leases and payable retries. Record legitimate drain/delivery or retention changes separately; refresh and review a final manifest in a new file if its baseline changed. Matching staged objects are recovered by permanent identities after idempotency expiry.
4. Configure the dedicated UAT PMC and stage the target webhook: create, capture its signing secret, update `disabled=true`, and verify disabled status. Disable an existing source endpoint only after drain. Keep target payment/catalog activity stopped during staging.
5. Rotate all account-scoped UAT configuration together:
   - UAT Worker secrets: `STRIPE_SECRET_KEY`, `STRIPE_PAYMENT_METHOD_CONFIGURATION_ID`, `STRIPE_WEBHOOK_SECRET`
   - GitHub environment `catalog-promotion-uat`: key secret and PMC variable
6. Apply the final reviewed manifest. Each mapping/offer pair switches atomically with source preconditions; every manifest row and protected commerce/CMS field is checked. Do not reset or reseed D1. Keep the freeze and checkout closed on any failure.
7. Before the first destination payment, rehearse inverse restore and reapply with the same private journal. Restore matching Worker/GitHub configuration separately. Enable the target endpoint after configuration and bindings agree, then prove a signed catalog event and replay without duplicate effects.
8. Run `pnpm runtime:config:verify --env uat`, `pnpm stripe:payment-methods:verify`, `pnpm stripe:webhooks:verify --env uat`, `pnpm stripe:catalog:verify --env uat`, and the separately authorized manual provider smoke below. Check current test stock and approved recipients first. Prior evidence is historical after an account/configuration/code change.
9. Keep PRD closed. Its equivalent live writes require its own reviewed hash and `--confirm-live-catalog-changes` on every command; provider and launch acceptance remain with their existing owners.

Custom-price Store Offer snapshots keep `amountMinor=null`; the preset belongs to the provider Price policy. A target state written by the former migration conversion with the preset in that snapshot fails the corrected command's exact current-row guards for both apply and restore. Keep checkout closed and review an explicit guarded repair of the affected rows before using the corrected command; do not weaken the manifest guards or rerun the former conversion.

The committed mock Stripe configuration, Prisma migration history, generated UAT/PRD seed inputs, and static frontend configuration do not change solely because the Stripe account changes.

Local mock stays independent. `pnpm dev:stack:uat-connected` follows the deployed UAT Worker without copying hosted credentials. Advanced Local real-test checkout remains a separate setup; do not rotate normal mock `.dev.vars` or reseed Local for this migration. Keep `backfill-runtime-catalog.ts`, `catalog:bindings:migrate` and `stripe:catalog:verify --plan-apply` out of account rebinding: their repository recovery inputs include retired `/assets/catalog/` URLs.

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

## Price changes and release

The Product's default Price selects the selling amount. Add an EUR Price with inclusive VAT under the existing Product and choose **Set as default price**. Older active Prices are harmless; do not move lookup keys or edit identity metadata.

Signed catalog webhooks refresh only the bound item. Detail and checkout reads retrieve current provider state and repair D1 snapshots. The presentation verifier reads current D1 projections; stock and pauses remain in D1. Software release moves code without applying a repository catalog. There is no normal catalog reset flow.

See [Catalog release](catalog-promotion.md) for the single workflow, credentials, targeted verification, migration, and retry commands. The provider smoke is manual only: the **UAT provider smoke** workflow (`uat-smoke.yml`), or the commands below. It is never a release gate and does not run on a push or promotion. The paid scenarios need at least 2 online stock of the smoke item in UAT D1, and they spend that stock, so check it first:

```sh
pnpm smoke:stripe-uat -- --scenario happy_path_paid,pay_what_you_want_paid --screenshots on-failure
```

The runner reads the published UAT D1 Product Projections for the canonical Disintegration and Atopia fixtures before creating Checkout expectations. Repository fixture contracts still supply the independent expected prices; repository names/images and observed Stripe Products do not supply expected presentation. Missing, duplicate, unpublished or incomplete runtime fixture rows stop the run. Also check Atopia has at least one buyable copy: the paid pair consumes one copy of each fixture.

For a changed fixed price, use the no-payment proof:

```sh
pnpm smoke:stripe-uat -- --scenario checkout_surface --expected-checkout-amount-minor <amount-minor>
```

For unexpected provider changes, inspect the Product and Price history in Stripe Workbench, including the event, request ID, and API key label. Avoid treating webhook arrival order as current state.

## What To Test

Start from the store, open an item, add it to the cart, and continue to checkout.

Use any realistic Greek shipping address and phone number in Stripe Checkout. The address is only sandbox test data.

Expected UAT checkout items: published, configured and unpaused items with available online stock should reach hosted Stripe Checkout after the reviewed manifest switch and readiness checks. Withheld, paused, sold-out and uninitialized rows keep their existing eligibility.

Sample across formats before acceptance: one vinyl item, `afterglow-tape` for low-stock behavior, `rehearsal-room-tee` for the T-shirt price, and one release item. Inspect current UAT stock rather than assuming seeded quantities. Successful sandbox payments decrement that stock, just like the production flow will.

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
