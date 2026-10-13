## Purpose

Specify permanent Greece-only fulfillment, shipping data minimization, and a separate gate for any future Greek BOX NOW automation.

## Requirements

### Requirement: Greece-only manual BOX NOW scope

The system SHALL keep current checkout shipping Greece-only with manual BOX NOW fulfillment.

#### Scenario: Greek checkout starts

- **GIVEN** a shopper starts checkout in the current shipping scope
- **WHEN** Stripe Checkout is created
- **THEN** Stripe collects Greek shipping address and contact details
- **AND** the browser does not submit BOX NOW locker data to `StartCheckout`.

### Requirement: BOX NOW data minimization

The system MUST avoid persisting raw BOX NOW widget, API, credential, voucher, label, tracking automation, or portal payloads in v1.

#### Scenario: Paid Greek order needs fulfillment

- **GIVEN** a paid Greek order exists
- **WHEN** operators create a BOX NOW shipment manually
- **THEN** the repo stores only Worker-owned order/payment and approved minimal shipping-mode data needed for handoff
- **AND** the staff dispatch mark stores only whether the order is shipped, when it last changed and which operator changed it.

### Requirement: Shipping country scope is closed

The system MUST reject non-Greece delivery and MUST NOT add a non-Greece provider, quote, or checkout path.

#### Scenario: Non-Greece delivery is submitted

- **GIVEN** a checkout or paid-order delivery address has a country other than `GR`
- **WHEN** the system validates it for payment or fulfillment
- **THEN** the request is rejected before it can become payable or ready for fulfillment
- **AND** no provider fallback broadens the supported country set.

### Requirement: BOX NOW automation reopen gate

The system SHALL require an explicit future decision before implementing BOX NOW automation, and any approved automation MUST remain Greece-only.

#### Scenario: Future shipping automation is requested

- **GIVEN** a task proposes BOX NOW API automation for Greek fulfillment
- **WHEN** work is planned
- **THEN** it must be represented as an active OpenSpec change
- **AND** provider credentials remain Worker-only or out-of-band operator credentials.

### Requirement: Manual Greek fulfillment uses the persisted paid order

The system SHALL use validated Worker-owned paid-order fields as the normal manual fulfillment handoff.

#### Scenario: Operator prepares a paid Greek order

- **WHEN** the protected order read returns complete current paid fulfillment
- **THEN** it supplies the recipient, contact, Greek address, order reference, and immutable line summary
- **AND** normal fulfillment does not require a fresh Stripe read.

#### Scenario: Paid fulfillment is incomplete

- **WHEN** required persisted fulfillment data is missing or invalid
- **THEN** the order is presented as operator-actionable
- **AND** it is not presented as ready for normal fulfillment.

### Requirement: Collected shipping details own fulfillment identity

The system MUST derive the shipment recipient and delivery address from verified Checkout shipping details, keep shopper contact separate, and never substitute billing details for missing shipping details.

#### Scenario: Billing and shipping differ

- **WHEN** a verified paid Session contains a Greek shipping address and recipient different from the buyer's billing details
- **THEN** the persisted fulfillment and operator delivery use the shipping recipient and address
- **AND** billing country does not reject an otherwise valid Greek shipment
- **AND** buyer email and optional phone remain shopper contact.

#### Scenario: Shipping data is incomplete or unsupported

- **WHEN** verified shipping lacks required recipient/address fields or its country is not `GR`
- **THEN** the order does not become ready for normal fulfillment
- **AND** billing details are not used as a fallback
- **AND** reconciliation preserves a durable review outcome or remains retryable until that outcome can be recorded.

#### Scenario: Fulfillment is replayed

- **WHEN** the same paid Session is delivered again
- **THEN** previously committed paid fulfillment facts remain immutable
- **AND** no raw billing or provider payload is added to public checkout responses or order storage.

### Requirement: Shoppers outside Greece get an email ordering route

The public site SHALL use Cloudflare network country only as an initial delivery hint. When that hint is foreign and no explicit delivery choice exists, it SHALL explain Greece-only online checkout and offer an email link for ordering from abroad. A shopper SHALL be able to correct the hint to delivery in Greece across all shared placements and change that choice back. Presentation choices MUST NOT change checkout or fulfillment eligibility.

#### Scenario: Shopper abroad browses a Store collection

- **GIVEN** the visitor country resolves to a valid code other than `GR` without an explicit delivery choice, or the shopper has chosen delivery outside Greece
- **WHEN** a Store collection page renders
- **THEN** a shipping strip states that the label ships within Greece only, for now
- **AND** it offers an "Email us to order" link to `orders@blackboxrecordsathens.com` with the subject "Order from outside Greece"
- **AND** a "Deliver to Greece" action can correct the network hint.

#### Scenario: Shopper abroad views a Store Item

- **GIVEN** the network hint or explicit delivery choice indicates delivery outside Greece
- **WHEN** the Store Item purchase actions render
- **THEN** a line after them states Greece-only shipping and offers the email link
- **AND** the link's body template lists that item's title, then empty Country and City fields
- **AND** the existing truck and `Ships within Greece only.` use the Store active accent, while `Outside Greece?` remains muted and the underlined email link remains foreground, without a trailing arrow
- **AND** the line preserves its inline wrapping, typography, 44px targets and visible keyboard focus without adding a box, border or padding
- **AND** the same delivery correction is available.

#### Scenario: Shopper abroad reviews the cart or checkout

- **GIVEN** the network hint or explicit delivery choice indicates delivery outside Greece
- **AND** the cart has items
- **WHEN** the shopper opens the cart drawer or checkout
- **THEN** a card explains that online checkout ships within Greece only and offers the email link
- **AND** the link's body template lists the current cart item titles
- **AND** the same delivery correction is available.

#### Scenario: Greek destination behind foreign network routing

- **GIVEN** a foreign network hint displays an international notice
- **WHEN** the shopper chooses "Deliver to Greece"
- **THEN** every shared placement replaces international-only copy with a quiet "Delivery: Greece" confirmation and a "Change" action
- **AND** the explicit choice wins over a late automatic hint
- **AND** changing the destination back restores international email assistance
- **AND** checkout still validates the actual shipping address.

#### Scenario: Shopper in Greece

- **GIVEN** the network hint resolves to `GR` without an explicit international delivery choice
- **WHEN** any Store collection, Store Item, cart drawer or checkout view renders
- **THEN** no international notice is rendered, including before the hint resolves.

#### Scenario: Country is unknown

- **GIVEN** no explicit delivery choice exists
- **AND** the lookup fails, times out, or returns an unknown, `XX` or `T1` value
- **WHEN** any placement renders
- **THEN** the notice stays hidden
- **AND** browsing and checkout remain usable.

#### Scenario: Notice stays quiet

- **GIVEN** the notice is shown in any placement
- **WHEN** the shopper browses or checks out
- **THEN** it remains static, without a modal, popup or live region
- **AND** country is looked up at most once per document and a full reload refreshes the automatic hint
- **AND** legacy persisted automatic hints are ignored
- **AND** only an explicit delivery choice persists within the tab when storage is available, with an in-memory fallback when it is unavailable
- **AND** neither the hint nor presentation choice is sent to the Worker
- **AND** checkout requests, country validation and Greek checkout behavior remain unchanged.

### Requirement: Notice lifetime follows the shipping restriction

The email ordering notice SHALL remain active while online checkout and fulfillment are Greece-only. It MUST NOT have an independent disable flag. An approved shipping expansion SHALL include removal or replacement of the Greece-specific notice in its acceptance and release scope; changing presentation MUST NOT broaden shipping authority.

#### Scenario: Shipping expansion is not yet available

- **GIVEN** online checkout and fulfillment remain Greece-only
- **WHEN** expansion is planned, implemented or awaiting acceptance
- **THEN** all four notice placements retain their country visibility and email ordering behavior.

#### Scenario: Shipping expands to some additional countries

- **GIVEN** expanded checkout and fulfillment are available and verified for some additional destinations
- **WHEN** that expansion is released
- **THEN** the notice no longer claims that online shipping is Greece-only
- **AND** an accurate email ordering route remains for destinations checkout cannot serve
- **AND** any destination eligibility used by the notice comes from the Worker's shipping policy, with shopper geolocation remaining advisory.

#### Scenario: Checkout covers the full intended destination scope

- **GIVEN** expanded checkout and fulfillment are available and verified for the full intended destination scope
- **WHEN** that expansion is released
- **THEN** the notice, its placements and its country lookup can be deleted together
- **AND** the release verifies that stale Greece-only notice content is absent and normal purchase, cart and checkout behavior is preserved.

### Requirement: Delivery Charge is explicit and applied once

The system MUST charge one aggregate Delivery Charge per eligible Greek BOX NOW order: €3 for 1–4 validated cart units, €6 for 5–8, or €10 for 9 or more. Current NO_TAX_COLLECTED explicitly disables automatic tax and claims no included VAT or exemption. Carrier costs and actual parcel count remain separate; BlackBox absorbs differences without a later top-up. Historical agreements retain their original charge and policy.

#### Scenario: Separate delivery is charged

- **WHEN** an eligible Greek cart enters payable checkout
- **THEN** the accepted quantity-band Delivery Charge appears separately and contributes once to the gross total on the site and in Stripe
- **AND** total validated cart quantity determines the band, without inferring disc counts from item metadata or charging per parcel
- **AND** delivery is not represented as a stock-bearing Store Item.
- **AND** owner-authorized assumed dimensions remain labelled assumed until measured evidence exists.

#### Scenario: The complete cart determines the delivery band

- **WHEN** the Worker validates a cart's products, quantities, prices and stock
- **THEN** it sums all validated line quantities and exposes the €3/€6/€10 band charge before hosted Checkout
- **AND** changing cart quantities requires recalculation
- **AND** the browser cannot select a cheaper band or Stripe shipping option
- **AND** parcel count and manual packing do not alter this fee or impose a nineteen-unit order ceiling

### Requirement: Packing eligibility accounts for the complete protected cart

The system MUST apply the final quantity-band tariff to newly created agreements, counting validated cart units across all lines. Every validated PRD variant shares the owner-authorized assumed item profile, regardless of format. Actual parcel selection and count are manual fulfillment responsibilities and MUST NOT impose the old single-parcel capacity ceiling on new orders. Actual measurements remain Unknown; identity, price, quantity, stock and configuration checks remain.

#### Scenario: Provisional UAT packing

- **GIVEN** owner-authorized UAT testing with a Stripe test key
- **WHEN** measured profiles are not yet available
- **THEN** the Worker may use the explicit synthetic profiles and a synthetic accepted-policy reference
- **AND** this UAT test authorization alone enables neither PRD nor UAT without a test key; PRD universal assumed packing has separate explicit owner authority and its own policy reference
- **AND** Local/UAT synthetic profiles do not become PRD measurement or packing authority
- **AND** successful provider tests do not establish measured packing or fiscal acceptance.

#### Scenario: The owner authorizes the same assumed profile for every PRD product

- **GIVEN** the owner authorized the same existing assumed profile for all products and manual offline shipments
- **WHEN** any validated PRD product variant enters checkout, regardless of format
- **THEN** the Worker counts validated cart units under `quantity-band-shipping-no-tax-collected-prd-2026-10-09-v1`, retaining the existing assumed 315 × 315 × 8 mm / 220 g profile as assumed provenance
- **AND** positive/safe quantities, stock, amount and configuration checks still apply
- **AND** 1–4 units cost €3, 5–8 cost €6 and 9 or more cost €10, subject to unchanged cart/per-line/stock guards
- **AND** manual splitting/repacking at BlackBox's cost allows quantities beyond the old nineteen-unit single-parcel capacity
- **AND** older vinyl/no-tax/inclusive references remain allowlisted and accepted hold/order terms are not rewritten
- **AND** new agreements use additive `manual` shipping classification while historical Small/Medium/null values retain their meanings
- **AND** technical packing/cart constraints are not participant, order or time limits, and assumed values are never recorded as measured evidence.

#### Scenario: Quantity crosses a tariff boundary

- **WHEN** total cart quantity changes from four to five or eight to nine
- **THEN** the quote changes from €3 to €6 or €6 to €10 respectively, independent of format, line order or duplicate-line grouping
- **AND** changing cart contents recalculates eligibility before creating checkout.

#### Scenario: An older packing agreement reaches a capacity boundary

- **WHEN** an accepted legacy agreement uses physical parcel selection and exactly meets usable dimensions and gross-weight limits with the required clearance/protection already accounted for
- **THEN** it fits that package
- **AND** exceeding any one limit prevents that package from being selected even if total item volume is small enough.

#### Scenario: Configuration or cart input is invalid

- **WHEN** the selected policy configuration, product identity or cart quantity is missing/invalid
- **THEN** shipping is unavailable and no payable Session is created for that cart
- **AND** the system does not guess disc counts from format labels, invent another tariff or request a later customer top-up.

### Requirement: Accepted shipping prices survive carrier and tariff changes

The system MUST preserve the accepted shopper charge for existing checkout agreements and orders despite different carrier costs or later policy changes.

#### Scenario: Carrier cost differs from the shopper charge

- **WHEN** an accepted island order, packaging choice or manual parcel split costs BlackBox more or less than the accepted fee
- **THEN** the shopper still pays the originally accepted aggregate order charge once
- **AND** no additional payment is demanded after checkout.

#### Scenario: The owner changes the future tariff

- **WHEN** a validated Worker tariff changes for new checkout agreements
- **THEN** the shared public policy and newly created native Stripe shipping option use the new gross amount for the accepted band
- **AND** an existing Session retains its disclosed tier/amount or is explicitly expired before payment
- **AND** finalized orders and applicable refunds use their original monetary snapshot.

#### Scenario: Configuration is missing or a custom amount is used

- **WHEN** the delivery policy is missing, invalid, unexpectedly zero or incompatible with the chosen payment flow
- **THEN** checkout does not silently assume free delivery or infer a tax mode from missing setup
- **AND** the accepted pay-what-you-want path must prove the same delivery/tax behavior using the shopper's finalized amount.

### Requirement: Delivery promises match manual BOX NOW operations

The system MUST disclose the agreed Greek BOX NOW locker method, coverage, delivery timing and locker-confirmation process before payment. Accepted carts and destinations MUST fit the approved shipment agreement without undisclosed post-payment charges. Existing restrictions on country scope, automation and BOX NOW data remain in force.

#### Scenario: A shopper reviews delivery terms

- **WHEN** delivery is offered
- **THEN** the shopper can find the gross charge, supported destinations, realistic timing and how the locker is agreed before dispatch
- **AND** collection of a street address does not promise home delivery.

#### Scenario: A cart cannot be fulfilled under the advertised policy

- **WHEN** its destination, quantity or parcel requirements are unsupported
- **THEN** the order cannot become payable under that policy
- **AND** the system does not collect an undisclosed surcharge after payment or use a non-Greece fallback.

#### Scenario: An unusual item requires manual repacking

- **WHEN** physical packing finds a box set, sleeve, protection or sealed carton outside the assumed model
- **THEN** the operator verifies/repackages at BlackBox's cost without a later customer top-up
- **AND** the shared model is not claimed as measured fit or a verified maximum, and no new per-product onboarding/measurement approval gate is introduced.

### Requirement: Delivery refunds and fiscal dispatch are reconciled

The selling workflow MUST apply the approved consumer-law delivery/return policy, required credit treatment and any applicable fiscal dispatch-document process alongside manual shipment records.

#### Scenario: Withdrawal or another refund is accepted

- **WHEN** an operator processes an eligible return/refund
- **THEN** applicable standard outbound delivery reimbursement, premium-delivery treatment and disclosed return costs are applied consistently
- **AND** VAT and credit records reconcile with the original monetary snapshot
- **AND** withdrawal exceptions do not remove applicable defective-goods rights.

#### Scenario: Shipment is handed over

- **WHEN** an operator dispatches a paid order
- **THEN** the required fiscal issuance/dispatch checks and duplicate-safe shipment record are complete under the approved process
- **AND** a carrier label or an email delivery result alone is not treated as proof of fiscal compliance.
