# Spec Delta

## ADDED Requirements

### Requirement: Global review offers saved-change discard

Global Review changes SHALL offer confirmed per-entry discard for saved records with live and draft revisions and no pending publication, using the existing revision-checked operation.

#### Scenario: Discard from global review

- **WHEN** a member chooses Discard saved changes and confirms the named eligible entry
- **THEN** only that draft is discarded using its reviewed current revision
- **AND** the list and saved selection refresh, later review uses the refreshed selection, and published content is unchanged
- **AND** repeated submission is disabled while discard is pending.

#### Scenario: Cancellation or conflict

- **WHEN** confirmation is cancelled or the submitted revision is stale
- **THEN** cancellation writes nothing and conflict rejection preserves the newer draft
- **AND** unrelated review selection is retained.

#### Scenario: Incomplete or never-published entry

- **WHEN** an incomplete saved draft has a live revision
- **THEN** completeness does not prevent discard
- **AND** never-published entries and entries with pending publication have no saved-change discard action.

### Requirement: Review controls reflect actionable changes

Review changes controls SHALL be visually and functionally disabled when their scope has no changes. Loading and read failure SHALL remain distinct from confirmed emptiness.

#### Scenario: Editor change state

- **WHEN** an editor has unsaved differences or saved unpublished differences
- **THEN** review is available subject to existing save/conflict guards
- **AND** unchanged or reverted content disables review, while autosave alone does not disable an unpublished change.

#### Scenario: Empty global review

- **WHEN** unfiltered discovery completes without changed entries
- **THEN** shell and Overview controls are disabled for mouse and keyboard with No changes to review feedback
- **AND** filtered emptiness or an empty page with a continuation does not establish global emptiness
- **AND** a newer saved revision with identical publishable values is not counted as a change.

#### Scenario: A meaningful field changes

- **WHEN** a member changes a slug, media identity or description, list order, or rich-text formatting
- **THEN** comparison preserves that difference as reviewable content
- **AND** matching saved revision IDs do not hide newer unsaved editor changes.

#### Scenario: Loading or failure

- **WHEN** change discovery is pending or fails
- **THEN** controls expose checking or recoverable error feedback instead of claiming no changes
- **AND** existing pending-publication recovery stays reachable.

#### Scenario: Refreshed review state

- **WHEN** save, discard, publication, or existing focus recovery refreshes change state
- **THEN** controls reflect that state without interval polling or an exact count
- **AND** empty or actually unchanged selected comparisons cannot advance to publication.
- **AND** shell and Overview share discovery rather than scanning once per control or keystroke.

### Requirement: Catalog artwork resolves to private thumbnails

Staff catalog rows with valid artwork and a prepared derivative SHALL render that derivative through existing private delivery. Missing derivatives SHALL use the existing preparation workflow for repair.

#### Scenario: Release artwork is prepared

- **WHEN** staff opens the release list, including the reported Disintegration case
- **THEN** each prepared artwork reference resolves to the correct loadable private thumbnail
- **AND** pagination and list-return context remain intact.

#### Scenario: Artwork cannot load

- **WHEN** artwork is absent, a derivative is missing, or its request fails
- **THEN** the row retains a stable placeholder without retry loops or original-image fallback
- **AND** existing private-access and derivative size limits remain enforced.
