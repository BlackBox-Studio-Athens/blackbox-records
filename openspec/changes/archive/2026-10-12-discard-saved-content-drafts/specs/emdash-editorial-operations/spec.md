# Spec Delta

## ADDED Requirements

### Requirement: Staff members can discard a saved draft

The staff workspace SHALL offer a separate, explicitly confirmed operation to
discard persisted draft changes for any editable content record that has both
a live revision and a draft revision. The operation SHALL use the current
revision for optimistic concurrency, SHALL leave the live public content
unchanged, and SHALL reload the editor to the resulting live content on
success.

#### Scenario: Member discards saved changes on a published record

- **WHEN** a member opens a saved record with both a live revision and a
  draft revision, chooses `Discard saved changes`, and confirms
- **THEN** the server removes the current draft using the submitted revision
- **AND** the public live content remains unchanged
- **AND** the editor shows the live content with no pending draft changes.

#### Scenario: Unsaved browser changes are still present

- **WHEN** a record has saved draft changes and additional unsaved browser
  edits
- **THEN** the saved-draft discard action is unavailable until the unsaved
  edits are discarded or saved
- **AND** the existing unsaved-change confirmation remains the only action
  that removes browser-local edits.

#### Scenario: Record has no live draft pair

- **WHEN** a record is new, has never been published, or has no current draft
  revision
- **THEN** the staff workspace does not offer the saved-draft discard action.

#### Scenario: Saved draft revision is stale

- **WHEN** the submitted revision no longer matches the server's current
  revision
- **THEN** the server rejects the operation without changing the record
- **AND** the editor retains the member's text and reports a reload/conflict
  action.
