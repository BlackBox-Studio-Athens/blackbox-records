## ADDED Requirements

### Requirement: Newsletter effects are scoped by Product Environment

The system MUST scope newsletter registration effects to the active Product Environment.

#### Scenario: Newsletter environment boundary is evaluated

- **WHEN** Local, UAT, or PRD newsletter registration is described, configured, tested, or operated
- **THEN** the registration is mapped to that Product Environment's static host, Worker runtime target, Resend runtime config, and provider Contact behavior
- **AND** Local, UAT, and PRD newsletter registrations do not share mutable subscriber effects.

#### Scenario: Newsletter sink routing is evaluated

- **WHEN** UAT newsletter registration uses sink routing
- **THEN** the sink routing is treated as UAT-only behavior
- **AND** PRD ignores UAT sink overrides.

#### Scenario: PRD newsletter readiness is evaluated

- **WHEN** PRD newsletter registration readiness is evaluated
- **THEN** it is gated by PRD Resend readiness rather than checkout PRD-open status
- **AND** failed or missing PRD Resend config blocks PRD newsletter Contact writes.
