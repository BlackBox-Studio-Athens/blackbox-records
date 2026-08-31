## ADDED Requirements

### Requirement: Catalog promotion validation is deterministic and fail-closed

The system SHALL validate generated artifacts and every UAT promotion boundary before later mutation or deployment.

#### Scenario: Artifact commit is evaluated

- **WHEN** promotion starts
- **THEN** artifact drift check, unit tests, repository check, and build pass before provider work.

#### Scenario: UAT apply is evaluated

- **WHEN** dry-run reports ambiguity, missing configuration, or an unsafe mutation
- **THEN** apply does not run
- **AND** failure output remains redacted.

#### Scenario: Hosted readiness is evaluated

- **WHEN** Worker/catalog preparation completes
- **THEN** every canonical published Store Item has exactly one ready hosted listing record before static deployment.

### Requirement: Promotion evidence and smoke remain environment-safe

The system SHALL verify UAT behavior and record PRD closure without inventing live proof.

#### Scenario: UAT smoke runs

- **WHEN** the same artifact commit is deployed
- **THEN** configured UAT checkout-surface and paid-path checks run
- **AND** their evidence contains no provider secrets, full IDs, or payment/customer details.

#### Scenario: PRD live policy is absent

- **WHEN** the PRD-open gate or required live configuration is absent
- **THEN** validation reports not_configured
- **AND** does not claim live provider, deploy, or Checkout proof.
