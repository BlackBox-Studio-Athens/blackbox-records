## ADDED Requirements

### Requirement: Hosted operator identity requires a verified Access assertion

The system MUST verify a Cloudflare Access JWT before any hosted /api/internal/* route reads or mutates application state.

#### Scenario: Valid assertion is received

- **WHEN** an RS256 assertion has a valid signature, configured issuer and audience, valid lifetime, and normalized email claim
- **THEN** the Worker derives OperatorIdentity from that claim
- **AND** internal route work may continue.

#### Scenario: Assertion is absent or invalid

- **WHEN** a hosted internal request lacks a valid assertion
- **THEN** the Worker returns a generic no-store unauthorized response
- **AND** performs no route-service construction, D1 read, or D1 mutation.

#### Scenario: Verification infrastructure is unavailable

- **WHEN** required hosted trust configuration or usable Access keys are unavailable
- **THEN** the Worker returns a generic no-store temporary-unavailable response
- **AND** does not fall back to any header identity.

### Requirement: Internal authentication is applied once

The system SHALL authenticate the complete /api/internal/* router through one shared middleware and SHALL provide only verified identity to its handlers.

#### Scenario: Internal route is mounted

- **WHEN** a stock or order handler runs
- **THEN** it receives OperatorIdentity from typed middleware context
- **AND** it does not parse Access or forwarded email headers.

#### Scenario: Stock mutation is recorded

- **WHEN** an authenticated operator writes StockChange or StockCount
- **THEN** actor email comes from the verified JWT claim.

#### Scenario: Public route is requested

- **WHEN** a shopper, Stripe webhook, newsletter, services, or Decap route runs
- **THEN** operator middleware is not applied
- **AND** its existing authentication contract remains unchanged.

### Requirement: Editorial and operator Google logins remain separate

The system SHALL keep Decap editorial authentication and Cloudflare Access operator authentication as independent boundaries.

#### Scenario: Same Google account is allowlisted for both systems

- **WHEN** a label member uses Decap and the operator stock surface
- **THEN** each system performs its own login and token validation
- **AND** neither reuses the other's token, cookie, callback, or auth helper.
