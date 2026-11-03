## ADDED Requirements

### Requirement: Publication confirmation works behind a protected public origin

A publication SHALL be confirmed against the renderer's own content identity wherever the public origin is protected by Cloudflare Access (Local and UAT). PRD keeps confirming through its open public origin. An activated publication that cannot be confirmed SHALL end after a bounded number of attempts and SHALL NOT hold later publications in the queue.

#### Scenario: UAT publication is confirmed

- **WHEN** a UAT publication is activated and the UAT public origin redirects anonymous requests to Access
- **THEN** the confirmation reads the identity from the renderer, verifies the accepted pointer and marks the publication live

#### Scenario: Confirmation keeps failing

- **WHEN** an activated publication fails confirmation on six attempts
- **THEN** it ends as failed with a message that the content was accepted and the accepted website was kept
- **AND** the next queued publication is processed

#### Scenario: PRD publication is confirmed

- **WHEN** a PRD publication is activated
- **THEN** the confirmation reads the identity from the public origin as before
