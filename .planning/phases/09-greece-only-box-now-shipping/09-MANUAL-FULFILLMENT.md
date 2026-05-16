# Phase 9 Manual BOX NOW Fulfillment Handoff

## Status

This document now defines the non-automated Phase 9 baseline. Plan `09-07` chooses this path for new checkout starts by
letting Stripe Checkout collect the Greek shipping address/contact details before payment. If BlackBox later chooses BOX
NOW automation instead, that work must be built through `C:\Users\SVall\WebstormProjects\boxnow-js`, and this manual
path stops being the primary Phase 9 closure route.

Current GSD status: complete for the manual v1 scope. `09-06`, Phase 9, and `SHIP-01` through `SHIP-03` are closed for
now. Do not reopen BOX NOW portal/API integration unless the user explicitly asks after BOX NOW access exists.

If reopened later, the next slice must validate:

- operator access to the BOX NOW partner/sandbox portal
- a paid Greek order fulfilled through the approved manual address/contact surface or through `boxnow-js` automation
- recorded out-of-band portal/API result evidence without committing credentials, vouchers, labels, or raw portal output

## Source Of Truth

Use Worker-owned order state as the operational source of truth.

- The order must be `paid` before any BOX NOW shipment is created.
- The non-automated path uses the paid order plus the approved address/contact surface needed for a human to create the
  shipment manually.
- Missing address/contact data in the approved payment or operations tooling means the order needs review.
- Do not create a BOX NOW shipment from browser state, notes, screenshots, query parameters, or the historical
  locker-first prototype alone.
- If the project later chooses automation, use `boxnow-js`; do not grow a bespoke BOX NOW client inside this repo.

## Manual Fulfillment Steps

1. Open the protected internal order readback for recent paid orders or the specific checkout session.
2. Confirm the order status is `paid`.
3. Confirm the order exposes the Greek delivery address and any required recipient/contact data through the approved
   operational surface.
4. If investigating a support case, confirm that the operational address/contact data matches the shopper-visible
   order state or approved payment tooling.
5. Open the BOX NOW partner portal using out-of-band operator credentials.
6. Create the shipment manually using the paid order plus the address/contact data available through the approved
   payment or operations tooling.
7. Keep any BOX NOW voucher, label, or tracking output out of the repo and out of D1 until a later milestone
   explicitly adds fulfillment persistence.
8. If the portal rejects the address, recipient, parcel, or shipment request, leave the order in operator review and
   record the failure in the Phase 10 review package.

## Data Boundaries

Allowed for the non-automated Phase 9 path:

- the minimum delivery address and recipient/contact data needed for a human to create the shipment
- normal Worker-owned order identifiers and payment state

Allowed only if a later automation path is explicitly approved:

- the thin BOX NOW-specific locker snapshot: `locker_id`, `country_code`, and `locker_name_or_label`

Forbidden in Phase 9 order state and frontend public config:

- raw BOX NOW widget or API payloads
- unapproved address or locker payload dumps
- coordinates, postal codes, parcel dimensions, voucher ids, label URLs, tracking automation state, or partner-portal
  credentials
- BOX NOW credentials in Astro `PUBLIC_*` env, Cloudflare Pages variables, generated frontend clients, committed seed
  files, or static content

## Validation Path

The current Phase 9 closure evidence is the implemented manual-address checkout path:

- Stripe Checkout collects Greek shipping address/contact details before payment.
- Public `StartCheckout` no longer accepts browser-selected `shippingLocker`.
- New pending checkout orders persist `shippingLocker: null`.
- Operators create BOX NOW shipments manually from paid order/payment tooling.
- The historical locker-first local evidence remains prototype proof only.

Future full integration evidence is out of current scope. If reopened, validate that path directly and keep all BOX NOW
credentials, vouchers, labels, tracking output, and raw portal/API payloads out of the repo.
