## ADDED Requirements

### Requirement: Cart checkout fits one desktop screen

The cart checkout page SHALL present its cost breakdown and the Stripe checkout action without scrolling on a 1440×900 desktop viewport for a one-line cart, and SHALL state each checkout fact once.

#### Scenario: One-line cart on desktop

- **GIVEN** a StoreCart with one priced line and a 1440×900 viewport
- **WHEN** `/store/checkout/` finishes loading its delivery quote
- **THEN** the total and the Continue to Stripe Checkout action are visible without scrolling
- **AND** loading the delivery quote does not move the checkout action.

#### Scenario: Checkout facts are not repeated

- **WHEN** the checkout page renders
- **THEN** the item list, Greece-only locker delivery information, card-detail reassurance and the cost breakdown each appear once per viewport layout.
