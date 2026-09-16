## MODIFIED Requirements

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
