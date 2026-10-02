# Spec Delta

## ADDED Requirements

### Requirement: Pre-order terms are canonical

The system SHALL use `Pre-order` for a Store Item variant sold before its copies arrive, `Ship Estimate` for the stated month or exact date, and `Awaiting Stock` for a paid order waiting on an open pre-order.

#### Scenario: A pre-order is named

- **WHEN** specs, code, tests, docs or UI copy describe an item sold before its copies arrive
- **THEN** they use `Pre-order`, written `Pre-order` in shopper and staff copy and `preorder` in identifiers
- **AND** they do not call it a backorder, reservation, deposit or presale.

#### Scenario: A ship estimate is named

- **WHEN** the expected shipping time of a pre-order is described
- **THEN** it is the `Ship Estimate`, worded to shoppers as ships around a month or on a date
- **AND** it is not called a delivery date, release date or dispatch guarantee.

#### Scenario: Release date and ship estimate differ

- **WHEN** a pre-order belongs to a release
- **THEN** the release date names when the music is out and stays editorial
- **AND** the Ship Estimate names when the physical copies are expected to ship and stays with stock.

#### Scenario: A waiting order is named

- **WHEN** a paid order contains a line from an open pre-order
- **THEN** it is `Awaiting Stock`, a derived state
- **AND** it is not an order status and does not replace paid, fulfilment or notification states.
