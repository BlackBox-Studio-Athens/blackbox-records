## Purpose

Specify native storefront, cart, checkout, Stripe, feature-gate, and secret-boundary behavior.

## Requirements

### Requirement: Native store projection

The system SHALL render native store pages from repo-owned content and stable store projections.

#### Scenario: Shopper opens a store item

- **GIVEN** a release or distro entry projects into a `StoreItem`
- **WHEN** the shopper opens the item route
- **THEN** the page presents editorial content and option availability through app-owned identifiers and browser-safe data.

### Requirement: StoreCart convenience state

The system SHALL treat `StoreCart` as browser convenience state only.

#### Scenario: Cart persists locally

- **GIVEN** the browser stores a cart draft
- **WHEN** the shopper returns to the store
- **THEN** local storage may restore display/routing data
- **AND** the Worker still validates all price, stock, payment, order, and eligibility authority before checkout.

### Requirement: Worker-owned checkout creation

The system MUST create Stripe Checkout Sessions only from the Worker through the backend Stripe gateway.

#### Scenario: Checkout starts

- **GIVEN** the shopper submits checkout intent
- **WHEN** the Worker validates the request
- **THEN** it creates a Stripe-hosted Checkout Session with Worker-owned success and cancel URLs
- **AND** the browser receives only the hosted `checkoutUrl`.

### Requirement: Stripe payment method configuration

The system MUST use a required Stripe Payment Method Configuration for Stripe-backed checkout.

#### Scenario: Configuration is missing

- **GIVEN** `STRIPE_PAYMENT_METHOD_CONFIGURATION_ID` is blank or missing
- **WHEN** `createStripeCheckoutGateway()` is constructed
- **THEN** gateway creation fails before Checkout Session creation.

### Requirement: Browser-safe capability exposure

The system SHALL expose checkout capability status without leaking provider internals.

#### Scenario: Browser reads store capabilities

- **GIVEN** the browser calls `/api/store/capabilities`
- **WHEN** the Worker evaluates native checkout availability
- **THEN** the response is browser-safe and omits provider names, feature flag keys, Stripe IDs, D1 bindings, secrets, and internal evaluation errors.
