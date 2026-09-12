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

## Stripe Account Cutover

Treat a Stripe account switch as one account-scoped cutover. Changing only `STRIPE_SECRET_KEY` leaves invalid Payment Method Configuration, webhook, Product, Price, D1 mapping, and acceptance-evidence state.

Complete repo work first. Then perform this manual/provider sequence from the exact pushed commit that passed all required gates:

1. Preserve the old account and historical D1 order/event rows. Do not rewrite stored Checkout Session, Payment Intent, Price, Product, or event identities; they remain historical references to the account that created them.
2. In the new Stripe test account, create/select the UAT Payment Method Configuration, persistent webhook endpoint, Products, and Prices. Reuse repo-owned lookup keys and metadata identities, not old account object IDs.
3. Rotate all account-scoped UAT configuration together:
   - UAT Worker secrets: `STRIPE_SECRET_KEY`, `STRIPE_PAYMENT_METHOD_CONFIGURATION_ID`, `STRIPE_WEBHOOK_SECRET`
   - GitHub environment `catalog-promotion-uat`: `STRIPE_SECRET_KEY` and `STRIPE_PAYMENT_METHOD_CONFIGURATION_ID`
   - ignored local `apps/backend/.dev.vars` and `apps/backend/prisma/seeds/local-stripe-test-state.sql` when local real-test checkout is required
4. Reset/reseed/reconcile the UAT catalog so every current variant receives a new-account Price mapping and Store Offer snapshot. Never carry old account `price_...` IDs into the new account.
5. Run `pnpm runtime:config:verify --env uat`, `pnpm stripe:payment-methods:verify`, `pnpm stripe:webhooks:verify --env uat`, catalog verification/apply, Worker deploy, and fresh paid UAT smoke. Existing evidence is historical and cannot prove the new account.
6. Keep PRD closed. Repeat the equivalent live-account setup and evidence only through `production-go-live-readiness`; do not copy UAT test IDs or treat UAT proof as PRD approval.

The committed mock Stripe configuration, Prisma migration history, generated UAT/PRD seed inputs, and static frontend configuration do not change solely because the Stripe account changes.

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

Signed catalog webhooks refresh only the bound item. Detail and checkout reads retrieve current provider state and repair D1 snapshots. There is no runtime catalog cron and no normal reset flow. Repo presentation updates happen during the release; stock and pauses remain in D1.

See [Catalog release](catalog-promotion.md) for the single workflow, credentials, targeted verification, migration, and retry commands. The manual provider smoke remains available after a deployment:

```sh
pnpm smoke:stripe-uat -- --scenario happy_path_paid,pay_what_you_want_paid --screenshots on-failure
```

For a changed fixed price, use the no-payment proof:

```sh
pnpm smoke:stripe-uat -- --scenario checkout_surface --expected-checkout-amount-minor <amount-minor>
```

For unexpected provider changes, inspect the Product and Price history in Stripe Workbench, including the event, request ID, and API key label. Avoid treating webhook arrival order as current state.

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
