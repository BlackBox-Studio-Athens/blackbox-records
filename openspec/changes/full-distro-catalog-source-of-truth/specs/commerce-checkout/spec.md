## ADDED Requirements

### Requirement: Hosted Checkout supports pay-what-you-want catalog Prices

The system SHALL allow checkout for catalog-ready Store Items backed by Stripe pay-what-you-want Prices.

#### Scenario: Shopper starts pay-what-you-want checkout

- **GIVEN** a Store Item has an active Stripe Price with `custom_unit_amount`
- **AND** D1 availability, stock, catalog identity, and Product Projection checks pass
- **WHEN** the shopper starts checkout
- **THEN** the Worker creates a hosted Stripe Checkout Session using the Stripe Price ID
- **AND** Stripe Checkout collects the shopper-entered amount on the hosted checkout page.

#### Scenario: Pay-what-you-want Store Offer is returned

- **GIVEN** a Store Item has a catalog-ready pay-what-you-want Price
- **WHEN** the browser reads the public Store Offer
- **THEN** the response is browser-safe and checkout-eligible
- **AND** it exposes display copy such as `Pay what you want`
- **AND** it does not expose Stripe Price IDs, D1 identifiers, provider internals, or raw Stripe payloads.

#### Scenario: Fixed-price behavior remains unchanged

- **GIVEN** a Store Item has a catalog-ready fixed Stripe Price
- **WHEN** the browser reads the public Store Offer or starts checkout
- **THEN** existing fixed-price checkout behavior remains Worker-owned
- **AND** the browser still sends only app-owned identities such as Store Item slug, Variant ID, and CartQuantity.

### Requirement: Cart and order state handle custom price display safely

The system SHALL avoid treating a pay-what-you-want display price as a fixed order amount before Stripe finalizes payment.

#### Scenario: Pay-what-you-want item enters StoreCart

- **GIVEN** a shopper adds a pay-what-you-want item to StoreCart
- **WHEN** the cart line snapshot is created
- **THEN** the cart line records browser-safe display state for pay-what-you-want
- **AND** it does not invent a fixed amount minor before hosted Checkout.

#### Scenario: Payment completes

- **GIVEN** a pay-what-you-want Checkout Session completes
- **WHEN** the Worker finalizes order state from Stripe webhook/session data
- **THEN** the paid amount is derived from Stripe's finalized payment/session data
- **AND** stock and order state are updated through existing Worker-owned checkout authority.
