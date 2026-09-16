## ADDED Requirements

### Requirement: Durable selected-record publication

The system SHALL persist a publication intent for the selected saved revision before changing publication state, process accepted requests durably, and activate only a complete validated immutable snapshot.

#### Scenario: Interrupted request

- **WHEN** an editor disconnects after acceptance or the runtime restarts
- **THEN** the same request resumes without publishing a different draft or losing its result

#### Scenario: Concurrent editing

- **WHEN** another record's draft changes during publication
- **THEN** publication completes without including that draft or failing because of it

### Requirement: Fast published-content delivery

The system SHALL serve server-rendered public pages from accepted snapshots, preserve the existing public origins, keep unpublished data private, and target p95 publication latency of at most sixty seconds on Cloudflare Free under normal service.

#### Scenario: Text-only publication

- **WHEN** an editor publishes a selected text change
- **THEN** the system reuses existing media and requires no software build or deployment

#### Scenario: Failed preparation

- **WHEN** content or media validation fails
- **THEN** the previous accepted snapshot remains served and the editor receives actionable status

#### Scenario: Code promotion

- **WHEN** an accepted software artifact is promoted
- **THEN** the target retains its current published content and commerce launch gates

#### Scenario: Publish several sections together

- **WHEN** an editor adds saved records from several sections to the publication selection and publishes it
- **THEN** all selected revisions activate in one snapshot, unselected drafts remain private, and any stale selected revision rejects the batch before native transitions
