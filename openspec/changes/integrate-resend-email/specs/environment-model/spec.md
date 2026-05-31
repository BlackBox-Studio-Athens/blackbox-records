## ADDED Requirements

### Requirement: Resend environment resources are scoped

The system SHALL scope Resend provider resources and runtime config to the canonical Local, UAT, and PRD Product Environments.

#### Scenario: Runtime email config is evaluated

- **GIVEN** the Worker runs in Local, UAT, or PRD
- **WHEN** email or newsletter behavior reads runtime config
- **THEN** it uses only that environment's Resend API key, sender, ops recipient, recipient override, Segment ID, optional Topic ID, and optional test API base URL.
- **AND** UAT maps to the Worker sandbox runtime target and requires `RESEND_UAT_RECIPIENT_OVERRIDE_EMAIL=blackboxrecordsathens@gmail.com`
- **AND** PRD maps to the Worker production runtime target and must not honor the UAT recipient override.

#### Scenario: Local development runs without real provider secrets

- **GIVEN** Local development or automated tests run without real Resend credentials
- **WHEN** email behavior is tested
- **THEN** the system uses mocked provider responses or an explicit local test API base URL
- **AND** no UAT or PRD Resend secrets are copied into local static frontend config.

#### Scenario: Provider setup is prepared

- **GIVEN** Resend CLI setup discovers or prepares provider resources
- **WHEN** environment-specific IDs or reports are produced
- **THEN** non-secret IDs may be copied into Worker runtime configuration
- **AND** API keys, DNS updates, and Worker secret uploads remain environment-scoped operator checkpoints.
