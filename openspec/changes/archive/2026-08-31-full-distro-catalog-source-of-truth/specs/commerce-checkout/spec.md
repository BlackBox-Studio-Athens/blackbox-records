## ADDED Requirements

### Requirement: Hosted Checkout supports authoritative pay-what-you-want Prices

The system SHALL let a ready pay-what-you-want Store Offer reach Stripe-hosted amount entry without moving price authority into the browser.

#### Scenario: Store Offer is displayed

- **WHEN** the authoritative offer uses a valid custom Stripe Price
- **THEN** browser-safe output presents Pay what you want
- **AND** exposes no Stripe Price ID or custom amount internals.

#### Scenario: Shopper starts checkout

- **WHEN** stock, availability, mapping, and the custom Price are ready
- **THEN** the Worker creates Checkout with the authoritative Stripe Price ID
- **AND** Stripe collects the shopper amount.

#### Scenario: Payment completes

- **WHEN** the paid event is reconciled
- **THEN** the paid amount comes from verified Stripe data
- **AND** no StoreCart display value is treated as payment authority.

#### Scenario: Fixed-price item starts checkout

- **WHEN** the offer uses a fixed Stripe Price
- **THEN** existing fixed-price checkout behavior remains unchanged.
