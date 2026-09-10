## ADDED Requirements

### Requirement: Manual Greek fulfillment uses the persisted paid order

The system SHALL use validated Worker-owned paid-order fields as the normal manual fulfillment handoff.

#### Scenario: Operator prepares a paid Greek order

- **WHEN** the protected order read returns complete current paid fulfillment
- **THEN** it supplies the recipient, contact, Greek address, order reference, and immutable line summary
- **AND** normal fulfillment does not require a fresh Stripe read.

#### Scenario: Paid fulfillment is incomplete

- **WHEN** required persisted fulfillment data is missing or invalid
- **THEN** the order is presented as operator-actionable
- **AND** it is not presented as ready for normal fulfillment.
