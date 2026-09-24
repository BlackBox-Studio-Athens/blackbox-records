## MODIFIED Requirements

### Requirement: Standard repository gates

The system SHALL run the standard repository gates after behavior-changing implementation.

#### Scenario: Behavior changes

- **GIVEN** code changes affect runtime behavior, tests, build output, scripts, or workflows
- **WHEN** implementation is complete
- **THEN** `pnpm validate` (alias `pnpm validate:full`) must pass every test, check, and build leaf previously owned by `pnpm test:unit`, `pnpm check`, and `pnpm build` before completion is claimed
- **AND** those three standalone commands remain supported without catalog generation
- **AND** partial `pnpm validate:fast`, `pnpm validate:checks`, and `pnpm validate:editor` results never establish completion.

#### Scenario: Local validation evidence is produced

- **WHEN** validation runs
- **THEN** compact phase results point to full local logs and a JSON summary
- **AND** the summary records source SHA, tracked/untracked source fingerprint, tool versions, durations, and phase exit status
- **AND** source changes, cancellation, and incomplete phases prevent full success
- **AND** task-specific rendered, asset, CMS, and hosted checks retain their existing scope.

#### Scenario: A separate worktree is explicitly authorized

- **GIVEN** the user explicitly requested a separate worktree
- **WHEN** the OpenSpec guard or wrapper receives `--allow-worktree`
- **THEN** it permits that repository checkout and does not forward the opt-in to OpenSpec
- **AND** omitting the flag preserves the default main-worktree and main-branch restriction.

#### Scenario: CI runs prerequisites before target builds

- **WHEN** `pnpm validate:checks` succeeds
- **THEN** all current unit-test and workspace-check leaves have succeeded for its recorded source identity
- **AND** its evidence is explicitly partial because target builds have not run
- **AND** CI still requires its unused audit, both target builds, combined artifacts, previews, and hosted acceptance before promotion eligibility
- **AND** a failed prerequisite prevents downstream builds and deployment.

### Requirement: CI performance measurement is repeatable

The system SHALL provide a repeatable CI performance measurement path that uses GitHub Actions run, job, and step timing data.

#### Scenario: Maintainer measures CI pipeline speed

- **WHEN** the CI speed measurement command runs against GitHub Actions history
- **THEN** it records workflow, job, and step durations for a declared bounded time window
- **AND** it reports median, p75, p90, sample count, conclusion counts, and confidence labels
- **AND** it separates UAT candidate releases, PRD promotions, catalog plans, and diagnostic workflows
- **AND** it reports source/workflow revisions, execution duration, available queue timing, total job seconds, and available cache/artifact/content metadata without secrets
- **AND** it stores raw data and a human-readable report under `.codex-artifacts/ci-speed-analysis/` or a documented equivalent artifact path.

#### Scenario: Manual reruns are present

- **WHEN** a workflow run contains multiple attempts or manual rerun gaps
- **THEN** measurement uses attempt-specific job and step timing for execution duration
- **AND** the selected attempt and prior conclusions are retained
- **AND** raw run wall-clock gaps are not treated as CI execution or queue time
- **AND** missing queue or cache metadata is reported as unavailable.

#### Scenario: CI measurements are gathered without extra release campaigns

- **WHEN** this optimization is investigated or accepted
- **THEN** existing run/job/step history, retained logs and local prototypes are reused first
- **AND** at most one optional 60-second shadow pack/restore/verify probe runs inside an already-authorized normal candidate job using its existing bundle
- **AND** that probe performs no duplicate build, full artifact upload, deployment, payment or webhook replay
- **AND** probe timeout or failure preserves the canonical original artifact and cannot establish optimization success
- **AND** small timing summaries from subsequent ordinary releases supply the post-change cohort, including all instrumentation overhead
- **AND** missing samples leave acceptance pending rather than triggering benchmark-only releases.

### Requirement: CI speed acceptance uses statistical thresholds

The system MUST accept CI speed improvements only from enough successful post-change runs to avoid single-run false positives.

#### Scenario: Static deploy workflow optimization is evaluated

- **WHEN** a CI speed optimization changes static deployment workflows
- **THEN** acceptance compares pre-change and post-change median, p75, and p90 timing for affected workflows
- **AND** each optimized workflow has at least 5 successful post-change runs before speed claims are made
- **AND** workflows with fewer than 5 successful runs are labeled low-confidence
- **AND** failures, cancellations, rerun counts, content differences, and cache states remain visible rather than silently excluded from the report.

#### Scenario: Runner-minute trade-off is evaluated

- **WHEN** an optimization uses more parallel jobs to reduce wall-clock duration
- **THEN** the report includes total job-duration impact or an equivalent runner-minute estimate
- **AND** the change is accepted only when the wall-clock benefit is worth the runner-minute trade-off.

#### Scenario: Current release speed change is accepted

- **GIVEN** at least five comparable successful baseline and five post-change UAT candidate attempts
- **WHEN** `accelerate-validation-and-releases` is assessed
- **THEN** median execution through required hosted smoke is lower, including measurement and artifact overhead, and the observed reduction and confidence are reported
- **AND** p75 and total job seconds are no more than 10 percent higher
- **AND** no required smoke, isolation, freshness, digest, authorization, or serialization check has been weakened
- **AND** unavailable hosted evidence leaves performance acceptance pending without causing benchmark-only PRD promotions.

#### Scenario: Only Local prototypes have run

- **WHEN** setup, scheduling, or media batching succeeds in Local prototypes
- **THEN** the report identifies actual commands, source/configuration identity, test coverage, repeated timings, and sample limitations
- **AND** it does not claim an end-to-end hosted percentage from Local timings or synthetic network latency.

## ADDED Requirements

### Requirement: Paid-order polling separates readiness from final acceptance

The smoke runner SHALL stop waiting when its required order state is observed, while independently enforcing every final checkout acceptance condition. It SHALL NOT impose the full timeout on an already-paid order because final evidence is unavailable inside the polling loop.

#### Scenario: A paid order is observed

- **WHEN** a paid scenario's poll observes the paid order state
- **THEN** it returns within that iteration using the existing enrichment and fallback behavior
- **AND** it records the first paid-state observation and poll count without provider secrets or customer payloads
- **AND** final surface, projection, payment and shipping checks still determine scenario success.

#### Scenario: The order is not ready or final evidence is invalid

- **WHEN** an order remains pending or a non-paid scenario is running
- **THEN** the existing bounded wait and non-paid behavior remain intact
- **AND** missing or invalid final checkout projection still prevents acceptance even if the order is paid
- **AND** the speed change does not shorten provider timeouts or create extra payments/replays.

### Requirement: Backend test selection preserves coverage and runtime intent

Backend validation SHALL execute every intended test exactly once in a suitable runtime and retain real platform integration coverage.

#### Scenario: Platform-independent tests change execution pool

- **WHEN** tests move to a lower-overhead runtime
- **THEN** their assertions and intended behavior remain unchanged
- **AND** collected file and full-test-name inventories have no missing or duplicate entries
- **AND** tests requiring platform bindings or platform-specific behavior remain in the platform runtime with storage isolation.

#### Scenario: A new backend test is added

- **WHEN** it has not yet been classified for the lower-overhead runtime
- **THEN** normal backend validation still collects it
- **AND** collection checks detect any overlap or omission.

### Requirement: Formatting cache preserves complete validation

Formatting checks SHALL return the same result with a compatible native cache as without it, across the complete normal input set. Cached success SHALL NOT replace test execution, final lint, type checks, boundary checks, or builds.

#### Scenario: Content or tooling changes

- **WHEN** source bytes, formatter configuration, ignore rules, plugin implementation/version, or dependency identity changes
- **THEN** affected formatting work is checked again
- **AND** unchanged timestamps cannot cause a changed file to be accepted from cache.

#### Scenario: Cache is unavailable

- **WHEN** the formatting cache is missing, unreadable, incompatible, or corrupt
- **THEN** validation either checks without it or fails with an actionable diagnostic
- **AND** it never reports success based on unusable evidence
- **AND** an explicit uncached formatting command remains available.

### Requirement: Test setup is scoped without permitting live requests

Validation SHALL avoid loading expensive runtime or request-mocking setup for tests that do not need it while preserving assertion coverage, lifecycle cleanup, and rejection of accidental live network requests.

#### Scenario: Pure tests run without the request-mocking server

- **WHEN** a proven platform-independent test is collected in the lightweight group
- **THEN** it avoids unnecessary database and request-handler initialization
- **AND** an unmocked external request still fails instead of reaching a real service.

#### Scenario: Request tests run

- **WHEN** a test requires the request-mocking server directly or through imported helpers
- **THEN** that setup remains active with unhandled-request rejection and per-test handler cleanup
- **AND** tests are not omitted, duplicated, or weakened by setup classification.

### Requirement: Parallel validation preserves dependencies and bounded resource use

Independent validation work SHALL be eligible for measured bounded overlap. Adoption SHALL preserve prerequisites, isolated mutable state, all child outcomes, and complete evidence, with a serial diagnostic path.

#### Scenario: A concurrency profile is selected

- **WHEN** the implementation evaluates additional test or check overlap
- **THEN** it measures full-run latency and records nested pool limits, host resources, and failures
- **AND** the selected profile improves complete execution without introducing resource-pressure failures or accepting a lost child failure
- **AND** per-file platform storage isolation and same-file test ordering remain intact.

#### Scenario: Independent builds or browser checks overlap

- **WHEN** web/staff builds or Chromium/Firefox fixture checks run together
- **THEN** prerequisites have completed and mutable outputs, ports, fixtures, and evidence are isolated
- **AND** every child must pass before downstream acceptance or packaging
- **AND** either child's failure or cancellation prevents successful completion and child processes are settled or stopped.

#### Scenario: Work shares a mutable resource

- **WHEN** two operations write the same build/configuration/storage paths or act on the same hosted target
- **THEN** they retain required sequencing
- **AND** a speed target never permits overlapping release mutations or weakening credential boundaries.

### Requirement: Local validation speed is measured against the current runner

Local performance acceptance SHALL compare the current full validator and fast-all command with the candidate on matching hardware, tools, scenarios, and declared cache state. Earlier sequential-runner improvements SHALL NOT be counted again.

#### Scenario: Local performance is accepted

- **GIVEN** three comparable valid warm-full baseline and three final implementation measurements on the same Local machine and toolchain
- **WHEN** this speed change is evaluated
- **THEN** the warm-full median reduction is at least 20 percent
- **AND** warm-full p75 is no more than 10 percent higher and the small sample size remains explicit
- **AND** warm priming, dependency installation, and evidence-collection setup are identified separately
- **AND** every full sample has complete successful gates, unchanged assertion inventories, and stable source identity.

#### Scenario: Fresh and fast paths are checked

- **WHEN** the selected implementation is integrated
- **THEN** one comparable fresh-full before/after pair and one warm-fast-all pair check correctness and non-regression within 10 percent
- **AND** an ambiguous or failing pair is repeated before a conclusion
- **AND** these diagnostic pairs do not establish median or percentile speed claims
- **AND** fast results remain partial.

#### Scenario: Removed overhead is distinguished from scheduling gains

- **WHEN** the implementation reports speed improvements
- **THEN** it includes a before/after warm pilot at fixed phase scheduling and per-suite worker settings
- **AND** setup/cache changes are measured before introducing additional concurrency
- **AND** that directional pilot is not presented as statistically conclusive evidence or a sum of overlapping phase durations.

#### Scenario: A benchmark run is invalid

- **WHEN** a phase fails, a source changes, an assertion disappears, the campaign is interrupted, or the expected summary is absent or incomplete
- **THEN** raw evidence and the invalid reason are retained
- **AND** successful outer exit codes do not override the invalidity
- **AND** the campaign is not reported as accepted savings.

#### Scenario: Baseline and candidate run sequentially in one checkout

- **WHEN** no separate benchmark worktrees are authorized
- **THEN** before/after campaigns can be captured separately without changing checkout policy
- **AND** comparison verifies machine/tool/scenario compatibility and records each frozen source identity
- **AND** the report states the non-interleaved order and rejects comparisons affected by changed host conditions.
