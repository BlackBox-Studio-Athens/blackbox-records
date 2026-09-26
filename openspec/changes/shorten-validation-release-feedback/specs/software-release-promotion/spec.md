## ADDED Requirements

### Requirement: Preparation cancellation does not interrupt hosted mutations

Release preparation MAY cancel superseded work by branch and preparation role. Every hosted Worker, Pages, catalog, and
promotion mutation MUST remain serialized through its required post-deploy acceptance and final identity checks.

#### Scenario: New source supersedes preparation

- **WHEN** a newer automatic run starts while older candidate preparation is active
- **THEN** obsolete preparation for the same branch and role may be canceled
- **AND** the active deployment/acceptance sequence is not canceled.

#### Scenario: Older candidate reaches mutation late

- **WHEN** an older candidate reaches a mutation after a newer candidate has changed the target
- **THEN** the monotonic release-order check rejects it before mutation.

#### Scenario: UAT quick checks pass before provider acceptance

- **WHEN** read-only UAT identity, readiness, and static checks pass
- **THEN** the workflow reports quick feedback
- **AND** candidate acceptance still waits for every existing provider and final identity check.
