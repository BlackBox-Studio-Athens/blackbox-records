# Spec Delta

## MODIFIED Requirements

### Requirement: Staff control per-item restock intent

The protected stock detail SHALL provide a per-variant choice, When sold out online, show: Coming Soon, Repressing or Sold Out, with an optional Expected month for the first two. It SHALL be backed by the stock record, use revision-checked writes, and SHALL not alter physical or online quantities. Stock detail SHALL also show how many shoppers are waiting for an availability alert.

#### Scenario: Set a restock plan

- **WHEN** staff choose Coming Soon, Repressing or Sold Out for the selected item
- **THEN** the stock record persists the choice and advances its revision
- **AND** the control reflects the saved value without changing stock quantities or ledger entries
- **AND** its help text says the choice is shown only while no copies are available online.

#### Scenario: Set an expected month

- **WHEN** staff enter a month that has not passed for a Coming Soon or Repressing item
- **THEN** the month is saved with the choice; choosing Sold Out clears it
- **AND** a passed or malformed month is rejected and nothing is saved.

#### Scenario: Stock has not been recorded

- **WHEN** staff choose Coming Soon or Repressing before the item's first stock count
- **THEN** the system creates a zero-quantity stock record with that choice.

#### Scenario: Choose restock intent during Store Item setup

- **WHEN** staff set up a new Store Item and choose a zero-stock state
- **THEN** the selected value and optional month are saved on the opening Stock row
- **AND** an omitted selection defaults to Sold Out.

#### Scenario: Shoppers are waiting

- **WHEN** the selected variant has pending availability alerts
- **THEN** stock detail shows the waiting count without any address.

#### Scenario: A concurrent stock update occurs

- **WHEN** the submitted stock revision is stale
- **THEN** the update is rejected and existing stock, zero-stock state and expected month remain intact
- **AND** staff can refresh the selected item before retrying.
