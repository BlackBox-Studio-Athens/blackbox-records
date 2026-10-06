## MODIFIED Requirements

### Requirement: Main publishes a UAT candidate only

A deploy-relevant push to main SHALL create a Release Candidate in UAT and SHALL NOT deploy PRD code or mutate live catalog state. The push run SHALL run the complete checks, the whole end-to-end suite and the staff previews in Chromium and Firefox in parallel with one content-free UAT build, and UAT deployment SHALL wait for the checks, the build and both browser suites. The UAT build SHALL hold no CMS credential and SHALL restore no CMS content or media. One deploy job SHALL check the Pages credential read-only before any migration, then migrate, deploy the Workers, deploy Pages and verify the hosted release identity, and SHALL then run the read-only UAT static smoke. It SHALL NOT run provider smoke.

#### Scenario: A small UI change reaches main

- **WHEN** its required checks, browser suites and UAT build pass
- **THEN** the stable UAT URL serves that candidate with the Review Site Marker
- **AND** PRD continues serving its previously deployed revision until explicit promotion.

#### Scenario: A candidate fails its checks or deployment

- **WHEN** required checks, the UAT build, UAT deployment or hosted release identity verification fails
- **THEN** the candidate is not promotable and the failing stage is reported.

#### Scenario: A browser suite fails

- **WHEN** the whole end-to-end suite or a staff preview fails in the push run
- **THEN** UAT is not deployed and the failing job is reported
- **AND** the candidate is not promotable.

#### Scenario: The Pages credential has no Pages access

- **WHEN** the environment credential lacks access to the Pages project, which the first step reads
- **THEN** the deploy job fails at its first step, before any migration or Worker deployment
- **AND** that step proves read access only, so Pages write is an operator precondition of the push, and a read-only credential fails later at the Pages deploy.

#### Scenario: A candidate fails UAT acceptance

- **WHEN** the UAT static smoke fails after UAT deployed
- **THEN** the push run fails and the candidate is not promotable
- **AND** UAT keeps serving that candidate until a later push replaces it.

### Requirement: PRD promotion selects verified artifacts

Software Release promotion SHALL be an explicit operator dispatch without inputs. It SHALL resolve the source SHA and push run from the release UAT currently serves, and SHALL deploy only that release. Deployment SHALL NOT silently substitute latest main, an unrelated successful run or a run that is not in main history.

#### Scenario: Reviewer accepts a candidate

- **WHEN** the authorized operator dispatches promotion
- **THEN** PRD is built from the source SHA UAT serves, after a push run of that SHA on main succeeded with its end-to-end shards, staff previews and UAT deploy
- **AND** the run's evidence records the operator, source SHA, candidate run, migration status and deployment result.

#### Scenario: Candidate evidence is stale or missing

- **WHEN** the served run is not a successful push run of the main workflow, its SHA is outside main history, it lacks a passed suite, or it does not match the served run number
- **THEN** promotion stops before any candidate code is checked out and before mutation.

#### Scenario: Target builds differ

- **WHEN** UAT and PRD use different origins, status cues or environment-owned configuration
- **THEN** both builds use the same reviewed source code with explicit target configuration
- **AND** evidence does not claim byte-identical artifacts or promote UAT data into PRD.

#### Scenario: PRD content advances after candidate preparation

- **WHEN** PRD content is published after the candidate's push run
- **THEN** promotion proceeds, because runtime publication, not the release, owns published content
- **AND** promotion does not claim that its content was the content viewed in UAT.

### Requirement: Build acceleration preserves target artifacts and release gates

Each release target SHALL still build from its selected source and configuration and pass existing build checks. Independent build and fixture-browser work SHALL overlap only with verified separate mutable state and complete prerequisite/failure handling. The staff previews and the whole end-to-end suite SHALL remain required before UAT deployment.

#### Scenario: Independent preparation overlaps

- **WHEN** the checks, the UAT build or Chromium/Firefox fixture checks are scheduled concurrently
- **THEN** all preview checks remain required for UAT deployment
- **AND** neither stage overwrites the other's output or evidence
- **AND** each browser uses independent fixture state and an ephemeral server
- **AND** UAT deployment waits for the checks, the build and both browsers' successful results
- **AND** failure or cancellation prevents deployment and leaves no unjoined child.

#### Scenario: Candidate preparation becomes faster

- **WHEN** validation scheduling or independent preparation changes
- **THEN** unit/check coverage, build checks and source identity remain enforced for every candidate
- **AND** previews and the whole end-to-end suite remain enforced before UAT deployment
- **AND** mutation stages retain their ordering, credential contexts and non-cancelling locks
- **AND** PRD still requires an explicit promotion that rebuilds the proven source without implying catalog/launch approval.

### Requirement: Releases serialize changes and expose partial failure

State-changing deployment stages for a target SHALL NOT overlap or be cancelled halfway through mutation. A failed partial release SHALL retain enough redacted evidence to retry or restore compatible application artifacts without rolling back orders or stock. Routine rollback SHALL be a revert committed and pushed forward through the normal release; an emergency rollback SHALL restore the renderer Worker version and the Pages deployment together, and SHALL NOT cross a migration. No retained release bundle or rebuild path SHALL exist: every release is built from its source SHA by the job that deploys it.

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

#### Scenario: The seven-day rebuild path is gone

- **WHEN** an older release must be restored after a seven-day window
- **THEN** no retained bundle or `target=uat` rebuild dispatch exists to restore it
- **AND** the operator reverts to that source on `main` and pushes it through the normal release.

### Requirement: Preparation cancellation does not interrupt hosted mutations

Release preparation MAY cancel superseded work by branch and role. Every hosted Worker, Pages and promotion mutation MUST remain serialized through its final identity checks.

#### Scenario: New source supersedes preparation

- **WHEN** a newer automatic run starts while older checks or builds are active
- **THEN** obsolete preparation for the same branch may be canceled
- **AND** an active deployment sequence is not canceled.

#### Scenario: Earlier deployment is still running

- **WHEN** a newer UAT candidate starts
- **THEN** its checks and build start without waiting for the hosted mutation lock
- **AND** its deploy job waits in the non-cancelling UAT release lock, which spans the migrations, Worker deployment, Pages deployment and final hosted identity verification; a waiting run is replaced by a newer one but a deploying run is never cancelled
- **AND** the deploy job binds the UAT environment and sets its Cloudflare credential only on the steps that need it
- **AND** PRD promotion holds its own non-cancelling lock and binds the PRD environment, and only the promotion workflow binds it
- **AND** the holding-page deployment keeps a separate lock, so it can never cancel a pending push deploy or promotion
- **AND** content publication is a runtime operation and takes no release lock.

#### Scenario: Older candidate reaches mutation late

- **WHEN** an older candidate reaches a mutation after a newer candidate has changed the target
- **THEN** the monotonic release-order check rejects it before mutation.

#### Scenario: UAT quick checks pass before provider acceptance

- **WHEN** the push run has deployed a candidate and verified its hosted release identity
- **THEN** the read-only UAT static smoke runs against that candidate
- **AND** provider smoke is manual and never a release gate.

### Requirement: Releases require combined CMS artifacts

Software promotion SHALL build and deploy the combined CMS Worker from the selected source SHA, and SHALL exclude standalone staff Pages and commerce-only Worker fallback deployment.

#### Scenario: Incompatible candidate is selected

- **WHEN** the served release is not a provable push run of main, or its source cannot build the combined CMS Worker
- **THEN** promotion stops before mutation and requires a fresh accepted push run.

#### Scenario: Current candidate is selected

- **WHEN** promotion passes the source, ordering and checkout-disabled checks
- **THEN** it deploys the combined Worker built from that SHA without changing staff DNS or Access, and preserves the target content and checkout gates.

## REMOVED Requirements

### Requirement: Published-content restore has bounded concurrency and unchanged authority

**Reason**: Release builds are content-free: they restore no snapshot or media, so no restore, request budget or media cache remains.

**Migration**: The renderer reads the environment's accepted snapshot from R2 at runtime; see static-site-and-deployment and content-publishing.

### Requirement: Native image reuse preserves fresh target builds

**Reason**: The Astro image cache and its Actions cache steps are removed with the per-target content builds; each job rebuilds from source.

**Migration**: None.

### Requirement: Compact artifact transfer preserves the complete reviewed bundle

**Reason**: No release bundle is assembled, retained or transferred: UAT hands its build to its deploy job within one run, and PRD is rebuilt from the proven SHA.

**Migration**: See "PRD promotion selects verified artifacts" and "PRD promotion is deploy-only".

### Requirement: PRD promotion runs hosted acceptance before mutation

**Reason**: The whole end-to-end suite and the staff previews test code, not UAT, so they run on every push and block the UAT deploy. Provider smoke is a manual workflow and never a release gate.

**Migration**: See the requirement "Main publishes a UAT candidate only" for the push-run suites and "PRD promotion is deploy-only" for promotion.

## ADDED Requirements

### Requirement: PRD promotion is deploy-only

An explicit operator dispatch of PRD promotion, which takes no inputs, SHALL run from main, resolve the release UAT serves and prove it from main-side tooling before any candidate code is checked out, then build PRD content-free from that source SHA, verify the order and checkout-disabled preconditions, migrate, deploy the Worker and then Pages, and verify the hosted PRD release. It SHALL run no static smoke, provider smoke, staff preview or end-to-end suite. The candidate's passed push run is the only acceptance evidence.

#### Scenario: An operator promotes the deployed candidate

- **GIVEN** UAT serves a release whose push run succeeded on main
- **WHEN** the operator dispatches promotion
- **THEN** the release's source SHA is verified to be in main history, and its end-to-end shards, staff previews and UAT deploy are verified to have passed, before any candidate code runs
- **AND** PRD is built stamped with the candidate's run, so it reports the same release identity as UAT
- **AND** PRD migrations and deployments run without a test suite in between.

#### Scenario: UAT serves a release that is not promotable

- **WHEN** the served run failed, predates the current pipeline, or is outside main history
- **THEN** promotion stops before candidate checkout and mutation
- **AND** the operator pushes a fix and promotes what UAT then serves.

#### Scenario: A push lands during promotion

- **WHEN** a newer push starts while promotion is running
- **THEN** promotion keeps the release it resolved at its start and is not failed by the push
- **AND** the push's UAT deploy runs under its own lock and the monotonic order check keeps any older release from replacing a newer one.

#### Scenario: A failed PRD step is retried

- **WHEN** a PRD migration or deployment step failed
- **THEN** rerunning the failed run rebuilds and redeploys the same resolved release.
