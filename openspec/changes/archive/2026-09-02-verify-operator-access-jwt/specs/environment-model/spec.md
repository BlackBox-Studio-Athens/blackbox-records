## ADDED Requirements

### Requirement: Operator Access trust is Product Environment scoped

The system SHALL require configured Cloudflare Access issuer and audience for the PRD operator surface, SHALL keep UAT operator access disabled when no UAT operator surface exists, and SHALL keep JWT-free identity Local and loopback-only.

#### Scenario: PRD evaluates an internal request

- **WHEN** PRD operator authentication starts
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
