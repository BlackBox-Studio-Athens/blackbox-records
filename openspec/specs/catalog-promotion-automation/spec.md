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

The system SHALL promote one artifact commit through UAT in a serialized sequence.

#### Scenario: UAT promotion succeeds

- **WHEN** UAT configuration, webhook, D1 readiness, provider dry-run/apply, post-apply verification, Worker deployment, and hosted listing readiness all pass
- **THEN** the workflow dispatches the UAT static deployment for the same commit
- **AND** runs smoke before marking promotion successful.

#### Scenario: A promotion step fails

- **WHEN** any step finds missing configuration, ambiguous provider state, non-ready catalog state, failed deployment, or failed smoke
- **THEN** every later step is skipped
- **AND** evidence names the failed stage and safe rerun action.

#### Scenario: A newer artifact commit arrives

- **WHEN** an older promotion is still pending
- **THEN** target concurrency supersedes the stale run
- **AND** the stale commit cannot deploy after the newer catalog.

### Requirement: PRD remains dry-run while its launch gate is closed

The system MUST NOT perform live PRD catalog mutation or launch deployment from this automation while the PRD-open gate is closed.

#### Scenario: PRD readiness is evaluated

- **WHEN** the artifact commit reaches the PRD branch of the workflow before launch approval exists
- **THEN** redacted readiness/dry-run may execute
- **AND** the result is not_configured with no live provider, PRD catalog, Worker launch, static launch, or live Checkout mutation.

### Requirement: Promotion evidence is redacted and revision-bound

The system SHALL retain concise Promotion Evidence for success, failure, supersession, and gated PRD outcomes.

#### Scenario: Evidence is produced

- **WHEN** a promotion run finishes
- **THEN** evidence records source/artifact commits, target, app-owned identities/counts, step outcomes, deployment references, smoke outcome, and rerun guidance
- **AND** excludes secrets, full provider IDs, raw payloads, payment details, and customer data.
