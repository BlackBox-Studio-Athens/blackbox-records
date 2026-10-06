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

### Requirement: Native image reuse preserves fresh target builds

Release preparation MAY persist Astro's native cache of public image transformations. Reuse SHALL preserve source/transformation invalidation and full target builds, and SHALL be retained only when natural release evidence demonstrates a net benefit.

#### Scenario: A compatible image cache is restored

- **WHEN** an ordinary candidate build restores a compatible cache
- **THEN** only the native image asset cache is reused, excluding content stores, snapshots, drafts, final bundles and credentials
- **AND** changes to image bytes, transformation options or image-service/tool identity cause appropriate regeneration
- **AND** both target builds and all existing output checks still run.

#### Scenario: Image cache reuse is unavailable or not worthwhile

- **WHEN** the cache is missing, incompatible, unusable, exceeds the declared size/storage budget, or requires paid storage
- **THEN** preparation rebuilds safely without persistence or fails with a diagnostic rather than accepting stale output
- **AND** restore/save bytes and time remain included in performance evidence
- **AND** persistence is retained only after compatible natural-release observations show at least 30 seconds of net saving including transfer and save overhead.

### Requirement: Compact artifact transfer preserves the complete reviewed bundle

Release transport MAY store each distinct file content once using the existing manifest digests. Every consumer SHALL reconstruct and verify the complete logical bundle before use, retaining both targets and all promotion authority checks.

#### Scenario: A compact candidate is consumed

- **WHEN** any UAT or PRD stage downloads a compact candidate
- **THEN** it validates the transport version, manifest structure, object digests/sizes, unique safe paths and output-root containment
- **AND** it reconstructs independent regular files in a fresh separate directory, without symlinks or shared writable hardlinks
- **AND** all original logical file bytes and manifest bytes are preserved
- **AND** the existing full file, target, source, configuration and content verification passes before any artifact is accepted
- **AND** artifact identity, retention, candidate run authorization and PRD promotion without rebuilding remain unchanged.

#### Scenario: A compact artifact is malformed

- **WHEN** an object is missing, corrupt or unexpected, a path is duplicated or escapes its root, a symlink is present, or the format is unsupported
- **THEN** materialization fails without accepting a partial bundle
- **AND** a transport marker cannot replace or weaken manifest verification.

#### Scenario: A retained legacy candidate is promoted

- **WHEN** the selected unexpired candidate uses the existing directory layout without a transport marker
- **THEN** its existing complete verification and promotion path remains supported
- **AND** compact candidates are consumed by the compatible helper from their reviewed source revision
- **AND** no target rebuild or authority bypass is introduced by format compatibility.

#### Scenario: Compact transfer performance is evaluated

- **WHEN** the current representative bundle is packed and reconstructed
- **THEN** every logical file hash matches and stored payload bytes fall by at least 50 percent
- **AND** normal-release evidence includes pack, upload, download, reconstruction and verification costs
- **AND** lower byte counts alone do not establish an end-to-end latency improvement.

### Requirement: Preparation cancellation does not interrupt hosted mutations

Release preparation MAY cancel superseded work by branch and preparation role. Every hosted Worker, Pages, catalog, and
promotion mutation MUST remain serialized through its required post-deploy acceptance and final identity checks.

#### Scenario: New source supersedes preparation

- **WHEN** a newer automatic run starts while older candidate preparation is active
- **THEN** obsolete preparation for the same branch and role may be canceled
- **AND** the active deployment/acceptance sequence is not canceled.

#### Scenario: Earlier deployment is still running

- **WHEN** a newer UAT candidate starts
- **THEN** its checks and target preparation start without waiting for the shared hosted mutation lock
- **AND** the UAT reusable-workflow call acquires that lock across Worker deployment, Pages deployment, and final provider acceptance
- **AND** the called workflow inherits repository secrets, binds Worker/provider jobs to the UAT environment, and rejects missing required credentials before mutation
- **AND** PRD promotion, catalog mutation, content publication and holding-page deployment retain the same non-cancelling lock.

#### Scenario: Older candidate reaches mutation late

- **WHEN** an older candidate reaches a mutation after a newer candidate has changed the target
- **THEN** the monotonic release-order check rejects it before mutation.

#### Scenario: UAT quick checks pass before provider acceptance

- **WHEN** read-only UAT identity, readiness, and static checks pass
- **THEN** the workflow reports quick feedback
- **AND** candidate acceptance still waits for every existing provider and final identity check.

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
