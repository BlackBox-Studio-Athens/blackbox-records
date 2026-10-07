# Spec Delta

## ADDED Requirements

### Requirement: Availability terms are canonical

The system SHALL name physical availability with one vocabulary: Buy for orderable stock, Pre-order for orderable copies not yet here, Coming Soon for copies on the way that cannot be ordered yet, Repressing for a sold-out edition being pressed again, Sold Out for an edition with no more copies planned, and Unavailable for any other non-orderable state. Shopper copy SHALL write them in Title Case. Identifiers SHALL use stocked, coming_soon, repressing, sold_out and unavailable.

#### Scenario: Zero stock is described

- **WHEN** specs, code, tests, docs or UI copy describe an edition with no copies available online
- **THEN** they use Coming Soon, Repressing or Sold Out according to the staff choice
- **AND** they do not use Out of Stock, Currently Unavailable, Back soon, Awaiting stock or coming later.

#### Scenario: Coming Soon and Pre-order differ

- **WHEN** copies are on the way
- **THEN** Pre-order names the state in which shoppers can pay now, and Coming Soon the state in which they cannot
- **AND** an expected month is worded Expected Month YYYY and never as a Ship Estimate or delivery promise.

#### Scenario: An availability alert is named

- **WHEN** a shopper's request to be emailed once an edition becomes orderable is described
- **THEN** it is an `Availability Alert`, labelled Notify me to shoppers
- **AND** it is not called a newsletter subscription, waitlist or reservation.
