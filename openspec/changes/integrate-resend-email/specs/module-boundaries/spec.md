## ADDED Requirements

### Requirement: Email modules follow backend boundaries

The system MUST document email application and infrastructure modules in the module-boundary manifest when email behavior is added.

#### Scenario: Email application code is introduced

- **GIVEN** backend email use cases or template builders are added
- **WHEN** module boundaries are audited
- **THEN** email application entrypoints and allowed dependencies are listed in the module-boundary manifest.

#### Scenario: Resend infrastructure code is introduced

- **GIVEN** a Resend SDK provider gateway is added
- **WHEN** module boundaries are audited
- **THEN** Resend infrastructure entrypoints and allowed dependencies are listed in the module-boundary manifest
- **AND** frontend modules cannot import backend email provider code.
