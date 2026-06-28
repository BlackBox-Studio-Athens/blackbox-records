## ADDED Requirements

### Requirement: No-store JSON response mechanics are shared

The system SHALL centralize reusable no-store JSON response mechanics in the backend HTTP interface layer.

#### Scenario: Route returns non-cacheable JSON

- **WHEN** a backend HTTP route returns a JSON response that must not be cached
- **THEN** the route uses a shared HTTP interface helper to apply `Cache-Control: no-store`
- **AND** duplicated route-local `jsonNoStore` helpers are not introduced.

#### Scenario: Error route returns JSON

- **WHEN** a backend HTTP route returns a standardized error response
- **THEN** the response uses the shared no-store JSON mechanics
- **AND** error-body creation remains governed by the `backend-error-responses` capability.

### Requirement: Successful responses remain route-specific contracts

The system SHALL keep successful Worker API response bodies explicit per route.

#### Scenario: Route succeeds

- **WHEN** a Worker API route succeeds
- **THEN** the response body matches that route's documented OpenAPI schema
- **AND** the implementation does not wrap every success payload in a generic success envelope solely for consistency.
