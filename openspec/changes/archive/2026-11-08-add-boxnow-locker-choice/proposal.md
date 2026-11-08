# Proposal

## Why

Shoppers pay without choosing a BOX NOW locker, so staff must contact them before every shipment and the shipping email cannot say where the parcel goes or how to track it. BlackBox has no BOX NOW partner contract or API access, and the owner will not ask BOX NOW or the shipping colleague for one, so the change uses only BOX NOW's public locker map and its public Send parcel form. The owner approved the visual design (draft 3) on 2026-11-06.

## What Changes

- Checkout gains a BOX NOW locker panel above Review and pay. BOX NOW's public map opens only after the shopper taps Find a locker. Continue to payment waits for a locker, and a phone remembers the last locker used.
- The browser sends the chosen locker with Start Checkout. The Worker validates it and saves the locker ID, name, address, postcode and country on the order. **BREAKING** for the shipping spec: today the browser sends no locker and the label arranges it after payment.
- If BOX NOW's map cannot load, checkout falls back to today's flow: the shopper pays and staff arrange the locker after payment.
- The cart line, order complete page and payment confirmation email name the chosen locker. The order complete page explains the pickup code, tracking and what BOX NOW does with a full locker.
- Staff order detail gains a "For BOX NOW Send parcel" section with copy buttons and a link to the public form. Mark shipped gains an editable Locker used and one or more 10-digit BOX NOW parcel numbers.
- The shipping email names the locker used, lists each parcel number with a tracking link (`https://boxnow.gr/en?track=<number>`) and explains pickup timing and full-locker redirection. Without a number it is sent without tracking.
- Delivery & returns may offer a browse-only locker finder that uses the same map.
- The commerce runbook replaces "create the shipment in the authorized partner portal" with the Send parcel steps.

Not included: any BOX NOW API call, partner portal, label creation, live parcel status, compartment reservation, or automation of the Send parcel form. BOX NOW's Partner API offers no compartment reservation in any case; BOX NOW assigns a compartment at delivery.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `shipping-fulfillment`: the shopper now chooses the locker before payment; the browser submits locker data; data minimization allows the locker snapshot and operator-entered parcel numbers; delivery promises describe the chosen locker and full-locker redirection; a map-unavailable fallback is added.
- `commerce-checkout`: checkout shows the locker panel and gates payment on a locker; the cart and return page show the chosen locker and BOX NOW pickup guidance.
- `paid-order-delivery`: paid facts may include the locker snapshot; the payment confirmation email shows the locker; the shipping email may show the locker, parcel numbers and tracking links.
- `staff-order-workspace`: order detail prepares the Send parcel form; the dispatch record stores the locker used and parcel numbers.
- `shopper-purchase-information`: Delivery & returns may offer a browse-only locker finder.

## Impact

- Public site: `apps/web` checkout panel and map loader, cart drawer copy, checkout return view, optional finder on the delivery page.
- Worker: Start Checkout contract and validation, order persistence (additive D1 columns for address and postcode, a parcel-number record for dispatch), internal order read/dispatch contracts, email templates.
- Staff: order detail copy section and dispatch control.
- Generated API clients and Prisma artifacts are regenerated.
- Third parties: the browser loads `widget-cdn.boxnow.gr` and an iframe from `widget-v5.boxnow.gr` only after a tap. No CSP exists on the public site today, so no header change is needed.
- Sequencing: `add-order-shipped-email` and `add-shipping-email-choice` must be archived before this change, because its staff and email deltas build on their requirements.
- Operations: `docs/commerce-operations.md`; the Staff-owned delivery terms need new wording through normal content publication.
