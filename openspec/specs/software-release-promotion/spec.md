# software-release-promotion Specification

## Purpose

Define safe review and promotion of software revisions through the stable UAT environment without implicitly publishing code or enabling checkout in PRD.

## Requirements

### Requirement: Releases require combined CMS artifacts

Software promotion SHALL verify and deploy the retained combined CMS artifact, reject incompatible old candidate contracts, and exclude standalone staff Pages and commerce-only Worker fallback deployment.

#### Scenario: Incompatible candidate is selected

- **WHEN** the candidate lacks the current combined artifact contract
- **THEN** promotion stops before mutation and requires a fresh accepted candidate.

#### Scenario: Current candidate is selected

- **WHEN** promotion passes exact source, artifact digest, ordering and content freshness checks
- **THEN** it promotes the combined Worker without changing staff DNS or Access, and preserves the target content and checkout gates.

### Requirement: Main publishes a UAT candidate only

A deploy-relevant push to main SHALL create a Release Candidate in UAT and SHALL NOT deploy PRD code or mutate live catalog state.

#### Scenario: A small UI change reaches main

- **WHEN** its required checks and target builds pass
- **THEN** the stable UAT URL serves that candidate with the Review Site Marker
- **AND** PRD continues serving its previously deployed revision until explicit promotion.

#### Scenario: A candidate fails UAT acceptance

- **WHEN** hosted static, provider, or required compatibility checks fail
- **THEN** the candidate is not promotable and the failing stage is reported.

### Requirement: PRD promotion selects verified artifacts

Software Release promotion SHALL require an explicit operator request identifying one successful UAT code revision and verified PRD-targeted code/content artifacts. Deployment SHALL NOT silently substitute latest main, unavailable artifacts, stale PRD content, or an unrelated successful run.

#### Scenario: Reviewer accepts a candidate

- **WHEN** the authorized reviewer promotes its exact code SHA and successful candidate evidence
- **THEN** PRD receives the verified PRD-targeted artifact from that source SHA and current approved PRD content revision
- **AND** evidence records reviewer, code/content revisions, artifact digest, configuration identity, migration status, and deployment result.

#### Scenario: Candidate evidence is stale or missing

- **WHEN** artifacts are unavailable, code is superseded, configuration changed, or deployed UAT code no longer matches the review
- **THEN** promotion stops before mutation and requires fresh candidate validation.

#### Scenario: Target builds differ

- **WHEN** UAT and PRD use different origins, status cues, or environment-owned content
- **THEN** both builds use the same reviewed source code with explicit target content/configuration identities
- **AND** evidence does not claim byte-identical artifacts or promote UAT data into PRD.

#### Scenario: PRD content advances after candidate preparation

- **WHEN** the PRD artifact contains an older content revision than the current approved publication
- **THEN** that artifact is rejected before deployment
- **AND** a refresh rebuilds the same reviewed code SHA against current PRD content, reruns content/build/compatibility checks, and records a new target artifact linked to the original code-candidate evidence
- **AND** the refreshed artifact requires explicit promotion without claiming that its target content was the content viewed in UAT.

### Requirement: Deployment preserves independent safety gates

Code promotion SHALL preserve one-run live catalog authorization, shopper launch approval, runtime checkout enablement, and environment-specific data ownership as separate controls.

#### Scenario: Disabled PRD software is promoted

- **WHEN** the candidate is accepted but launch approval or checkout enablement is absent
- **THEN** code can deploy as a disabled PRD readiness surface
- **AND** it does not create live prices, replace stock, enable checkout, or promote UAT operational data.

### Requirement: Releases serialize changes and expose partial failure

State-changing deployment stages for a target SHALL NOT overlap or be cancelled halfway through mutation. A failed partial release SHALL retain enough redacted evidence to retry or restore compatible application artifacts without rolling back orders or stock.

#### Scenario: Another release starts during deployment

- **WHEN** a target is already being mutated
- **THEN** the new run waits and revalidates its source and target preconditions before acting.

#### Scenario: Worker deploy succeeds but public deploy fails

- **WHEN** a release stops after only the backend changed
- **THEN** evidence names the deployed backend and unchanged frontend
- **AND** recovery uses a compatible retry or code rollback without database reset or implied cross-provider transaction.

### Requirement: One stable UAT supports review

The system SHALL support reviewing successive UI or backend candidates at the same UAT URL. Diagnostic branch deployments SHALL NOT substitute for isolated UAT acceptance.

#### Scenario: Reviewer requests a correction

- **WHEN** the next candidate passes deployment checks
- **THEN** it replaces the prior UAT candidate without changing PRD
- **AND** the earlier candidate's acceptance cannot be reused for the new revision.
