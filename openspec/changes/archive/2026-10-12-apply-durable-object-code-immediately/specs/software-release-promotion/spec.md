## MODIFIED Requirements

### Requirement: Main publishes a UAT candidate only

A deploy-relevant push to main SHALL create a Release Candidate in UAT and SHALL NOT deploy PRD code or mutate live catalog state. The push run SHALL run the complete checks, the whole end-to-end suite and the staff previews in Chromium and Firefox in parallel with one content-free UAT build, and UAT deployment SHALL wait for the checks and the build. The end-to-end suite and the staff previews SHALL NOT delay UAT deployment, and a run in which any of them failed SHALL NOT be promotable. The UAT build SHALL hold no CMS credential and SHALL restore no CMS content or media. One deploy job SHALL check the Pages credential read-only before any migration, then migrate, deploy the Workers, deploy Pages, verify the deployed Worker and hosted release identity, and SHALL then run the read-only UAT static smoke. Every Worker deployment SHALL restart running Durable Objects onto the new code immediately, and the Worker identity check SHALL require both the backend Worker entry and its store Durable Object to report the candidate. It SHALL NOT run provider smoke.

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
- **THEN** running Durable Objects restart onto the new code at once, instead of when they next hibernate
- **AND** the job deploys Pages next and only then verifies, within a two-minute budget, that the Worker entry, the store Durable Object and the hosted release report the candidate
- **AND** a request in flight in an object at that moment fails only if it touches Durable Object storage.

#### Scenario: A candidate fails UAT acceptance

- **WHEN** the UAT static smoke fails after UAT deployed
- **THEN** the push run fails and the candidate is not promotable
- **AND** UAT keeps serving that candidate until a later push replaces it.
