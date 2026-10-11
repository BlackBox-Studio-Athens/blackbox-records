## MODIFIED Requirements

### Requirement: One release workflow gates deployment

The pages release workflow SHALL own preparation, UAT Worker deployment, static deployment, and same-SHA smoke tests. State-changing stages SHALL share a non-cancelling target lock. Main pushes SHALL target UAT only; PRD code deployment SHALL require explicit Software Release promotion.

#### Scenario: Invalid release item

- **WHEN** an intended item lacks valid catalog configuration
- **THEN** the current catalog preparation blocks the affected deployment
- **AND** intentional D1 sold-out or paused availability alone does not invalidate configured catalog state.

#### Scenario: A newer release arrives

- **WHEN** another release is already applying state
- **THEN** the running mutation finishes before another starts
- **AND** the next run rechecks candidate and target identity before deploying.

#### Scenario: PRD code is promoted without live catalog confirmation

- **WHEN** an accepted candidate requires no live catalog preparation
- **THEN** its verified PRD code may deploy without provider mutation
- **AND** missing catalog readiness keeps affected checkout unavailable rather than granting live mutation authority.
