## MODIFIED Requirements

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

- **WHEN** a shopper, Stripe webhook, newsletter, services, or CMS route runs
- **THEN** operator middleware is not applied
- **AND** its existing authentication contract remains unchanged.

### Requirement: Editorial and operator authentication remain separate

The system SHALL keep Sveltia GitHub authentication and Cloudflare Access operator authentication as independent boundaries.

#### Scenario: Same person is allowlisted for both systems

- **WHEN** a label member uses Sveltia and the operator stock surface
- **THEN** each system performs its own login and token validation
- **AND** neither reuses the other's token, cookie, callback, or auth helper.

## RENAMED Requirements

- FROM: `### Requirement: Editorial and operator Google logins remain separate`
- TO: `### Requirement: Editorial and operator authentication remain separate`
