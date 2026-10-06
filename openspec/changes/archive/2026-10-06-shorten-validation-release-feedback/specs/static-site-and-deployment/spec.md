## ADDED Requirements

### Requirement: UAT and PRD candidate artifacts are prepared independently

The Software Release workflow MUST prepare target artifacts independently from each Product Environment's own accepted
publication. It MUST retain full source, workflow, run, configuration, and file identity in verified intermediates
before combining the existing schema-2 promotion bundle.

#### Scenario: PRD preparation is slower than UAT

- **WHEN** UAT preparation and verification pass while PRD preparation is still running
- **THEN** UAT deployment may begin from its verified target artifact
- **AND** the overall candidate remains unaccepted until PRD preparation, assembly, and full UAT acceptance pass.

#### Scenario: Checks run alongside target preparation

- **WHEN** a candidate begins preparation
- **THEN** checks and both target builds may run concurrently after each job verifies immutable main source
- **AND** failed checks block UAT inspection, deployment, and final candidate assembly.

#### Scenario: Target staff artifacts are built

- **WHEN** either target's combined CMS artifact is built
- **THEN** its staff assets are built once with that target's configuration and pass route isolation and bundle budgets
- **AND** both target public builds may restore Astro image transforms without reusing compiled release artifacts or acceptance results.
- **AND** UAT saves the transform cache only when its native file hash changes, it is nonempty, and its size is at most 600 MiB; PRD remains restore-only.

#### Scenario: Intermediate bundle identity differs

- **WHEN** assembly receives missing, altered, wrong-target, mixed-run, mixed-source, or migration-conflicting bundle
  data
- **THEN** assembly fails before producing a promotable candidate.

#### Scenario: Candidate bundle is promoted

- **WHEN** PRD promotion consumes the assembled release
- **THEN** it retains schema-2 artifact compatibility and does not rebuild or restamp the selected bytes.
