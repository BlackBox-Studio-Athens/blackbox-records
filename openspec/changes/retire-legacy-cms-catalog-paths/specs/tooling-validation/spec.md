## MODIFIED Requirements

### Requirement: Cleanup validates EmDash continuity without compiled catalog

Installation, ordinary checks, tests, builds and Local startup SHALL work without a generated catalog manifest. Acceptance SHALL cover runtime-only items, member prices, draft privacy, publication ordering, and staff access.

#### Scenario: Clean workspace validation

- **WHEN** required checks run without generated catalog outputs
- **THEN** they pass without recreating a compiled manifest or mutating hosted catalog state.

#### Scenario: Published distro lacks commerce setup

- **WHEN** a snapshot contains published distro without a runtime item
- **THEN** it remains browsable without checkout eligibility; a bound runtime identity takes precedence.
