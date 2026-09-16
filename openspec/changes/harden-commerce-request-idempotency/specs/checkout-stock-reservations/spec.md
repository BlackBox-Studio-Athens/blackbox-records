## ADDED Requirements

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
