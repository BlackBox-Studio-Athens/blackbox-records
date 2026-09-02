## MODIFIED Requirements

### Requirement: PRD requires explicit live catalog confirmation

The system MUST NOT perform live PRD catalog mutation unless the exact promotion run carries an explicit, false-by-default live catalog confirmation. Shopper launch approval MUST NOT authorize provider mutation by implication.

#### Scenario: PRD readiness is evaluated

- **WHEN** an artifact commit reaches the PRD branch without explicit live catalog confirmation
- **THEN** redacted readiness or dry-run work may execute
- **AND** no live provider, PRD D1, Worker, static deployment, or Checkout mutation occurs.

#### Scenario: Confirmed PRD catalog preparation runs

- **GIVEN** repository gates passed for one exact artifact commit
- **WHEN** an operator selects PRD and explicitly confirms live catalog changes for that run
- **THEN** the workflow may apply the bounded provider and PRD D1 catalog changes for that commit
- **AND** the confirmation expires with that workflow run
- **AND** it does not approve or enable shopper checkout.

#### Scenario: Direct PRD apply is requested

- **WHEN** a maintainer invokes a direct PRD catalog apply without the explicit confirmation option
- **THEN** the command fails before provider or D1 mutation.

## RENAMED Requirements

- FROM: `### Requirement: PRD remains dry-run while its launch gate is closed`
- TO: `### Requirement: PRD requires explicit live catalog confirmation`
