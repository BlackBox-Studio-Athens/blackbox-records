## ADDED Requirements

### Requirement: Worker API errors use a shared JSON contract

The system MUST return standardized JSON error bodies for Worker API routes.

#### Scenario: Public API returns an expected error

- **GIVEN** a request targets a public Worker API route
- **WHEN** the route returns an expected error such as invalid input, unavailable checkout, catalog drift, or newsletter unavailability
- **THEN** the response body includes a non-empty `error` message string
- **AND** the response body includes a stable lower-snake-case `code`
- **AND** the response body includes the request-scoped `requestId` when one exists
- **AND** the HTTP status remains the authoritative transport status.

#### Scenario: Internal API returns an expected error

- **GIVEN** a request targets a protected internal Worker API route
- **WHEN** the route returns an expected error such as missing operator identity, invalid stock input, variant not found, or order not found
- **THEN** the response body uses the same `error`, `code`, and `requestId` fields
- **AND** the body does not expose Cloudflare Access tokens, raw authenticated-user headers, or internal binding details.

#### Scenario: Fallback handler returns an unexpected error

- **GIVEN** a Worker API request throws an unexpected error
- **WHEN** the global Hono error handler creates the response
- **THEN** the body uses the shared error contract with `code` set to `internal_server_error`
- **AND** the browser-visible `error` message is generic
- **AND** stack traces, provider payloads, secrets, D1 binding names, and raw validation details are omitted.

#### Scenario: Unknown route returns not found

- **GIVEN** a request targets an unknown route
- **WHEN** the Hono not-found handler creates the response
- **THEN** the body uses the shared error contract with `code` set to `not_found`
- **AND** the status is `404`.

### Requirement: Error schemas are shared across route contracts

The system SHALL define backend error OpenAPI schemas once and reuse them across route families.

#### Scenario: Route documents an error response

- **WHEN** a backend route declares an OpenAPI error response
- **THEN** it reuses the shared backend error schema
- **AND** it does not define a separate `{ error: string }` schema for that route family.

#### Scenario: Generated clients consume errors

- **WHEN** backend OpenAPI contracts change for standardized errors
- **THEN** the generated API client package is regenerated
- **AND** browser consumers continue to read the existing `error` message during deploy skew.

### Requirement: Hono exceptions use the shared error contract

The system SHALL convert Hono boundary exceptions to the shared backend error contract.

#### Scenario: Hono HTTPException is handled

- **GIVEN** route code or middleware throws a Hono `HTTPException`
- **WHEN** the global error handler handles it
- **THEN** the response is converted to the shared error contract
- **AND** the handler applies repository response headers itself instead of returning `HTTPException.getResponse()` unchanged.

### Requirement: Error responses stay browser-safe

The system MUST keep browser-visible error bodies safe for public shoppers and protected operators.

#### Scenario: Validation fails

- **WHEN** request validation fails at the HTTP boundary
- **THEN** the response uses a stable safe error code such as `invalid_request`
- **AND** the message is understandable to the caller
- **AND** raw validator issue dumps are omitted unless a later approved requirement defines safe field-level validation details.

#### Scenario: Provider operation fails

- **WHEN** Stripe, email, D1, or another backend dependency fails
- **THEN** the response uses a safe public code and message
- **AND** raw provider errors, credentials, payment identifiers, shopper PII, webhook signatures, and internal exception text are omitted.

#### Scenario: Error is logged

- **WHEN** an error response is returned
- **THEN** logs may include safe diagnostic classification and safe reason fields
- **AND** the response code remains a client-facing contract distinct from richer internal telemetry.
