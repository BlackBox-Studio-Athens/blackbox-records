## MODIFIED Requirements

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
