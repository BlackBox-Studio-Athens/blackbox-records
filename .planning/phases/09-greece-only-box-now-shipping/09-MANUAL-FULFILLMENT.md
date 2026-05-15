# Phase 9 Manual BOX NOW Fulfillment Handoff

## Status

This document now defines the non-automated Phase 9 baseline. It does not prove the repo already captures the required
address/contact data. If BlackBox later chooses BOX NOW automation instead, that work must be built through
`C:\Users\SVall\WebstormProjects\boxnow-js`, and this manual path stops being the primary Phase 9 closure route.

Do not mark `SHIP-03` or `09-06` complete until:

- the shipping mode is explicitly chosen
- an operator can use the chosen path for a sandbox-paid Greek order
- the result is recorded in `09-VALIDATION.md`

## Source Of Truth

Use Worker-owned order state as the operational source of truth.

- The order must be `paid` before any BOX NOW shipment is created.
- The non-automated path uses the paid order plus the approved address/contact surface needed for a human to create the
  shipment manually.
- Missing address/contact data means the order needs review.
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

The current local Phase 9 evidence still reflects the historical locker-first prototype branch. That evidence remains
useful as prototype proof, but it does not close the revised Phase 9 contract by itself.

If the project chooses the non-automated path, replace the prototype validation with evidence that:

- checkout/order flow exposes the required delivery address and recipient/contact data for operators
- the paid order readback lets an operator reconstruct the shipment manually
- a sandbox-paid Greek order can be fulfilled manually through the BOX NOW portal from that data
- repeated paid webhook delivery does not mutate stock twice

If the project chooses the automated path, open a follow-up implementation slice that consumes `boxnow-js` and validate
that path directly.

## Remaining External Validation

`SHIP-03` remains blocked until the shipping mode is chosen and BOX NOW partner or sandbox portal access exists.

Required later evidence:

- operator can sign in to the BOX NOW partner or sandbox portal
- a sandbox-paid Greek order can be recreated from the chosen Worker-owned shipping surface
- voucher/label/tracking output is handled out-of-band and not committed
- if automation is chosen, the integration uses `boxnow-js`
- any production go-live gaps are recorded before Phase 10 approval
