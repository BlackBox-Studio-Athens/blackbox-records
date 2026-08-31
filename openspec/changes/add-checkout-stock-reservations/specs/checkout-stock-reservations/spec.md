## Purpose

Defines temporary checkout stock holds by reusing pending CheckoutOrders and their lines, without a second reservation model or counter.

## ADDED Requirements

### Requirement: A pending CheckoutOrder is the temporary stock hold

The system SHALL represent each accepted checkout hold as one CheckoutOrder in pending_payment status with one positive aggregated CheckoutOrderLine per variant.

#### Scenario: Checkout hold is accepted

- **WHEN** every requested variant has sufficient effective availability
- **THEN** one pending-payment order and all aggregated lines commit atomically
- **AND** no separate reservation record or lifecycle is created.

#### Scenario: One cart line is unavailable

- **WHEN** any requested variant lacks effective availability
- **THEN** no order or line from that checkout request commits
- **AND** no Stripe Checkout Session is created.

#### Scenario: Order becomes terminal

- **WHEN** the order becomes paid, not_paid, or needs_review
- **THEN** later stale events cannot return it to pending_payment.

### Requirement: Effective availability subtracts pending order lines

The system MUST calculate effective checkout availability as the nonnegative lower of physical Stock and OnlineStock minus quantities in pending-payment CheckoutOrderLine rows.

#### Scenario: Pending orders consume availability

- **GIVEN** physical Stock is 4, OnlineStock is 3, and pending order lines total 2
- **WHEN** effective availability is read
- **THEN** the result is 1.

#### Scenario: Physical stock is lower

- **GIVEN** physical Stock is below OnlineStock
- **WHEN** effective availability is read
- **THEN** physical Stock bounds the result
- **AND** the result is never negative.

#### Scenario: Concurrent shoppers request the final unit

- **GIVEN** one effective unit remains
- **WHEN** two checkout-start transactions request it concurrently
- **THEN** exactly one pending order commits
- **AND** the other request receives the browser-safe unavailable result.

### Requirement: Provider binding cannot release a payable hold

The system SHALL bind at most one Stripe Checkout Session to a pending order and MUST retain the hold while that session may accept payment.

#### Scenario: Provider session is created

- **WHEN** Stripe accepts checkout creation
- **THEN** the session has the app order ID in private metadata and a fixed 30-minute expiry
- **AND** its session ID is bound uniquely to the existing pending order.

#### Scenario: Provider creation fails

- **WHEN** no Stripe Checkout Session was created
- **THEN** the sessionless pending order changes to not_paid
- **AND** its lines stop reducing effective availability.

#### Scenario: Session binding fails

- **WHEN** Stripe created a session but D1 cannot bind it
- **THEN** the Worker requests session expiry
- **AND** changes the order to not_paid only after non-payable state is confirmed.

#### Scenario: Metadata webhook arrives

- **WHEN** a verified Stripe event contains the app order ID for a sessionless pending order
- **THEN** reconciliation can recover and bind that session identity before applying its guarded outcome.

### Requirement: Provider-confirmed outcomes consume or release the hold once

The system SHALL use compare-and-set order transitions so paid stock consumption and non-paid release occur at most once.

#### Scenario: Verified payment succeeds

- **WHEN** first paid reconciliation changes pending_payment to paid
- **THEN** StockChange rows and Stock and OnlineStock decrements commit in the same transaction
- **AND** replay does not repeat them.

#### Scenario: Checkout remains asynchronously pending

- **WHEN** checkout completes without a final paid or failed outcome
- **THEN** the order remains pending_payment
- **AND** its lines continue to hold availability.

#### Scenario: Verified expiry or asynchronous failure arrives

- **WHEN** the event changes pending_payment to not_paid
- **THEN** no stock decrement occurs
- **AND** the lines stop reducing effective availability.

#### Scenario: Local expiry is observed

- **WHEN** local time has passed checkoutExpiresAt
- **THEN** the system does not release a session-bound order without Stripe-confirmed terminal non-payable state.
