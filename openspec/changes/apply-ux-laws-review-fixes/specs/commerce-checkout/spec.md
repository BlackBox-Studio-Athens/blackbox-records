# Spec Delta

## MODIFIED Requirements

### Requirement: Delivery quotes follow settled cart changes

The storefront SHALL request a delivery quote for a settled StoreCart change, not for every intermediate quantity step. The first quote for a nonempty cart shown in a delivery summary SHALL be requested without the settle wait.

#### Scenario: Shopper changes quantities quickly

- **WHEN** the shopper presses quantity controls several times in quick succession
- **THEN** the client waits for about 250 milliseconds without further changes before requesting a quote
- **AND** a newer request aborts any older in-flight quote, so only the latest result is shown
- **AND** the pay control shows the existing pending state until the latest quote settles.

#### Scenario: Cart drawer opens after an add

- **WHEN** a delivery summary mounts for a nonempty cart with no quote yet
- **THEN** it requests the quote immediately, without the 250 millisecond settle wait
- **AND** exactly one quote request is sent for that cart state.

#### Scenario: Shopper starts checkout after a quote

- **WHEN** the shopper starts checkout
- **THEN** the Worker revalidates lines, stock, delivery, and price authority as before
- **AND** a debounced or aborted client quote is never accepted as checkout authority.

## ADDED Requirements

### Requirement: The cart drawer reserves its cost rows while the quote is pending

While a delivery quote is pending, the cart drawer SHALL show the Items, Delivery and Total rows in their final positions. Items SHALL show the local cart subtotal when every line has a fixed price in one currency; Delivery and Total, and Items otherwise, SHALL show an ellipsis. The summary SHALL be marked busy and named as calculating, and the quoted values SHALL replace the placeholders without moving the rows.

#### Scenario: Shopper adds a fixed-price item

- **WHEN** the drawer opens for one €20.00 item and the quote has not returned
- **THEN** Items reads €20.00 and Delivery and Total read …
- **AND** assistive technology hears that delivery and current prices are being calculated.

#### Scenario: Quote returns

- **WHEN** the quote resolves
- **THEN** Items, Delivery and Total show the quoted amounts in the same rows
- **AND** the quoted Items amount replaces the local subtotal when they differ.

#### Scenario: Cart has a pay-what-you-want line

- **WHEN** a line has no fixed price
- **THEN** Items shows … until the quote returns.

### Requirement: A pre-order cart keeps a readable Checkout

When the cart holds at least one pre-order line, the cart drawer's Checkout control SHALL use the Sea Green pre-order face with its light label, meeting text contrast. Carts without pre-orders keep the neutral ink face.

#### Scenario: Shopper opens a cart holding a pre-order

- **WHEN** the drawer shows a pre-order line
- **THEN** Checkout reads on a Sea Green face (#2d766a) with a #f5f5f5 label
- **AND** its label is never the same colour as its face.

### Requirement: The cart drawer uses shopper language

The cart drawer SHALL NOT show implementation terms such as browser-only state or cart draft. Its visible header SHALL be the Cart title and close control; its accessible description SHALL read "Review your items before checkout." The empty cart SHALL read "Your cart is empty" with the detail "Nothing here yet."

#### Scenario: Shopper opens an empty cart

- **WHEN** the shopper opens the cart with no lines
- **THEN** the drawer shows Cart, Your cart is empty, Nothing here yet. and Continue Shopping
- **AND** no visible text mentions browser state, Stripe or a cart draft.
