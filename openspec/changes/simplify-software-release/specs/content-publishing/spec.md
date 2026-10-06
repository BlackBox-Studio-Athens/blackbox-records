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
