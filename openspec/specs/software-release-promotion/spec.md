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

### Requirement: Published-content restore has bounded concurrency and unchanged authority

Release preparation SHALL restore only the target's accepted immutable snapshot and verified media within its existing request and byte budgets. Overlapping media reads SHALL have a fixed maximum of four active requests per restore and SHALL NOT increase successful-path request counts for the same snapshot.

#### Scenario: A published snapshot is restored

- **WHEN** its identity, snapshot digest, target, schema, and budgets are valid
- **THEN** each unique media digest is fetched once using the existing target authentication
- **AND** at most four media reads are active at once
- **AND** each response still satisfies its timeout, redirect, byte-limit, and digest checks
- **AND** completed output has the same snapshot/media identity as a serial restore.

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

Each release target SHALL still build from its selected source/content/configuration and pass existing acceptance checks. Independent build and fixture-browser work SHALL overlap only with verified separate mutable state and complete prerequisite/failure handling.

#### Scenario: Independent preparation overlaps

- **WHEN** web/staff builds or Chromium/Firefox fixture checks are scheduled concurrently
- **THEN** all existing artifact and preview checks remain required
- **AND** neither stage overwrites the other's output or evidence
- **AND** each browser uses independent fixture state and an ephemeral server
- **AND** packaging waits for both successful results
- **AND** failure or cancellation prevents acceptance and leaves no unjoined child
- **AND** target builds sharing output paths remain sequential, while hosted jobs retain the existing dependency order and shared release lock.

#### Scenario: Candidate preparation becomes faster

- **WHEN** validation scheduling, media reads, or independent preparation changes
- **THEN** unit/check coverage, unused audit, target builds, previews, provider/static smoke, artifact digests, source/configuration/content identity, and retention remain enforced
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
