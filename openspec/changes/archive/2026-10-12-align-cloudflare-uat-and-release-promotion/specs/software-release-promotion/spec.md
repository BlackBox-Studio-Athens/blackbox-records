## Purpose

Define safe review and promotion of software revisions through the stable UAT environment without implicitly publishing code or enabling checkout in PRD.

## ADDED Requirements

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

Software Release promotion SHALL require an explicit operator request identifying one successful UAT source revision and its verified target artifacts. Deployment SHALL NOT silently substitute latest main, an expired artifact, or an unrelated successful run.

#### Scenario: Reviewer accepts a candidate

- **WHEN** the authorized reviewer promotes its exact SHA and successful run
- **THEN** PRD receives the PRD-targeted artifact built from that source SHA
- **AND** evidence records reviewer, SHA, artifact digest, configuration identity, migration status, and deployment result.

#### Scenario: Candidate evidence is stale or missing

- **WHEN** artifacts are unavailable, the candidate is superseded, configuration changed, or the deployed UAT identity no longer matches the review
- **THEN** promotion stops before mutation and requires a fresh candidate validation.

#### Scenario: Target builds differ

- **WHEN** UAT and PRD use different origins, status cues, or browser-safe configuration
- **THEN** both target builds are verified from the same source revision
- **AND** evidence does not claim the resulting artifacts are byte-identical.

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
