# Phase 9 Manual BOX NOW Fulfillment Handoff

## Status

This handoff is ready for local contract validation, but real sandbox fulfillment is blocked until BlackBox Records has BOX NOW partner or sandbox portal access.

Do not mark `SHIP-03` or `09-06` complete until an operator can use the BOX NOW portal to fulfill a sandbox-paid Greek order and the result is recorded in `09-VALIDATION.md`.

## Source Of Truth

Use Worker-owned order state as the operational source of truth.

- The order must be `paid` before any BOX NOW shipment is created.
- The selected locker must come from the persisted `shippingLocker` snapshot on `CheckoutOrder`.
- The locker snapshot may contain only `locker_id`, `country_code`, and `locker_name_or_label`.
- `country_code` must be `GR`.
- Missing locker data means the order needs review; do not create a BOX NOW shipment from browser state, notes, screenshots, or query parameters.

The local/mock BOX NOW test locker is:

```text
locker_id: 4
country_code: GR
locker_name_or_label: ΛΕΩΦΟΡΟΣ ΠΕΝΤΕΛΗΣ 125, 15234
```

## Manual Fulfillment Steps

1. Open the protected internal order readback for recent paid orders or the specific checkout session.
2. Confirm the order status is `paid`.
3. Confirm the order has a `shippingLocker` snapshot and `shippingLocker.country_code` is `GR`.
4. Confirm the locker id and label match the shopper-facing return recap if investigating a support case.
5. Open the BOX NOW partner portal using out-of-band operator credentials.
6. Create the shipment manually using the paid order, the selected locker id, and the recipient/contact data available through the approved payment or operations tooling.
7. Keep any BOX NOW voucher, label, or tracking output out of the repo and out of D1 until a later milestone explicitly adds fulfillment persistence.
8. If the portal rejects the locker, recipient, parcel, or shipment request, leave the order in operator review and record the failure in the Phase 10 review package.

## Data Boundaries

Allowed for v1 order state:

- `locker_id`
- `country_code`
- `locker_name_or_label`

Forbidden in v1 order state and frontend public config:

- raw BOX NOW widget or API payloads
- full locker addresses beyond the approved label snapshot
- coordinates, postal codes, parcel dimensions, voucher ids, label URLs, tracking automation state, or partner-portal credentials
- BOX NOW credentials in Astro `PUBLIC_*` env, Cloudflare Pages variables, generated frontend clients, committed seed files, or static content

## Local Contract Validation Path

This path proves the local checkout/order/shipping handoff shape without Stripe account access or BOX NOW portal access. It is not real payment or BOX NOW fulfillment evidence.

Prepare local mock state:

```powershell
pnpm --filter @blackbox/backend d1:prepare:local
pnpm --filter @blackbox/backend d1:seed:stripe-mock:local
pnpm --filter @blackbox/backend d1:check:stripe-mock:local
pnpm dev:stack:stripe-mock
```

Browser validation must use Browser Use first:

1. Open `/blackbox-records/store/disintegration-black-vinyl-lp/checkout/`.
2. Confirm payment is blocked before locker selection.
3. Select the local BOX NOW test locker.
4. Continue to payment and create the mock checkout.
5. Capture the returned checkout session id from the return URL or network response.

Post a signed local paid webhook fixture for that checkout session:

```powershell
$env:STRIPE_WEBHOOK_CHECKOUT_SESSION_ID = "<checkout session id>"
pnpm stripe:webhook:simulate:local checkout.session.completed
```

Read back the paid order through the internal route:

```powershell
curl.exe -H "cf-access-authenticated-user-email: local-operator@example.com" "http://127.0.0.1:8787/api/internal/orders/checkout-sessions/$env:LOCAL_CHECKOUT_SESSION_ID"
```

Expected local evidence:

- order status is `paid`
- `shippingLocker.locker_id` is `4`
- `shippingLocker.country_code` is `GR`
- `shippingLocker.locker_name_or_label` is `ΛΕΩΦΟΡΟΣ ΠΕΝΤΕΛΗΣ 125, 15234`
- return recap shows the same persisted locker snapshot
- repeated paid webhook delivery does not decrement stock again

## Remaining External Validation

`SHIP-03` remains blocked until BOX NOW partner or sandbox portal access exists.

Required later evidence:

- operator can sign in to the BOX NOW partner or sandbox portal
- a sandbox-paid Greek order can be recreated from Worker-owned paid order state
- the portal accepts the selected Greek locker id
- voucher/label/tracking output is handled out-of-band and not committed
- any production go-live gaps are recorded before Phase 10 approval
