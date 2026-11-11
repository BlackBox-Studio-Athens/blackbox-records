## ADDED Requirements

### Requirement: A recount records the shelf and keeps owed copies out of sale

Stock SHALL count copies free to sell. Owed copies SHALL be the copies in paid orders for the variant that are not marked shipped. A recount SHALL take the copies on the shelf and SHALL store, in the same atomic write, stock equal to the shelf minus the owed copies at that moment, never below zero, with online stock no higher than that. The `StockCount` entry SHALL keep the shelf count and the owed copies. Every stock read for staff SHALL include the owed copies.

#### Scenario: Shelf count after a pre-order arrives

- **GIVEN** 50 copies are in paid orders not yet shipped
- **WHEN** staff record 300 copies on the shelf
- **THEN** stock becomes 250 and the count entry keeps 300 on the shelf and 50 owed
- **AND** shoppers can buy at most 250.

#### Scenario: The shelf holds fewer copies than are owed

- **GIVEN** 50 copies are owed
- **WHEN** staff record 40 copies on the shelf
- **THEN** stock becomes 0 and the response reports a shortfall of 10
- **AND** staff see that 10 owed copies are missing.

#### Scenario: An order ships

- **WHEN** staff mark an order shipped
- **THEN** its copies are no longer owed and stock does not change.

#### Scenario: A sale lands during the recount

- **WHEN** a paid checkout consumes a copy while staff submit a recount
- **THEN** the revision check rejects whichever write is stale, so the owed copies used are the ones current at the write.
