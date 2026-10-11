# Spec Delta

## ADDED Requirements

### Requirement: Ready Store Offers carry the opt-in copies-left count

A ready Store Offer SHALL include an optional lowStockQuantity under the same rule as the listing projection, computed from effective stock after pending checkout holds. The count SHALL be presentation only and SHALL NOT change checkout eligibility.

#### Scenario: Item page shows copies left

- **WHEN** the item page reads a ready offer with lowStockQuantity N
- **THEN** it shows Only N left above Add To Cart as a status, not a control
- **AND** adding to the cart and checkout behave as for any ready offer.

#### Scenario: Offer without a qualifying count

- **WHEN** the notice is disabled or effective stock is outside 1–5
- **THEN** the offer has no lowStockQuantity and the item page shows no notice.
