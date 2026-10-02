# Spec Delta

## ADDED Requirements

### Requirement: Orders can be filtered to those awaiting stock

The order workspace SHALL let staff filter to paid orders that are Awaiting Stock and SHALL show that state in the list and in order detail. The filter SHALL apply on the server before pagination and SHALL remain read-only.

#### Scenario: Operator filters awaiting stock

- **WHEN** the operator turns on Awaiting stock
- **THEN** the protected query returns only paid orders with a line from a pre-order that is still open
- **AND** search, email-status filtering, Next and Previous keep working with the filter on.

#### Scenario: No pre-order is open

- **WHEN** no variant has an open pre-order
- **THEN** the filtered list is empty and says so without an error.

#### Scenario: Operator inspects an awaiting order

- **WHEN** an awaiting order appears in the list or is opened
- **THEN** it is marked Awaiting stock, and each pre-order line shows the Ship Estimate the shopper was shown
- **AND** no payment, stock, order, notification or dispatch mutation is offered or performed.

#### Scenario: Filter is restored from the address

- **WHEN** the workspace opens with the awaiting-stock filter in its address, or the operator uses Back
- **THEN** the filter and list are restored
- **AND** an unrecognised value for it is rejected like other invalid workspace addresses.
