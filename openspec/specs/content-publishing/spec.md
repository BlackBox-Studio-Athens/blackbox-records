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

The public renderer SHALL serve one validated published-content snapshot and its referenced media, selected through the environment's accepted R2 pointer. It SHALL NOT mix revisions, include drafts, or silently fall back to stale repository content when loading the snapshot fails. No software build SHALL read, restore or bundle a snapshot, a media file or a content identity, and no build SHALL hold a CMS export credential.

#### Scenario: Another editor saves during a build

- **WHEN** a publication or renderer refresh is already using a captured revision
- **THEN** it finishes against that revision without including the later save
- **AND** the later published revision can be processed separately.

#### Scenario: Snapshot export or validation fails

- **WHEN** content, references, or required media cannot be validated
- **THEN** the accepted pointer does not move
- **AND** the previously accepted snapshot remains served with a visible failure status for staff.

#### Scenario: A software release is built

- **WHEN** a UAT or PRD release is built
- **THEN** the build is content-free and the renderer reads its environment's accepted snapshot from R2 at runtime
- **AND** the release neither changes nor depends on the live pointer's generation.

#### Scenario: Published distro has no commerce setup yet

- **WHEN** a published Distro source is absent from the runtime catalog
- **THEN** the snapshot retains its canonical source-slug display entry so existing storefront content stays browsable
- **AND** an existing bound identity takes precedence; this display projection creates no D1 item, Product, Price, stock or checkout eligibility.

### Requirement: Publish status distinguishes requested from live

The workspace SHALL distinguish saved draft, publication pending, live, and failed publication. A publish request SHALL be durable and safely retryable without requiring the browser to remain open. The workspace's prominent current-status indicator SHALL represent the active request or newest publication request, while retaining older requests in publication history.

#### Scenario: Dispatch fails or the browser closes

- **WHEN** a valid publication request cannot be processed by the runtime publication processor, or the browser closes after sending it
- **THEN** its pending state remains visible and the same request can be retried
- **AND** the UI does not claim that the page is live.

#### Scenario: Deployment succeeds but acknowledgement is lost

- **WHEN** the system retries or reconciles the publication
- **THEN** it verifies the accepted snapshot pointer and the public origin's content identity before marking it live
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

Content Publication and Software Release promotion SHALL NOT overwrite a newer accepted publication with an older one. Content Publication SHALL be a runtime operation of the target's CMS Worker that moves the accepted snapshot pointer; it SHALL NOT dispatch a GitHub workflow, build a static artifact or take the release lock.

#### Scenario: Content changes after a code candidate was built

- **WHEN** content is published after a PRD code candidate was prepared
- **THEN** promotion keeps the accepted snapshot pointer and does not reject or refresh the candidate for content freshness
- **AND** no content is copied or rebuilt by the promotion.

#### Scenario: Code is promoted while a publication waits

- **WHEN** code is promoted while a publication request is pending
- **THEN** promotion keeps the accepted snapshot pointer and rebuilds no content
- **AND** the publication still activates against the promoted renderer, or stops for a safe retry, instead of downgrading content.

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

### Requirement: Published content reads are linear and snapshot-scoped

Static and hosted page renders SHALL read published content with work linear in the records they use, and any reuse SHALL be scoped to one accepted snapshot.

#### Scenario: A Store collection page renders

- **WHEN** a Store collection or category page lists its Store Items
- **THEN** each Store Item's availability is computed once from that item without rebuilding the Store Item list
- **AND** the category navigation reuses the listing already computed for the page
- **AND** the rendered output is identical to the previous implementation's.

#### Scenario: A snapshot is parsed

- **WHEN** the reader parses an accepted snapshot or a publication candidate
- **THEN** its schemas are built once per process, not once per record
- **AND** the final publication candidate still receives one full parse with the same validation errors, messages, and paths.

#### Scenario: A page reads a collection or entry

- **WHEN** a render calls `getCollection` or `getEntry` for an accepted snapshot
- **THEN** projections may be reused only for that same snapshot object and media base, with an id index for entries
- **AND** a new snapshot never sees another snapshot's projections
- **AND** staff previews with preview overrides bypass the reuse.

### Requirement: Hosted pages render accepted purchase information

Hosted public pages and islands SHALL render the purchase information of the accepted snapshot, not the repository's static copy.

#### Scenario: Purchase information is published

- **WHEN** a publication containing changed purchase information is accepted and becomes live
- **THEN** a fresh hosted page load renders the new purchase information on the server and in the islands that read it
- **AND** static output continues to render the repository copy it was built from.

#### Scenario: A web module the hosted build overrides moves

- **WHEN** a module the hosted build configuration replaces is moved or renamed in the web app
- **THEN** an automated check fails because the override no longer resolves to an existing module with the same exports
- **AND** hosted output never silently falls back to the static module.

#### Scenario: A page needs inline purchase information

- **WHEN** a build's browser reader needs the inline purchase-information data
- **THEN** that build emits it on the pages where that reader can hydrate
- **AND** builds whose islands bundle the data do not inline it.
