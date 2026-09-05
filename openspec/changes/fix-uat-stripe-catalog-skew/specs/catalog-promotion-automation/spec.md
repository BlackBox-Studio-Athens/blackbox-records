## MODIFIED Requirements

### Requirement: UAT catalog promotion is ordered and fail-closed

The system SHALL promote one artifact commit through UAT in a serialized sequence, and that sequence SHALL be the only supported UAT Worker deployment path.

#### Scenario: UAT promotion succeeds

- **WHEN** UAT configuration, webhook, D1 readiness, provider dry-run/apply, post-apply verification, Worker deployment, and hosted listing readiness all pass
- **THEN** the workflow dispatches the UAT static deployment for the same commit
- **AND** downstream provider smoke validates the deployed release without applying D1 migrations or deploying the Worker.

#### Scenario: A promotion step fails

- **WHEN** any step finds missing configuration, ambiguous provider state, non-ready catalog state, failed deployment, or failed smoke
- **THEN** every later step is skipped
- **AND** evidence names the failed stage and safe rerun action.

#### Scenario: A newer artifact commit arrives

- **WHEN** an older promotion is still pending
- **THEN** target concurrency supersedes the stale run
- **AND** the stale commit cannot deploy after the newer catalog.

#### Scenario: A direct UAT Worker deployment path is inspected

- **WHEN** repository validation inspects active deployment workflows
- **THEN** no standalone or smoke-owned UAT Worker deployment path exists
- **AND** catalog promotion remains the sole workflow that deploys the UAT Worker.
