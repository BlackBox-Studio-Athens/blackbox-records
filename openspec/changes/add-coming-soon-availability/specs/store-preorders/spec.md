# Spec Delta

## MODIFIED Requirements

### Requirement: Staff put a variant on pre-order with a ship estimate

Protected stock operations SHALL let staff put one Store Item variant on pre-order with a Ship Estimate that is either a month, optionally early, mid or late, or an exact date. The write SHALL be revision-checked and SHALL NOT change stock quantities or ledger entries.

#### Scenario: Start a pre-order with a month

- **WHEN** staff switch Pre-order on, choose a month that has not passed and save
- **THEN** the variant is on pre-order with that estimate and its stock revision advances
- **AND** physical and online quantities and the stock history are unchanged.

#### Scenario: Change the estimate

- **WHEN** staff change the month, its part, or switch between a month and an exact date on an open pre-order
- **THEN** the new estimate replaces the old one and the pre-order continues as the same pre-order.

#### Scenario: End the pre-order

- **WHEN** staff press Copies arrived or switch Pre-order off
- **THEN** the pre-order ends at once and the item reads as an ordinary Store Item.

#### Scenario: Release stage and physical pre-order are independent

- **WHEN** staff edit Release stage or the linked Store Item's Pre-order toggle
- **THEN** each control explains that Release stage describes music only, and Pre-order and the zero-stock state describe physical copies
- **AND** changing Release stage does not start or end the physical pre-order or change the zero-stock state; Released music can still have an open pre-order or read Coming Soon.

#### Scenario: Invalid or stale input

- **WHEN** the month has already passed, the date is today or earlier, the value is malformed, or the submitted stock revision is stale
- **THEN** the request is rejected, nothing is saved, and staff can refresh and retry.

#### Scenario: Stock was never recorded

- **WHEN** staff start a pre-order for a variant with no stock record
- **THEN** a zero-quantity stock record is created with the pre-order, and shoppers see the zero-stock state, Sold Out by default, until copies are entered.

### Requirement: Pre-order copies are ordinary stock and payment is unchanged

Expected copies SHALL be recorded as the ordinary stock quantity. A pre-order SHALL use the same checkout, payment, stock hold and paid reconciliation as any purchase, and pre-order surfaces SHALL NOT add a deposit, a deferred charge, a consent step, or a cancellation or refund promise.

#### Scenario: Shopper pays for a pre-order

- **WHEN** a shopper checks out a cart containing a pre-order item
- **THEN** the hosted payment session is created exactly as for in-stock items and charges the full amount
- **AND** the stock hold and paid stock decrement behave as for any item.

#### Scenario: Copies run out

- **WHEN** effective online stock of a pre-order item reaches zero
- **THEN** it reads its zero-stock state, Coming Soon, Repressing or Sold Out, and cannot be bought.

#### Scenario: Shopper reads pre-order copy

- **WHEN** any pre-order surface or email is shown
- **THEN** it states that payment is taken in full at order and when the item is expected to ship
- **AND** it makes no promise about cancelling or refunding beyond the existing returns information.

### Requirement: Store cards match the approved pre-order lifecycle references

Store listing cards SHALL retain the supplied 5 October pre-order lifecycle composition: full square artwork, optional Listen, source-cased Veneer title, quiet Inter “by ARTIST” credit and format metadata, left-aligned status badges and stable bottom price/action. Reference annotations SHALL NOT appear as shopper interface copy.

#### Scenario: Lifecycle state changes

- **WHEN** music is unreleased, released with physical copies on pre-order, or its pre-order has ended
- **THEN** the appropriate release/ship badges and Pre-order or ordinary Buy action follow authoritative lifecycle data without altering card geometry.

#### Scenario: Active pre-order copies become unavailable

- **WHEN** an active pre-order has no buyable copies
- **THEN** its actual zero-stock badge, Coming Soon, Repressing or Sold Out, is visible beside a genuinely disabled gray Pre-order control as in the approved reference
- **AND** ordering remains unavailable and ordinary unavailable cards keep their existing purchase-slot status treatment.

#### Scenario: Card metadata is long or the viewport is narrow

- **WHEN** cards display long identities or month/exact/unknown ship estimates at 320px, 390px, 430px or desktop widths
- **THEN** artwork remains intact and titles, badges, prices and actions remain readable without document overflow
- **AND** filters, navigation, cart operations and persistent listening retain their existing behavior.
