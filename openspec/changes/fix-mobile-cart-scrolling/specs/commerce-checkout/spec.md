## ADDED Requirements

### Requirement: Cart actions remain reachable on small screens

The storefront SHALL keep Checkout and Continue Shopping visible and operable within the cart drawer's available viewport while the cart heading, items and delivery information scroll independently above them.

#### Scenario: Cart content exceeds the available height

- **GIVEN** a small phone viewport or a cart with multiple items, long titles or lengthy delivery information
- **WHEN** the shopper opens and scrolls the cart
- **THEN** the cart content scrolls without moving the background Store page
- **AND** Checkout and Continue Shopping remain visible and tappable
- **AND** delivery loading, available and unavailable states remain readable within the scroll area.

#### Scenario: Shopper continues shopping

- **WHEN** the shopper chooses Continue Shopping
- **THEN** the cart closes and focus returns to its opener
- **AND** Store scrolling resumes so another product can be added
- **AND** the existing cart lines, supported quantities and active player session remain intact.

#### Scenario: Cart is empty

- **WHEN** the cart contains no items
- **THEN** its empty state can scroll when necessary
- **AND** Continue Shopping remains visible and operable without a Checkout action.

#### Scenario: Player is minimized during shopping

- **GIVEN** an active minimized player session
- **WHEN** the shopper opens the cart
- **THEN** the player surface does not cover or intercept the cart actions
- **AND** closing the cart preserves the existing player iframe and session.
