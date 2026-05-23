## ADDED Requirements

### Requirement: Non-Greece Shiplemon quotes

The system SHALL create app-owned Shiplemon shipping quotes for supported non-Greece destinations only after package profile and cart validation succeeds.

#### Scenario: Non-Greece quote requested

- **GIVEN** a shopper requests non-Greece shipping options
- **WHEN** every CartLine has a Shipping Package Profile and the destination is supported
- **THEN** the Worker returns sanitized quote options with app-owned `shippingQuoteId`, amount, currency, carrier/service display name, and estimated delivery data only.

### Requirement: Non-Greece checkout quote authority

The system MUST reject non-Greece checkout starts without a valid, unexpired, matching Worker-owned `shippingQuoteId`.

#### Scenario: Quote is stale or mismatched

- **GIVEN** a non-Greece checkout request references a stale, consumed, country-mismatched, postal-code-mismatched, or cart-mismatched quote
- **WHEN** the Worker validates checkout
- **THEN** checkout fails before Stripe Session creation.

### Requirement: Shiplemon shipment creation

The system SHALL create Shiplemon shipments only after verified paid Stripe webhook reconciliation and operator-ready review.

#### Scenario: Paid order has a valid non-Greece quote

- **GIVEN** a paid CheckoutOrder has a consumed non-Greece ShippingQuote
- **WHEN** an operator confirms the shipment is ready
- **THEN** the Worker creates or records a ShiplemonShipment internally
- **AND** public APIs never expose labels, invoice URLs, provider IDs, API keys, or raw provider payloads.
