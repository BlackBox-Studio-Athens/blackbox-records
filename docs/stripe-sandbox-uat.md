# Stripe Sandbox UAT Guide

This guide is for label-member testing of the sandbox checkout flow on GitHub Pages.

## Test URL

Use the GitHub Pages sandbox UAT site:

https://blackbox-studio-athens.github.io/blackbox-records/

The site is static, but checkout calls the sandbox Worker:

https://blackbox-records-backend-sandbox.blackboxrecordsathens.workers.dev

## Important Rules

- This is Stripe test mode only.
- Do not enter real card details.
- No real charges are created.
- Orders, stock changes, and webhook evidence are sandbox-only.
- Report buyer-facing UI issues, confusing wording, broken flows, and anything that feels unsafe or unclear.

## Operator Webhook Readiness

Sandbox paid-order and catalog webhook evidence must use the persistent Stripe Dashboard/Workbench webhook endpoint:

```text
https://blackbox-records-backend-sandbox.blackboxrecordsathens.workers.dev/api/stripe/webhooks
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

Before accepting sandbox webhook readiness, run:

```sh
pnpm stripe:webhooks:verify --env sandbox
pnpm stripe:catalog:verify --env sandbox
```

If the endpoint is newly created, recreated, or its signing secret is rotated, update the sandbox Worker from `apps/backend`:

```sh
pnpm exec wrangler secret put STRIPE_WEBHOOK_SECRET --env sandbox
```

Do not paste the signing secret into docs, chat, screenshots, evidence files, Astro public env vars, or committed files. For an existing endpoint, reveal/copy the signing secret from Stripe Dashboard/Workbench and put it directly into Wrangler. Stripe endpoint list/retrieve APIs do not return an existing endpoint secret, so `pnpm stripe:webhooks:verify --env sandbox` separates endpoint configuration proof from signing-secret match proof.

Catalog correctness is layered: persistent webhooks provide near-real-time sync, Store Offer reads reconcile stale snapshots, checkout start revalidates the active Stripe Price, scheduled sandbox catalog verification runs every six hours, and `pnpm stripe:catalog:verify --env sandbox` remains the operator proof for current catalog alignment.

Catalog Field Ownership keeps sandbox alignment explicit:

- Product Projection is repo-owned and may update Stripe Product name, description, image URLs, and metadata only through a reviewed sandbox apply.
- Price Authority is Stripe-owned. Change prices by creating a replacement Stripe Price, moving lookup key/metadata to that Price, archiving the stale Price, and rerunning catalog verification.
- Stripe Dashboard edits to Product presentation are drift unless repo content/projection is updated first.
- `pnpm stripe:catalog:verify --env sandbox --apply` is sandbox-only and should follow a reviewed dry-run plan.
- Full-catalog sandbox reset is a deactivation flow, not hard deletion. It only targets Stripe test-mode objects identified by BlackBox sandbox metadata or lookup keys.

## Full Catalog UAT Alignment

The sandbox UAT catalog is generated from current Astro Store Item content. The placeholder `___.json` distro file remains excluded by the projection loader until it becomes an explicit content decision.

Sandbox test Price defaults:

- Cassette/tape: `1200 EUR`
- T-shirt/tee: `2000 EUR`
- Vinyl, LP, releases, and unknown physical goods: `2800 EUR`

Sandbox stock defaults:

- `afterglow-tape`: `quantity = 1`, `onlineQuantity = 1`
- every other current Store Item: `quantity = 99`, `onlineQuantity = 99`

Static pages may show items as available with `Worker-confirmed at checkout`. They must not expose Stripe Price IDs, D1 IDs, stock authority, secrets, or authoritative prices.

Operator sequence for a full sandbox catalog reset:

```powershell
pnpm stripe:webhooks:verify --env sandbox
pnpm stripe:catalog:verify --env sandbox
pnpm stripe:catalog:reset-sandbox --env sandbox --dry-run
pnpm stripe:catalog:reset-sandbox --env sandbox --confirm
pnpm --filter @blackbox/backend d1:seed:sandbox:uat-catalog
pnpm stripe:catalog:verify --env sandbox --apply
pnpm stripe:catalog:verify --env sandbox
pnpm deploy:backend:sandbox
```

GitHub Pages UAT smoke:

```powershell
pnpm smoke:stripe-sandbox -- --site-url https://blackbox-studio-athens.github.io/blackbox-records/ --scenario checkout_surface
pnpm smoke:stripe-sandbox -- --site-url https://blackbox-studio-athens.github.io/blackbox-records/ --scenario happy_path_paid
```

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
