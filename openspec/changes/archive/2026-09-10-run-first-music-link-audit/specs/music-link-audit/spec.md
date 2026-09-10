## ADDED Requirements

### Requirement: Applied provider corrections remain traceable

Every provider correction applied from a music-link audit SHALL remain reviewable from the `Verified` row that authorized it without a second report format.

#### Scenario: Verified correction is recorded

- **WHEN** a `Verified` row authorizes a content edit
- **THEN** the audit records the source content path, target field, old value or absence, replacement, and decisive evidence
- **AND** the report and correction are committed in the same implementation change

#### Scenario: Audit produces no verified correction

- **WHEN** no candidate reaches `Verified`
- **THEN** the completed audit contains zero content edits
