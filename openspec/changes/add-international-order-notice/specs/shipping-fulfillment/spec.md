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
