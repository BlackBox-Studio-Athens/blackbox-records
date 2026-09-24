## MODIFIED Requirements

### Requirement: Private previews faithfully render unsaved editorial content

The content workspace SHALL render the selected unsaved record with the public site''s presentation and same-environment published surrounding content. Preview SHALL remain authenticated, uncached, bounded, and free of save, publication, commerce, or submission side effects. It SHALL identify its environment and code basis. Preview SHALL not request or display a new render while the current editorial data fails shared Content validation.

#### Scenario: Member edits while preview is visible

- **WHEN** an authorized member pauses editing for 750 ms with valid editorial data
- **THEN** the visible preview updates with those unsaved changes and actual public typography, images, rich text, and layout
- **AND** superseded responses cannot replace newer output and scroll position is retained.

#### Scenario: Preview cannot render

- **WHEN** content is valid but media or references are unavailable, or authentication expires
- **THEN** the workspace explains that preview could not update
- **AND** any previous rendering remains visible, is marked outdated, and no changes are saved or published.

#### Scenario: Member retries failed preview assets

- **WHEN** a stylesheet or image fails and the member refreshes unchanged content
- **THEN** the workspace reloads the preview assets and reports success only after they load
- **AND** failed or superseded replacements cannot remove the last successful preview or lose edits.

#### Scenario: Initial Staff sign-in also authorizes Preview

- **WHEN** a member signs into Staff through Google in an environment configured for shared preview sign-in
- **THEN** its Access application issues authorization cookies for both exact Staff and Preview hostnames before returning to the editor, without a second interactive sign-in
- **AND** both hosts validate that environment's application audience while keeping separate browser origins and verified identity/context ownership checks.

#### Scenario: Preview session needs recovery

- **WHEN** the member is signed into the editor but the isolated preview hostname requires authentication
- **THEN** a bounded credentialed connection check fails before the preview iframe is mounted and offers sign-in in a separate top-level tab followed by retry
- **AND** current edits and the previous successful preview remain available, diagnostics identify the access phase, and only the configured staff origin can read the authenticated connection response
- **AND** login frame restrictions and preview authentication remain enforced.

#### Scenario: Firefox Distro preview times out

- **WHEN** the Band in the Pit Distro record 01M2J1EK7DF73T79TJRN083EP6 times out in Firefox
- **THEN** the workspace keeps the last successful preview visible and provides a copyable failure reference
- **AND** the existing redacted Worker report correlates the request and release with the last readiness phase, without editorial content or credentials.

#### Scenario: Frame and gallery images load after a preview-service restart

- **WHEN** the preview service restarts after a valid preview is created but before its frame or a lazy image is requested
- **THEN** the preview remains available to the same authenticated editor until its 15-minute expiry
- **AND** failure logs correlate with the browser's request ID and record resource type, failure phase, response status, and elapsed time without draft content or private media paths.

#### Scenario: Member returns to a hidden editor tab

- **WHEN** a member switches away from the editor and returns while its preview inputs are unchanged
- **THEN** the last successful iframe remains visible and no new preview request is made while its context is valid
- **AND** returning after the preview context expires starts a fresh request.

#### Scenario: Member waits for a preview update

- **WHEN** the workspace is updating a preview
- **THEN** a compact inline Lattice Loader appears beside the status while the last successful preview remains visible
- **AND** reduced-motion preferences disable its animation.

#### Scenario: Member checks Distro listing and detail

- **WHEN** the member views the Band in the Pit Distro record in Detail page and Listing modes
- **THEN** both views show the same title, artist, and format
- **AND** Detail page additionally shows the record description, purchase information, release date, and gallery.

#### Scenario: Member opens or refreshes a preview

- **WHEN** a member opens the preview, changes preview context, or manually refreshes valid content
- **THEN** preview requests start without an editing debounce
- **AND** independent published reads overlap with no more than four active CMS reads per request and repeated reads are deduplicated.

#### Scenario: Preview is accessed outside the editor

- **WHEN** a request lacks authorized identity, same-origin validation, or a supported editorial payload
- **THEN** access is rejected without disclosing draft HTML or changing content.

#### Scenario: Member reviews responsive content

- **WHEN** the member selects Fit, Desktop, Mobile, or Expand
- **THEN** the preview uses the requested viewport width and preserves edits
- **AND** it uses the isolated real public renderer described by make-editorial-preview-one-to-one; public navigation, scripts, and players work within that context while checkout and form delivery remain blocked.

#### Scenario: Member edits invalid content

- **WHEN** a current field, relationship, image, or nested row fails shared Content validation
- **THEN** the affected editor field shows its validation message
- **AND** no preview request is sent for the invalid data
- **AND** the last successful preview remains visible and is labeled outdated when one exists.

## ADDED Requirements

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

- **WHEN** the current editor inputs differ from the displayed frame''s inputs
- **THEN** the frame is labelled outdated, never up to date
- **AND** diagnostic evidence may contain numeric request/display generations and readiness outcomes but no editorial text.

### Requirement: Preview security and failures work across supported browsers

The workspace SHALL permit validated same-environment preview assets in Firefox and Chromium under the isolated-origin script, form, connection and private-media boundary specified by make-editorial-preview-one-to-one. Preview failures SHALL have bounded private diagnostics that exclude editorial content and credentials.

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
