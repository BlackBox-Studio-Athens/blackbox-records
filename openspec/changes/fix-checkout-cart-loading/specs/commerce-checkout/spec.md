## ADDED Requirements

### Requirement: Checkout waits for saved cart hydration

Checkout SHALL distinguish an unread saved cart from a confirmed empty cart. Until the cart is read, it SHALL show neutral loading feedback, withhold quantity editing and payment, and avoid empty-cart or delivery-failure conclusions. Server and initial browser rendering SHALL agree without reading browser storage during server rendering.

#### Scenario: Saved populated cart loads slowly

- **GIVEN** the browser has saved cart lines and checkout JavaScript is delayed
- **WHEN** checkout first renders and then hydrates
- **THEN** loading feedback precedes the saved items without an empty-cart or delivery-failure claim
- **AND** payment waits for valid authoritative price and delivery state.

#### Scenario: Saved cart is genuinely empty

- **WHEN** the saved cart read finishes with no lines and no applicable single-item fallback
- **THEN** checkout shows the empty-cart recovery path and does not offer payment.

#### Scenario: Delivery is pending or fails after cart loading

- **GIVEN** saved cart lines have loaded
- **WHEN** the delivery quote is pending, temporarily fails, or rejects the cart
- **THEN** checkout preserves the cart and distinguishes those states
- **AND** temporary failure retains the explicit delivery retry, with payment unavailable until a valid quote returns.

#### Scenario: Existing item intent and cart updates survive loading

- **WHEN** a shopper opens an item compatibility route, uses an applicable single-item fallback, or changes cart quantities
- **THEN** the existing item recovery and cart update behavior remains available after cart loading
- **AND** unread cart state never supplies invented items, prices or totals.
