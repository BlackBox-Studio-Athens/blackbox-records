## ADDED Requirements

### Requirement: Delivery quote failures recover in place

The system SHALL distinguish temporary delivery quote read failures from an authoritative unavailable cart and SHALL offer an explicit retry using the current cart after a temporary failure.

#### Scenario: Temporary failure followed by recovery

- **WHEN** a populated cart's delivery read fails through transport or server failure
- **THEN** the summary explains that delivery could not be calculated and offers Try delivery again
- **AND** retry preserves items, quantities and the newsletter choice without reloading
- **AND** progress is announced and repeated activation cannot start duplicate requests
- **AND** payment remains disabled until a current authoritative quote succeeds.

#### Scenario: Retry fails again

- **WHEN** an explicit retry fails temporarily
- **THEN** the shopper can retry again and no previous total authorizes payment.

#### Scenario: Cart is unsupported

- **WHEN** the Worker successfully returns no quote or rejects the cart as invalid or ineligible
- **THEN** the summary asks the shopper to review the cart instead of presenting a temporary service error
- **AND** payment remains disabled.

#### Scenario: Cart changes or summary unmounts during a request

- **WHEN** a quote request is abandoned through a cart change or unmount
- **THEN** its late success or failure cannot overwrite the current cart's quote state
- **AND** any changed cart requires its own authoritative quote before payment is enabled.
