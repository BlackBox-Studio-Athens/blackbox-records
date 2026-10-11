## ADDED Requirements

### Requirement: News supports an optional native Artist reference

Members SHALL be able to select, replace and remove an Artist in a News editor. Existing News without this field SHALL remain valid. Native saves, selected revisions, imports, preview and accepted snapshots SHALL preserve the selected Artist identity. Invalid supplied references SHALL be rejected, and publication or preview SHALL require the selected Artist in the accepted or explicitly reviewed content.

#### Scenario: Member selects or removes an Artist

- **WHEN** the member selects an existing Artist in News
- **THEN** autosave preserves that native reference
- **AND** removing it leaves valid general news without a genre tag
- **AND** Release Artist selection remains required.

#### Scenario: A selected News revision differs from its current draft

- **WHEN** review, preview or publication reads a saved News revision
- **THEN** its Artist comes from that selected revision's native relation snapshot
- **AND** a newer draft's Artist or genre does not replace it.

#### Scenario: Selected Artist has not been published

- **WHEN** review or preview includes News linked to an Artist absent from the accepted snapshot
- **THEN** the existing dependency flow asks for that Artist to be included in the same review
- **AND** unresolved publication references never enter an accepted snapshot.

#### Scenario: CMS already contains content

- **WHEN** explicit catalog-schema preparation adds the optional News Artist reference
- **THEN** existing News, drafts, revisions and accepted publication pointers remain intact
- **AND** repeating preparation does not create a duplicate field or overwrite content.
