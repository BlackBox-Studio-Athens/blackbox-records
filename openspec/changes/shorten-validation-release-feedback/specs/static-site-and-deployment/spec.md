## ADDED Requirements

### Requirement: UAT and PRD candidate artifacts are prepared independently

The Software Release workflow MUST prepare target artifacts independently from each Product Environment's own accepted
publication. It MUST retain full source, workflow, run, configuration, and file identity in verified intermediates
before combining the existing schema-2 promotion bundle.

#### Scenario: PRD preparation is slower than UAT

- **WHEN** UAT preparation and verification pass while PRD preparation is still running
- **THEN** UAT deployment may begin from its verified target artifact
- **AND** the overall candidate remains unaccepted until PRD preparation, assembly, and full UAT acceptance pass.

#### Scenario: Intermediate bundle identity differs

- **WHEN** assembly receives missing, altered, wrong-target, mixed-run, mixed-source, or migration-conflicting bundle
  data
- **THEN** assembly fails before producing a promotable candidate.

#### Scenario: Candidate bundle is promoted

- **WHEN** PRD promotion consumes the assembled release
- **THEN** it retains schema-2 artifact compatibility and does not rebuild or restamp the selected bytes.
