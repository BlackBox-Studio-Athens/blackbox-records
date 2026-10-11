# Spec Delta

## ADDED Requirements

### Requirement: Saved-draft discard is not publication history restoration

Discarding a saved draft SHALL affect only the current unpublished draft. It
SHALL NOT publish content, alter the accepted public snapshot, or add a
restore/undo action to read-only historical publication entries.

#### Scenario: Member discards the current draft

- **WHEN** a member discards saved changes on a published record
- **THEN** the accepted public snapshot and its public rendering remain the
  same
- **AND** the editor returns to the currently live content.

#### Scenario: Member reviews an older publication

- **WHEN** a member opens publication history for an older revision
- **THEN** history remains read-only and exposes no restore or undo control
- **AND** the member must use normal editing and publication to create a new
  change.
