## MODIFIED Requirements

### Requirement: Main publishes a UAT candidate only

A deploy-relevant push to main SHALL create a Release Candidate in UAT and SHALL NOT deploy PRD code or mutate live catalog state. The push run SHALL run the complete checks, the whole end-to-end suite and the staff previews in Chromium and Firefox in parallel with one content-free UAT build, and UAT deployment SHALL wait for the checks and the build. The end-to-end suite and the staff previews SHALL NOT delay UAT deployment, and a run in which any of them failed SHALL NOT be promotable. The UAT build SHALL hold no CMS credential and SHALL restore no CMS content or media. One deploy job SHALL check the Pages credential read-only before any migration, then migrate, deploy the Workers, deploy Pages, verify the deployed Worker and hosted release identity, and SHALL then run the read-only UAT static smoke. Worker identity SHALL be read from the backend Worker entry, not from a Durable Object. It SHALL NOT run provider smoke.

#### Scenario: A small UI change reaches main

- **WHEN** its required checks and UAT build pass
- **THEN** the stable UAT URL serves that candidate with the Review Site Marker
- **AND** PRD continues serving its previously deployed revision until explicit promotion.

#### Scenario: A candidate fails its checks or deployment

- **WHEN** required checks, the UAT build, UAT deployment or hosted release identity verification fails
- **THEN** the candidate is not promotable and the failing stage is reported.

#### Scenario: A browser suite fails

- **WHEN** the whole end-to-end suite or a staff preview fails in the push run
- **THEN** the failing job is reported and the push run fails
- **AND** UAT may already serve that candidate, but the candidate is not promotable.

#### Scenario: The Pages credential has no Pages access

- **WHEN** the environment credential lacks access to the Pages project, which the first step reads
- **THEN** the deploy job fails at its first step, before any migration or Worker deployment
- **AND** that step proves read access only, so Pages write is an operator precondition of the push, and a read-only credential fails later at the Pages deploy.

#### Scenario: Pages follows the Workers without waiting for Durable Objects

- **WHEN** the deploy job has deployed the renderer and backend Workers
- **THEN** it deploys Pages next and only then verifies the Worker entry identity and the hosted release identity, within a two-minute budget
- **AND** it does not wait for the commerce or CMS Durable Objects, whose code updates are eventually consistent, so backend API changes stay compatible with the previous release.

#### Scenario: A candidate fails UAT acceptance

- **WHEN** the UAT static smoke fails after UAT deployed
- **THEN** the push run fails and the candidate is not promotable
- **AND** UAT keeps serving that candidate until a later push replaces it.

### Requirement: Build acceleration preserves target artifacts and release gates

Each release target SHALL still build from its selected source and configuration and pass existing build checks. Independent build and fixture-browser work SHALL overlap only with verified separate mutable state and complete prerequisite/failure handling. The staff previews and the whole end-to-end suite SHALL remain required before PRD promotion, and the checks and the build SHALL remain required before UAT deployment.

#### Scenario: Independent preparation overlaps

- **WHEN** the checks, the UAT build, the end-to-end shards or the Chromium/Firefox staff previews are scheduled concurrently
- **THEN** neither stage overwrites the other's output or evidence
- **AND** each browser uses independent fixture state and an ephemeral server
- **AND** UAT deployment waits for the checks and the build
- **AND** promotion requires every end-to-end shard, both staff previews and the UAT deploy of the candidate's run to have passed
- **AND** failure or cancellation leaves no unjoined child.

#### Scenario: Candidate preparation becomes faster

- **WHEN** validation scheduling or independent preparation changes
- **THEN** unit/check coverage, build checks and source identity remain enforced for every candidate before UAT deployment
- **AND** previews and the whole end-to-end suite remain enforced before PRD promotion
- **AND** mutation stages retain their ordering, credential contexts and non-cancelling locks
- **AND** PRD still requires an explicit promotion that rebuilds the proven source without implying catalog/launch approval.
