## ADDED Requirements

### Requirement: CheckoutOrder transitions are compare-and-set

The system MUST apply paid and non-paid transitions only from pending_payment and MUST keep paid, not_paid, and needs_review terminal.

#### Scenario: Paid transition wins

- **WHEN** first paid reconciliation changes the order to paid
- **THEN** later expiry, failure, unpaid, or replayed events change no row.

#### Scenario: Non-paid transition wins

- **WHEN** verified expiry or asynchronous failure changes the order to not_paid
- **THEN** a later stale paid or non-paid update cannot silently overwrite it
- **AND** no stock mutation occurs.

### Requirement: Paid reconciliation consumes held stock atomically

The system SHALL commit first paid order state and stock effects in one transaction.

#### Scenario: Held checkout is paid

- **WHEN** sufficient physical and online stock still exists
- **THEN** deterministic StockChange rows, Stock decrement, OnlineStock decrement, and paid order state commit together.

#### Scenario: Operator reconciliation removed held stock

- **WHEN** the held quantity can no longer be consumed safely
- **THEN** no partial stock mutation commits
- **AND** the order follows the established needs-review outcome.

### Requirement: Uncertain provider binding remains operator-actionable

The system MUST preserve a pending hold when a created provider session cannot be proven non-payable.

#### Scenario: Session expiry cannot be confirmed

- **WHEN** post-provider binding compensation cannot confirm terminal state
- **THEN** the order remains pending_payment
- **AND** redacted diagnostics identify it for metadata-webhook recovery or operator reconciliation.
