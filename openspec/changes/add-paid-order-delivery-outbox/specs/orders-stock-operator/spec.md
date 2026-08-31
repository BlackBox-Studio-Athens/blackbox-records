## ADDED Requirements

### Requirement: First paid reconciliation includes fulfillment and delivery work

The system SHALL extend the single first-paid transaction with complete paid-order facts and applicable PaidOrderDelivery rows.

#### Scenario: Paid reconciliation succeeds

- **WHEN** a pending-payment CheckoutOrder completes first verified paid reconciliation
- **THEN** its order state, stock effects, fulfillment fields, line snapshots, and delivery rows commit together
- **AND** external providers are called only after commit.

#### Scenario: Paid event is replayed

- **WHEN** another paid event identifies the already paid CheckoutOrder
- **THEN** order facts and stock are not rewritten
- **AND** any existing pending deliveries may use their independent claim path.

### Requirement: Protected order reads support manual operations without public leakage

The system SHALL expose validated paid fulfillment and delivery status to authenticated operators only.

#### Scenario: Operator reads a current paid order

- **WHEN** the protected no-store order API returns it
- **THEN** the response includes the approved order, line, delivery, and safe diagnostic fields needed for manual operations.

#### Scenario: Shopper reads checkout status

- **WHEN** a public checkout response is generated
- **THEN** it omits shopper contact, delivery address, delivery attempts, provider identifiers, and safe failure reasons.
