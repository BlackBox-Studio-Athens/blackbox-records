# catalog-promotion-automation Specification

## Purpose

Defines deterministic, fail-closed promotion of committed catalog artifacts through UAT while live PRD commerce remains behind its separate launch gate.

## Requirements

### Requirement: Editorial catalog changes produce one committed artifact revision

The system SHALL generate deterministic catalog artifacts from current Store Item content and repository-owned policy without adding CMS-authored commerce authority.

#### Scenario: Catalog content changes

- **WHEN** a content commit changes generated catalog output
- **THEN** automation creates one bot artifact commit on the same branch
- **AND** all provider, D1, deployment, and evidence steps use that artifact commit.

#### Scenario: Bot artifact commit reruns generation

- **WHEN** the generated artifacts already match source content
- **THEN** no further commit is created.

#### Scenario: Artifact generation or repository gates fail

- **WHEN** deterministic generation, tests, checks, or build fail
- **THEN** provider mutation and deployment do not start.

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

### Requirement: PRD requires explicit live catalog confirmation

The system MUST NOT perform live PRD catalog mutation unless the exact promotion run carries an explicit, false-by-default live catalog confirmation. Shopper launch approval MUST NOT authorize provider mutation by implication.

#### Scenario: PRD readiness is evaluated

- **WHEN** an artifact commit reaches the PRD branch without explicit live catalog confirmation
- **THEN** redacted readiness or dry-run work may execute
- **AND** no live provider, PRD D1, Worker, static deployment, or Checkout mutation occurs.

#### Scenario: Confirmed PRD catalog preparation runs

- **GIVEN** repository gates passed for one exact artifact commit
- **WHEN** an operator selects PRD and explicitly confirms live catalog changes for that run
- **THEN** the workflow may apply the bounded provider and PRD D1 catalog changes for that commit
- **AND** the confirmation expires with that workflow run
- **AND** it does not approve or enable shopper checkout.

#### Scenario: Direct PRD apply is requested

- **WHEN** a maintainer invokes a direct PRD catalog apply without the explicit confirmation option
- **THEN** the command fails before provider or D1 mutation.

### Requirement: Promotion evidence is redacted and revision-bound

The system SHALL retain concise Promotion Evidence for success, failure, supersession, and gated PRD outcomes.

#### Scenario: Evidence is produced

- **WHEN** a promotion run finishes
- **THEN** evidence records source/artifact commits, target, app-owned identities/counts, step outcomes, deployment references, smoke outcome, and rerun guidance
- **AND** excludes secrets, full provider IDs, raw payloads, payment details, and customer data.
