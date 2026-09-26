## ADDED Requirements

### Requirement: Local iteration is scoped and final validation is complete

The repository MUST support package-scoped partial validation during implementation and MUST retain complete validation
at final completion and before pushing.

#### Scenario: Package-only iteration

- **WHEN** a maintainer selects one application package for fast validation
- **THEN** tests and type checks run for that package without repository-wide contracts
- **AND** the result is explicitly partial.

#### Scenario: Full local validation

- **WHEN** a maintainer completes implementation or prepares to push
- **THEN** all repository validation gates run against the final source fingerprint and toolchain
- **AND** applicable browser, editor, content publication, and task-specific acceptance remains additional.

### Requirement: Validation phase reuse is conservative

The repository MUST reuse validation results only through explicit opt-in and completed, source-stable evidence whose
eligible inputs match.

#### Scenario: An unchanged successful phase is reused

- **GIVEN** a completed eligible phase with identical source, configuration, toolchain, and environment inputs
- **WHEN** a maintainer requests resume
- **THEN** that phase may be reused with its original evidence recorded.

#### Scenario: Inputs or evidence are uncertain

- **GIVEN** missing, changed, malformed, canceled, or invalid source or evidence
- **WHEN** validation resumes
- **THEN** the affected phase runs again, or validation fails closed if source identity is unavailable.

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
