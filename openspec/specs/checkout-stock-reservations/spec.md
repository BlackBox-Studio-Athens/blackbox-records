# checkout-stock-reservations Specification

## Purpose

Defines temporary checkout stock holds by reusing pending CheckoutOrders and their lines, without a second reservation model or counter.

## Requirements

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
- **THEN** the session has the app order ID in private metadata and the 35-minute target calculated immediately before the provider call
- **AND** its session ID and accepted expiry are bound to the existing pending order, preserving unique session identity.

#### Scenario: Provider creation fails

- **WHEN** provider non-creation is definitive
- **THEN** the sessionless pending order changes to not_paid
- **AND** its lines stop reducing effective availability.

#### Scenario: Provider creation is uncertain

- **WHEN** a timeout, network failure, provider 5xx, or unusable success response leaves creation uncertain
- **THEN** the pending hold and any known Session identity remain available for recovery
- **AND** local time or the error response alone does not release the hold.

#### Scenario: Session binding fails

- **WHEN** Stripe created a session but D1 cannot bind it
- **THEN** the Worker requests session expiry
- **AND** changes the order to not_paid only after non-payable state is confirmed.

#### Scenario: Metadata webhook arrives

- **WHEN** a verified Stripe event contains the app order ID for a sessionless pending order
- **THEN** reconciliation can recover and bind that session identity and accepted expiry before applying its guarded outcome.

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

### Requirement: One checkout attempt retains one durable hold across retries

The system SHALL associate each keyed checkout attempt with one durable request identity, immutable accepted input, and at most one pending CheckoutOrder hold, independently of client retries or process restarts.

#### Scenario: A successful response is lost

- **WHEN** the client repeats the same checkout key and normalized input after acknowledgement loss
- **THEN** the Worker resolves the original attempt without creating another order, stock hold, or payable Session
- **AND** an existing open Session is returned only through current launch/capability and provider-state checks.

#### Scenario: Duplicate starts arrive concurrently

- **WHEN** matching keyed requests race
- **THEN** they share one committed request identity and hold
- **AND** a request still being processed yields documented bounded retry guidance rather than a second effect.

#### Scenario: A key is reused for changed input

- **WHEN** a request uses an existing key with a different normalized payload
- **THEN** it returns a conflict without creating or changing a checkout attempt.

#### Scenario: A shopper intentionally starts another checkout

- **WHEN** the shopper starts a new explicit attempt using a new request key
- **THEN** it is independently validated even if its cart matches an earlier attempt
- **AND** identical cart contents alone do not identify a duplicate.

### Requirement: Checkout retry identity preserves provider uncertainty and terminal state

The system MUST retain original provider request identity/parameters and pending-hold safety across uncertain creation, and MUST NOT silently reopen terminal attempts under the same key.

#### Scenario: Provider response is uncertain

- **WHEN** network failure, timeout, provider 5xx, or acknowledgement loss leaves creation uncertain
- **THEN** the existing hold and original provider request identity remain available for bounded recovery
- **AND** no replacement key or duplicate payable Session is created merely because of the error.

#### Scenario: Provider key retention has elapsed

- **WHEN** an uncertain attempt is retried beyond the provider's guaranteed idempotency retention
- **THEN** the system resolves durable Session identity through supported recovery or reports an unresolved/review outcome
- **AND** it does not blindly repeat creation or release a potentially payable hold.

#### Scenario: Price or delivery policy changes before retry

- **WHEN** the same caller intent is retried after a server-side price, parcel tariff or monetary-policy change
- **THEN** lookup resolves the original attempt before new quote/reconciliation/reservation work and reuses its immutable accepted provider parameters
- **AND** current launch/capability and provider-state checks still apply without a second hold or repricing the original attempt
- **AND** existing monetary snapshots, paid/review finalization and outbox replay remain authoritative.

#### Scenario: An attempt is terminal

- **WHEN** a completed, expired, or review-required attempt is retried with its old key
- **THEN** the caller receives a safe terminal/conflict outcome
- **AND** any new payable attempt requires new explicit intent and identity.

### Requirement: Checkout request identity remains bounded and compatible

The system SHALL keep retry identity separate from StoreCart, restrict it to its operation/environment, retain its association with the parent order, and document the staged contract migration.

#### Scenario: A public retry is inspected

- **WHEN** a retry is logged or returned to an anonymous caller
- **THEN** raw retry keys, private order data, credentials, and provider identifiers are not exposed
- **AND** the key cannot retrieve unrelated operations or private order details.

#### Scenario: Clients migrate to required keys

- **WHEN** key support is rolled out across independent server/client releases
- **THEN** the compatibility bridge explicitly identifies keyless legacy calls as outside retry protection
- **AND** final acceptance requires keys on maintained checkout clients and safe rejection of keyless new attempts.

#### Scenario: Another operation already has retry identity

- **WHEN** an item, price or selected-record/batch publication request uses its existing durable operation ID
- **THEN** that accepted identity and recovery contract remain unchanged
- **AND** neither those operations nor the read-only delivery-quote POST acquire a checkout idempotency-header requirement.
