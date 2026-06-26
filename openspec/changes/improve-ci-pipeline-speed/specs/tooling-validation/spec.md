## ADDED Requirements

### Requirement: CI performance measurement is repeatable

The system SHALL provide a repeatable CI performance measurement path that uses GitHub Actions run, job, and step timing data.

#### Scenario: Maintainer measures CI pipeline speed

- **WHEN** the CI speed measurement command runs against GitHub Actions history
- **THEN** it records workflow, job, and step durations for a declared time window
- **AND** it reports median, p75, p90, sample count, conclusion counts, and confidence labels
- **AND** it stores raw data and a human-readable report under `.codex-artifacts/ci-speed-analysis/` or a documented equivalent artifact path.

#### Scenario: Manual reruns are present

- **WHEN** a workflow run contains multiple attempts or manual rerun gaps
- **THEN** measurement uses latest-attempt job and step timing for execution duration
- **AND** raw run wall-clock gaps are not treated as CI execution time.

### Requirement: CI speed acceptance uses statistical thresholds

The system MUST accept CI speed improvements only from enough successful post-change runs to avoid single-run false positives.

#### Scenario: Static deploy workflow optimization is evaluated

- **WHEN** a CI speed optimization changes static deployment workflows
- **THEN** acceptance compares pre-change and post-change median, p75, and p90 timing for affected workflows
- **AND** each optimized workflow has at least 5 successful post-change runs before speed claims are made
- **AND** workflows with fewer than 5 successful runs are labeled low-confidence.

#### Scenario: Runner-minute trade-off is evaluated

- **WHEN** an optimization uses more parallel jobs to reduce wall-clock duration
- **THEN** the report includes total job-duration impact or an equivalent runner-minute estimate
- **AND** the change is accepted only when the wall-clock benefit is worth the runner-minute trade-off.

### Requirement: Dependency caching remains lockfile-driven and measured

The system SHALL use package-manager store caching for CI dependency installs and avoid custom caches unless measurement proves they are useful.

#### Scenario: Node dependencies are installed in GitHub Actions

- **WHEN** an edited workflow installs Node dependencies with pnpm
- **THEN** it uses `actions/setup-node` pnpm caching keyed by the repository lockfile
- **AND** it runs `pnpm install --frozen-lockfile`.

#### Scenario: Custom cache is proposed

- **WHEN** a workflow change proposes caching `node_modules`, build output, Playwright browsers, or other generated directories
- **THEN** the change includes pre-change timing evidence that the cached path is a material bottleneck
- **AND** the post-change report compares cache restore/save overhead against wall-clock improvement.

#### Scenario: Dependency install remains cheap

- **WHEN** dependency install median remains below 10 seconds for the affected workflow
- **THEN** custom dependency caching is not accepted as a CI speed optimization.

### Requirement: Low-reliability workflows are stabilized before speed tuning

The system SHALL prioritize failure classification for workflows whose success rate is too low for trustworthy speed baselines.

#### Scenario: Workflow has high failure rate

- **WHEN** a workflow has at least 5 runs in the measurement window and fewer than 70 percent succeed
- **THEN** the CI speed report identifies the workflow as reliability-first
- **AND** speed optimization for that workflow waits until failures are classified or the success rate improves.
