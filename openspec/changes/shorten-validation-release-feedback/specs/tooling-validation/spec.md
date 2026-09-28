## ADDED Requirements

### Requirement: Local completion is targeted and CI validation is complete

The repository MUST default to targeted local validation for completion and pushing, retain full validation as an explicit local command, and require complete CI tests, checks, and target builds before deployment.

#### Scenario: Package-only iteration

- **WHEN** a maintainer selects one application package for fast validation
- **THEN** tests and type checks run for that package without repository-wide contracts
- **AND** the result is explicitly partial.

#### Scenario: Local completion

- **WHEN** a maintainer completes implementation or prepares to push
- **THEN** affected tests, affected-package types, changed-file lint, and cached formatting run against the final source fingerprint and toolchain
- **AND** selection includes committed changes against a pinned comparison ref plus staged, unstaged, deleted and untracked source
- **AND** content, assets, migrations and package configuration broaden that package's tests; shared packages/tooling add repository contracts
- **AND** local evidence is identified separately from complete CI acceptance
- **AND** applicable browser, editor, content publication, and task-specific acceptance remains additional.

#### Scenario: Full validation is needed

- **WHEN** CI prepares a release or a maintainer explicitly requests the full local suite
- **THEN** every existing test/check/build gate remains required for that full acceptance
- **AND** the default targeted local command cannot substitute for those gates.

#### Scenario: Imported source module changes during iteration

- **WHEN** a maintainer selects a package's affected-test command
- **THEN** its existing Vitest configurations run tests affected by edits against HEAD or an explicit comparison ref
- **AND** selected failures remain nonzero, while an empty selection remains explicitly partial
- **AND** shared/configuration/content/migration changes and dynamic file dependencies still require complete scoped checks.

#### Scenario: Public frontend browser iteration

- **WHEN** Codex edits public frontend code
- **THEN** it reuses the existing background Astro server and hot updates for affected-route inspection
- **AND** CMS, checkout, and publication acceptance still use the full Local stack.
- **AND** occupied port 4321 fails rather than silently selecting another port.

### Requirement: Validation phase reuse is conservative

Full validation MUST reuse phase results only through explicit opt-in. Standalone lint MAY resume by default. All reuse MUST require completed, source-stable evidence whose eligible inputs match.

#### Scenario: An unchanged successful phase is reused

- **GIVEN** a completed eligible phase with identical source, configuration, toolchain, and environment inputs
- **WHEN** a maintainer requests resume
- **THEN** that phase may be reused with its original evidence recorded.

#### Scenario: Inputs or evidence are uncertain

- **GIVEN** missing, changed, malformed, canceled, or invalid source or evidence
- **WHEN** validation resumes
- **THEN** the affected phase runs again, or validation fails closed if source identity is unavailable.

#### Scenario: Native compiler state accelerates repeated package checks

- **WHEN** backend or API-client type checking runs repeatedly
- **THEN** TypeScript may reuse its native incremental state in separate ignored build-info files
- **AND** no-emit diagnostics still fail on invalid changed source, and compiler state never establishes validation or release acceptance by itself.

#### Scenario: Standalone lint repeats on unchanged source

- **WHEN** a maintainer runs `pnpm lint` repeatedly
- **THEN** the existing phase cache may reuse only a complete successful lint phase with matching source/configuration/toolchain/environment and intact evidence
- **AND** the lint-only result is explicitly partial; `--no-cache` forces execution and full validation/CI remains fresh by default.

#### Scenario: Formatting is applied during development

- **WHEN** a maintainer runs `pnpm format` with optional file targets
- **THEN** the installed Prettier CLI uses the existing configuration/plugin-aware cache for write mode
- **AND** edited unformatted files fail checks and are repaired by write mode despite a warm cache
- **AND** `--uncached` explicitly disables native caching.

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
