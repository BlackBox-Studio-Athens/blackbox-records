# Spec Delta

## MODIFIED Requirements

### Requirement: Shared website changes review

The staff workspace SHALL provide a protected `/review/` destination, linked from utilities and Overview, that discovers unpublished Website and Catalog entries, including catalog entries whose only change is an EmDash price draft, using EmDash APIs and accepted publication state. It SHALL retain incomplete drafts with blockers, expose pending publication state, and support search, area filtering and 25-entry pages without truncating discovery to the first source page.

#### Scenario: Publish one or several saved changes

- **WHEN** a member reviews up to twenty ready entries, including editorial changes linked to selling setup
- **THEN** one batch publishes exactly those reviewed versions, preserving unselected drafts, price drafts, stock and shop availability
- **AND** newer versions require renewed review, pending operations retain their identities, and shop activation and price drafts remain applied from the item's own publish review.

#### Scenario: Enter review from an editor

- **WHEN** the member chooses Publish changes in an editor
- **THEN** autosave finishes before the review opens with only that saved entry and its price draft selected
- **AND** failed saves and conflicts preserve local input and prevent publication.

#### Scenario: Return from editing

- **WHEN** a member returns to review after editing or a same-tab reload
- **THEN** selection and browse position are restored, and saved versions are rechecked before confirmation.
