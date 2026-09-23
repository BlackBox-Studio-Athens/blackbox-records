# content-publishing Specification

## Purpose

Publish editorial content independently of application code while keeping drafts private, deployments consistent, and live commerce independent of static builds.

## Requirements

### Requirement: Content publication does not release software

Content Publication SHALL publish a consistent content revision using the target environment's currently deployed approved code revision. It SHALL NOT create Git commits, deploy backend code, promote a UAT candidate, or require a developer to edit catalog files.

#### Scenario: Member publishes a post while a UI change is in UAT

- **WHEN** the member publishes PRD News
- **THEN** the PRD site updates using PRD's currently approved code
- **AND** the unpromoted UI change stays in UAT.

#### Scenario: Member changes price or stock

- **WHEN** an authorized price or stock operation succeeds
- **THEN** the runtime Store Offer or stock state updates without content publication, a static build, or a Worker deployment.

### Requirement: Publication uses a complete immutable snapshot

A public build SHALL consume one validated published-content snapshot and its referenced media. It SHALL NOT mix revisions, include drafts, or silently fall back to stale repository content when loading the snapshot fails.

#### Scenario: Another editor saves during a build

- **WHEN** a publication build is already using a captured revision
- **THEN** it finishes against that revision without including the later save
- **AND** the later published revision can be processed separately.

#### Scenario: Snapshot export or validation fails

- **WHEN** content, references, or required media cannot be validated
- **THEN** the new static artifact is not deployed
- **AND** the previous public site remains available with a visible failure status for staff.

#### Scenario: Published distro has no commerce setup yet

- **WHEN** a published Distro source is absent from the runtime catalog
- **THEN** the snapshot retains its canonical source-slug display entry so existing storefront content stays browsable
- **AND** an existing bound identity takes precedence; this display projection creates no D1 item, Product, Price, stock or checkout eligibility.

### Requirement: Publish status distinguishes requested from live

The workspace SHALL distinguish saved draft, publication pending, live, and failed publication. A publish request SHALL be durable and safely retryable without requiring the browser to remain open. The workspace's prominent current-status indicator SHALL represent the active request or newest publication request, while retaining older requests in publication history.

#### Scenario: Dispatch fails or the browser closes

- **WHEN** a valid publication request cannot reach deployment automation
- **THEN** its pending state remains visible and the same request can be retried
- **AND** the UI does not claim that the page is live.

#### Scenario: Deployment succeeds but acknowledgement is lost

- **WHEN** the system retries or reconciles the publication
- **THEN** it verifies the actual deployment and revision before marking it live
- **AND** duplicate notifications do not republish an older revision.

#### Scenario: A newer request follows an older failure

- **WHEN** publication history contains a failed request and a newer request is being submitted or is pending
- **THEN** the prominent current-status indicator shows Publishing or Publishing · pending
- **AND** the older failure remains available in history without overriding the current status.

#### Scenario: The newest request fails

- **WHEN** the newest publication request reaches failed status
- **THEN** the prominent current-status indicator shows Publication failed
- **AND** the failure remains actionable until a later request is confirmed live.

#### Scenario: Status cannot be read

- **WHEN** a status refresh fails after the workspace has received publication history
- **THEN** the workspace preserves the last known history and identifies the status as unavailable or stale
- **AND** it never changes a stale or accepted state to Live.

#### Scenario: Member refreshes publication status

- **WHEN** a member uses the top-right refresh action
- **THEN** the workspace checks publication status without requiring the history popover to be opened
- **AND** pending status continues to refresh automatically only while the page is visible and within the existing bounded polling window.

### Requirement: Content and software deployments share target ordering

Content Publication and Software Release promotion SHALL serialize target mutation and verify deployed code and content preconditions. Neither path SHALL overwrite a newer accepted publication with an older artifact.

#### Scenario: Content changes after a code candidate was built

- **WHEN** a PRD candidate artifact contains an older content revision
- **THEN** promotion stops and refreshes the candidate's PRD-targeted artifact against current PRD content, retaining the same approved code SHA
- **AND** the refreshed artifact passes content, build, compatibility, and target checks before explicit promotion.

#### Scenario: Code is promoted while a publication waits

- **WHEN** the publication reaches its deployment step
- **THEN** it checks the target's deployed code revision again
- **AND** it rebuilds with that approved revision or stops for a safe retry instead of downgrading code.

### Requirement: Environment publication never copies operational data

UAT and PRD SHALL own separate content and publication state. Software promotion SHALL NOT copy UAT content, customer data, stock, orders, provider identifiers, or secrets into PRD.

#### Scenario: A UI candidate is reviewed

- **WHEN** UAT requires representative content
- **THEN** it uses UAT fixtures or an explicit editorial-only sanitized import
- **AND** promoting the code leaves PRD content and operational records intact.

### Requirement: Publication preserves safe storefront behavior

New Store Items SHALL remain unavailable for checkout until their setup and public publication are confirmed. Hiding or archiving an item SHALL preserve its operational history and prevent new checkout independently of static deployment success.

#### Scenario: First item publication fails

- **WHEN** its setup is ready but the public build fails
- **THEN** the item remains unpublished and cannot start checkout through a guessed identity
- **AND** retrying publication does not create more stock or provider objects.

#### Scenario: An item is unpublished

- **WHEN** an authorized member confirms the action
- **THEN** new checkout is paused before public removal
- **AND** existing reservations, paid orders, return pages, and fulfillment remain processable.

#### Scenario: New content is live

- **WHEN** a fresh page load follows a confirmed publication
- **THEN** pages, metadata, sitemap, search data, and overlay fragments use that revision
- **AND** existing music playback is not forcibly reloaded to update an already-open tab.

### Requirement: Private previews faithfully render unsaved editorial content

The content workspace SHALL render the selected unsaved record with the public site's presentation and same-environment published surrounding content. Preview SHALL remain authenticated, uncached, bounded, and free of save, publication, commerce, or submission side effects. It SHALL identify its environment and code basis. Preview SHALL not request or display a new render while the current editorial data fails shared Content validation.

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

#### Scenario: Firefox Distro preview times out

- **WHEN** the Band in the Pit Distro record 01M2J1EK7DF73T79TJRN083EP6 times out in Firefox
- **THEN** the workspace keeps the last successful preview visible and provides a copyable failure reference
- **AND** the existing redacted Worker report correlates the request and release with the last readiness phase, without editorial content or credentials.

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
