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
