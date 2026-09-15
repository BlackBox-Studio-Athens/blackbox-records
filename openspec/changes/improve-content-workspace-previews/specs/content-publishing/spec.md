## ADDED Requirements

### Requirement: Private previews faithfully render unsaved editorial content

The content workspace SHALL render the selected unsaved record with the public site's presentation and same-environment published surrounding content. Preview SHALL remain authenticated, uncached, bounded, and free of save, publication, commerce, or submission side effects. It SHALL identify its environment and code basis.

#### Scenario: Member edits while preview is visible

- **WHEN** an authorized member pauses editing for 750 ms
- **THEN** the visible preview updates with those unsaved changes and actual public typography, images, rich text, and layout
- **AND** superseded responses cannot replace newer output and scroll position is retained.

#### Scenario: Preview cannot render

- **WHEN** content is invalid, media or references are unavailable, or authentication expires
- **THEN** the workspace explains that preview could not update
- **AND** any previous rendering is marked outdated and no changes are saved or published.

#### Scenario: Member retries failed preview assets

- **WHEN** a stylesheet or image fails and the member refreshes unchanged content
- **THEN** the workspace reloads the preview assets and reports success only after they load
- **AND** failed or superseded replacements cannot remove the last successful preview or lose edits.

#### Scenario: Member opens or refreshes a preview

- **WHEN** a member first opens a record, changes preview context, or manually refreshes
- **THEN** preview requests start without an editing debounce
- **AND** independent published reads overlap with no more than four active CMS reads per request and repeated reads are deduplicated.

#### Scenario: Preview is accessed outside the editor

- **WHEN** a request lacks authorized identity, same-origin validation, or a supported editorial payload
- **THEN** access is rejected without disclosing draft HTML or changing content.

#### Scenario: Member reviews responsive content

- **WHEN** the member selects Fit, Desktop, Mobile, or Expand
- **THEN** the preview uses the requested viewport width and preserves edits
- **AND** preview links, scripts, players, checkout, and form submissions remain inactive.

### Requirement: Content editing prioritizes the selected record and publication state

The workspace SHALL offer searchable content selection, a wide editor/preview split, narrow-screen Edit/Preview tabs, helpful action copy, semantic state colors with text, and keyboard-accessible controls. Publication state SHALL remain visible near the top with history available on demand.

#### Scenario: Member selects content

- **WHEN** a member opens a record
- **THEN** a compact searchable selector replaces the permanent record column and unsaved-change protection remains active across navigation and media.

#### Scenario: Publication is pending or fails

- **WHEN** a publication is pending
- **THEN** the top bar distinguishes pending from live and refreshes at bounded intervals while visible
- **AND** failure stays visible with a manual refresh or retry path, without inventing titles or authors absent from the history contract.
