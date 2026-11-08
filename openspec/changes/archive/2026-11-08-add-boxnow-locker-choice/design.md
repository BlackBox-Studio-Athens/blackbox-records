# Design

## Context

See [proposal.md](proposal.md) for the reasons and scope. The approved visual is draft 3 (owner approval on 2026-11-06), kept outside the repo; the screens below follow it.

Current state that shapes the approach:

- The order and the checkout stock hold already carry a nullable locker snapshot: `shippingLockerId`, `shippingLockerCountryCode`, `shippingLockerNameOrLabel` (migrations 0004 and 0014), exposed as `ShippingLockerSnapshot` and in `CheckoutState.shippingLocker`. Nothing fills it today, because `StartCheckoutBody` has no locker field and the shipping spec forbids it.
- The return page already renders a locker recap when the snapshot is present (`checkout-return-status-state.ts`).
- `OrderDispatch` holds the shipped mark, operator, time and `shippingEmailSuppressed`. The shipping email (`shopper_shipping`) is queued in the same D1 transaction as the mark.
- Recipient, phone and email come from Stripe and are already saved on the order.
- The public site sends no Content-Security-Policy, so loading BOX NOW's script and frame needs no header change.
- BOX NOW facts checked on 2026-11-06: the public widget works without a partner contract; `https://boxnow.gr/en?track=<number>` fills in the number and runs BOX NOW's lookup; Send parcel costs €3 Small, €5 Medium, €10 Large inside Greece (+€1 islands); a full locker at delivery sends the parcel to the closest locker; there is no compartment reservation, even in the Partner API.

## Goals / Non-Goals

**Goals:**

- One locker choice, made by the shopper, carried unchanged from checkout to the Staff copy section, with the operator's actual locker and parcel numbers carried to the shipping email.
- No BOX NOW request until the shopper or operator asks for the map.
- Checkout never blocks a sale because BOX NOW's map is down.

**Non-Goals:**

- Checking a locker against BOX NOW's locker list from the Worker. The Send parcel form is the existence check; the Worker validates shape only.
- Showing parcel status, prefilling or automating BOX NOW's Send parcel form, or storing anything BOX NOW returns.
- Rewording the pre-order return requirement in `store-preorders`. Its "locker arrangement before dispatch" wording is satisfied by showing the chosen locker; a later cleanup can reword it.

## Decisions

### Load BOX NOW's public widget only on tap

The panel renders our own markup first. Find a locker (or Change locker) opens BOX NOW's frame `https://widget-v5.boxnow.gr/iframe.html` inside the panel, with English labels, `gps=no` and partner ID 0, as on the reference site. The page accepts a `message` event only from that origin and that frame, and keeps five fields: locker ID, name, address line, postcode and country. Anything else in the payload is dropped.

Refinement during implementation: BOX NOW's loader `v5.js` only builds that same frame URL and relays its message, so the page creates the frame itself instead of running BOX NOW's script in our origin. No preselected locker is passed, because with `autoselect` the frame could report it at once and close the map. The size filter (`parcelSize`) is not used: it was never tested and could hide valid lockers.

Alternative considered: open the map on arrival (option B in the draft). Rejected by the owner: it loads BOX NOW for every checkout visitor and pushes the prices down.

### Fallback after a bounded wait

If the map frame fails or has not loaded within 10 seconds of the tap, the panel switches to the fallback copy and enables Continue to payment without a locker. The cross-origin frame sends no ready message, so its load event is the ready signal; a timer that closed a loaded map could interrupt a shopper who is still choosing. For a map that loads but does not work, the panel always shows "Map not loading? Continue without a locker", which opens the same fallback. The order then has a null locker, which already means "staff arrange it", so no new state is needed. The fallback panel is a new visual state and needs owner approval before it is built.

### Locker travels with Start Checkout

`StartCheckoutBody` gains an optional `shippingLocker` object `{ lockerId, name, addressLine, postalCode, countryCode: 'GR' }` with bounded strings, plus `lockerFallback: true` for the fallback. The Worker rejects a body with neither a locker nor the fallback flag once the web release is live; during the rollout window it accepts both absent, so a page cached before the release still works. The locker is part of the request fingerprint, so changing the locker after an abandoned attempt creates a new attempt instead of reusing the old Session. The hold copies the snapshot and the pending order inherits it through the existing path.

Alternative considered: send only the locker ID and look up the rest in BOX NOW's public locker JSON. Rejected: it adds a third-party fetch on the payment path, the list is unofficial, and the browser already holds the display fields.

### Two additive columns for address and postcode

Add nullable `shippingLockerAddressLine` and `shippingLockerPostalCode` to `CheckoutOrder` and the checkout stock hold, and extend `ShippingLockerSnapshot` and the public/internal response schemas. Historical rows keep nulls. The postcode makes the locker easy to find in Send parcel's own map.

### Parcel numbers and locker used on the dispatch record

Add three nullable columns to `OrderDispatch`: `lockerUsedId`, `lockerUsedName` and `parcelNumbers` (a JSON array of 10-digit strings, checked with `json_valid`). They are written in the same compare-and-set write as the shipped mark, so a stale write cannot change them. Mark not shipped keeps them for the record; the next Mark shipped replaces them. The shipping email reads them when it renders, so a pending email shows the latest saved values.

Alternative considered: a separate parcel table. Rejected for now: numbers are only ever read with their dispatch row, and two or three per order fit one column.

### Copy section and size suggestion in Staff

Staff derives the suggested BOX NOW size from the delivery band already charged: 1–4 units Small, 5–8 Medium, 9 or more Large. BOX NOW's prices sit in one small constant with the price-list date, shown as "Small · BOX NOW €3 (we charged €3)". Values come from the protected order read; nothing is sent to BOX NOW. Open Send parcel links to `https://steiledema.boxnow.gr/en/apostoli-dematos`.

### Delivery wording lives in published purchase information

Hosted sites read the delivery summary and terms from the Staff-published `purchase_information` record; `site.json` is only the local fixture and code fallback. The fixture, the fallback in `PurchaseInformation.tsx` and the static terms fallback now carry the new wording, but hosted checkout keeps showing "We arrange your locker with you before dispatch" until the owner publishes the same wording in Staff (task 7.3). That publication must happen with the release, or the checkout note contradicts the locker panel above it.

Summary (checkout note): "Delivery is to the locker above. Stripe also asks for a street address; it is not used for delivery."

First delivery paragraph: "Delivery is to the BOX NOW locker in Greece that you choose at checkout, including supported island destinations, with no island surcharge. BOX NOW texts you a pickup code when the parcel arrives. If that locker is full, BOX NOW moves the parcel to the nearest one and tells you where. If the locker map is unavailable at checkout, we email you to agree a locker before we ship. A street address collected at payment does not mean home delivery."

### Emails reuse the existing shopper frame

The confirmation adds one Locker fact row; the shipping email adds Locker, Parcel number(s), Track actions and two short paragraphs, all through the existing render helpers. The tracking URL is built only from validated 10-digit numbers.

### Ownership

Claude builds and reviews the web checkout panel, cart and return copy, finder and Staff UI. Codex builds the Worker contract, validation, migrations, persistence, internal API, email rendering, generated clients and runbook. Visual evidence for emails is presented for owner review like any other screen.

## Risks / Trade-offs

- [BOX NOW changes or blocks the public widget for shops without a partner ID] → The 10-second fallback keeps checkout selling with today's manual locker agreement.
- [BOX NOW changes the tracking link format] → It is built in one function; a wrong link only fails to prefill BOX NOW's page.
- [A locker chosen for a pre-order is full or removed weeks later] → Locker used lets the operator ship elsewhere; the emails explain BOX NOW's own redirection.
- [The operator types a wrong parcel number] → 10-digit validation and the Check the number on BOX NOW link before marking shipped.
- [Unverified: how Send parcel's later steps pick the locker] → Staff shows name, address, postcode and ID so either a search or an ID entry works.
- [The order's value limit under BOX NOW's terms is unclear] → Staff shows no value; the operator chooses the band in BOX NOW's form.
- [Spec sequencing] → `add-order-shipped-email` and `add-shipping-email-choice` must be archived first, because this change modifies `Staff record dispatch in Orders` and `Shipping email follows the approved shopper draft` as those changes define them.

## Migration Plan

1. Additive D1 migration for the five new columns; regenerate Prisma and API clients.
2. Release the Worker first, accepting bodies with or without a locker.
3. Release the web checkout, cart, return page and Staff UI.
4. After the web release is live everywhere, enforce "locker or fallback" in Start Checkout.
5. Accept on UAT with the Stripe sandbox, a real map selection, the fallback, Staff copy and a sink shipping email. PRD release follows the normal separate gate.

Rollback: older code ignores the new columns and fields; orders keep their saved lockers and numbers.
