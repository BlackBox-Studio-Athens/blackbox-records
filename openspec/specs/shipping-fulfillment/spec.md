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
- **THEN** the repo stores only Worker-owned order/payment and approved minimal shipping-mode data needed for handoff.

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

The public site SHALL show shoppers whose Cloudflare-reported country is not Greece that online checkout ships within Greece only, and SHALL offer an email link for ordering from abroad. Shoppers in Greece MUST NOT see the notice. The closed shipping country scope is unchanged.

#### Scenario: Shopper abroad browses a Store collection

- **GIVEN** the visitor country resolves to a valid country code other than `GR`
- **WHEN** a Store collection page renders
- **THEN** a shipping strip states that the label ships within Greece only, for now
- **AND** it offers an "Email us to order" link to `orders@blackboxrecordsathens.com` with the subject "Order from outside Greece".

#### Scenario: Shopper abroad views a Store Item

- **GIVEN** the visitor country resolves to a valid country code other than `GR`
- **WHEN** the Store Item purchase actions render
- **THEN** a line after them states Greece-only shipping and offers the email link
- **AND** the link's body template lists that item's title, then empty Country and City fields.
- **AND** the existing truck and `Ships within Greece only.` use the Store active accent, while `Outside Greece?` remains muted and the underlined email link remains foreground, without a trailing arrow
- **AND** the line preserves its inline wrapping, typography, 44px email target and visible keyboard focus without adding a box, border or padding.

#### Scenario: Shopper abroad reviews the cart or checkout

- **GIVEN** the visitor country resolves to a valid country code other than `GR`
- **AND** the cart has items
- **WHEN** the shopper opens the cart drawer or the checkout shipping step
- **THEN** a card explains that online checkout ships within Greece only and offers the email link
- **AND** the link's body template lists the current cart item titles.

#### Scenario: Shopper in Greece

- **GIVEN** the visitor country resolves to `GR`
- **WHEN** any Store collection, Store Item, cart drawer or checkout view renders
- **THEN** no part of the notice is rendered, including before the country resolves.

#### Scenario: Country is unknown

- **GIVEN** the country lookup fails, times out, or returns an unknown, `XX` or `T1` value
- **WHEN** any placement renders
- **THEN** the notice stays hidden
- **AND** browsing and checkout behave as before.

#### Scenario: Notice stays quiet

- **GIVEN** the notice is shown in any placement
- **WHEN** the shopper browses or checks out
- **THEN** it is static, not dismissible, not a modal or popup and not a live region
- **AND** the country is looked up at most once per tab, kept only in the browser, and never sent to the Worker
- **AND** checkout requests, country validation and Greek checkout behaviour are unchanged.

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
