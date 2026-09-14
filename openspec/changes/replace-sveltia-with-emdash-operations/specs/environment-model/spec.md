## MODIFIED Requirements

### Requirement: Operator Access trust is Product Environment scoped

The system SHALL require configured Cloudflare Access issuer and audience for both hosted staff/CMS surfaces, SHALL fail closed when either surface is not configured, and SHALL keep JWT-free identity Local and loopback-only.

#### Scenario: PRD evaluates an internal request

- **WHEN** UAT or PRD staff/CMS authentication starts
- **THEN** configured issuer and operator-application audience are required
- **AND** missing or malformed configuration fails closed before route work.

#### Scenario: UAT has no operator surface

- **GIVEN** UAT has no protected operator hostname or Access application
- **WHEN** an internal request reaches the UAT Worker
- **THEN** the request fails closed before route work
- **AND** a forwarded email header does not change the outcome.

#### Scenario: Local loopback request is evaluated

- **GIVEN** Product Environment is Local and a valid local operator email is configured
- **WHEN** the request hostname is localhost or 127.0.0.1
- **THEN** the Worker may produce the configured Local operator identity without an Access assertion.

#### Scenario: Local configuration reaches another hostname

- **WHEN** a JWT-free internal request uses a non-loopback hostname or a hosted Product Environment
- **THEN** the Local path is rejected
- **AND** a forwarded email header does not change the outcome.

## ADDED Requirements

### Requirement: Editorial resources follow Product Environment isolation

UAT and PRD SHALL have separate CMS data, media, publication state, commerce data, credentials, and staff Access audiences, using the same deployment topology.

#### Scenario: UAT content is edited

- **WHEN** a member saves, uploads, publishes, changes a price, or adjusts stock in UAT
- **THEN** no PRD record, provider object, media object, or deployment is changed.

#### Scenario: Code is promoted

- **WHEN** a Software Release moves from UAT to PRD
- **THEN** environment-specific bindings select existing PRD resources
- **AND** no UAT database or media bucket is copied as part of deployment.
