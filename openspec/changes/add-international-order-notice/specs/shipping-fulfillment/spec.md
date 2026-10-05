## ADDED Requirements

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
