## ADDED Requirements

### Requirement: Shoppers outside Greece get an email ordering route

The public site SHALL tell shoppers that online checkout ships within Greece only and SHALL offer an email link for ordering from abroad, without changing the closed shipping country scope.

#### Scenario: Shopper browses a Store collection

- **GIVEN** a shopper opens any Store collection page
- **WHEN** the page renders
- **THEN** a shipping strip states that the label ships within Greece only
- **AND** it offers an "Email us to order" link to the support address with the subject "Order from outside Greece".

#### Scenario: Shopper views a Store Item

- **GIVEN** a shopper opens a Store Item page
- **WHEN** the purchase actions render
- **THEN** a line after them states Greece-only shipping and offers the email link
- **AND** the link's body template lists that item's title, then empty Country and City fields.

#### Scenario: Shopper reviews the cart or checkout

- **GIVEN** a shopper has items in the cart
- **WHEN** they open the cart drawer or the checkout shipping step
- **THEN** a card explains that online checkout ships within Greece only and offers the email link
- **AND** the link's body template lists the current cart item titles.

#### Scenario: Notice stays quiet

- **GIVEN** the notice is shown in any placement
- **WHEN** the shopper browses or checks out
- **THEN** it is static, not dismissible, not a modal or popup and not a live region
- **AND** it does not use geolocation, store state, or change checkout requests, country validation or Greek checkout behaviour.
