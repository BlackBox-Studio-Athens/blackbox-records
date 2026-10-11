# Spec Delta

## ADDED Requirements

### Requirement: Staff control the per-item copies-left notice

The protected stock detail SHALL provide a per-variant Show copies left switch backed by the stock record, defaulting to off for new and existing items. Writes SHALL be revision-checked and SHALL NOT alter quantities, restock intent or ledger entries.

#### Scenario: Enable the notice

- **WHEN** staff turns on Show copies left for the selected item
- **THEN** the stock record persists the flag and advances its revision
- **AND** the switch reflects the saved value.

#### Scenario: A concurrent stock update occurs

- **WHEN** the submitted stock revision is stale
- **THEN** the update is rejected, the stored flag is unchanged, and staff can refresh before retrying.
