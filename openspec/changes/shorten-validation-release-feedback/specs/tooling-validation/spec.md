## ADDED Requirements

### Requirement: Nx owns local task selection, execution and caching

The repository MUST use pinned Nx 23.2.1 for affected selection, task scheduling and deterministic local caching, capped at three concurrent tasks without Nx Cloud. The validation wrapper MUST retain source fingerprinting, change invalidation and evidence reporting without a second selector, task graph or phase cache. Complete CI tests, checks and target builds remain required before deployment.

#### Scenario: Module test iteration

- **WHEN** a maintainer runs `pnpm test <module>`
- **THEN** Nx runs that module's test target without validation prerequisites
- **AND** the result remains an iteration check rather than completion evidence.

#### Scenario: Local completion

- **WHEN** a maintainer completes implementation or prepares to push
- **THEN** Nx selects affected module tests and package-level lint/type checks, with required architecture checks
- **AND** selection includes project dependencies and declared task inputs
- **AND** the wrapper records the final source fingerprint and toolchain
- **AND** local evidence is identified separately from complete CI acceptance
- **AND** applicable browser, editor, content publication, and task-specific acceptance remains additional.

#### Scenario: Full validation is needed

- **WHEN** CI prepares a release or a maintainer explicitly requests the full local suite
- **THEN** every existing test/check/build gate remains required for that full acceptance
- **AND** the default targeted local command cannot substitute for those gates.

#### Scenario: Nx plan is requested

- **WHEN** a maintainer runs `pnpm validate --plan`
- **THEN** the wrapper prints the native Nx task graph
- **AND** it executes no task.

#### Scenario: Native test projects are generated

- **WHEN** a source or integration project declares a test command
- **THEN** its Vitest project discovers tests within its native Nx root, excluding nested projects
- **AND** backend source targets depend on integration test targets, which Nx deduplicates in full runs
- **AND** backend `*.worker.test.ts` tests use Cloudflare while other backend `*.test.ts` tests use Node
- **AND** `scripts/check-module-projects.mjs` verifies every TypeScript test has exactly one owner and rejects unowned source and module cycles.

#### Scenario: Package checks avoid repeated typed lint

- **WHEN** multiple source modules in one package are affected
- **THEN** tests remain module-level and lint/typecheck remain package-level Nx targets
- **AND** TypeScript-aware lint does not restart once per module.

#### Scenario: Affected test shortcuts are used

- **WHEN** a maintainer runs `pnpm test:changed` or `pnpm test:watch <module>`
- **THEN** Nx affected selection or the native test-watch target is used
- **AND** these iteration results alone do not establish local completion.

#### Scenario: Cache behavior is selected

- **WHEN** a maintainer runs validation without cache options
- **THEN** Nx's deterministic local cache is enabled by default
- **AND** `--resume` remains a compatibility option
- **AND** `--no-cache` disables cache reuse without changing affected or full selection.

#### Scenario: Public frontend browser iteration

- **WHEN** Codex edits public frontend code
- **THEN** it reuses the existing background Astro server and hot updates for affected-route inspection
- **AND** CMS, checkout, and publication acceptance still use the full Local stack.
- **AND** occupied port 4321 fails rather than silently selecting another port.

### Requirement: Full validation retains all targets

Full local validation MUST run all test, lint, type and build targets through Nx `run-many`. Full CI and release acceptance MUST remain complete and independent of local cache hits.

#### Scenario: Full validation is requested

- **WHEN** a maintainer runs `pnpm validate:full`
- **THEN** Nx `run-many` selects tests, lint, types and builds
- **AND** the result does not omit required CI or release acceptance.

### Requirement: Validation timing distinguishes feedback milestones

Reports MUST distinguish local first failure and total duration from hosted queue, setup, transfer, runner cost, UAT
quick feedback, and promotion readiness where evidence is available.

#### Scenario: Hosted timing is incomplete

- **WHEN** timing evidence is missing
- **THEN** it is reported as unavailable and excluded from successful-run percentiles.

### Requirement: Unused-code reporting does not delay candidate acceptance

The weekly and manually dispatched unused-code audit MUST retain its report independently from the release candidate
workflow.

#### Scenario: Candidate acceptance runs

- **WHEN** the release workflow prepares a candidate
- **THEN** it runs all required tests, checks, builds, and acceptance stages
- **AND** it does not wait for the advisory unused-code audit.

#### Scenario: Advisory audit fails

- **WHEN** the audit tool itself fails
- **THEN** its standalone workflow fails visibly and retains available diagnostic output.

## MODIFIED Requirements

### Requirement: Standard repository gates

The system SHALL run targeted local checks after behavior-changing implementation and retain complete repository gates in CI before deployment.

#### Scenario: Behavior changes

- **GIVEN** code changes affect runtime behavior, tests, build output, scripts, or workflows
- **WHEN** implementation is complete
- **THEN** targeted `pnpm validate` must pass for the final source fingerprint before local completion or push
- **AND** CI must pass every test/check leaf and the checked target builds before deployment
- **AND** `pnpm validate:full` and the three standalone unit/check/build commands remain available without catalog generation
- **AND** local evidence and partial `pnpm validate:fast`, `pnpm validate:checks`, and `pnpm validate:editor` results never establish full CI or release acceptance.

#### Scenario: Local validation evidence is produced

- **WHEN** validation runs
- **THEN** compact phase results point to full local logs and a JSON summary
- **AND** the summary records source SHA, tracked/untracked source fingerprint, tool versions, durations, and phase exit status
- **AND** targeted local summaries declare `mode: local`, distinct from `mode: full`
- **AND** source changes, cancellation, and incomplete phases prevent full success
- **AND** task-specific rendered, asset, CMS, and hosted checks retain their existing scope.

#### Scenario: A separate worktree is explicitly authorized

- **GIVEN** the user explicitly requested a separate worktree
- **WHEN** the OpenSpec guard or wrapper receives `--allow-worktree`
- **THEN** it permits that repository checkout and does not forward the opt-in to OpenSpec
- **AND** omitting the flag preserves the default main-worktree and main-branch restriction.

#### Scenario: CI runs complete checks alongside target builds

- **WHEN** `pnpm validate:checks` succeeds
- **THEN** all current unit-test and workspace-check leaves have succeeded for its recorded source identity
- **AND** its evidence is explicitly partial because target builds have not run
- **AND** CI still requires both target builds, combined artifacts, previews, and hosted acceptance before promotion eligibility; the unused-code audit runs separately
- **AND** checks and target builds may run concurrently, but failed checks prevent deployment and final candidate assembly.
