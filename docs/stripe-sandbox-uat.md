# Stripe Sandbox UAT Guide

This guide is for label-member testing of UAT checkout on GitHub Pages. `sandbox` is the mapped Worker runtime target and Stripe test-mode provider layer, not a separate Product Environment.

## Test URL

Use the GitHub Pages UAT site:

https://blackbox-studio-athens.github.io/blackbox-records/

The site is static, but checkout calls the UAT Worker/API. That Worker is deployed through the Wrangler `sandbox` runtime target:

https://blackbox-records-backend-sandbox.blackboxrecordsathens.workers.dev

## Important Rules

- This is Stripe test mode only.
- Do not enter real card details.
- No real charges are created.
- Orders, stock changes, and webhook evidence are UAT-only and backed by sandbox D1 plus Stripe test mode.
- Report buyer-facing UI issues, confusing wording, broken flows, and anything that feels unsafe or unclear.

## Operator Webhook Readiness

UAT paid-order and catalog webhook evidence must use the persistent Stripe Dashboard/Workbench test-mode webhook endpoint:

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

Before accepting UAT webhook readiness, run:

```sh
pnpm stripe:webhooks:verify --env sandbox
pnpm stripe:catalog:verify --env sandbox
```

If the endpoint is newly created, recreated, or its signing secret is rotated, update the UAT Worker from `apps/backend`:

```sh
pnpm exec wrangler secret put STRIPE_WEBHOOK_SECRET --env sandbox
```

Do not paste the signing secret into docs, chat, screenshots, evidence files, Astro public env vars, or committed files. For an existing endpoint, reveal/copy the signing secret from Stripe Dashboard/Workbench and put it directly into Wrangler. Stripe endpoint list/retrieve APIs do not return an existing endpoint secret, so `pnpm stripe:webhooks:verify --env sandbox` separates endpoint configuration proof from signing-secret match proof.

Catalog correctness is layered: persistent webhooks provide near-real-time sync, Store Offer reads reconcile stale snapshots, checkout start revalidates the active Stripe Price, scheduled UAT catalog verification runs every six hours, and `pnpm stripe:catalog:verify --env sandbox` remains the Worker-target command for current UAT catalog alignment.

UAT is also the first leg of the generated catalog artifact pipeline described in [`docs/catalog-promotion.md`](catalog-promotion.md). Normal content publication should use the generated artifact commit and promotion workflow instead of treating sandbox apply as a detached manual checklist.

Catalog Field Ownership keeps UAT alignment explicit:

- Product Projection is repo-owned and may update Stripe Product name, description, image URLs, and metadata only through a reviewed UAT apply. UAT Product image URLs use the GitHub Pages UAT asset base.
- Price Authority is Stripe-owned. Change prices by creating a replacement Stripe Price, moving lookup key/metadata to that Price, archiving the stale Price, and rerunning catalog verification.
- Stripe Dashboard edits to Product presentation are drift unless repo content/projection is updated first.
- `pnpm stripe:catalog:verify --env sandbox --apply` is UAT-only and should follow a reviewed dry-run plan.
- Full-catalog sandbox reset is a deactivation flow, not hard deletion. It only targets Stripe test-mode objects identified by BlackBox sandbox metadata, lookup keys, or documented catalog-derived legacy sandbox names.

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
pnpm stripe:webhooks:verify --env sandbox
pnpm stripe:catalog:verify --env sandbox
pnpm stripe:catalog:reset-sandbox --env sandbox --dry-run
pnpm stripe:catalog:reset-sandbox --env sandbox --confirm
pnpm --filter @blackbox/backend d1:seed:sandbox:uat-catalog
pnpm stripe:catalog:verify --env sandbox --apply
pnpm stripe:catalog:verify --env sandbox
pnpm deploy:backend:sandbox
```

Provider execution notes:

- Repo-complete is not provider-complete. A pushed commit does not mutate Stripe Products, Stripe Prices, D1 stock, D1 mappings, or Store Offer snapshots.
- Start from a clean final tree that already passed `pnpm test:unit`, `pnpm check`, `pnpm build`, and OpenSpec validation. `git status --short` should print nothing before provider mutation begins.
- Run the provider sequence from the final pushed commit. If reset/apply/smoke work requires a code or script fix, rerun `pnpm test:unit`, `pnpm check`, and `pnpm build`, push the fix, redeploy the sandbox Worker, and rerun catalog verification.
- Reset cleanup must cover current ownership metadata and documented legacy sandbox names such as `BlackBox UAT - ...`. Keep that fallback until there are no legacy sandbox catalog objects left.
- `pnpm stripe:catalog:verify --env sandbox` and `pnpm stripe:catalog:verify --env sandbox --apply` are intentionally throttled. If Stripe returns a rate-limit error after reset or apply work, wait for a short cooldown and rerun verification instead of trusting Dashboard row counts.
- Stripe Dashboard product counts are diagnostic only. Acceptance proof is the CLI report showing every expected variant checked with zero Product Projection, Price Authority, D1 readiness, and Store Offer snapshot issues, plus UAT smoke evidence.
- `pnpm stripe:webhooks:verify --env sandbox` proves endpoint shape, mode, status, and event coverage. Existing endpoint signing-secret match is proven by `happy_path_paid` reaching a paid Worker order, not by Stripe endpoint list/retrieve APIs.
- Keep `afterglow-tape` reserved for low-stock behavior. Generic happy-path smoke should use a high-stock item so repeated proof runs do not consume the low-stock test case.

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
