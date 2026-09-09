## ADDED Requirements

### Requirement: Hosted Checkout expiry tolerates creation latency

The system MUST calculate the requested expiry from current time plus 35 minutes immediately before the provider call, retain the provider-accepted expiry on the CheckoutOrder, and release held stock only after definitive non-creation or provider-confirmed terminal non-payable state.

#### Scenario: Hold creation consumes time

- **WHEN** time elapses between committing the pending hold and creating hosted Checkout
- **THEN** the outgoing expiry is calculated after that delay with the five-minute margin above Stripe's minimum
- **AND** the accepted session expiry is recorded with its binding.

#### Scenario: Provider rejects the requested expiry

- **WHEN** Stripe definitively rejects creation because the requested expiry is invalid
- **THEN** checkout returns a browser-safe failure and releases its sessionless hold
- **AND** the application does not create a replacement Session inside that failed attempt.

#### Scenario: SDK retries creation

- **WHEN** the SDK retries the same create request
- **THEN** its order-derived idempotency key and every request parameter, including expiry, remain identical
- **AND** recovery does not issue a new create request after the SDK attempt has ended.

#### Scenario: Provider outcome or binding is uncertain

- **WHEN** a timeout, network failure, provider 5xx, missing usable URL, or binding failure leaves creation or payment eligibility uncertain
- **THEN** the pending hold remains recoverable through the same order identity
- **AND** retry does not create a second Session for that order
- **AND** local time alone does not release the hold.

## MODIFIED Requirements

### Requirement: Hosted Checkout supports authoritative pay-what-you-want Prices

The system SHALL let a ready pay-what-you-want Store Offer reach Stripe-hosted amount entry only as a cart containing exactly one line of quantity one, without moving price authority into the browser.

#### Scenario: Store Offer is displayed

- **WHEN** the authoritative offer uses a valid custom Stripe Price
- **THEN** browser-safe output presents Pay what you want
- **AND** exposes no Stripe Price ID or custom amount internals.

#### Scenario: Shopper starts checkout

- **WHEN** stock, availability, mapping, and the custom Price are ready and the aggregated cart contains only that line with quantity one
- **THEN** the Worker creates Checkout with the authoritative Stripe Price ID
- **AND** Stripe collects the shopper amount.

#### Scenario: Custom Price cart is incompatible

- **WHEN** an authoritative pay-what-you-want line appears with another line or its aggregated quantity exceeds one
- **THEN** the Worker rejects checkout before creating a hold or provider Session
- **AND** the browser explains that the item must be purchased alone at quantity one
- **AND** the cart retains its contents for the shopper to correct.

#### Scenario: Browser state is stale or bypassed

- **WHEN** duplicate lines, a stale fixed-price display snapshot, or a direct request would bypass cart controls
- **THEN** the Worker enforces the constraint using merged quantities and the current authoritative Price kind.

#### Scenario: Payment completes

- **WHEN** the paid event is reconciled
- **THEN** the paid amount comes from verified Stripe data
- **AND** no StoreCart display value is treated as payment authority.

#### Scenario: Fixed-price item starts checkout

- **WHEN** every offer uses a fixed Stripe Price
- **THEN** existing fixed-price multi-line checkout and supported quantities remain unchanged.
