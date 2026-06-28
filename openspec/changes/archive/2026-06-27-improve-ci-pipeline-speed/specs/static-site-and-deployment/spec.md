## ADDED Requirements

### Requirement: Static deploy automation exposes measurable stages

The system SHALL keep UAT and PRD static deploy automation split into measurable verification, build, and deploy stages while preserving the existing deployment targets.

#### Scenario: UAT Pages workflow reports verification and deploy timing separately

- **WHEN** the shared static deployment workflow runs the GitHub Pages UAT target
- **THEN** unit tests, workspace checks, unused audit, UAT static build, artifact upload, and GitHub Pages deploy appear as separately timed workflow jobs or steps
- **AND** the deployed target remains GitHub Pages UAT.

#### Scenario: PRD Pages workflow reports verification and deploy timing separately

- **WHEN** the shared static deployment workflow runs the Cloudflare Pages PRD target
- **THEN** unit tests, workspace checks, unused audit, PRD static build, artifact handoff, and Cloudflare Pages deploy appear as separately timed workflow jobs or steps
- **AND** the deployed target remains Cloudflare Pages PRD.

### Requirement: Static deploy workflows preserve gate-before-deploy correctness

The system MUST deploy UAT and PRD static artifacts only after the required repository gates and target-specific build artifact succeed for the same commit.

#### Scenario: UAT static deployment waits for required work

- **GIVEN** the shared static deployment workflow is triggered for a commit
- **WHEN** deployment starts
- **THEN** `pnpm test:unit`, `pnpm check`, `pnpm audit:unused`, and the UAT `pnpm build:web` artifact build have succeeded for that commit
- **AND** the deployed artifact was built with the UAT site/base/backend environment values.

#### Scenario: PRD static deployment waits for required work

- **GIVEN** the shared static deployment workflow is triggered for a commit
- **WHEN** deployment starts
- **THEN** `pnpm test:unit`, `pnpm check`, `pnpm audit:unused`, and the PRD `pnpm build` artifact build have succeeded for that commit
- **AND** the deployed artifact was built with the PRD site/base/backend environment values.

### Requirement: Static deploy workflows use explicit artifact handoff

The system SHALL hand static build output from build jobs to deploy jobs through explicit GitHub Actions artifacts with bounded retention.

#### Scenario: UAT build artifact is handed to deploy

- **WHEN** the GitHub Pages UAT workflow builds the static frontend
- **THEN** it uploads only the deployable static artifact needed by GitHub Pages
- **AND** the deploy job consumes that artifact for the same commit
- **AND** artifact retention is bounded to the shortest practical period for deployment diagnostics.

#### Scenario: PRD build artifact is handed to deploy

- **WHEN** the Cloudflare Pages PRD workflow builds the static frontend
- **THEN** it uploads only the deployable `apps/web/dist` artifact needed by Cloudflare Pages
- **AND** the deploy job consumes that artifact for the same commit
- **AND** Cloudflare credentials are available only to the deploy job.

### Requirement: Edited deploy workflows follow modern GitHub Actions hygiene

The system MUST keep edited deploy workflows least-privilege, stale-run-safe, and bounded.

#### Scenario: Workflow permissions are reviewed

- **WHEN** a static deploy workflow is edited for CI speed
- **THEN** workflow and job `permissions` are explicit and limited to the actions each job performs
- **AND** secrets are scoped only to jobs that need them.

#### Scenario: Stale deploy work is superseded

- **WHEN** a newer commit starts a static deploy workflow for the same target
- **THEN** concurrency cancels stale in-progress work where deploying the older commit would not be useful
- **AND** environment or promotion jobs that must not overlap remain serialized.

#### Scenario: Workflow jobs are bounded

- **WHEN** a static deploy workflow job runs
- **THEN** the job has an explicit timeout suitable for its measured p90 duration and required provider operations.

### Requirement: CI speed work distinguishes build feedback from provider deploy latency

The system SHALL report static deployment speed in separate build-verification and provider-deploy latency categories.

#### Scenario: UAT Pages deploy tail remains slow

- **WHEN** GitHub Pages deploy latency has high p75 or p90 duration
- **THEN** the workflow report identifies it separately from repository verification and Astro build time
- **AND** repository build/check optimization is not credited with fixing provider deploy latency unless post-change data proves it.
