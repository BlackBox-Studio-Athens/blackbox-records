# Phase 10 Local Full-Loop UAT Checklist

## Purpose

This checklist proves the no-account native commerce loop locally. It uses the official local `stripe-mock` API path, the Mock Checkout Panel, the BOX NOW Test Locker, signed webhook fixtures, local D1, and protected internal order readback.

This is not Stripe test-mode evidence and not BOX NOW portal evidence. It prepares repeatable local UAT while the Stripe Access Gate and BOX NOW Portal Gate remain deferred.

## Prerequisites

- Dependencies are installed with `pnpm install`.
- Go is available for the local official `stripe-mock` launcher.
- No real Stripe keys, Stripe Price IDs, BOX NOW credentials, or `apps/backend/.dev.vars` are required.
- Browser validation uses Browser Use first. If Browser Use is unavailable, record the failure reason before using DevTools MCP as fallback.

## Prepare Local State

```powershell
pnpm --filter @blackbox/backend d1:prepare:local
pnpm --filter @blackbox/backend d1:seed:stripe-mock:local
pnpm --filter @blackbox/backend d1:check:stripe-mock:local
```

Expected readiness:

- The readiness check reports every current store item ready.
- Seeded stock and Stripe Price mappings are local-only fake values.
- No committed or real Stripe values are required.

## Start The Local Stack

```powershell
pnpm dev:stack:stripe-mock
```

Expected services:

- local official `stripe-mock` proxy on `127.0.0.1:12110`
- Worker on `127.0.0.1:8787`
- static Astro site on `127.0.0.1:4321`

## Browser UAT

Open:

```text
http://127.0.0.1:4321/blackbox-records/store/disintegration-black-vinyl-lp/checkout/
```

Verify:

- payment is blocked before locker selection
- the BOX NOW Test Locker can be selected
- the payment action becomes available only after that locker selection
- the Mock Checkout Panel starts through Worker-owned `StartCheckout`
- the checkout request sends only `storeItemSlug`, `variantId`, and `shippingLocker`
- the `shippingLocker` snapshot is `locker_id = 4`, `country_code = GR`, and `locker_name_or_label = ΛΕΩΦΟΡΟΣ ΠΕΝΤΕΛΗΣ 125, 15234`
- browser console output has no checkout errors

Capture the checkout session id from the mock checkout return URL or network response.

## Simulate Paid Webhook

```powershell
$env:STRIPE_WEBHOOK_CHECKOUT_SESSION_ID = "<checkout session id>"
pnpm stripe:webhook:simulate:local checkout.session.completed
```

Expected result:

- the simulator posts to `http://127.0.0.1:8787/api/stripe/webhooks`
- the Worker returns `HTTP 200`
- the response body is `{ "received": true }`

## Read Internal Order State

```powershell
curl.exe -H "cf-access-authenticated-user-email: local-operator@example.com" "http://127.0.0.1:8787/api/internal/orders/checkout-sessions/$env:STRIPE_WEBHOOK_CHECKOUT_SESSION_ID"
```

Expected order state:

- `status` is `paid`
- `shippingLocker.locker_id` is `4`
- `shippingLocker.country_code` is `GR`
- `shippingLocker.locker_name_or_label` is `ΛΕΩΦΟΡΟΣ ΠΕΝΤΕΛΗΣ 125, 15234`

## Replay Idempotency Check

Run the same signed paid webhook fixture again:

```powershell
pnpm stripe:webhook:simulate:local checkout.session.completed
```

Then inspect local stock-change evidence:

```powershell
pnpm --filter @blackbox/backend exec wrangler d1 execute COMMERCE_DB --local --command "SELECT COUNT(*) AS checkoutPaidChanges FROM StockChange WHERE reason = 'checkout_paid' AND notes = 'Checkout session $env:STRIPE_WEBHOOK_CHECKOUT_SESSION_ID'" --json
```

Expected replay evidence:

- the replay returns `HTTP 200`
- `checkoutPaidChanges` remains `1`
- stock does not decrement a second time

## Return Recap

Open the checkout return URL for the captured session id:

```text
http://127.0.0.1:4321/blackbox-records/store/disintegration-black-vinyl-lp/checkout/return?session_id=<checkout session id>
```

Expected recap:

- the selected BOX NOW Test Locker appears from Worker-owned order state
- missing locker state, if tested with older rows, shows support-oriented needs-review copy
- payment state may still display `open` in local `stripe-mock` mode because official `stripe-mock` is stateless and does not make session retrieval reflect the signed webhook fixture

## Known Limits

- This local loop does not satisfy the Stripe Access Gate.
- This local loop does not satisfy the BOX NOW Portal Gate.
- This local loop does not prove Cloudflare sandbox Worker, remote D1, real Stripe Checkout, real Stripe webhooks, or BOX NOW partner-portal fulfillment.
- Production cutover remains out of scope.
