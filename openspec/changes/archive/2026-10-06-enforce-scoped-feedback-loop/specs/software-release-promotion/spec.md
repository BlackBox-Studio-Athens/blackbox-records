# Spec Delta

## ADDED Requirements

### Requirement: PRD promotion runs hosted acceptance before mutation

Software Release promotion SHALL run UAT static smoke, provider smoke, staff preview checks in Chromium and Firefox, and the whole end-to-end suite for the selected candidate before any PRD migration or deployment. Promotion SHALL first verify that UAT serves the selected candidate's source SHA. Any failed or skipped acceptance suite SHALL stop promotion before mutation.

#### Scenario: An operator promotes the deployed candidate

- **GIVEN** UAT serves the selected candidate's source SHA
- **WHEN** the operator confirms code promotion
- **THEN** the acceptance suites run for that SHA under the shared non-cancelling release lock
- **AND** PRD migrations and deployments start only after every suite passes.

#### Scenario: An acceptance suite fails

- **WHEN** static smoke, provider smoke, staff previews or the end-to-end suite fails
- **THEN** no PRD migration or deployment runs
- **AND** the failing suite and its evidence are reported.

#### Scenario: UAT moved to a newer candidate

- **WHEN** UAT serves a different source SHA than the candidate selected for promotion
- **THEN** promotion stops before acceptance and mutation
- **AND** the operator promotes the candidate UAT currently serves or redeploys the selected one.

#### Scenario: A failed PRD step is retried

- **WHEN** acceptance passed and a later PRD step failed
- **THEN** rerunning only the failed jobs of that run reuses the passed acceptance results for the same candidate.

## MODIFIED Requirements

### Requirement: Main publishes a UAT candidate only

A deploy-relevant push to main SHALL create a Release Candidate in UAT and SHALL NOT deploy PRD code or mutate live catalog state. The push run SHALL verify the hosted release identity and SHALL NOT run browser or provider acceptance.

#### Scenario: A small UI change reaches main

- **WHEN** its required checks and target builds pass
- **THEN** the stable UAT URL serves that candidate with the Review Site Marker
- **AND** PRD continues serving its previously deployed revision until explicit promotion.

#### Scenario: A candidate fails its checks or deployment

- **WHEN** required checks, a target build, artifact assembly, UAT deployment or hosted release identity verification fails
- **THEN** the candidate is not promotable and the failing stage is reported.

#### Scenario: A candidate fails UAT acceptance

- **WHEN** hosted static, provider, preview or end-to-end checks fail during promotion
- **THEN** PRD is not mutated and the failing stage is reported.

### Requirement: Published-content restore has bounded concurrency and unchanged authority

Release preparation SHALL restore only the target's accepted immutable snapshot and verified media within its existing request and byte budgets. Overlapping media reads SHALL have a fixed maximum of four active requests per restore and SHALL NOT increase successful-path request counts for the same snapshot. A media file MAY be taken from a retained cache only when its bytes match the snapshot's digest.

#### Scenario: A published snapshot is restored

- **WHEN** its identity, snapshot digest, target, schema, and budgets are valid
- **THEN** each unique media digest is fetched at most once using the existing target authentication
- **AND** at most four media reads are active at once
- **AND** each response still satisfies its timeout, redirect, byte-limit, and digest checks
- **AND** completed output has the same snapshot/media identity as a serial restore.

#### Scenario: Media is available from the retained cache

- **WHEN** a cached file's digest equals a media digest in the accepted snapshot
- **THEN** the restore uses the cached bytes without a hosted request
- **AND** a cached file whose digest differs is ignored and the media is fetched
- **AND** the snapshot itself is always read from the target, never from the cache.

#### Scenario: A media read fails or exceeds a budget

- **WHEN** a read fails authentication, times out, redirects, exceeds its byte limit, or has an incorrect digest
- **THEN** no subsequent batch starts and no automatic hosted retry is added
- **AND** active requests are settled or cancelled before exit
- **AND** no completed snapshot identity is accepted from the partial restore.

#### Scenario: Hosted restore performance is observed

- **WHEN** measurement consumes hosted operations during an authorized release
- **THEN** local rehearsal, current account-wide usage, declared operations/headroom, and a bounded operation satisfy the Free-tier operating rule
- **AND** missing quota evidence keeps the experiment local
- **AND** synthetic local latency is never presented as measured hosted savings.

### Requirement: Build acceleration preserves target artifacts and release gates

Each release target SHALL still build from its selected source/content/configuration and pass existing artifact checks. Independent build and fixture-browser work SHALL overlap only with verified separate mutable state and complete prerequisite/failure handling. Preview, static and provider acceptance SHALL remain required before PRD promotion mutates PRD.

#### Scenario: Independent preparation overlaps

- **WHEN** web/staff builds or Chromium/Firefox fixture checks are scheduled concurrently
- **THEN** all existing artifact checks remain required for packaging and all preview checks remain required for promotion
- **AND** neither stage overwrites the other's output or evidence
- **AND** each browser uses independent fixture state and an ephemeral server
- **AND** packaging waits for the successful target builds, and promotion waits for both browsers' successful results
- **AND** failure or cancellation prevents acceptance and leaves no unjoined child
- **AND** target builds sharing output paths remain sequential, while hosted jobs retain the existing dependency order and shared release lock.

#### Scenario: Candidate preparation becomes faster

- **WHEN** validation scheduling, media reads, or independent preparation changes
- **THEN** unit/check coverage, target builds, artifact digests, source/configuration/content identity, and retention remain enforced for every candidate
- **AND** previews and provider/static smoke remain enforced before PRD promotion mutates PRD
- **AND** mutation stages retain their ordering, credential contexts, and shared non-cancelling lock
- **AND** PRD still requires explicit selection and promotion of the retained reviewed artifact without rebuilding or implying catalog/launch approval.
