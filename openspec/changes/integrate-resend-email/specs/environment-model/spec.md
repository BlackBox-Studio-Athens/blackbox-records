## ADDED Requirements

### Requirement: Resend environment resources are scoped

The system SHALL scope Resend provider resources and runtime config to the canonical Local, UAT, and PRD Product Environments.

#### Scenario: Runtime email config is evaluated

- **GIVEN** the Worker runs in Local, UAT, or PRD
- **WHEN** paid-order email behavior reads runtime config
- **THEN** it uses only that environment's Resend API key, sender, ops recipient, and recipient override.
- **AND** UAT maps to the Worker sandbox runtime target and requires `RESEND_UAT_RECIPIENT_OVERRIDE_EMAIL=blackboxrecordsathens@gmail.com`
- **AND** PRD maps to the Worker production runtime target and must not honor the UAT recipient override.

#### Scenario: Local development runs without real provider secrets

- **GIVEN** Local development or automated tests run without real Resend credentials
- **WHEN** email behavior is tested
- **THEN** the system uses mocked application-level provider responses
- **AND** no UAT or PRD Resend secrets are copied into local static frontend config.

#### Scenario: Provider readiness is verified

- **GIVEN** Resend CLI verification checks provider readiness
- **WHEN** environment-specific IDs or reports are produced
- **THEN** non-secret reports may be copied into local evidence or deployment notes
- **AND** API keys, DNS updates, and Worker secret uploads remain environment-scoped operator checkpoints.
