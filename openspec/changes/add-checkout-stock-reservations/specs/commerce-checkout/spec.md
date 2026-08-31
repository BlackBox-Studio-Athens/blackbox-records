## ADDED Requirements

### Requirement: Checkout creates app authority before provider authority

The system MUST create the complete pending CheckoutOrder hold before requesting a Stripe Checkout Session.

#### Scenario: Checkout starts

- **WHEN** the Worker validates the cart, Store Offers, price mappings, Greece shipping scope, and effective availability
- **THEN** it commits the pending order and lines before calling Stripe
- **AND** the browser receives only the hosted checkout URL or a browser-safe failure.

#### Scenario: Hosted checkout is created

- **WHEN** Stripe accepts the request
- **THEN** the session expires after 30 minutes
- **AND** private metadata carries only the app order identity needed for recovery.

### Requirement: Store reads use D1 availability without provider calls

The system SHALL resolve checkout availability from Worker-owned D1 state.

#### Scenario: Listing or Store Offer readiness is read

- **WHEN** pending orders consume the final effective unit
- **THEN** the established browser-safe unavailable state is returned
- **AND** no Stripe read occurs.

#### Scenario: Stale holds alone block checkout

- **WHEN** checkout start would otherwise fail and locally expired pending orders are the only cause
- **THEN** the Worker may inspect at most five oldest session-bound candidates through Stripe
- **AND** releases only provider-confirmed terminal sessions before retrying availability once.
