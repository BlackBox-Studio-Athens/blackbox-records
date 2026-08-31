## ADDED Requirements

### Requirement: UAT Worker readiness includes persistent webhook proof

The system SHALL include persistent Stripe endpoint configuration and delivery evidence in UAT Worker readiness.

#### Scenario: UAT readiness is evaluated

- **WHEN** the deployed UAT Worker is accepted
- **THEN** evidence shows the exact persistent endpoint, required event coverage, and STRIPE_WEBHOOK_SECRET binding-name presence
- **AND** contains no signing secret or full provider identifier.

#### Scenario: Secret match is accepted

- **WHEN** persistent signed delivery produces the expected reconciliation
- **THEN** readiness may record the endpoint/Worker secret pair as operational.

#### Scenario: PRD readiness is evaluated

- **WHEN** live PRD webhook setup is requested
- **THEN** production-go-live-readiness owns the endpoint, secret, events, and delivery proof
- **AND** this UAT change performs no live provider mutation.
