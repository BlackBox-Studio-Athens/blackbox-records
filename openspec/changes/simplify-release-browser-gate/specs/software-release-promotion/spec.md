## MODIFIED Requirements

### Requirement: Main publishes a UAT candidate only

A deploy-relevant push to main SHALL create a Release Candidate in UAT and SHALL NOT deploy PRD code or mutate live catalog state. The push run SHALL run the complete checks, the end-to-end journey suite and the Chromium staff previews in parallel with one content-free UAT build, and UAT deployment SHALL wait for the checks and the build. The journey suite SHALL cover shopper journeys only (routes, shell navigation and the player, cart to checkout and payment, checkout recovery and return, withdrawal, email preferences and availability alerts) and SHALL NOT assert catalog content, pixel geometry, typography or motion. The journey suite and the staff previews SHALL NOT delay UAT deployment, and a run in which any of them failed SHALL NOT be promotable. The UAT build SHALL hold no CMS credential and SHALL restore no CMS content or media. One deploy job SHALL check the Pages credential read-only before any migration, then migrate, deploy the Workers, deploy Pages, verify the deployed Worker and hosted release identity, and SHALL then run the read-only UAT static smoke. Every Worker deployment SHALL restart running Durable Objects onto the new code immediately, and the Worker identity check SHALL require both the backend Worker entry and its store Durable Object to report the candidate. It SHALL NOT run provider smoke.

#### Scenario: A small UI change reaches main

- **WHEN** its required checks and UAT build pass
- **THEN** the stable UAT URL serves that candidate with the Review Site Marker
- **AND** PRD continues serving its previously deployed revision until explicit promotion.

#### Scenario: A candidate fails its checks or deployment

- **WHEN** required checks, the UAT build, UAT deployment or hosted release identity verification fails
- **THEN** the candidate is not promotable and the failing stage is reported.

#### Scenario: A browser suite fails

- **WHEN** the end-to-end journey suite or the staff previews fail in the push run
- **THEN** the failing job is reported and the push run fails
- **AND** UAT may already serve that candidate, but the candidate is not promotable.

#### Scenario: An intended design or content change reaches main

- **WHEN** a push changes layout, typography, motion or catalog content and every shopper journey still works
- **THEN** the journey suite passes without a test update
- **AND** the change is accepted through visual review, not through a browser gate.

#### Scenario: The Pages credential has no Pages access

- **WHEN** the environment credential lacks access to the Pages project, which the first step reads
- **THEN** the deploy job fails at its first step, before any migration or Worker deployment
- **AND** that step proves read access only, so Pages write is an operator precondition of the push, and a read-only credential fails later at the Pages deploy.

#### Scenario: Pages follows the Workers without waiting for Durable Objects

- **WHEN** the deploy job has deployed the renderer and backend Workers
- **THEN** running Durable Objects restart onto the new code at once, instead of when they next hibernate
- **AND** the job deploys Pages next and only then verifies, within a two-minute budget, that the Worker entry, the store Durable Object and the hosted release report the candidate
- **AND** a request in flight in an object at that moment fails only if it touches Durable Object storage.

#### Scenario: A candidate fails UAT acceptance

- **WHEN** the UAT static smoke fails after UAT deployed
- **THEN** the push run fails and the candidate is not promotable
- **AND** UAT keeps serving that candidate until a later push replaces it.

### Requirement: PRD promotion selects verified artifacts

Software Release promotion SHALL be an explicit operator dispatch without inputs. It SHALL resolve the source SHA and push run from the release UAT currently serves, and SHALL deploy only that release. Deployment SHALL NOT silently substitute latest main, an unrelated successful run or a run that is not in main history.

#### Scenario: Reviewer accepts a candidate

- **WHEN** the authorized operator dispatches promotion
- **THEN** PRD is built from the source SHA UAT serves, after a push run of that SHA on main succeeded with its `e2e`, `staff-previews` and `deploy-uat` jobs
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

Each release target SHALL still build from its selected source and configuration and pass existing build checks. Independent build and fixture-browser work SHALL overlap only with verified separate mutable state and complete prerequisite/failure handling. The staff previews and the end-to-end journey suite SHALL remain required before PRD promotion, and the checks and the build SHALL remain required before UAT deployment.

#### Scenario: Independent preparation overlaps

- **WHEN** the checks, the UAT build, the end-to-end journey suite or the Chromium staff previews are scheduled concurrently
- **THEN** neither stage overwrites the other's output or evidence
- **AND** each browser uses independent fixture state and an ephemeral server
- **AND** UAT deployment waits for the checks and the build
- **AND** promotion requires the `e2e`, `staff-previews` and `deploy-uat` jobs of the candidate's run to have passed
- **AND** failure or cancellation leaves no unjoined child.

#### Scenario: Candidate preparation becomes faster

- **WHEN** validation scheduling or independent preparation changes
- **THEN** unit/check coverage, build checks and source identity remain enforced for every candidate before UAT deployment
- **AND** previews and the end-to-end journey suite remain enforced before PRD promotion
- **AND** mutation stages retain their ordering, credential contexts and non-cancelling locks
- **AND** PRD still requires an explicit promotion that rebuilds the proven source without implying catalog/launch approval.

### Requirement: PRD promotion is deploy-only

An explicit operator dispatch of PRD promotion, which takes no inputs, SHALL run from main, resolve the release UAT serves and prove it from main-side tooling before any candidate code is checked out, then build PRD content-free from that source SHA, verify the order and checkout-disabled preconditions, migrate, deploy the Worker and then Pages, and verify the hosted PRD release. It SHALL run no static smoke, provider smoke, staff preview or end-to-end suite. The candidate's passed push run is the only acceptance evidence.

#### Scenario: An operator promotes the deployed candidate

- **GIVEN** UAT serves a release whose push run succeeded on main
- **WHEN** the operator dispatches promotion
- **THEN** the release's source SHA is verified to be in main history, and its `e2e`, `staff-previews` and `deploy-uat` jobs are verified to have passed, before any candidate code runs
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
