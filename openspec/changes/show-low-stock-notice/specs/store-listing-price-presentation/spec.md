# Spec Delta

## ADDED Requirements

### Requirement: Listing projection carries an opt-in copies-left count

The listing-price projection SHALL add an optional lowStockQuantity to a ready record only when staff enabled the item's copies-left notice, its availabilityState is stocked, and its effective stock is between 1 and 5. All other records SHALL carry no stock count.

#### Scenario: A scarce item has the notice enabled

- **GIVEN** an item's copies-left notice is enabled and its effective stock is 3
- **WHEN** the listing projection is read
- **THEN** its ready record reports availabilityState stocked and lowStockQuantity 3
- **AND** the projection still uses one bulk query without provider reads or writes.

#### Scenario: The count does not qualify

- **WHEN** the notice is disabled, effective stock exceeds 5 or is 0, the item is not stocked, or its price is unavailable
- **THEN** the record has no lowStockQuantity.

#### Scenario: A Store card presents copies left

- **WHEN** a stocked card's ready record carries lowStockQuantity N
- **THEN** its status slot shows Only N left beside the price and Buy remains available
- **AND** a stocked record without the count keeps the status slot hidden.
