## ADDED Requirements

### Requirement: Email modules follow backend boundaries

The system MUST document email application and infrastructure modules in the module-boundary manifest when email behavior or newsletter registration is added.

#### Scenario: Email application code is introduced

- **GIVEN** backend email use cases, newsletter registration use cases, or template builders are added
- **WHEN** module boundaries are audited
- **THEN** email application entrypoints and allowed dependencies are listed in the module-boundary manifest
- **AND** the email module follows the repo's TypeScript-native modulith strategy with closed internals, a root-first public API, and approved named interfaces only where needed
- **AND** consumers cannot deep-import email templates, provider mapping, routing, idempotency, or other internal implementation files.

#### Scenario: Resend infrastructure code is introduced

- **GIVEN** a Resend SDK provider gateway is added
- **WHEN** module boundaries are audited
- **THEN** Resend infrastructure entrypoints and allowed dependencies are listed in the module-boundary manifest
- **AND** frontend modules cannot import backend email provider code.
- **AND** application consumers call the email public API rather than importing the Resend SDK gateway directly.
