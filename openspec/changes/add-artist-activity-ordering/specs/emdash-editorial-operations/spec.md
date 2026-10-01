## ADDED Requirements

### Requirement: Staff controls Artist activity

The Artist editor SHALL provide an Active artist switch below Artist name, with Active or Inactive state text. New and legacy entries without activity SHALL display Active without a save on open. Activity SHALL use existing private autosave, revision recovery, preview and explicit publication. False activity SHALL survive native storage and publication.

#### Scenario: Staff edits activity using a keyboard

- **WHEN** a member focuses and toggles Active artist
- **THEN** the control exposes its switch role, checked state and visible focus
- **AND** the state text updates and the boolean joins the ordinary private draft without discarding other fields.

#### Scenario: Staff reopens and publishes an inactive Artist

- **WHEN** a saved inactive draft is reopened and its reviewed revision is published
- **THEN** the switch remains Inactive and the accepted snapshot retains inactive activity
- **AND** native 0 remains false while native 1 remains true.

#### Scenario: Existing CMS schema is prepared again

- **WHEN** the release prepares the optional Artist activity field repeatedly
- **THEN** preparation is idempotent and retains all existing records and revisions
- **AND** an existing incompatible field type stops preparation with an actionable error.
