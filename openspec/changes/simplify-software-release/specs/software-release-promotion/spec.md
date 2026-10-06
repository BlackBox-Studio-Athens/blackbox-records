## MODIFIED Requirements

### Requirement: Main publishes a UAT candidate only

A deploy-relevant push to main SHALL create a Release Candidate in UAT and SHALL NOT deploy PRD code or mutate live catalog state. The push run SHALL run the complete checks, both target builds, the whole end-to-end suite and the staff previews in Chromium and Firefox in parallel, and UAT deployment SHALL wait for the checks, the UAT build and both browser suites. After UAT deployment the push run SHALL verify the hosted release identity and run the read-only UAT static smoke. It SHALL NOT run provider smoke.

#### Scenario: A small UI change reaches main

- **WHEN** its required checks, browser suites and target builds pass
- **THEN** the stable UAT URL serves that candidate with the Review Site Marker
- **AND** PRD continues serving its previously deployed revision until explicit promotion.

#### Scenario: A candidate fails its checks or deployment

- **WHEN** required checks, a target build, artifact assembly, UAT deployment or hosted release identity verification fails
- **THEN** the candidate is not promotable and the failing stage is reported.

#### Scenario: A browser suite fails

- **WHEN** the whole end-to-end suite or a staff preview fails in the push run
- **THEN** UAT is not deployed and the failing job is reported
- **AND** the candidate is not promotable.

#### Scenario: A candidate fails UAT acceptance

- **WHEN** the UAT static smoke fails after UAT deployed
- **THEN** the push run fails and the candidate is not promotable
- **AND** UAT keeps serving that candidate until a later push replaces it.

### Requirement: PRD promotion selects verified artifacts

Software Release promotion SHALL require an explicit operator request identifying one successful UAT code revision and verified PRD-targeted artifacts. Deployment SHALL NOT silently substitute latest main, unavailable artifacts, or an unrelated successful run.

#### Scenario: Reviewer accepts a candidate

- **WHEN** the authorized operator promotes its exact code SHA and successful candidate evidence
- **THEN** PRD receives the verified PRD-targeted artifact from that source SHA
- **AND** evidence records operator, code revision, artifact digest, configuration identity, migration status, and deployment result.

#### Scenario: Candidate evidence is stale or missing

- **WHEN** artifacts are unavailable, code is superseded, configuration changed, or deployed UAT code no longer matches the review
- **THEN** promotion stops before mutation and requires fresh candidate validation.

#### Scenario: Target builds differ

- **WHEN** UAT and PRD use different origins, status cues, or environment-owned configuration
- **THEN** both builds use the same reviewed source code with explicit target configuration identities
- **AND** evidence does not claim byte-identical artifacts or promote UAT data into PRD.

#### Scenario: PRD content advances after candidate preparation

- **WHEN** PRD content is published after the candidate was prepared
- **THEN** the artifact is not rejected for content freshness, because runtime publication, not the release, owns published content
- **AND** promotion does not claim that its content was the content viewed in UAT.

### Requirement: Build acceleration preserves target artifacts and release gates

Each release target SHALL still build from its selected source/content/configuration and pass existing artifact checks. Independent build and fixture-browser work SHALL overlap only with verified separate mutable state and complete prerequisite/failure handling. The staff previews and the whole end-to-end suite SHALL remain required before UAT deployment.

#### Scenario: Independent preparation overlaps

- **WHEN** web/staff builds or Chromium/Firefox fixture checks are scheduled concurrently
- **THEN** all existing artifact checks remain required for packaging and all preview checks remain required for UAT deployment
- **AND** neither stage overwrites the other's output or evidence
- **AND** each browser uses independent fixture state and an ephemeral server
- **AND** packaging waits for the successful target builds, and UAT deployment waits for both browsers' successful results
- **AND** failure or cancellation prevents acceptance and leaves no unjoined child
- **AND** target builds sharing output paths remain sequential, while hosted jobs retain the existing dependency order and shared release lock.

#### Scenario: Candidate preparation becomes faster

- **WHEN** validation scheduling, media reads, or independent preparation changes
- **THEN** unit/check coverage, target builds, artifact digests, source/configuration/content identity, and retention remain enforced for every candidate
- **AND** previews and the whole end-to-end suite remain enforced before UAT deployment
- **AND** mutation stages retain their ordering, credential contexts, and shared non-cancelling lock
- **AND** PRD still requires explicit selection and promotion of the retained reviewed artifact without rebuilding or implying catalog/launch approval.

### Requirement: Releases serialize changes and expose partial failure

State-changing deployment stages for a target SHALL NOT overlap or be cancelled halfway through mutation. A failed partial release SHALL retain enough redacted evidence to retry or restore compatible application artifacts without rolling back orders or stock. Routine rollback SHALL be a revert committed and pushed forward through the normal release; an emergency rollback SHALL restore the renderer Worker version and the Pages deployment together, and SHALL NOT cross a migration.

#### Scenario: Another release starts during deployment

- **WHEN** a target is already being mutated
- **THEN** the new run waits and revalidates its source and target preconditions before acting.

#### Scenario: Worker deploy succeeds but public deploy fails

- **WHEN** a release stops after only the backend changed
- **THEN** evidence names the deployed backend and unchanged frontend
- **AND** recovery uses a compatible retry or code rollback without database reset or implied cross-provider transaction.

#### Scenario: Routine rollback

- **WHEN** a released change must be undone and no incident requires immediate action
- **THEN** the operator reverts the change on `main` and pushes forward
- **AND** the revert passes the same push-run gates, deploys to UAT and is promoted like any other candidate.

#### Scenario: Emergency rollback

- **WHEN** an incident requires restoring the previous PRD code before a revert can be released
- **THEN** the operator rolls back the renderer Worker version and the Pages deployment from the same release run together, because rolling back only one leaves the renderer HTML and its `/_astro/*` chunks mismatched
- **AND** the CMS Worker is rolled back only when no migration ran between the two releases
- **AND** no rollback crosses a migration: D1 and CMS migrations are forward-only, so an incident across a migration is repaired by a compatible fix pushed forward.

### Requirement: Preparation cancellation does not interrupt hosted mutations

Release preparation MAY cancel superseded work by branch and preparation role. Every hosted Worker, Pages and
promotion mutation MUST remain serialized through its final identity checks.

#### Scenario: New source supersedes preparation

- **WHEN** a newer automatic run starts while older candidate preparation is active
- **THEN** obsolete preparation for the same branch and role may be canceled
- **AND** the active deployment/acceptance sequence is not canceled.

#### Scenario: Earlier deployment is still running

- **WHEN** a newer UAT candidate starts
- **THEN** its checks and target preparation start without waiting for the shared hosted mutation lock
- **AND** the UAT reusable-workflow call acquires that lock across Worker deployment, Pages deployment, and final hosted identity verification
- **AND** the called workflow inherits repository secrets, binds Worker/provider jobs to the UAT environment, and rejects missing required credentials before mutation
- **AND** PRD promotion and holding-page deployment retain the same non-cancelling lock; content publication is a runtime operation and takes no release lock.

#### Scenario: Older candidate reaches mutation late

- **WHEN** an older candidate reaches a mutation after a newer candidate has changed the target
- **THEN** the monotonic release-order check rejects it before mutation.

#### Scenario: UAT quick checks pass before provider acceptance

- **WHEN** the push run has deployed a candidate and verified its hosted release identity
- **THEN** the read-only UAT static smoke runs against that candidate
- **AND** provider smoke is manual and never a release gate.

## REMOVED Requirements

### Requirement: PRD promotion runs hosted acceptance before mutation

**Reason**: The whole end-to-end suite and the staff previews test code, not UAT, so they run on every push and block the UAT deploy. Provider smoke is a manual workflow and never a release gate.

**Migration**: See the requirement "Main publishes a UAT candidate only" for the push-run suites and "PRD promotion is deploy-only" for promotion.

## ADDED Requirements

### Requirement: PRD promotion is deploy-only

An explicit operator dispatch of PRD promotion SHALL verify that UAT serves the selected candidate's source SHA, then verify the order and checkout-disabled preconditions, migrate, deploy the Worker and then Pages, and verify the hosted PRD release. It SHALL run no static smoke, provider smoke, staff preview or end-to-end suite, and it SHALL check out the selected candidate's source SHA. The candidate's passed push run is the only acceptance evidence.

#### Scenario: An operator promotes the deployed candidate

- **GIVEN** UAT serves the selected candidate's source SHA and that candidate's push run succeeded
- **WHEN** the operator dispatches promotion
- **THEN** main ancestry of the candidate is verified before any candidate code runs, then UAT identity is verified under the shared non-cancelling release lock
- **AND** PRD migrations and deployments run without a test suite in between.

#### Scenario: UAT moved to a newer candidate

- **WHEN** UAT serves a different source SHA than the candidate selected for promotion
- **THEN** promotion stops before mutation
- **AND** the operator promotes the candidate UAT currently serves or redeploys the selected one.

#### Scenario: A push lands during promotion

- **WHEN** a newer push starts while promotion is running
- **THEN** promotion holds the shared release lock, so the push's UAT deploy waits until promotion ends
- **AND** each `verify prd` before a PRD mutation re-checks UAT identity, while `verify-worker` and `verify-hosted` do not.

#### Scenario: A failed PRD step is retried

- **WHEN** a PRD migration or deployment step failed
- **THEN** rerunning only the failed jobs of that run reuses the same candidate.
