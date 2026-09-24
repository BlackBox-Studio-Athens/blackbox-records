## ADDED Requirements

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
