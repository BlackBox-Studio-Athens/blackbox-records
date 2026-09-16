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

- **WHEN** a member opens the preview, changes preview context, or manually refreshes
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

The workspace SHALL offer searchable content selection, an optional wide editor/preview split, narrow-screen Edit/Preview tabs, helpful action copy, semantic state colors with text, and keyboard-accessible controls. Publication state SHALL remain visible near the top with history available on demand.

#### Scenario: Member selects content

- **WHEN** a member opens a record
- **THEN** a compact searchable selector replaces the permanent record column and unsaved-change protection remains active across navigation and media.

#### Scenario: Publication is pending or fails

- **WHEN** a publication is pending
- **THEN** the top bar distinguishes pending from live and refreshes at bounded intervals while visible
- **AND** failure stays visible with a manual refresh or retry path, without inventing titles or authors absent from the history contract.

#### Scenario: A workflow fails before content capture

- **WHEN** an accepted publication starts a hosted workflow
- **THEN** the existing dispatcher is kicked immediately and the workflow registers its run before release validation
- **AND** failure or cancellation is acknowledged or reconciled to Failed without overriding a deployment awaiting verification.

#### Scenario: A member checks a long publication

- **WHEN** a publication remains pending
- **THEN** Refresh publication status is available directly in the top bar
- **AND** visible-page polling uses 15-second intervals for two minutes, then 30-second intervals up to thirty minutes, without overlapping refreshes
- **AND** returning to the page checks immediately, settlement stops polling, and expiry leaves an honest pending state with manual refresh.

#### Scenario: An older preview is still displayed

- **WHEN** the current editor inputs differ from the displayed frame's inputs
- **THEN** the frame is labelled outdated, never up to date
- **AND** diagnostic evidence may contain numeric request/display generations and readiness outcomes but no editorial text.

### Requirement: Preview security and failures work across supported browsers

The workspace SHALL permit validated same-environment preview assets in Firefox and Chromium without weakening script, form, connection, or private media restrictions. Preview failures SHALL have bounded private diagnostics that exclude editorial content and credentials.

#### Scenario: Firefox renders the preview

- **WHEN** a member opens a preview in Firefox
- **THEN** the explicit environment origin permits its styles, images and fonts
- **AND** unauthorized external assets, scripts and submissions remain blocked.

#### Scenario: A preview fails

- **WHEN** a current preview request or asset fails
- **THEN** an error-only disclosure offers a copyable diagnostic reference
- **AND** at most one best-effort report correlates with server logs, with a 4 KB limit and ten reports per minute per authenticated member.

### Requirement: Staff editing defaults to focused content work

Staff roots and brand navigation SHALL lead to Content. Desktop preview SHALL start closed and remember the browser preference. Copy and icons SHALL help members act without exposing routine implementation details.

#### Scenario: Member hides and reopens preview

- **WHEN** the member hides preview
- **THEN** preview requests stop and the editor uses available space without losing edits or position
- **AND** reopening immediately renders current data; narrow screens independently start in Edit.

#### Scenario: Member opens the backoffice

- **WHEN** a member opens a staff root or follows the brand link
- **THEN** Content opens while existing deep links remain valid
- **AND** UAT has one Test environment marker and save/publication states remain distinct.
