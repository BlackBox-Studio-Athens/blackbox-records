## ADDED Requirements

### Requirement: Scoped env helpers

The system SHALL use `@t3-oss/env-core` only where selected script or build-time env contracts become clearer and safer.

#### Scenario: Env helper is introduced

- **GIVEN** a repo-owned script or Astro build-time config has duplicated env parsing
- **WHEN** a helper is added
- **THEN** it uses Zod-backed required, optional, and defaulted values with actionable errors.

### Requirement: Secret ownership remains unchanged

The system MUST keep Worker runtime bindings and secrets out of Astro public env, generated clients, package scripts, and committed files.

#### Scenario: Secret env is missing or malformed

- **GIVEN** a secret-like value fails validation
- **WHEN** the error is reported
- **THEN** the message is actionable and does not print the secret value.
