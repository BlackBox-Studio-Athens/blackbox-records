## ADDED Requirements

### Requirement: Production launch gates

The system MUST block production native-commerce launch until live payment, domain, webhook, Worker, D1, rollback, and approval evidence exists.

#### Scenario: Launch is requested

- **GIVEN** sandbox/test-mode evidence exists
- **WHEN** production launch is considered
- **THEN** live Stripe credentials, live Products/Prices, final domain, production webhook endpoint, production Worker/D1 configuration, and final approval are verified first.

### Requirement: Launch evidence safety

The system SHALL record production evidence without committing secrets, full Stripe IDs, provider credentials, raw provider payloads, or account-specific private data.

#### Scenario: Evidence is recorded

- **GIVEN** a production readiness check produces account-specific output
- **WHEN** evidence is written to OpenSpec
- **THEN** it is redacted to safe identifiers and summary status only.

### Requirement: Rollback and disable path

The system MUST have documented rollback and emergency-disable behavior before native commerce receives production traffic.

#### Scenario: Go-live review finds a critical issue

- **GIVEN** reviewers identify a launch blocker
- **WHEN** native checkout must be disabled or rolled back
- **THEN** the approved rollback or disable path is available without exposing runtime secrets to the frontend.
